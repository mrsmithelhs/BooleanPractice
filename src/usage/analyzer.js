import {
  GENESIS_HASH,
  areAttemptSequencesSuspiciouslyIdentical,
  canonicalJsonStringify,
  getUsageEventFingerprint,
  sha256Hex,
  verifyIntegrity,
} from './format.js';

export const IMPLAUSIBLE_SPEED_THRESHOLD_MS = 10000; // 10 seconds

export async function summarizeFile(payload, options = {}) {
  const customSubtle = options.customSubtle;
  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      error: 'Invalid payload: not an object',
      flags: [{ type: 'invalid_format', label: 'File format invalid' }],
    };
  }

  // 1. Schema check
  const schemaValid = payload.schemaVersion === 1 && payload.app === 'boolean-practice';
  if (!schemaValid) {
    return {
      isValid: false,
      error: `Unsupported schema or app: schemaVersion=${payload.schemaVersion}, app=${payload.app}`,
      flags: [{ type: 'schema_invalid', label: 'Invalid schema or app' }],
    };
  }

  // 2. Integrity check
  const integrity = await verifyIntegrity(payload, customSubtle);

  // 3. Hash chain verification
  const events = Array.isArray(payload.events) ? payload.events : [];
  const summaryBlock = payload.summary || {};
  const isTruncated = Boolean(summaryBlock.eventsTruncated);
  const firstRetainedSeq = summaryBlock.firstRetainedSeq ?? (events[0]?.seq ?? 1);

  let chainOk = true;
  let brokenAtSeq = null;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (i === 0) {
      if (isTruncated && ev.seq === firstRetainedSeq) {
        // Legitimate truncation at retention boundary
      } else if (ev.seq === 1) {
        if (ev.prevHash !== GENESIS_HASH) {
          chainOk = false;
          brokenAtSeq = ev.seq;
          break;
        }
      } else {
        // Chain prefix is missing without truncation flag
        chainOk = false;
        brokenAtSeq = ev.seq;
        break;
      }
    } else {
      const prevEvent = events[i - 1];
      const expectedPrevHash = await sha256Hex(
        canonicalJsonStringify(prevEvent),
        customSubtle,
      );
      if (ev.prevHash !== expectedPrevHash) {
        chainOk = false;
        brokenAtSeq = ev.seq;
        break;
      }
    }
  }

  // 4. Progress per set and sheet
  // sheets: { [sheetKey]: { solved, solvedAt, mode, attempts, checks, activeMs } }
  const sheets = {};
  if (summaryBlock.sheets && typeof summaryBlock.sheets === 'object') {
    for (const [key, s] of Object.entries(summaryBlock.sheets)) {
      sheets[key] = {
        solved: Boolean(s.solved),
        solvedAt: s.solvedAt || null,
        mode: s.mode || null,
        outputChecks: Number(s.outputChecks || 0),
        shadingChecks: Number(s.shadingChecks || 0),
        checks: Number(s.outputChecks || 0) + Number(s.shadingChecks || 0),
        activeMs: Number(s.activeMs || 0),
      };
    }
  }

  // Also check events for any solves or checks not in summary
  for (const ev of events) {
    if (ev.data && ev.data.set && ev.data.sheet !== undefined) {
      const key = `${ev.data.set}:${ev.data.sheet}`;
      if (!sheets[key]) {
        sheets[key] = {
          solved: false,
          solvedAt: null,
          mode: null,
          outputChecks: 0,
          shadingChecks: 0,
          checks: 0,
          activeMs: 0,
        };
      }
      if (ev.type === 'sheet_solved') {
        sheets[key].solved = true;
        if (!sheets[key].solvedAt) sheets[key].solvedAt = new Date(ev.t).toISOString();
        if (ev.data.mode) sheets[key].mode = ev.data.mode;
        if (typeof ev.data.attempts === 'number') sheets[key].attempts = ev.data.attempts;
      }
    }
  }

  let totalActiveMs = 0;
  for (const s of Object.values(sheets)) {
    totalActiveMs += s.activeMs || 0;
  }

  // 5. Teacher view events & solves after teacher view
  const teacherViewEvents = events.filter((e) => e.type === 'teacher_view_opened');
  const teacherViewOpened = teacherViewEvents.map((e) => ({
    set: e.data?.set || '',
    sheet: e.data?.sheet ?? '',
    t: e.t,
    time: new Date(e.t).toISOString(),
  }));

  const solvesAfterTeacherView = [];
  if (teacherViewOpened.length > 0) {
    const earliestTeacherViewT = Math.min(...teacherViewOpened.map((tv) => tv.t));
    for (const [key, s] of Object.entries(sheets)) {
      if (s.solved && s.solvedAt) {
        const solvedT = new Date(s.solvedAt).getTime();
        if (solvedT >= earliestTeacherViewT) {
          solvesAfterTeacherView.push({
            sheetKey: key,
            solvedAt: s.solvedAt,
          });
        }
      }
    }
  }

  // Activity bounds
  const timestamps = events.map((e) => e.t).filter((t) => typeof t === 'number' && !Number.isNaN(t));
  const firstActivityAt = timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : null;
  const lastActivityAt = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;

  const eventFingerprint = getUsageEventFingerprint(events);

  return {
    isValid: true,
    schemaVersion: payload.schemaVersion,
    appVersion: payload.appVersion || '',
    exportedAt: payload.exportedAt || '',
    student: {
      name: payload.student?.name || '',
      classCode: payload.student?.classCode || '',
    },
    installId: payload.installId || '',
    integrity: {
      ok: integrity.ok,
      reason: integrity.reason,
      sha256: integrity.computedSha256 || payload.integrity?.sha256 || '',
    },
    hashChain: {
      ok: chainOk,
      brokenAtSeq,
      truncated: isTruncated,
      firstRetainedSeq,
    },
    totalEvents: events.length,
    sheets,
    activeTimeMs: totalActiveMs,
    firstActivityAt,
    lastActivityAt,
    teacherViewOpened,
    solvesAfterTeacherView,
    eventFingerprint,
    events,
    sessions: payload.sessions || [],
    rawPayload: payload,
  };
}

