'use strict';

/**
 * plan-status.js unit tests
 *
 * NOTE: This is a standalone Node.js test/self-check script. It is NOT a
 * Vitest, Jest, Mocha, or Jasmine suite.
 *
 * If your project adopts a Vitest-based test setup (or similar test runner),
 * exclude this file from your test-collection glob (e.g., in vitest.config.ts's
 * `test.exclude` list) to avoid false test failures, and run it directly:
 *
 *   node scripts/dev/plan-status.test.js
 *
 * Uses synthetic in-memory fixture packets (no disk access for core logic).
 * Covers: parseFrontmatter, computeEffectiveStatus, detectCycles,
 *         generateIndexTable, and all lint rules.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  parseFrontmatter,
  frontmatterLength,
  computeEffectiveStatus,
  detectCycles,
  generateIndexTable,
  lintPackets,
  setPacketStatus,
  detectEol,
  normalizeNewlines,
  parsePacketSortKey,
  VALID_STATUSES,
  TERMINAL_STATUSES,
  INDEX_BEGIN,
  INDEX_END,
} = require('../../scripts/dev/plan-status');

// ── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    passed++;
    process.stdout.write('  PASS  ' + label + '\n');
  } else {
    failed++;
    failures.push(label);
    process.stdout.write('  FAIL  ' + label + '\n');
  }
}

function eq(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    process.stdout.write('         actual:   ' + JSON.stringify(actual) + '\n');
    process.stdout.write('         expected: ' + JSON.stringify(expected) + '\n');
  }
  assert(ok, label);
}

function section(title) {
  process.stdout.write('\n── ' + title + ' ──\n');
}

// ── Fixture helpers ──────────────────────────────────────────────────────────

function makeFm(overrides) {
  return Object.assign(
    {
      id: 'plan-01',
      title: 'Plan One',
      status: 'complete',
      depends_on: [],
      gate: '',
      superseded_by: null,
      resolution: 'Delivered.',
      summary: 'Does the thing.',
    },
    overrides
  );
}

function makePacket(id, fmOverrides) {
  const fm = makeFm(Object.assign({ id }, fmOverrides));
  return { filePath: `docs/development/${id}.md`, basename: id, text: '', fm };
}

function indexById(packets) {
  const map = {};
  for (const p of packets) {
    if (p.fm && p.fm.id) map[p.fm.id] = p;
  }
  return map;
}

function makePacketText(overrides) {
  const eol = overrides.eol || '\n';
  const status = overrides.status || 'draft';
  const dependsOn = overrides.depends_on || [];
  const summary = overrides.summary || 'Does the thing.';
  const gate = overrides.gate || '';
  const resolution = Object.prototype.hasOwnProperty.call(overrides, 'resolution')
    ? overrides.resolution
    : null;
  const supersededBy = Object.prototype.hasOwnProperty.call(overrides, 'superseded_by')
    ? overrides.superseded_by
    : null;
  const title = overrides.title || overrides.id || 'Packet';
  const body = overrides.body || '# Body';

  const lines = [
    '---',
    `id: ${overrides.id}`,
    `title: ${title}`,
    `status: ${status}`,
    `depends_on: [${dependsOn.join(', ')}]`,
    `gate: ${gate ? JSON.stringify(gate) : '""'}`,
    `superseded_by: ${supersededBy === null ? 'null' : supersededBy}`,
    `resolution: ${resolution === null ? 'null' : JSON.stringify(resolution)}`,
    `summary: >-`,
    `  ${summary}`,
    '---',
    body,
  ];

  return lines.join(eol) + eol;
}

function makeFixtureWorkspace(packets, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'techexam-plan-status-'));
  const docsDir = path.join(root, 'docs', 'development');
  const reportsDir = path.join(root, 'reports', 'development');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });

  for (const packet of packets) {
    const text = makePacketText(packet);
    fs.writeFileSync(path.join(docsDir, `${packet.id}.md`), text, 'utf8');
  }

  const readmeText = options.readmeText || `# Packets\n\n${INDEX_BEGIN}\n${generateIndexTable(packets.map((packet) => makePacket(packet.id, packet)), indexById(packets.map((packet) => makePacket(packet.id, packet))))}\n${INDEX_END}\n`;
  fs.writeFileSync(path.join(docsDir, 'README.md'), readmeText, 'utf8');

  return { root, docsDir, reportsDir, readmePath: path.join(docsDir, 'README.md') };
}

function readPacketObject(dir, id) {
  const filePath = path.join(dir, `${id}.md`);
  const text = fs.readFileSync(filePath, 'utf8');
  return {
    filePath,
    basename: id,
    text,
    fm: parseFrontmatter(text),
  };
}

// ── parseFrontmatter ─────────────────────────────────────────────────────────

section('parseFrontmatter — basic scalars');

{
  const text = `---
id: plan-01
title: Repo Scaffold
status: complete
superseded_by: null
resolution: Delivered.
---

# Body
`;
  const fm = parseFrontmatter(text);
  eq(fm.id, 'plan-01', 'id scalar');
  eq(fm.title, 'Repo Scaffold', 'title scalar');
  eq(fm.status, 'complete', 'status scalar');
  eq(fm.superseded_by, null, 'null value');
  eq(fm.resolution, 'Delivered.', 'resolution string');
  assert(fm !== null, 'returns object');
}

section('parseFrontmatter — inline array');

{
  const text = `---
id: plan-10
depends_on: [plan-01, plan-02]
---
`;
  const fm = parseFrontmatter(text);
  eq(fm.depends_on, ['plan-01', 'plan-02'], 'two-element array');
}

{
  const text = `---
id: plan-10
depends_on: []
---
`;
  const fm = parseFrontmatter(text);
  eq(fm.depends_on, [], 'empty array');
}

section('parseFrontmatter — quoted gate');

{
  const text = `---
id: plan-05
gate: "owner gate at completion: contract rungs"
---
`;
  const fm = parseFrontmatter(text);
  eq(fm.gate, 'owner gate at completion: contract rungs', 'double-quoted string with colon');
}

section('parseFrontmatter — >- folded scalar');

{
  const text = `---
id: plan-03
summary: >-
  First line of summary
  second line continues here.
---
`;
  const fm = parseFrontmatter(text);
  eq(fm.summary, 'First line of summary second line continues here.', 'folded scalar joins lines');
}

section('parseFrontmatter — no frontmatter returns null');

{
  const text = `# Plan 01

## Packet Metadata

- Status: complete
`;
  const fm = parseFrontmatter(text);
  eq(fm, null, 'no frontmatter → null');
}

section('frontmatterLength');

{
  const text = `---
id: plan-01
---
# Body starts here
`;
  const len = frontmatterLength(text);
  const body = text.slice(len);
  assert(body.startsWith('# Body'), 'body starts after frontmatter');
}

// ── computeEffectiveStatus ───────────────────────────────────────────────────

section('computeEffectiveStatus — not blocked if no deps');

{
  const byId = indexById([makePacket('plan-01', { status: 'complete' })]);
  eq(computeEffectiveStatus(makeFm({ id: 'plan-02', status: 'ready', depends_on: [] }), byId),
    'ready', 'ready with no deps → ready');
}

section('computeEffectiveStatus — blocked if dep not complete');

{
  const p1 = makePacket('plan-01', { status: 'ready' }); // dep is ready, not complete
  const byId = indexById([p1]);
  const fm = makeFm({ id: 'plan-02', status: 'ready', depends_on: ['plan-01'] });
  eq(computeEffectiveStatus(fm, byId), 'blocked', 'ready with non-complete dep → blocked');
}

section('computeEffectiveStatus — blocked if dep unknown');

{
  const byId = indexById([]);
  const fm = makeFm({ id: 'plan-05', status: 'ready', depends_on: ['plan-99'] });
  eq(computeEffectiveStatus(fm, byId), 'blocked', 'ready with unknown dep → blocked');
}

section('computeEffectiveStatus — complete dep unblocks');

{
  const p1 = makePacket('plan-01', { status: 'complete', resolution: 'Done.' });
  const byId = indexById([p1]);
  const fm = makeFm({ id: 'plan-02', status: 'ready', depends_on: ['plan-01'] });
  eq(computeEffectiveStatus(fm, byId), 'ready', 'ready with complete dep → ready');
}

section('computeEffectiveStatus — non-ready statuses pass through');

{
  const byId = indexById([makePacket('plan-01', { status: 'ready' })]);
  const draftFm = makeFm({ id: 'plan-02', status: 'draft', depends_on: ['plan-01'] });
  eq(computeEffectiveStatus(draftFm, byId), 'draft',
    'draft with incomplete dep → draft (blocked computed only for ready/in-progress)');

  const completeFm = makeFm({ id: 'plan-03', status: 'complete', resolution: 'Done.', depends_on: ['plan-01'] });
  eq(computeEffectiveStatus(completeFm, byId), 'complete',
    'complete with incomplete dep → complete (pass-through)');
}

section('computeEffectiveStatus — in-progress blocked');

{
  const p1 = makePacket('plan-01', { status: 'ready' });
  const byId = indexById([p1]);
  const fm = makeFm({ id: 'plan-02', status: 'in-progress', depends_on: ['plan-01'] });
  eq(computeEffectiveStatus(fm, byId), 'blocked', 'in-progress with incomplete dep → blocked');
}

section('computeEffectiveStatus — null fm → no-frontmatter');

{
  eq(computeEffectiveStatus(null, {}), 'no-frontmatter', 'null fm → no-frontmatter');
}

// ── detectCycles ─────────────────────────────────────────────────────────────

section('detectCycles — no cycles');

{
  const packets = [
    makePacket('plan-01', { depends_on: [] }),
    makePacket('plan-02', { depends_on: ['plan-01'] }),
    makePacket('plan-03', { depends_on: ['plan-02'] }),
  ];
  const byId = indexById(packets);
  const cycles = detectCycles(packets, byId);
  eq(cycles.length, 0, 'linear chain has no cycles');
}

section('detectCycles — direct cycle A→B→A');

{
  const packets = [
    makePacket('plan-01', { depends_on: ['plan-02'] }),
    makePacket('plan-02', { depends_on: ['plan-01'] }),
  ];
  const byId = indexById(packets);
  const cycles = detectCycles(packets, byId);
  assert(cycles.length >= 1, 'direct cycle detected');
  const flat = cycles.map(c => c.join('→')).join('; ');
  assert(flat.includes('plan-01') && flat.includes('plan-02'), 'cycle includes both nodes');
}

section('detectCycles — self-loop');

{
  const packets = [makePacket('plan-01', { depends_on: ['plan-01'] })];
  const byId = indexById(packets);
  const cycles = detectCycles(packets, byId);
  assert(cycles.length >= 1, 'self-loop detected');
}

section('detectCycles — triangle A→B→C→A');

{
  const packets = [
    makePacket('plan-01', { depends_on: ['plan-03'] }),
    makePacket('plan-02', { depends_on: ['plan-01'] }),
    makePacket('plan-03', { depends_on: ['plan-02'] }),
  ];
  const byId = indexById(packets);
  const cycles = detectCycles(packets, byId);
  assert(cycles.length >= 1, 'triangle cycle detected');
}

// ── parsePacketSortKey ───────────────────────────────────────────────────────

section('parsePacketSortKey — numeric order');

{
  const ids = ['plan-10b', 'plan-02', 'plan-10', 'plan-10c', 'plan-01', 'plan-02b'];
  const sorted = [...ids].sort((a, b) => {
    const [na, la] = parsePacketSortKey(a);
    const [nb, lb] = parsePacketSortKey(b);
    return na !== nb ? na - nb : la.localeCompare(lb);
  });
  eq(sorted, ['plan-01', 'plan-02', 'plan-02b', 'plan-10', 'plan-10b', 'plan-10c'],
    'packet ids sort numerically with letter suffix secondary');
}

// ── generateIndexTable ───────────────────────────────────────────────────────

section('generateIndexTable — basic output');

{
  const packets = [
    makePacket('plan-02', { title: 'Plan Two', status: 'ready', summary: 'Does two things.', depends_on: [] }),
    makePacket('plan-01', { title: 'Plan One', status: 'complete', resolution: 'Done.', summary: 'Does one thing.', depends_on: [] }),
  ];
  const byId = indexById(packets);
  const table = generateIndexTable(packets, byId);
  const lines = table.split('\n');
  assert(lines[0].includes('| id |'), 'header row present');
  assert(lines[1].includes('|---'), 'separator row present');
  assert(lines[2].includes('plan-01'), 'plan-01 appears before plan-02 (sorted)');
  assert(lines[3].includes('plan-02'), 'plan-02 appears second');
  assert(table.includes('Does one thing.'), 'summary included');
}

section('generateIndexTable — blocked effective status');

{
  const packets = [
    makePacket('plan-01', { status: 'ready', depends_on: [] }),
    makePacket('plan-02', { status: 'ready', depends_on: ['plan-01'] }),
  ];
  const byId = indexById(packets);
  const table = generateIndexTable(packets, byId);
  assert(table.includes('blocked'), 'plan-02 shows blocked effective status');
  // plan-01 with no complete deps shows ready
  const lines = table.split('\n');
  const p01line = lines.find(l => l.includes('plan-01'));
  assert(p01line && p01line.includes('ready'), 'plan-01 shows ready');
}

// ── lint rules (inline via lintPackets helper) ───────────────────────────────

// We can't run the full cmdLint() (it reads from disk), but we can test the
// rule logic by exercising the same underlying helpers used by cmdLint.

section('lint logic — VALID_STATUSES covers all vocabulary');

{
  const expected = ['draft', 'ready', 'in-progress', 'delivered', 'complete', 'superseded', 'parked'];
  for (const s of expected) {
    assert(VALID_STATUSES.has(s), `VALID_STATUSES includes "${s}"`);
  }
  assert(!VALID_STATUSES.has('blocked'), 'blocked is not a hand-set status');
  assert(!VALID_STATUSES.has('deferred'), 'deferred is not a valid status (was renamed parked)');
}

section('lint logic — TERMINAL_STATUSES');

{
  for (const s of ['complete', 'superseded', 'parked']) {
    assert(TERMINAL_STATUSES.has(s), `TERMINAL_STATUSES includes "${s}"`);
  }
  assert(!TERMINAL_STATUSES.has('ready'), 'ready is not terminal');
  assert(!TERMINAL_STATUSES.has('draft'), 'draft is not terminal');
}

section('lint logic — superseded requires superseded_by (simulated)');

{
  const fm = makeFm({ status: 'superseded', superseded_by: null, resolution: 'Replaced by plan-02.' });
  const violations = [];
  if (fm.status === 'superseded' && !fm.superseded_by) {
    violations.push('superseded without superseded_by');
  }
  eq(violations.length, 1, 'superseded with null superseded_by is a violation');
}

{
  const fm = makeFm({ status: 'superseded', superseded_by: 'plan-02', resolution: 'Replaced by plan-02.' });
  const violations = [];
  if (fm.status === 'superseded' && !fm.superseded_by) {
    violations.push('superseded without superseded_by');
  }
  eq(violations.length, 0, 'superseded with superseded_by set is clean');
}

section('lint logic — terminal status requires resolution (simulated)');

{
  for (const status of ['complete', 'superseded', 'parked']) {
    const fmMissing = makeFm({ status, resolution: null, superseded_by: status === 'superseded' ? 'plan-02' : null });
    const hasMissing = TERMINAL_STATUSES.has(fmMissing.status) && !fmMissing.resolution;
    assert(hasMissing, `${status} with null resolution triggers violation`);

    const fmOk = makeFm({ status, resolution: 'Done.', superseded_by: status === 'superseded' ? 'plan-02' : null });
    const hasOk = TERMINAL_STATUSES.has(fmOk.status) && !fmOk.resolution;
    assert(!hasOk, `${status} with resolution set is clean`);
  }
}

section('lint logic — unknown status (simulated)');

{
  const badStatuses = ['deferred', 'cancelled', 'wip', ''];
  for (const s of badStatuses) {
    assert(!VALID_STATUSES.has(s), `"${s || '(empty)'}" is not a valid status`);
  }
}

section('lint logic — dangling depends_on (simulated)');

{
  const byId = indexById([makePacket('plan-01')]);
  const fm = makeFm({ id: 'plan-02', depends_on: ['plan-01', 'plan-99'] });
  const dangling = (fm.depends_on || []).filter(dep => !byId[dep]);
  eq(dangling, ['plan-99'], 'plan-99 flagged as dangling');
}

section('lint logic — id/filename mismatch (simulated)');

{
  const p = makePacket('plan-01', { id: 'plan-02' }); // id in fm differs from basename
  const mismatch = p.fm.id !== p.basename;
  assert(mismatch, 'id/filename mismatch detected');
}

{
  const p = makePacket('plan-01', { id: 'plan-01' });
  const mismatch = p.fm.id !== p.basename;
  assert(!mismatch, 'matching id/filename is clean');
}

section('lint logic — duplicate ids (simulated)');

{
  const packets = [
    makePacket('plan-01', { id: 'plan-01' }),
    makePacket('plan-01-copy', { id: 'plan-01' }), // same id, different file
  ];
  const seenIds = {};
  const dupes = [];
  for (const p of packets) {
    if (!p.fm || !p.fm.id) continue;
    if (seenIds[p.fm.id]) dupes.push(p.fm.id);
    else seenIds[p.fm.id] = p.basename;
  }
  eq(dupes, ['plan-01'], 'duplicate id flagged');
}

// ── temp-fixture set verb ────────────────────────────────────────────────────

section('setPacketStatus — valid non-terminal transition writes and re-renders');

{
  const workspace = makeFixtureWorkspace([
    { id: 'plan-01', title: 'Plan One', status: 'draft', summary: 'Does one thing.' },
    { id: 'plan-02', title: 'Plan Two', status: 'complete', resolution: 'Done.', summary: 'Does two things.' },
  ]);
  const beforePacket = fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8');
  const beforeReadme = fs.readFileSync(workspace.readmePath, 'utf8');

  const result = setPacketStatus('plan-01', 'ready', {
    docsDir: workspace.docsDir,
    readmePath: workspace.readmePath,
    reportsDir: workspace.reportsDir,
  });

  assert(result.ok, 'non-terminal transition succeeds');
  const afterPacket = fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8');
  const afterReadme = fs.readFileSync(workspace.readmePath, 'utf8');
  assert(afterPacket !== beforePacket, 'packet file changed');
  assert(afterReadme !== beforeReadme, 'README index changed');
  eq(parseFrontmatter(afterPacket).status, 'ready', 'packet status updated to ready');
  assert(afterReadme.includes('`plan-01` | Plan One | ready'), 'README re-rendered with new status');
}

section('setPacketStatus — terminal without resolution is refused with no write');

{
  const workspace = makeFixtureWorkspace([
    { id: 'plan-01', title: 'Plan One', status: 'ready', summary: 'Does one thing.' },
  ]);
  const beforePacket = fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8');

  const result = setPacketStatus('plan-01', 'complete', {
    docsDir: workspace.docsDir,
    readmePath: workspace.readmePath,
    reportsDir: workspace.reportsDir,
  });

  assert(!result.ok, 'missing resolution is rejected');
  assert(result.error.includes('--resolution'), 'error mentions resolution');
  eq(fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8'), beforePacket, 'packet file unchanged');
}

section('setPacketStatus — superseded without superseded_by is refused with no write');

{
  const workspace = makeFixtureWorkspace([
    { id: 'plan-01', title: 'Plan One', status: 'ready', summary: 'Does one thing.' },
    { id: 'plan-02', title: 'Plan Two', status: 'ready', summary: 'Does two things.' },
  ]);
  const beforePacket = fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8');

  const result = setPacketStatus('plan-01', 'superseded', {
    resolution: 'Replaced by plan-02.',
    docsDir: workspace.docsDir,
    readmePath: workspace.readmePath,
    reportsDir: workspace.reportsDir,
  });

  assert(!result.ok, 'missing superseded_by is rejected');
  assert(result.error.includes('--superseded-by'), 'error mentions superseded_by');
  eq(fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8'), beforePacket, 'packet file unchanged');
}

section('setPacketStatus — invalid status string and missing id are refused with no write');

{
  const workspace = makeFixtureWorkspace([
    { id: 'plan-01', title: 'Plan One', status: 'draft', summary: 'Does one thing.' },
  ]);
  const beforePacket = fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8');

  const invalidStatus = setPacketStatus('plan-01', 'bogus', {
    docsDir: workspace.docsDir,
    readmePath: workspace.readmePath,
    reportsDir: workspace.reportsDir,
  });
  assert(!invalidStatus.ok, 'invalid status is rejected');
  assert(invalidStatus.error.includes('invalid status'), 'invalid status error reported');
  eq(fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8'), beforePacket, 'packet file unchanged after invalid status');

  const missingId = setPacketStatus('plan-99', 'ready', {
    docsDir: workspace.docsDir,
    readmePath: workspace.readmePath,
    reportsDir: workspace.reportsDir,
  });
  assert(!missingId.ok, 'missing packet id is rejected');
  assert(missingId.error.includes('packet not found'), 'missing id error reported');
  eq(fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8'), beforePacket, 'packet file unchanged after missing id');
}

section('setPacketStatus — proposed lint failure is refused before write');

{
  const workspace = makeFixtureWorkspace([
    { id: 'plan-01', title: 'Plan One', status: 'draft', summary: 'Does one thing.' },
    { id: 'plan-02', title: 'Plan Two', status: 'bogus', summary: 'Broken on purpose.' },
  ]);
  const beforePacket = fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8');

  const result = setPacketStatus('plan-01', 'ready', {
    docsDir: workspace.docsDir,
    readmePath: workspace.readmePath,
    reportsDir: workspace.reportsDir,
  });

  assert(!result.ok, 'proposal with invalid sibling packet is rejected');
  assert(result.error.includes('unknown status'), 'lint error surfaced');
  eq(fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8'), beforePacket, 'packet file unchanged');
}

section('setPacketStatus — line endings preserved on edited packet');

{
  const workspace = makeFixtureWorkspace([
    { id: 'plan-01', title: 'Plan One', status: 'draft', summary: 'Does one thing.', eol: '\r\n' },
  ]);
  const before = fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8');
  assert(before.includes('\r\n'), 'fixture starts with CRLF');

  const result = setPacketStatus('plan-01', 'ready', {
    docsDir: workspace.docsDir,
    readmePath: workspace.readmePath,
    reportsDir: workspace.reportsDir,
  });

  assert(result.ok, 'CRLF transition succeeds');
  const after = fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8');
  assert(after.includes('\r\n'), 'CRLF preserved after edit');
  assert(detectEol(after) === '\r\n', 'edited packet still uses CRLF');
}

section('setPacketStatus — terminal close with resolution writes fields and passes lint');

{
  const workspace = makeFixtureWorkspace([
    { id: 'plan-01', title: 'Plan One', status: 'ready', summary: 'Does one thing.' },
    { id: 'plan-02', title: 'Plan Two', status: 'complete', resolution: 'Already done.', summary: 'Does two things.' },
  ]);

  const result = setPacketStatus('plan-01', 'complete', {
    resolution: 'Closed cleanly.',
    docsDir: workspace.docsDir,
    readmePath: workspace.readmePath,
    reportsDir: workspace.reportsDir,
  });

  assert(result.ok, 'terminal close succeeds');
  const afterPacket = fs.readFileSync(path.join(workspace.docsDir, 'plan-01.md'), 'utf8');
  const fm = parseFrontmatter(afterPacket);
  eq(fm.status, 'complete', 'status set to complete');
  eq(fm.resolution, 'Closed cleanly.', 'resolution written');
  const lint = lintPackets([
    readPacketObject(workspace.docsDir, 'plan-01'),
    readPacketObject(workspace.docsDir, 'plan-02'),
  ], {
    readmePath: workspace.readmePath,
    reportsDir: workspace.reportsDir,
  });
  eq(lint.errors.length, 0, 'lint has no errors after terminal close');
}

// ── INDEX markers ────────────────────────────────────────────────────────────

section('INDEX_BEGIN / INDEX_END constants');

{
  assert(INDEX_BEGIN === '<!-- plan-index:begin -->', 'INDEX_BEGIN correct');
  assert(INDEX_END === '<!-- plan-index:end -->', 'INDEX_END correct');
}

// ── Summary ──────────────────────────────────────────────────────────────────

process.stdout.write('\n');
if (failed === 0) {
  process.stdout.write(`plan-status tests: ${passed} passed, 0 failed\n`);
  process.exit(0);
} else {
  process.stdout.write(`plan-status tests: ${passed} passed, ${failed} failed\n`);
  process.stdout.write('\nFailed tests:\n');
  for (const f of failures) process.stdout.write(`  - ${f}\n`);
  process.exit(1);
}
