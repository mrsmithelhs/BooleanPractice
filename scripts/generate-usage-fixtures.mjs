import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  GENESIS_HASH,
  buildExportPayload,
  canonicalJsonStringify,
  sha256Hex,
  withIntegrity,
} from '../src/usage/format.js';

const outDir = resolve('tests/fixtures/usage');
mkdirSync(outDir, { recursive: true });

async function createChain(eventSpecs, customSubtle) {
  const events = [];
  let prevHash = GENESIS_HASH;
  for (let i = 0; i < eventSpecs.length; i++) {
    const spec = eventSpecs[i];
    const ev = {
      seq: i + 1,
      t: spec.t,
      sessionId: spec.sessionId || 'sess-1',
      type: spec.type,
      data: spec.data || {},
      prevHash,
    };
    events.push(ev);
    prevHash = await sha256Hex(canonicalJsonStringify(ev), customSubtle);
  }
  return events;
}

async function main() {
  const t0 = 1729860000000;

  // 1. Clean pair
  // clean-student-a.json
  const eventsA = await createChain([
    { t: t0, type: 'session_started', data: { urlParams: { set: 'shapes-1', sheet: '1' } } },
    { t: t0 + 2000, type: 'sheet_opened', data: { set: 'shapes-1', sheet: 1, mode: 'table' } },
    { t: t0 + 25000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: false, attempt: 1, blankCount: 0, wrongCount: 1 } },
    { t: t0 + 45000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 2, blankCount: 0, wrongCount: 0 } },
    { t: t0 + 46000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table', attempts: 2, activeMs: 44000 } },
  ]);
  const payloadA = await withIntegrity(buildExportPayload({
    student: { name: 'Alex Carter', classCode: 'PERIOD-1' },
    installId: '11111111-0000-0000-0000-000000000001',
    sessions: [{ sessionId: 'sess-1', startedAt: new Date(t0).toISOString(), lastActivityAt: new Date(t0 + 46000).toISOString() }],
    events: eventsA,
    summary: {
      eventsTruncated: false,
      firstRetainedSeq: 1,
      totalEvents: eventsA.length,
      sheets: {
        'shapes-1:1': { solved: true, solvedAt: new Date(t0 + 46000).toISOString(), mode: 'table', outputChecks: 2, shadingChecks: 0, activeMs: 44000 },
      },
    },
    exportedAt: new Date(t0 + 50000).toISOString(),
  }));
  writeFileSync(resolve(outDir, 'clean-student-a.json'), JSON.stringify(payloadA, null, 2));

  // clean-student-b.json
  const eventsB = await createChain([
    { t: t0 + 1000, type: 'session_started', data: { urlParams: { set: 'shapes-1', sheet: '1' } } },
    { t: t0 + 3000, type: 'sheet_opened', data: { set: 'shapes-1', sheet: 1, mode: 'table' } },
    { t: t0 + 35000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 1, blankCount: 0, wrongCount: 0 } },
    { t: t0 + 36000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table', attempts: 1, activeMs: 33000 } },
  ]);
  const payloadB = await withIntegrity(buildExportPayload({
    student: { name: 'Blake Jordan', classCode: 'PERIOD-1' },
    installId: '22222222-0000-0000-0000-000000000002',
    sessions: [{ sessionId: 'sess-2', startedAt: new Date(t0 + 1000).toISOString(), lastActivityAt: new Date(t0 + 36000).toISOString() }],
    events: eventsB,
    summary: {
      eventsTruncated: false,
      firstRetainedSeq: 1,
      totalEvents: eventsB.length,
      sheets: {
        'shapes-1:1': { solved: true, solvedAt: new Date(t0 + 36000).toISOString(), mode: 'table', outputChecks: 1, shadingChecks: 0, activeMs: 33000 },
      },
    },
    exportedAt: new Date(t0 + 40000).toISOString(),
  }));
  writeFileSync(resolve(outDir, 'clean-student-b.json'), JSON.stringify(payloadB, null, 2));

  // 2. Flag: integrity mismatch
  const eventsCasey = await createChain([
    { t: t0 + 5000, type: 'session_started', data: { urlParams: { set: 'shapes-1', sheet: '1' } } },
    { t: t0 + 8000, type: 'sheet_opened', data: { set: 'shapes-1', sheet: 1, mode: 'table' } },
    { t: t0 + 20000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: false, attempt: 1, blankCount: 2, wrongCount: 0 } },
    { t: t0 + 40000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: false, attempt: 2, blankCount: 0, wrongCount: 1 } },
    { t: t0 + 60000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 3, blankCount: 0, wrongCount: 0 } },
    { t: t0 + 61000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table', attempts: 3, activeMs: 53000 } },
  ]);
  const payloadIntegrityMismatch = await withIntegrity(buildExportPayload({
    student: { name: 'Casey Morgan', classCode: 'PERIOD-1' },
    installId: '99990001-0000-0000-0000-000000000001',
    sessions: [{ sessionId: 'sess-casey', startedAt: new Date(t0 + 5000).toISOString(), lastActivityAt: new Date(t0 + 61000).toISOString() }],
    events: eventsCasey,
    summary: {
      sheets: {
        'shapes-1:1': { solved: true, solvedAt: new Date(t0 + 61000).toISOString(), mode: 'table', outputChecks: 3, shadingChecks: 0, activeMs: 53000 },
      },
    },
    exportedAt: new Date(t0 + 65000).toISOString(),
  }));
  // Tamper with event data without recomputing integrity
  payloadIntegrityMismatch.events[2].data.wrongCount = 5;
  writeFileSync(resolve(outDir, 'flag-integrity-mismatch.json'), JSON.stringify(payloadIntegrityMismatch, null, 2));

  // 3. Flag: broken hash chain
  const eventsBrokenChain = await createChain([
    { t: t0 + 10000, type: 'session_started', data: {} },
    { t: t0 + 15000, type: 'sheet_opened', data: { set: 'shapes-1', sheet: 1 } },
    { t: t0 + 35000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 1 } },
  ]);
  eventsBrokenChain[2].prevHash = 'bad0000000000000000000000000000000000000000000000000000000000000';
  const payloadBrokenChain = await withIntegrity(buildExportPayload({
    student: { name: 'Dana Taylor', classCode: 'PERIOD-1' },
    installId: '33333333-0000-0000-0000-000000000003',
    events: eventsBrokenChain,
  }));
  writeFileSync(resolve(outDir, 'flag-broken-chain.json'), JSON.stringify(payloadBrokenChain, null, 2));

  // 4. Flag: class code mismatch
  const eventsElliott = await createChain([
    { t: t0 + 20000, type: 'session_started', data: {} },
    { t: t0 + 25000, type: 'sheet_opened', data: { set: 'shapes-1', sheet: 1 } },
    { t: t0 + 55000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 1 } },
    { t: t0 + 56000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table', attempts: 1, activeMs: 31000 } },
  ]);
  const payloadClassMismatch = await withIntegrity(buildExportPayload({
    student: { name: 'Elliott Reed', classCode: 'PERIOD-9' },
    installId: '44444444-0000-0000-0000-000000000004',
    events: eventsElliott,
    summary: {
      sheets: {
        'shapes-1:1': { solved: true, solvedAt: new Date(t0 + 56000).toISOString(), mode: 'table', outputChecks: 1, shadingChecks: 0, activeMs: 31000 },
      },
    },
  }));
  writeFileSync(resolve(outDir, 'flag-class-code-mismatch.json'), JSON.stringify(payloadClassMismatch, null, 2));

  // 5. Flag: teacher view opened
  const eventsTeacherView = await createChain([
    { t: t0, type: 'session_started', data: {} },
    { t: t0 + 1000, type: 'teacher_view_opened', data: { set: 'shapes-1', sheet: 1 } },
    { t: t0 + 5000, type: 'sheet_opened', data: { set: 'shapes-1', sheet: 1, mode: 'table' } },
    { t: t0 + 25000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 1 } },
    { t: t0 + 26000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table', attempts: 1, activeMs: 21000 } },
  ]);
  const payloadTeacherView = await withIntegrity(buildExportPayload({
    student: { name: 'Finley Brooks', classCode: 'PERIOD-1' },
    installId: '55555555-0000-0000-0000-000000000005',
    events: eventsTeacherView,
    summary: {
      sheets: {
        'shapes-1:1': { solved: true, solvedAt: new Date(t0 + 26000).toISOString(), mode: 'table', outputChecks: 1, shadingChecks: 0, activeMs: 21000 },
      },
    },
  }));
  writeFileSync(resolve(outDir, 'flag-teacher-view-opened.json'), JSON.stringify(payloadTeacherView, null, 2));

  // 6. Flag: implausible speed (< 10s active time on 1st check)
  const eventsFast = await createChain([
    { t: t0, type: 'session_started', data: {} },
    { t: t0 + 1000, type: 'sheet_opened', data: { set: 'shapes-1', sheet: 1, mode: 'table' } },
    { t: t0 + 4000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 1 } },
    { t: t0 + 4500, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table', attempts: 1, activeMs: 3500 } },
  ]);
  const payloadFast = await withIntegrity(buildExportPayload({
    student: { name: 'Gray Harper', classCode: 'PERIOD-1' },
    installId: '66666666-0000-0000-0000-000000000006',
    events: eventsFast,
    summary: {
      sheets: {
        'shapes-1:1': { solved: true, solvedAt: new Date(t0 + 4500).toISOString(), mode: 'table', outputChecks: 1, shadingChecks: 0, activeMs: 3500 },
      },
    },
  }));
  writeFileSync(resolve(outDir, 'flag-implausible-speed.json'), JSON.stringify(payloadFast, null, 2));

  // 7. Flag: same install id under different student names
  const sharedInstallId = '77777777-aaaa-bbbb-cccc-777777777777';
  const payloadSameInstall1 = await withIntegrity(buildExportPayload({
    student: { name: 'Hayden Fox', classCode: 'PERIOD-1' },
    installId: sharedInstallId,
    events: eventsA,
    summary: {
      sheets: { 'shapes-1:1': { solved: true, solvedAt: new Date(t0 + 46000).toISOString(), outputChecks: 2, activeMs: 44000 } },
    },
  }));
  const payloadSameInstall2 = await withIntegrity(buildExportPayload({
    student: { name: 'Indigo Quinn', classCode: 'PERIOD-1' },
    installId: sharedInstallId,
    events: eventsB,
    summary: {
      sheets: { 'shapes-1:1': { solved: true, solvedAt: new Date(t0 + 36000).toISOString(), outputChecks: 1, activeMs: 33000 } },
    },
  }));
  writeFileSync(resolve(outDir, 'flag-same-install-1.json'), JSON.stringify(payloadSameInstall1, null, 2));
  writeFileSync(resolve(outDir, 'flag-same-install-2.json'), JSON.stringify(payloadSameInstall2, null, 2));

  // 8. Flag: identical files / duplicate hash
  const payloadDupHash1 = await withIntegrity(buildExportPayload({
    student: { name: 'Kendall Moss', classCode: 'PERIOD-1' },
    installId: '88888888-0000-0000-0000-000000000008',
    events: eventsA,
    exportedAt: '2026-10-25T15:00:00.000Z',
    summary: { sheets: { 'shapes-1:1': { solved: true, outputChecks: 2, activeMs: 44000 } } },
  }));
  const payloadDupHash2 = JSON.parse(JSON.stringify(payloadDupHash1)); // Exact byte-identical file
  writeFileSync(resolve(outDir, 'flag-duplicate-hash-1.json'), JSON.stringify(payloadDupHash1, null, 2));
  writeFileSync(resolve(outDir, 'flag-duplicate-hash-2.json'), JSON.stringify(payloadDupHash2, null, 2));

  // 9. Flag: identical fingerprints under different student names
  // Exactly matching check/solve attempt sequence and timing (>= 6 signal events)
  const eventsFp1 = await createChain([
    { t: t0, type: 'session_started', data: {} },
    { t: t0 + 2000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: false, attempt: 1 } },
    { t: t0 + 15000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 2 } },
    { t: t0 + 17000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table', attempts: 2, activeMs: 15000 } },
    { t: t0 + 35000, type: 'shading_checked', data: { set: 'shapes-1', sheet: 2, correct: false, attempt: 1 } },
    { t: t0 + 50000, type: 'shading_checked', data: { set: 'shapes-1', sheet: 2, correct: true, attempt: 2 } },
    { t: t0 + 52000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 2, mode: 'shade', attempts: 2, activeMs: 35000 } },
  ]);
  const eventsFp2 = await createChain([
    { t: t0 + 100000, type: 'session_started', data: {} },
    { t: t0 + 103000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: false, attempt: 1 } },
    { t: t0 + 116000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 2 } },
    { t: t0 + 118000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1, mode: 'table', attempts: 2, activeMs: 15000 } },
    { t: t0 + 136000, type: 'shading_checked', data: { set: 'shapes-1', sheet: 2, correct: false, attempt: 1 } },
    { t: t0 + 151000, type: 'shading_checked', data: { set: 'shapes-1', sheet: 2, correct: true, attempt: 2 } },
    { t: t0 + 153000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 2, mode: 'shade', attempts: 2, activeMs: 35000 } },
  ]);
  const payloadFp1 = await withIntegrity(buildExportPayload({
    student: { name: 'Logan Price', classCode: 'PERIOD-1' },
    installId: 'aaaaaaaa-0000-0000-0000-00000000000a',
    events: eventsFp1,
    summary: {
      sheets: {
        'shapes-1:1': { solved: true, outputChecks: 2, activeMs: 15000 },
        'shapes-1:2': { solved: true, shadingChecks: 2, activeMs: 35000 },
      },
    },
  }));
  const payloadFp2 = await withIntegrity(buildExportPayload({
    student: { name: 'Mason Brooks', classCode: 'PERIOD-1' },
    installId: 'bbbbbbbb-0000-0000-0000-00000000000b',
    events: eventsFp2,
    summary: {
      sheets: {
        'shapes-1:1': { solved: true, outputChecks: 2, activeMs: 15000 },
        'shapes-1:2': { solved: true, shadingChecks: 2, activeMs: 35000 },
      },
    },
  }));
  writeFileSync(resolve(outDir, 'flag-identical-fingerprints-1.json'), JSON.stringify(payloadFp1, null, 2));
  writeFileSync(resolve(outDir, 'flag-identical-fingerprints-2.json'), JSON.stringify(payloadFp2, null, 2));

  // 10. Info only: Same student name across multiple install IDs
  const payloadMultiInstall1 = await withIntegrity(buildExportPayload({
    student: { name: 'Morgan Smith', classCode: 'PERIOD-1' },
    installId: 'cccccccc-0000-0000-0000-00000000000c',
    events: eventsA,
  }));
  const payloadMultiInstall2 = await withIntegrity(buildExportPayload({
    student: { name: 'Morgan Smith', classCode: 'PERIOD-1' },
    installId: 'dddddddd-0000-0000-0000-00000000000d',
    events: eventsB,
  }));
  writeFileSync(resolve(outDir, 'info-multi-install-1.json'), JSON.stringify(payloadMultiInstall1, null, 2));
  writeFileSync(resolve(outDir, 'info-multi-install-2.json'), JSON.stringify(payloadMultiInstall2, null, 2));

  console.log('Fixtures generated successfully.');
}

main().catch(console.error);
