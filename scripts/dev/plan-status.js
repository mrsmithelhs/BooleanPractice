'use strict';

/**
 * plan-status.js — packet status tooling
 *
 * Verbs:
 *   list [--json]         table of all packets: id, status, effective status, deps, gate
 *   check <id>            exit 0 + RUNNABLE if ready/in-progress with all deps complete;
 *                         exit 1 with reason otherwise
 *   lint                  exit 1 listing violations; exit 0 if clean
 *   render                regenerate README packet table between marker comments
 *   set <id> <status>     validate, write, and re-render README index
 *
 * No npm dependencies — runs with built-in Node.js modules only.
 * CommonJS (CJS) — matches src/shared/ constraint.
 *
 * Run from repo root: node scripts/dev/plan-status.js <verb> [args]
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_STATUSES = new Set([
  'draft', 'ready', 'in-progress', 'delivered', 'complete', 'superseded', 'parked',
]);

const TERMINAL_STATUSES = new Set(['complete', 'superseded', 'parked']);

const DOCS_DIR = path.join(__dirname, '../../docs/development');
const README_PATH = path.join(DOCS_DIR, 'README.md');
const REPORTS_DIR = path.join(__dirname, '../../reports/development');

const INDEX_BEGIN = '<!-- plan-index:begin -->';
const INDEX_END = '<!-- plan-index:end -->';

// ---------------------------------------------------------------------------
// YAML subset parser
//
// Handles: scalars (unquoted / single-quoted / double-quoted), null, inline
// string arrays [a, b, c], and >- folded block scalars (stripped).
// ---------------------------------------------------------------------------

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) return null;

  const fm = {};
  const lines = m[1].split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)/);
    if (!kv) { i++; continue; }

    const key = kv[1];
    const raw = kv[2].trim();

    if (raw === '>-') {
      // Folded block scalar — collect 2-space-indented (or blank) continuation lines
      const parts = [];
      i++;
      while (i < lines.length) {
        const cl = lines[i];
        if (cl === '' || cl.startsWith('  ')) {
          parts.push(cl === '' ? '' : cl.replace(/^  /, ''));
          i++;
        } else {
          break;
        }
      }
      // Fold: blank lines become newlines, others join with space (>- strips trailing newlines)
      fm[key] = parts.join(' ').replace(/\s+$/, '');
      continue;
    }

    if (raw === 'null' || raw === '~') {
      fm[key] = null;
      i++;
      continue;
    }

    if (raw.startsWith('[') && raw.includes(']')) {
      const inner = raw.slice(raw.indexOf('[') + 1, raw.lastIndexOf(']')).trim();
      fm[key] = inner ? inner.split(',').map(s => s.trim()).filter(Boolean) : [];
      i++;
      continue;
    }

    if ((raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))) {
      const quote = raw[0];
      let value = raw.slice(1, -1);
      if (quote === '"') {
        value = value.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      } else {
        value = value.replace(/''/g, "'");
      }
      fm[key] = value;
      i++;
      continue;
    }

    fm[key] = raw;
    i++;
  }

  return fm;
}

/** Length of the frontmatter block (including both --- delimiters and trailing newline). */
function frontmatterLength(text) {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n)?/);
  return m ? m[0].length : 0;
}

function detectEol(text) {
  return String(text).includes('\r\n') ? '\r\n' : '\n';
}

function normalizeNewlines(text) {
  return String(text).replace(/\r\n/g, '\n');
}

function escapeYamlDoubleQuoted(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, '\\n');
}

function formatYamlScalar(value) {
  if (value === null || value === undefined) return 'null';
  const text = String(value);
  if (/^[A-Za-z0-9_./:-]+$/.test(text)) return text;
  return `"${escapeYamlDoubleQuoted(text)}"`;
}

function replaceIndexMarkerBlock(readmeText, tableText) {
  const eol = detectEol(readmeText);
  const markerRe = new RegExp(
    '(' + escapeRegex(INDEX_BEGIN) + ')[\\s\\S]*?(' + escapeRegex(INDEX_END) + ')'
  );
  if (!markerRe.test(readmeText)) {
    return null;
  }
  const table = normalizeNewlines(tableText).replace(/\n/g, eol);
  return readmeText.replace(markerRe, `${INDEX_BEGIN}${eol}${table}${eol}${INDEX_END}`);
}

