export const SCHEMA_VERSION = 1;
export const APP_NAME = 'boolean-practice';
export const APP_VERSION = '0.1.0';
export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function canonicalizeJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalizeJsonValue);
  }
  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        const entry = value[key];
        if (typeof entry !== 'undefined') {
          accumulator[key] = canonicalizeJsonValue(entry);
        }
        return accumulator;
      }, {});
  }
  return value;
}

export function canonicalJsonStringify(value) {
  return JSON.stringify(canonicalizeJsonValue(value));
}

export async function sha256Hex(text, customSubtle) {
  const subtle = customSubtle || globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is not available.');
  }
  const data = new TextEncoder().encode(text);
  const digest = await subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function slugifyStudentName(name) {
  if (!name || typeof name !== 'string') return 'anonymous';
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'anonymous';
}

export function createExportFilename(studentName, installId, date = new Date()) {
  const nameSlug = slugifyStudentName(studentName);
  const idStr = String(installId || '').replace(/[^a-zA-Z0-9]/g, '');
  const idPart = (idStr.slice(0, 8) || '00000000').toLowerCase().padEnd(8, '0');
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  return `bp-usage-${nameSlug}-${idPart}-${datePart}.json`;
}

export const SIGNAL_EVENT_TYPES = Object.freeze([
  'outputs_checked',
  'shading_checked',
  'sheet_solved',
  'teacher_view_opened',
]);

export function getUsageSignalEvents(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }
  return events.filter((e) => SIGNAL_EVENT_TYPES.includes(e?.type));
}

function getSignalEventDescriptor(e) {
  const set = e.data?.set || '';
  const sheet = e.data?.sheet ?? '';
  const correct = typeof e.data?.correct === 'boolean'
    ? e.data.correct
    : (typeof e.data?.allCorrect === 'boolean' ? e.data.allCorrect : '');
  const attempt = e.data?.attempt ?? e.data?.attempts ?? '';
  return `${e.type}:${set}:${sheet}:${correct}:${attempt}`;
}

export function getUsageEventFingerprint(events) {
  const signalEvents = getUsageSignalEvents(events);
  if (signalEvents.length === 0) {
    return 'empty';
  }
  return signalEvents
    .map((e, idx) => {
      const base = getSignalEventDescriptor(e);
      if (idx === 0) return base;
      const gapSec = Math.round(Math.max(0, (e.t || 0) - (signalEvents[idx - 1].t || 0)) / 1000);
      return `${base}+${gapSec}s`;
    })
    .join(';');
}

export function areAttemptSequencesSuspiciouslyIdentical(eventsA, eventsB) {
  const sigA = getUsageSignalEvents(eventsA);
  const sigB = getUsageSignalEvents(eventsB);

  // Must have at least 6 signal events to prevent false positives on short runs
  if (sigA.length < 6 || sigB.length < 6) {
    return false;
  }

  if (sigA.length !== sigB.length) {
    return false;
  }

  for (let i = 0; i < sigA.length; i++) {
    const a = sigA[i];
    const b = sigB[i];

    if (getSignalEventDescriptor(a) !== getSignalEventDescriptor(b)) {
      return false;
    }

    if (i > 0) {
      const gapA = Math.round(Math.max(0, (a.t || 0) - (sigA[i - 1].t || 0)) / 1000);
      const gapB = Math.round(Math.max(0, (b.t || 0) - (sigB[i - 1].t || 0)) / 1000);
      if (Math.abs(gapA - gapB) > 1) {
        return false;
      }
    }
  }

  return true;
}

export function buildExportPayload({
  student = { name: '', classCode: '' },
  installId = '',
  sessions = [],
  events = [],
  summary = {},
  appVersion = APP_VERSION,
  exportedAt = new Date().toISOString(),
} = {}) {
  const cleanStudent = {
    name: typeof student?.name === 'string' ? student.name.trim() : '',
    classCode: typeof student?.classCode === 'string' ? student.classCode.trim() : '',
  };

  const cleanSessions = sessions.map((s) => {
    const urlParams = s.urlParams ? { ...s.urlParams } : {};
    delete urlParams.teacher;
    return {
      sessionId: s.sessionId || '',
      startedAt: s.startedAt || '',
      lastActivityAt: s.lastActivityAt || s.startedAt || '',
      urlParams,
    };
  });

  const firstSeq = events.length > 0 ? events[0].seq : 1;

  return {
    schemaVersion: SCHEMA_VERSION,
    app: APP_NAME,
    appVersion,
    exportedAt,
    student: cleanStudent,
    installId: String(installId || ''),
    sessions: cleanSessions,
    events: events.map((e) => ({
      seq: e.seq,
      t: e.t,
      sessionId: e.sessionId,
      type: e.type,
      data: e.data ? { ...e.data } : {},
      prevHash: e.prevHash,
    })),
    summary: {
      eventsTruncated: Boolean(summary.eventsTruncated),
      firstRetainedSeq:
        typeof summary.firstRetainedSeq === 'number'
          ? summary.firstRetainedSeq
          : firstSeq,
      totalEvents:
        typeof summary.totalEvents === 'number'
          ? summary.totalEvents
          : events.length,
      sheets: summary.sheets ? JSON.parse(JSON.stringify(summary.sheets)) : {},
    },
  };
}

export async function withIntegrity(payload, customSubtle) {
  const payloadCopy = { ...payload };
  delete payloadCopy.integrity;
  const canonical = canonicalJsonStringify(payloadCopy);
  const sha256 = await sha256Hex(canonical, customSubtle);
  return {
    ...payloadCopy,
    integrity: {
      algorithm: 'SHA-256',
      sha256,
    },
  };
}

export async function verifyIntegrity(payload, customSubtle) {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      reason: 'payload_missing',
      computedSha256: null,
      expectedSha256: null,
      algorithm: null,
    };
  }
  if (!payload.integrity || typeof payload.integrity !== 'object' || !payload.integrity.sha256) {
    return {
      ok: false,
      reason: 'missing_integrity',
      computedSha256: null,
      expectedSha256: null,
      algorithm: null,
    };
  }
  const { integrity, ...payloadWithoutIntegrity } = payload;
  const canonical = canonicalJsonStringify(payloadWithoutIntegrity);
  const computedSha256 = await sha256Hex(canonical, customSubtle);
  const expectedSha256 = integrity.sha256;
  const ok = computedSha256 === expectedSha256;
  return {
    ok,
    computedSha256,
    expectedSha256,
    algorithm: integrity.algorithm || 'SHA-256',
    reason: ok ? 'verified' : 'integrity_mismatch',
  };
}