export function compareFiles(summaries, options = {}) {
  const expectedClassCode = options.expectedClassCode
    ? options.expectedClassCode.trim().toLowerCase()
    : null;

  const results = summaries.map((s, index) => ({
    index,
    summary: s,
    flags: [],
    infos: [],
  }));

  // Per-file checks:
  for (const item of results) {
    const s = item.summary;
    if (!s.isValid) {
      item.flags.push({
        type: 'invalid_file',
        label: 'File format or schema invalid',
        detail: s.error || 'Invalid file',
      });
      continue;
    }

    // 1. Integrity check
    if (!s.integrity.ok) {
      item.flags.push({
        type: 'integrity_mismatch',
        label: 'Integrity mismatch (possible file edit)',
        detail: `Expected SHA-256 did not match computed content hash (${s.integrity.reason}).`,
      });
    }

    // 2. Hash chain check
    if (!s.hashChain.ok) {
      item.flags.push({
        type: 'broken_chain',
        label: 'Event sequence or hash chain broken',
        detail: `Event chain discontinuity detected at seq ${s.hashChain.brokenAtSeq}.`,
      });
    }

    // 3. Class code mismatch
    if (expectedClassCode) {
      const studentCode = (s.student.classCode || '').trim().toLowerCase();
      if (!studentCode || studentCode !== expectedClassCode) {
        item.flags.push({
          type: 'class_code_mismatch',
          label: 'Class code mismatch',
          detail: `Expected "${options.expectedClassCode}", but file has "${s.student.classCode || '(empty)'}".`,
        });
      }
    }

    // 4. Teacher view opened
    if (s.teacherViewOpened.length > 0) {
      const sheetsList = s.teacherViewOpened.map((tv) => `${tv.set}:sheet-${tv.sheet}`).join(', ');
      const solvesList = s.solvesAfterTeacherView.map((sv) => sv.sheetKey).join(', ');
      const detail = solvesList
        ? `Answer key (?teacher=1) was opened for: ${sheetsList}. Solved sheets after opening: ${solvesList}.`
        : `Answer key (?teacher=1) was opened for: ${sheetsList}.`;
      item.flags.push({
        type: 'teacher_view_opened',
        label: 'Teacher view opened in this browser',
        detail,
      });
    }

    // 5. Implausible speed: sheet solved on 1st check in under 10 seconds
    for (const [key, sheet] of Object.entries(s.sheets)) {
      if (sheet.solved && sheet.checks === 1 && sheet.activeMs < IMPLAUSIBLE_SPEED_THRESHOLD_MS) {
        item.flags.push({
          type: 'implausible_speed',
          label: 'Implausible solving speed',
          detail: `Sheet ${key} solved on 1st check in ${(sheet.activeMs / 1000).toFixed(1)}s (threshold: < 10s).`,
        });
      }
    }
  }

  // Cross-file checks:
  // A. Same install id under different student names
  const byInstallId = new Map();
  results.forEach((item) => {
    const id = item.summary.installId;
    if (id) {
      if (!byInstallId.has(id)) byInstallId.set(id, []);
      byInstallId.get(id).push(item);
    }
  });

  for (const [id, items] of byInstallId.entries()) {
    if (items.length > 1) {
      const names = new Set(
        items.map((it) => (it.summary.student.name || '').trim().toLowerCase()),
      );
      if (names.size > 1) {
        const studentNameList = items
          .map((it) => it.summary.student.name || '(anonymous)')
          .join(', ');
        items.forEach((it) => {
          it.flags.push({
            type: 'same_install_different_names',
            label: 'Same browser install ID under different student names',
            detail: `Browser install ${id.slice(0, 8)} submitted under names: ${studentNameList}.`,
          });
        });
      }
    }
  }

  // B. Duplicate integrity hash / byte-identical files
  const byHash = new Map();
  results.forEach((item) => {
    const hash = item.summary.integrity?.sha256;
    if (hash) {
      if (!byHash.has(hash)) byHash.set(hash, []);
      byHash.get(hash).push(item);
    }
  });

  for (const [hash, items] of byHash.entries()) {
    if (items.length > 1) {
      items.forEach((it) => {
        it.flags.push({
          type: 'duplicate_hash',
          label: 'Identical file content / duplicate integrity hash',
          detail: `File shares identical integrity hash with ${items.length - 1} other file(s): ${hash.slice(0, 12)}...`,
        });
      });
    }
  }

  // C. Identical attempt fingerprints with matching timing under different student names
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const itemA = results[i];
      const itemB = results[j];
      const nameA = (itemA.summary.student?.name || '').trim().toLowerCase();
      const nameB = (itemB.summary.student?.name || '').trim().toLowerCase();

      if (nameA && nameB && nameA !== nameB) {
        if (areAttemptSequencesSuspiciouslyIdentical(itemA.summary.events, itemB.summary.events)) {
          if (!itemA.flags.some((f) => f.type === 'identical_fingerprints')) {
            itemA.flags.push({
              type: 'identical_fingerprints',
              label: 'Identical attempt sequence under different student names',
              detail: 'Identical check/solve attempt sequence and timing match other student file(s).',
            });
          }
          if (!itemB.flags.some((f) => f.type === 'identical_fingerprints')) {
            itemB.flags.push({
              type: 'identical_fingerprints',
              label: 'Identical attempt sequence under different student names',
              detail: 'Identical check/solve attempt sequence and timing match other student file(s).',
            });
          }
        }
      }
    }
  }

  // D. Info only: Same student name across multiple install IDs
  const byStudentName = new Map();
  results.forEach((item) => {
    const name = (item.summary.student.name || '').trim().toLowerCase();
    if (name) {
      if (!byStudentName.has(name)) byStudentName.set(name, []);
      byStudentName.get(name).push(item);
    }
  });

  for (const [, items] of byStudentName.entries()) {
    if (items.length > 1) {
      const uniqueInstallIds = new Set(
        items.map((it) => it.summary.installId).filter(Boolean),
      );
      if (uniqueInstallIds.size > 1) {
        items.forEach((it) => {
          it.infos.push({
            type: 'multiple_install_ids',
            label: 'Same student on multiple browsers/devices (normal)',
            detail: `Student active across ${uniqueInstallIds.size} different browser installs.`,
          });
        });
      }
    }
  }

  return results;
}