function updateFrontmatterText(fileText, fields) {
  const eol = detectEol(fileText);
  const fmMatch = fileText.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!fmMatch) {
    throw new Error('target packet has no frontmatter');
  }

  const fmLines = fmMatch[1].split(/\r?\n/);
  const findLineIndex = (key) => fmLines.findIndex((line) => new RegExp(`^${escapeRegex(key)}:\\s*`).test(line));

  const replaceOrInsertLine = (key, value, afterKeys) => {
    const rendered = `${key}: ${value}`;
    const existingIndex = findLineIndex(key);
    if (existingIndex !== -1) {
      fmLines[existingIndex] = rendered;
      return existingIndex;
    }

    const anchors = Array.isArray(afterKeys) ? afterKeys : [afterKeys];
    let insertAt = fmLines.length;
    for (const anchorKey of anchors) {
      const idx = findLineIndex(anchorKey);
      if (idx !== -1) {
        insertAt = idx + 1;
        break;
      }
    }
    fmLines.splice(insertAt, 0, rendered);
    return insertAt;
  };

  const removeLine = (key) => {
    const idx = findLineIndex(key);
    if (idx !== -1) fmLines.splice(idx, 1);
  };

  replaceOrInsertLine('status', formatYamlScalar(fields.status), ['status', 'id']);

  if (fields.status && TERMINAL_STATUSES.has(fields.status)) {
    if (fields.resolution !== undefined) {
      replaceOrInsertLine('resolution', formatYamlScalar(fields.resolution), ['status', 'resolution', 'superseded_by']);
    }
    if (fields.status === 'superseded' && fields.superseded_by !== undefined) {
      replaceOrInsertLine('superseded_by', formatYamlScalar(fields.superseded_by), ['resolution', 'status', 'superseded_by']);
    }
  } else {
    removeLine('resolution');
    removeLine('superseded_by');
  }

  const fmText = fmLines.join(eol);
  const trailingNewline = /\r?\n$/.test(fmMatch[0]) ? eol : '';
  return fileText.replace(fmMatch[0], `---${eol}${fmText}${eol}---${trailingNewline}`);
}

// ---------------------------------------------------------------------------
// Packet discovery and reading
// ---------------------------------------------------------------------------

function findPacketFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /^plan-\d/.test(f) && f.endsWith('.md'))
    .sort()
    .map(f => path.join(dir, f));
}

function readPacket(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const fm = parseFrontmatter(text);
  const basename = path.basename(filePath, '.md');
  return { filePath, basename, text, fm };
}

function readAllPackets(dir) {
  return findPacketFiles(dir).map(readPacket);
}

/** Index packets by their frontmatter id. */
function indexById(packets) {
  const byId = {};
  for (const p of packets) {
    if (p.fm && p.fm.id) {
      byId[p.fm.id] = p;
    }
  }
  return byId;
}

// ---------------------------------------------------------------------------
// Plan number comparator for stable sort (plan-01 < plan-02 < plan-10 < plan-10b)
// ---------------------------------------------------------------------------

function parsePacketSortKey(id) {
  const m = String(id).match(/^plan-(\d+)([a-z]?)(?:-|$)/i);
  if (!m) return [9999, ''];
  return [parseInt(m[1], 10), m[2] || ''];
}

function packetComparator(a, b) {
  const [na, la] = parsePacketSortKey(a.fm ? a.fm.id : a.basename);
  const [nb, lb] = parsePacketSortKey(b.fm ? b.fm.id : b.basename);
  if (na !== nb) return na - nb;
  return la.localeCompare(lb);
}

// ---------------------------------------------------------------------------
// Effective status computation
//
// A packet is effectively "blocked" if its hand-set status is ready or
// in-progress AND any depends_on packet is not complete.
// ---------------------------------------------------------------------------

function computeEffectiveStatus(fm, byId) {
  if (!fm) return 'no-frontmatter';
  const status = fm.status;
  if (status === 'ready' || status === 'in-progress') {
    const deps = Array.isArray(fm.depends_on) ? fm.depends_on : [];
    for (const dep of deps) {
      const dep_p = byId[dep];
      if (!dep_p || !dep_p.fm || dep_p.fm.status !== 'complete') {
        return 'blocked';
      }
    }
  }
  return status || 'no-frontmatter';
}

// ---------------------------------------------------------------------------
// Dependency cycle detection (DFS)
// ---------------------------------------------------------------------------

