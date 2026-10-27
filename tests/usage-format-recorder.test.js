// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  GENESIS_HASH,
  buildExportPayload,
  canonicalJsonStringify,
  createExportFilename,
  getUsageEventFingerprint,
  sha256Hex,
  verifyIntegrity,
  withIntegrity,
} from '../src/usage/format.js';
import {
  MAX_ACTIVE_GAP_MS,
  MAX_EVENTS,
  UsageRecorder,
} from '../src/usage/recorder.js';

class MockStorage {
  constructor(shouldThrow = false) {
    this.store = new Map();
    this.shouldThrow = shouldThrow;
  }
  getItem(key) {
    if (this.shouldThrow) throw new Error('Storage access denied');
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    if (this.shouldThrow) throw new Error('Storage quota exceeded');
    this.store.set(key, String(value));
  }
  removeItem(key) {
    if (this.shouldThrow) throw new Error('Storage error');
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

describe('Format Module (src/usage/format.js)', () => {
  it('canonicalizes JSON with alphabetically sorted keys recursively', () => {
    const raw = {
      z: 1,
      a: {
        d: 4,
        c: [ { y: 2, x: 1 } ],
      },
    };
    const stringified = canonicalJsonStringify(raw);
    expect(stringified).toBe('{"a":{"c":[{"x":1,"y":2}],"d":4},"z":1}');
  });

  it('computes sha256 hex digest correctly', async () => {
    const hash = await sha256Hex('hello world');
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('builds export payload, adds integrity, and verifies cleanly', async () => {
    const payload = buildExportPayload({
      student: { name: 'Alex Carter', classCode: 'CS-A' },
      installId: '12345678-abcd-ef01-2345-6789abcdef01',
      sessions: [
        {
          sessionId: 'sess-1',
          startedAt: '2026-10-25T12:00:00.000Z',
          urlParams: { set: 'shapes-1', teacher: '1', mode: 'table' },
        },
      ],
      events: [
        {
          seq: 1,
          t: 1729857600000,
          sessionId: 'sess-1',
          type: 'session_started',
          data: {},
          prevHash: GENESIS_HASH,
        },
      ],
    });

    // Check that teacher param was excluded from sessions
    expect(payload.sessions[0].urlParams.teacher).toBeUndefined();
    expect(payload.sessions[0].urlParams.set).toBe('shapes-1');

    const withHash = await withIntegrity(payload);
    expect(withHash.integrity).toBeDefined();
    expect(withHash.integrity.algorithm).toBe('SHA-256');
    expect(typeof withHash.integrity.sha256).toBe('string');

    const result = await verifyIntegrity(withHash);
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('verified');
  });

  it('detects tampering when an event is edited in an exported file', async () => {
    const payload = buildExportPayload({
      student: { name: 'Jordan Lee' },
      installId: 'abcdef01-2345-6789-abcd-ef0123456789',
      events: [
        {
          seq: 1,
          t: 1729857600000,
          sessionId: 's1',
          type: 'sheet_solved',
          data: { set: 'shapes-1', sheet: 1, attempts: 1 },
          prevHash: GENESIS_HASH,
        },
      ],
    });
    const sealed = await withIntegrity(payload);

    // Tamper with the event
    sealed.events[0].data.attempts = 99;

    const result = await verifyIntegrity(sealed);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('integrity_mismatch');
  });

  it('formats filenames with slugified names, first 8 install chars, and YYYYMMDD date', () => {
    const d = new Date('2026-10-25T14:30:00.000Z');
    expect(createExportFilename('Jane Doe', 'a1b2c3d4-e5f6-7890', d)).toBe(
      'bp-usage-jane-doe-a1b2c3d4-20261025.json',
    );
    expect(createExportFilename('  Special! @Name# $123  ', '12345678', d)).toBe(
      'bp-usage-special-name-123-12345678-20261025.json',
    );
    expect(createExportFilename('', 'AABBCCDD', d)).toBe(
      'bp-usage-anonymous-aabbccdd-20261025.json',
    );
  });

  it('generates deterministic event fingerprints with rounded second gaps from attempt events', () => {
    const events = [
      { t: 1000, type: 'session_started', data: {} },
      { t: 3000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: false, attempt: 1 } },
      { t: 15000, type: 'outputs_checked', data: { set: 'shapes-1', sheet: 1, correct: true, attempt: 2 } },
      { t: 17000, type: 'sheet_solved', data: { set: 'shapes-1', sheet: 1 } },
    ];
    const fp = getUsageEventFingerprint(events);
    expect(fp).toBe(
      'outputs_checked:shapes-1:1:false:1;outputs_checked:shapes-1:1:true:2+12s;sheet_solved:shapes-1:1::+2s',
    );
  });
});

describe('Recorder (src/usage/recorder.js)', () => {
  it('maintains monotonic seq across multiple sessions using shared storage', async () => {
    const storage = new MockStorage();
    let now = 1729850000000;
    const clock = () => now;

    // Session 1
    const recorder1 = new UsageRecorder({ storage, clock });
    await recorder1.recordEvent('session_started', { mode: 'table' });
    await recorder1.recordEvent('sheet_opened', { set: 'shapes-1', sheet: 1, mode: 'table' });

    expect(recorder1.state.seq).toBe(2);
    expect(recorder1.state.events[0].seq).toBe(1);
    expect(recorder1.state.events[0].prevHash).toBe(GENESIS_HASH);
    expect(recorder1.state.events[1].seq).toBe(2);

    const hashOfFirst = await sha256Hex(canonicalJsonStringify(recorder1.state.events[0]));
    expect(recorder1.state.events[1].prevHash).toBe(hashOfFirst);

    // Session 2 (same browser/storage, new page load)
    now += 10000;
    const recorder2 = new UsageRecorder({ storage, clock });
    expect(recorder2.installId).toBe(recorder1.installId);
    expect(recorder2.sessionId).not.toBe(recorder1.sessionId);

    await recorder2.recordEvent('sheet_opened', { set: 'shapes-1', sheet: 2, mode: 'shade' });
    expect(recorder2.state.seq).toBe(3);
    expect(recorder2.state.events[2].seq).toBe(3);

    const hashOfSecond = await sha256Hex(canonicalJsonStringify(recorder1.state.events[1]));
    expect(recorder2.state.events[2].prevHash).toBe(hashOfSecond);
  });

  it('caps active time gaps between consecutive events on the same sheet at 5 minutes', async () => {
    const storage = new MockStorage();
    let now = 1729850000000;
    const clock = () => now;

    const recorder = new UsageRecorder({ storage, clock });
    await recorder.recordEvent('sheet_opened', { set: 'shapes-1', sheet: 1 });

    // 30 seconds later: output checked
    now += 30000;
    await recorder.recordEvent('outputs_checked', { set: 'shapes-1', sheet: 1, correct: false });

    const summary1 = recorder.getSheetSummary('shapes-1:1');
    expect(summary1.activeMs).toBe(30000);
    expect(summary1.outputChecks).toBe(1);

    // 20 minutes later (1200000 ms) idle break -> capped at 5 minutes (300000 ms)
    now += 1200000;
    await recorder.recordEvent('outputs_checked', { set: 'shapes-1', sheet: 1, correct: true });

    const summary2 = recorder.getSheetSummary('shapes-1:1');
    expect(summary2.activeMs).toBe(30000 + MAX_ACTIVE_GAP_MS);
    expect(summary2.outputChecks).toBe(2);
  });

  it('marks retention truncation when events exceed 60 days or max count', async () => {
    const storage = new MockStorage();
    let now = 1729850000000;
    const clock = () => now;

    const recorder = new UsageRecorder({ storage, clock });

    // Manually push 5005 events
    for (let i = 1; i <= 5005; i++) {
      recorder.state.events.push({
        seq: i,
        t: now + i * 10,
        sessionId: 's',
        type: 'test',
        data: {},
        prevHash: 'mock',
      });
    }
    recorder.state.seq = 5005;
    recorder._saveState();

    expect(recorder.state.events.length).toBe(MAX_EVENTS);
    expect(recorder.state.summary.eventsTruncated).toBe(true);
    expect(recorder.state.summary.firstRetainedSeq).toBe(6);
    expect(recorder.state.summary.totalEvents).toBe(5005);
  });

  it('records only one teacher_view_opened event per sheet viewed in teacher mode, and no checks or solves', async () => {
    const storage = new MockStorage();
    let now = 1729850000000;
    const clock = () => now;

    const teacherRecorder = new UsageRecorder({ storage, clock, isTeacher: true });

    // Teacher actions: should be ignored except teacher_view_opened
    await teacherRecorder.recordEvent('sheet_opened', { set: 'shapes-1', sheet: 1 });
    await teacherRecorder.recordEvent('outputs_checked', { set: 'shapes-1', sheet: 1 });
    await teacherRecorder.recordEvent('sheet_solved', { set: 'shapes-1', sheet: 1 });
    expect(teacherRecorder.state.events.length).toBe(0);

    // Teacher opens sheet 1 view
    await teacherRecorder.recordEvent('teacher_view_opened', { set: 'shapes-1', sheet: 1 });
    expect(teacherRecorder.state.events.length).toBe(1);
    expect(teacherRecorder.state.events[0].type).toBe('teacher_view_opened');
    expect(teacherRecorder.state.events[0].data).toEqual({ set: 'shapes-1', sheet: 1 });

    // Re-opening sheet 1 in same session does not record a duplicate
    await teacherRecorder.recordEvent('teacher_view_opened', { set: 'shapes-1', sheet: 1 });
    expect(teacherRecorder.state.events.length).toBe(1);

    // Opening sheet 2 records exactly one for sheet 2
    await teacherRecorder.recordEvent('teacher_view_opened', { set: 'shapes-1', sheet: 2 });
    expect(teacherRecorder.state.events.length).toBe(2);
    expect(teacherRecorder.state.events[1].data).toEqual({ set: 'shapes-1', sheet: 2 });
  });

  it('handles throwing storage gracefully without breaking runtime and sets storageError', async () => {
    const throwingStorage = new MockStorage(true);
    const recorder = new UsageRecorder({ storage: throwingStorage });

    expect(recorder.isStorageAvailable()).toBe(false);

    // Recording should still succeed in-memory
    await recorder.recordEvent('session_started', {});
    await recorder.recordEvent('sheet_opened', { set: 'shapes-1', sheet: 1 });

    expect(recorder.state.events.length).toBe(2);
    expect(recorder.isStorageAvailable()).toBe(false);

    // Export should still produce a valid payload
    const exported = await recorder.buildExport({ name: 'Private User' });
    expect(exported.payload.student.name).toBe('Private User');
    const verify = await verifyIntegrity(exported.payload);
    expect(verify.ok).toBe(true);
  });

  it('supports two recorder instances sharing one storage (read-modify-write across tabs)', async () => {
    const storage = new MockStorage();
    let now = 1729850000000;
    const clock = () => now;

    const r1 = new UsageRecorder({ storage, clock });
    const r2 = new UsageRecorder({ storage, clock });

    // Interleave events between r1 and r2
    now += 1000;
    await r1.recordEvent('outputs_checked', { set: 'shapes-1', sheet: 1, correct: false, attempt: 1 });

    now += 2000;
    await r2.recordEvent('shading_checked', { set: 'shapes-1', sheet: 2, correct: false, attempt: 1 });

    now += 3000;
    await r1.recordEvent('outputs_checked', { set: 'shapes-1', sheet: 1, correct: true, attempt: 2 });

    now += 1000;
    await r1.recordEvent('sheet_solved', { set: 'shapes-1', sheet: 1, mode: 'table', attempts: 2 });

    now += 4000;
    await r2.recordEvent('shading_checked', { set: 'shapes-1', sheet: 2, correct: true, attempt: 2 });

    now += 1000;
    await r2.recordEvent('sheet_solved', { set: 'shapes-1', sheet: 2, mode: 'shade', attempts: 2 });

    const export1 = await r1.buildExport({ name: 'Student Tab 1' });
    const export2 = await r2.buildExport({ name: 'Student Tab 2' });

    // Both exports must contain ALL 6 events from both instances
    expect(export1.payload.events).toHaveLength(6);
    expect(export2.payload.events).toHaveLength(6);

    // seq values must be unique and strictly consecutive 1..6
    expect(export1.payload.events.map((e) => e.seq)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(export2.payload.events.map((e) => e.seq)).toEqual([1, 2, 3, 4, 5, 6]);

    // Chain must be intact across interleaving writes
    for (let i = 1; i < export1.payload.events.length; i++) {
      const prev = export1.payload.events[i - 1];
      const curr = export1.payload.events[i];
      const expectedPrevHash = await sha256Hex(canonicalJsonStringify(prev));
      expect(curr.prevHash).toBe(expectedPrevHash);
    }

    // Both sheets must be recorded as solved
    expect(export1.payload.summary.sheets['shapes-1:1'].solved).toBe(true);
    expect(export1.payload.summary.sheets['shapes-1:2'].solved).toBe(true);

    // Both exports verify integrity
    const v1 = await verifyIntegrity(export1.payload);
    const v2 = await verifyIntegrity(export2.payload);
    expect(v1.ok).toBe(true);
    expect(v2.ok).toBe(true);
  });

  it('does not double-count active time when two tabs work on the same sheet', async () => {
    const storage = new MockStorage();
    let now = 1729850000000;
    const clock = () => now;
    const r1 = new UsageRecorder({ storage, clock });
    const r2 = new UsageRecorder({ storage, clock });
    const check = { set: 'shapes-1', sheet: 1, correct: false };

    await r1.recordEvent('outputs_checked', { ...check, attempt: 1 });
    now += 3000;
    await r2.recordEvent('outputs_checked', { ...check, attempt: 1 });
    now += 3000;
    await r1.recordEvent('outputs_checked', { ...check, attempt: 2 });

    const exported = await r1.buildExport({ name: 'Two Tabs' });
    expect(exported.payload.summary.sheets['shapes-1:1'].activeMs).toBe(6000);
  });
});