function detectCycles(packets, byId) {
  const cycles = [];
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};

  function dfs(id, stack) {
    if (color[id] === GRAY) {
      // Found a back-edge — extract the cycle
      const start = stack.indexOf(id);
      if (start !== -1) cycles.push([...stack.slice(start), id]);
      return;
    }
    if (color[id] === BLACK) return;
    color[id] = GRAY;
    stack.push(id);
    const p = byId[id];
    if (p && p.fm && Array.isArray(p.fm.depends_on)) {
      for (const dep of p.fm.depends_on) {
        dfs(dep, stack);
      }
    }
    stack.pop();
    color[id] = BLACK;
  }

  for (const p of packets) {
    if (p.fm && p.fm.id && !color[p.fm.id]) {
      dfs(p.fm.id, []);
    }
  }
  return cycles;
}

// ---------------------------------------------------------------------------
// Index table generation (used by both render and lint stale-check)
// ---------------------------------------------------------------------------

function generateIndexTable(packets, byId) {
  const sorted = packets
    .filter(p => p.fm && p.fm.id)
    .sort(packetComparator);

  const rows = [
    '| id | title | status | summary |',
    '|---|---|---|---|',
  ];

  for (const p of sorted) {
    const eff = computeEffectiveStatus(p.fm, byId);
    const title = (p.fm.title || '').replace(/\|/g, '\\|');
    const summary = (p.fm.summary || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    rows.push(`| \`${p.fm.id}\` | ${title} | ${eff} | ${summary} |`);
  }

  return rows.join('\n');
}

function lintPackets(packets, options = {}) {
  const readmePath = options.readmePath || README_PATH;
  const reportsDir = options.reportsDir || REPORTS_DIR;
  const explicitReadmeText = Object.prototype.hasOwnProperty.call(options, 'readmeText')
    ? options.readmeText
    : undefined;

  const byId = indexById(packets);
  const errors = [];
  const warns = [];

  function error(msg) { errors.push('ERROR: ' + msg); }
  function warn(msg)  { warns.push('WARN:  ' + msg); }

  const seenIds = {};
  for (const p of packets) {
    if (!p.fm || !p.fm.id) continue;
    if (seenIds[p.fm.id]) {
      error(`Duplicate id "${p.fm.id}" in ${p.basename} (first seen: ${seenIds[p.fm.id]})`);
    } else {
      seenIds[p.fm.id] = p.basename;
    }
  }

  for (const p of packets) {
    const loc = p.basename;

    if (!p.fm) {
      error(`${loc}: missing frontmatter`);
      continue;
    }

    if (p.fm.id) {
      const idMatchesFilename =
        p.fm.id === p.basename ||
        p.basename.startsWith(p.fm.id + '-') ||
        p.basename.startsWith(p.fm.id.replace(/-[^-]+$/, '') + '-');
      if (!idMatchesFilename) {
        error(`${loc}: frontmatter id "${p.fm.id}" does not match filename prefix`);
      }
    }

    if (!p.fm.status) {
      error(`${loc}: missing status field`);
    } else if (!VALID_STATUSES.has(p.fm.status)) {
      error(`${loc}: unknown status "${p.fm.status}" (valid: ${[...VALID_STATUSES].join(', ')})`);
    }

    if (TERMINAL_STATUSES.has(p.fm.status) && !p.fm.resolution) {
      error(`${loc}: terminal status "${p.fm.status}" requires a non-null resolution`);
    }

    if (p.fm.status === 'superseded' && !p.fm.superseded_by) {
      error(`${loc}: status "superseded" requires superseded_by`);
    }

    const deps = Array.isArray(p.fm.depends_on) ? p.fm.depends_on : [];
    for (const dep of deps) {
      if (!byId[dep]) {
        error(`${loc}: depends_on references unknown id "${dep}"`);
      }
    }

    if (p.fm.status === 'complete') {
      const reportFolder = path.join(reportsDir, p.basename);
      if (!fs.existsSync(reportFolder)) {
        warn(`${loc}: complete packet has no reports/development/${p.basename}/ folder`);
      }
    }
  }

  const cycles = detectCycles(packets, byId);
  for (const cycle of cycles) {
    error(`Dependency cycle detected: ${cycle.join(' → ')}`);
  }

  if (explicitReadmeText !== undefined) {
    const markerRe = new RegExp(
      escapeRegex(INDEX_BEGIN) + '([\\s\\S]*?)' + escapeRegex(INDEX_END)
    );
    const markerMatch = String(explicitReadmeText).match(markerRe);
    if (!markerMatch) {
      error(`README missing plan-index markers (<!-- plan-index:begin --> / <!-- plan-index:end -->)`);
    } else {
      const committed = normalizeNewlines(markerMatch[1].trim());
      const generated = normalizeNewlines(generateIndexTable(packets, byId).trim());
      if (committed !== generated) {
        error(`README index is stale — run "node scripts/dev/plan-status.js render" to regenerate`);
      }
    }
  } else if (readmePath) {
    if (fs.existsSync(readmePath)) {
      const readmeText = fs.readFileSync(readmePath, 'utf8');
      const markerRe = new RegExp(
        escapeRegex(INDEX_BEGIN) + '([\\s\\S]*?)' + escapeRegex(INDEX_END)
      );
      const markerMatch = readmeText.match(markerRe);
      if (!markerMatch) {
        error(`README missing plan-index markers (<!-- plan-index:begin --> / <!-- plan-index:end -->)`);
      } else {
        const committed = normalizeNewlines(markerMatch[1].trim());
        const generated = normalizeNewlines(generateIndexTable(packets, byId).trim());
        if (committed !== generated) {
          error(`README index is stale — run "node scripts/dev/plan-status.js render" to regenerate`);
        }
      }
    } else {
      error(`docs/development/README.md not found`);
    }
  }

  return { errors, warns, byId };
}

function renderPacketIndex(options = {}) {
  const docsDir = options.docsDir || DOCS_DIR;
  const readmePath = options.readmePath || README_PATH;
  const packets = readAllPackets(docsDir);
  const byId = indexById(packets);

  if (!fs.existsSync(readmePath)) {
    throw new Error(`README not found at ${readmePath}`);
  }

  const readmeText = fs.readFileSync(readmePath, 'utf8');
  const table = generateIndexTable(packets, byId);
  const newText = replaceIndexMarkerBlock(readmeText, table);
  if (newText === null) {
    throw new Error('plan-index markers not found in README');
  }

  fs.writeFileSync(readmePath, newText, 'utf8');
  return { count: packets.filter(p => p.fm && p.fm.id).length };
}

function findPacketMatchesById(packets, id) {
  return packets.filter((p) => p.fm && p.fm.id === id);
}

function setPacketStatus(id, nextStatus, options = {}) {
  const docsDir = options.docsDir || DOCS_DIR;
  const readmePath = options.readmePath || README_PATH;
  const reportsDir = options.reportsDir || REPORTS_DIR;
  const resolution = options.resolution;
  const supersededBy = options.supersededBy;

  const packets = readAllPackets(docsDir);
  const matches = findPacketMatchesById(packets, id);
  if (matches.length === 0) {
    return { ok: false, error: `ERROR: packet not found: ${id}` };
  }
  if (matches.length > 1) {
    const files = matches.map((p) => p.basename).join(', ');
    return { ok: false, error: `ERROR: packet id "${id}" resolves to multiple files: ${files}` };
  }

  const target = matches[0];
  if (!target.fm) {
    return { ok: false, error: `ERROR: packet ${id} has no frontmatter` };
  }

  if (!VALID_STATUSES.has(nextStatus)) {
    return { ok: false, error: `ERROR: invalid status "${nextStatus}" (valid: ${[...VALID_STATUSES].join(', ')})` };
  }

  const trimmedResolution = resolution == null ? '' : String(resolution).trim();
  const trimmedSupersededBy = supersededBy == null ? '' : String(supersededBy).trim();
  const isTerminal = TERMINAL_STATUSES.has(nextStatus);

  if (isTerminal && !trimmedResolution) {
    return { ok: false, error: `ERROR: status "${nextStatus}" requires --resolution` };
  }

  if (nextStatus === 'superseded' && !trimmedSupersededBy) {
    return { ok: false, error: `ERROR: status "superseded" requires --superseded-by <existing-id>` };
  }

  if (trimmedSupersededBy) {
    const supersededMatches = findPacketMatchesById(packets, trimmedSupersededBy);
    if (supersededMatches.length === 0) {
      return { ok: false, error: `ERROR: --superseded-by packet not found: ${trimmedSupersededBy}` };
    }
    if (supersededMatches.length > 1) {
      return { ok: false, error: `ERROR: --superseded-by resolves to multiple packets: ${trimmedSupersededBy}` };
    }
  }

  const oldStatus = target.fm.status;
  const warnings = [];
  if (TERMINAL_STATUSES.has(oldStatus) && !TERMINAL_STATUSES.has(nextStatus)) {
    warnings.push(`WARN: reopening terminal packet ${id} (${oldStatus} → ${nextStatus})`);
  }

  const currentText = fs.readFileSync(target.filePath, 'utf8');
  const updatedText = updateFrontmatterText(currentText, {
    status: nextStatus,
    resolution: isTerminal ? trimmedResolution : undefined,
    superseded_by: nextStatus === 'superseded' ? trimmedSupersededBy : undefined,
  });
  const updatedPacket = readPacket(target.filePath);
  updatedPacket.text = updatedText;
  updatedPacket.fm = parseFrontmatter(updatedText);

  const proposedPackets = packets.map((p) => (p.filePath === target.filePath ? updatedPacket : p));
  const currentReadmeText = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : null;
  const lintOptions = currentReadmeText
    ? {
        readmeText: replaceIndexMarkerBlock(currentReadmeText, generateIndexTable(proposedPackets, indexById(proposedPackets))),
        readmePath,
        reportsDir,
      }
    : {
        readmePath,
        reportsDir,
      };
  const lint = lintPackets(proposedPackets, lintOptions);

  if (lint.errors.length > 0) {
    return {
      ok: false,
      error: lint.errors.join('\n'),
      warnings: lint.warns,
    };
  }

  const latestText = fs.readFileSync(target.filePath, 'utf8');
  if (latestText !== currentText) {
    return {
      ok: false,
      error: `ERROR: packet ${id} changed on disk before write; re-run the command`,
      warnings: lint.warns,
    };
  }

  fs.writeFileSync(target.filePath, updatedText, 'utf8');
  const renderResult = renderPacketIndex({ docsDir, readmePath });

  return {
    ok: true,
    oldStatus,
    newStatus: nextStatus,
    warnings,
    lintWarns: lint.warns,
    renderResult,
  };
}

// ---------------------------------------------------------------------------
// list verb
// ---------------------------------------------------------------------------

function cmdList(args) {
  const packets = readAllPackets(DOCS_DIR);
  const byId = indexById(packets);
  const sorted = [...packets].sort(packetComparator);

  if (args.includes('--json')) {
    const out = sorted.map(p => ({
      id: p.fm ? p.fm.id : p.basename,
      title: p.fm ? p.fm.title : null,
      status: p.fm ? p.fm.status : null,
      effectiveStatus: computeEffectiveStatus(p.fm, byId),
      depends_on: p.fm ? (p.fm.depends_on || []) : [],
      gate: p.fm ? (p.fm.gate || null) : null,
    }));
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return;
  }

  // Text table
  const rows = sorted.map(p => ({
    id: p.fm ? p.fm.id : p.basename,
    status: p.fm ? (p.fm.status || '?') : 'no-frontmatter',
    eff: computeEffectiveStatus(p.fm, byId),
    deps: p.fm && Array.isArray(p.fm.depends_on) ? p.fm.depends_on.join(', ') : '',
    gate: p.fm ? (p.fm.gate || '') : '',
  }));

  const w = {
    id: Math.max(...rows.map(r => r.id.length), 2),
    status: Math.max(...rows.map(r => r.status.length), 6),
    eff: Math.max(...rows.map(r => r.eff.length), 14),
  };

  const header = `${'id'.padEnd(w.id)}  ${'status'.padEnd(w.status)}  ${'effective'.padEnd(w.eff)}  deps`;
  process.stdout.write(header + '\n');
  process.stdout.write('-'.repeat(header.length) + '\n');
  for (const r of rows) {
    process.stdout.write(
      `${r.id.padEnd(w.id)}  ${r.status.padEnd(w.status)}  ${r.eff.padEnd(w.eff)}  ${r.deps}\n`
    );
  }
}

// ---------------------------------------------------------------------------
// check verb
// ---------------------------------------------------------------------------

function cmdCheck(id) {
  if (!id) {
    process.stderr.write('Usage: plan-status.js check <packet-id>\n');
    process.exit(1);
  }

  const packets = readAllPackets(DOCS_DIR);
  const byId = indexById(packets);
  const packet = byId[id];

  if (!packet) {
    process.stderr.write(`ERROR: packet not found: ${id}\n`);
    process.exit(1);
  }

  if (!packet.fm) {
    process.stderr.write(`ERROR: packet ${id} has no frontmatter\n`);
    process.exit(1);
  }

  const status = packet.fm.status;
  if (status !== 'ready' && status !== 'in-progress') {
    process.stderr.write(`BLOCKED: ${id} has status "${status}" — not ready or in-progress\n`);
    process.exit(1);
  }

  const deps = Array.isArray(packet.fm.depends_on) ? packet.fm.depends_on : [];
  const blocked = [];
  for (const dep of deps) {
    const dp = byId[dep];
    if (!dp) {
      blocked.push(`${dep} (unknown packet)`);
    } else if (!dp.fm || dp.fm.status !== 'complete') {
      blocked.push(`${dep} (status: ${dp.fm ? dp.fm.status : 'no-frontmatter'})`);
    }
  }

  if (blocked.length) {
    process.stderr.write(`BLOCKED: ${id} has incomplete dependencies:\n`);
    for (const b of blocked) process.stderr.write(`  - ${b}\n`);
    process.exit(1);
  }

  process.stdout.write(`RUNNABLE: ${id} is ready to implement\n`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// lint verb
// ---------------------------------------------------------------------------

function cmdLint() {
  const packets = readAllPackets(DOCS_DIR);
  const lint = lintPackets(packets, { readmePath: README_PATH, reportsDir: REPORTS_DIR });

  const all = [...lint.errors, ...lint.warns];
  if (all.length) {
    for (const msg of all) process.stdout.write(msg + '\n');
  } else {
    process.stdout.write('lint: OK (no violations)\n');
  }

  process.exit(lint.errors.length > 0 ? 1 : 0);
}

// ---------------------------------------------------------------------------
// render verb
// ---------------------------------------------------------------------------

function cmdRender() {
  try {
    const result = renderPacketIndex({ docsDir: DOCS_DIR, readmePath: README_PATH });
    process.stdout.write(`render: wrote ${result.count} packets to README index\n`);
  } catch (err) {
    process.stderr.write(`ERROR: ${err.message}\n`);
    process.exit(1);
  }
}

function parseSetArgs(args) {
  if (!args.length || args.length < 2) {
    return { error: 'Usage: plan-status.js set <id> <status> [--resolution "<text>"] [--superseded-by <id>]' };
  }

  const [id, status, ...rest] = args;
  const result = { id, status, resolution: null, supersededBy: null };

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--resolution') {
      result.resolution = rest[++i];
      continue;
    }
    if (arg.startsWith('--resolution=')) {
      result.resolution = arg.slice('--resolution='.length);
      continue;
    }
    if (arg === '--superseded-by') {
      result.supersededBy = rest[++i];
      continue;
    }
    if (arg.startsWith('--superseded-by=')) {
      result.supersededBy = arg.slice('--superseded-by='.length);
      continue;
    }
    return { error: `ERROR: unrecognized argument: ${arg}` };
  }

  return result;
}

function cmdSet(args) {
  const parsed = parseSetArgs(args);
  if (parsed.error) {
    process.stderr.write(parsed.error + '\n');
    process.exit(1);
  }

  const result = setPacketStatus(parsed.id, parsed.status, {
    resolution: parsed.resolution,
    supersededBy: parsed.supersededBy,
    docsDir: DOCS_DIR,
    readmePath: README_PATH,
    reportsDir: REPORTS_DIR,
  });

  if (!result.ok) {
    process.stderr.write(result.error + '\n');
    process.exit(1);
  }

  for (const warning of [...(result.warnings || []), ...(result.lintWarns || [])]) {
    process.stdout.write(warning + '\n');
  }
  process.stdout.write(`${parsed.id}: ${result.oldStatus} → ${result.newStatus}; index re-rendered; lint clean\n`);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Exports (for testing)
// ---------------------------------------------------------------------------

module.exports = {
  parseFrontmatter,
  frontmatterLength,
  detectEol,
  normalizeNewlines,
  formatYamlScalar,
  computeEffectiveStatus,
  detectCycles,
  generateIndexTable,
  lintPackets,
  renderPacketIndex,
  setPacketStatus,
  updateFrontmatterText,
  parsePacketSortKey,
  VALID_STATUSES,
  TERMINAL_STATUSES,
  INDEX_BEGIN,
  INDEX_END,
};

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const [,, verb, ...rest] = process.argv;

  switch (verb) {
    case 'list':   cmdList(rest); break;
    case 'check':  cmdCheck(rest[0]); break;
    case 'lint':   cmdLint(); break;
    case 'render': cmdRender(); break;
    case 'set':    cmdSet(rest); break;
    default:
      process.stderr.write(
        'Usage: node scripts/dev/plan-status.js <list|check|lint|render|set> [...args]\n'
      );
      process.exit(1);
  }
}
