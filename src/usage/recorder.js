import {
  APP_VERSION,
  GENESIS_HASH,
  buildExportPayload,
  canonicalJsonStringify,
  createExportFilename,
  sha256Hex,
  withIntegrity,
} from './format.js';

export const USAGE_STORAGE_KEY = 'bp-usage-v1';
export const INSTALL_ID_KEY = 'bp-usage-install-id';
export const STUDENT_INFO_KEY = 'bp-usage-student-info';

export const MAX_ACTIVE_GAP_MS = 5 * 60 * 1000; // 5 minutes
export const RETENTION_DAYS = 60;
export const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
export const MAX_EVENTS = 5000;

function defaultGenerateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Module-level lock for serializing same-process instances (e.g. in Node/tests where navigator.locks is absent)
const processLocks = new Map();
async function runProcessLock(name, fn) {
  const prev = processLocks.get(name) || Promise.resolve();
  let release;
  const next = new Promise((resolve) => {
    release = resolve;
  });
  processLocks.set(name, prev.then(() => next));
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

export class UsageRecorder {
  constructor(options = {}) {
    this.storage = options.storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    this.clock = options.clock ?? (() => Date.now());
    this.generateUUID = options.generateUUID ?? defaultGenerateUUID;
    this.subtle = options.subtle ?? (typeof crypto !== 'undefined' ? crypto.subtle : null);
    this.appVersion = options.appVersion ?? APP_VERSION;
    this.isTeacher = Boolean(options.isTeacher);
    this.locks = options.locks ?? (typeof navigator !== 'undefined' ? navigator.locks : null);
    this.storageError = false;
    this._memoryState = null;

    this.installId = this._initInstallId();
    this.sessionId = this.generateUUID();
    this.sessionStartedAt = new Date(this.clock()).toISOString();
    this.urlParams = options.urlParams ? { ...options.urlParams } : {};
    delete this.urlParams.teacher;

    // Track teacher_view_opened per sheet in current session to enforce exactly once per sheet
    this.teacherViewsLogged = new Set();

    this.state = this._loadState();
    // Promise chain for serializing calls within this instance
    this.queue = Promise.resolve().then(() => this._initSession());
  }

  async _runWithLock(fn) {
    const locks = this.locks ?? (typeof navigator !== 'undefined' ? navigator.locks : null);
    if (locks && typeof locks.request === 'function') {
      return locks.request('bp-usage', () => fn());
    }
    return runProcessLock('bp-usage', fn);
  }

  _safeStorageGet(key) {
    if (!this.storage) return null;
    try {
      return this.storage.getItem(key);
    } catch {
      this.storageError = true;
      return null;
    }
  }

  _safeStorageSet(key, value) {
    if (!this.storage) return false;
    try {
      this.storage.setItem(key, value);
      return true;
    } catch {
      this.storageError = true;
      return false;
    }
  }

  _initInstallId() {
    let id = this._safeStorageGet(INSTALL_ID_KEY);
    if (!id) {
      id = this.generateUUID();
      this._safeStorageSet(INSTALL_ID_KEY, id);
    }
    return id;
  }

  _createInitialState() {
    return {
      seq: 0,
      lastEvent: null,
      events: [],
      sessions: [],
      summary: {
        eventsTruncated: false,
        firstRetainedSeq: 1,
        totalEvents: 0,
        sheets: {},
      },
    };
  }

  _loadState() {
    if (this.storageError) {
      if (!this._memoryState) {
        this._memoryState = this._createInitialState();
      }
      return this._memoryState;
    }
    const raw = this._safeStorageGet(USAGE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            seq: typeof parsed.seq === 'number' ? parsed.seq : 0,
            lastEvent: parsed.lastEvent || null,
            events: Array.isArray(parsed.events) ? parsed.events : [],
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            summary: parsed.summary || {
              eventsTruncated: false,
              firstRetainedSeq: 1,
              totalEvents: 0,
              sheets: {},
            },
          };
        }
      } catch {
        // Corrupt storage, fall through to initial state
      }
    }
    return this._createInitialState();
  }

  _saveState(state = this.state) {
    if (!state) state = this.state;
    this._applyRetention(state);
    if (this.storageError || !this.storage) {
      this._memoryState = state;
      return;
    }
    const serialized = JSON.stringify(state);
    const ok = this._safeStorageSet(USAGE_STORAGE_KEY, serialized);
    if (!ok) {
      this._memoryState = state;
    }
  }

  _applyRetention(state = this.state) {
    if (!state) state = this.state;
    const now = this.clock();
    const cutoff = now - RETENTION_MS;
    const initialCount = state.events.length;

    // Filter by age (last 60 days)
    let retained = state.events.filter((e) => e.t >= cutoff);

    // Filter by count (max 5000)
    if (retained.length > MAX_EVENTS) {
      retained = retained.slice(retained.length - MAX_EVENTS);
    }

    if (retained.length < initialCount) {
      state.summary.eventsTruncated = true;
      if (retained.length > 0) {
        state.summary.firstRetainedSeq = retained[0].seq;
      }
    }

    state.events = retained;
    state.summary.totalEvents = state.seq;
  }

  async _initSession() {
    return this._runWithLock(async () => {
      const state = this._loadState();
      let session = state.sessions.find((s) => s.sessionId === this.sessionId);
      if (!session) {
        session = {
          sessionId: this.sessionId,
          startedAt: this.sessionStartedAt,
          lastActivityAt: this.sessionStartedAt,
          urlParams: this.urlParams,
        };
        state.sessions.push(session);
        this._saveState(state);
        this.state = state;
      }
    });
  }

  getSheetSummary(sheetKey) {
    const state = this._loadState();
    if (!state.summary.sheets[sheetKey]) {
      state.summary.sheets[sheetKey] = {
        solved: false,
        solvedAt: null,
        mode: null,
        outputChecks: 0,
        shadingChecks: 0,
        activeMs: 0,
      };
    }
    return state.summary.sheets[sheetKey];
  }

  recordEvent(type, data = {}) {
    this.queue = this.queue.then(async () => {
      await this._runWithLock(async () => {
        await this._recordEventInternal(type, data);
      });
    }).catch(() => {
      // Swallowed to prevent disruption of student practice
    });
    return this.queue;
  }

  async _recordEventInternal(type, data = {}) {
    // If teacher mode is active, the ONLY allowed event is teacher_view_opened
    if (this.isTeacher) {
      if (type !== 'teacher_view_opened') {
        return;
      }
      const sheetKey = `${data.set}:${data.sheet}`;
      if (this.teacherViewsLogged.has(sheetKey)) {
        return; // exactly one teacher_view_opened per sheet viewed per session
      }
      this.teacherViewsLogged.add(sheetKey);
    } else if (type === 'teacher_view_opened') {
      // In student mode, teacher_view_opened shouldn't fire
      return;
    }

    const t = this.clock();
    let maxRetries = 5;
    while (maxRetries > 0) {
      maxRetries--;
      // 1. Re-read latest state from storage (read-modify-write)
      const state = this._loadState();
      const initialSeq = state.seq;

      // Ensure session is in state.sessions
      let currentSession = state.sessions.find((s) => s.sessionId === this.sessionId);
      if (!currentSession) {
        currentSession = {
          sessionId: this.sessionId,
          startedAt: this.sessionStartedAt,
          lastActivityAt: new Date(t).toISOString(),
          urlParams: this.urlParams,
        };
        state.sessions.push(currentSession);
      } else {
        currentSession.lastActivityAt = new Date(t).toISOString();
      }

      // Compute active time if this event is associated with a specific sheet
      if (data && data.set && data.sheet !== undefined) {
        const sheetKey = `${data.set}:${data.sheet}`;
        if (!state.summary.sheets[sheetKey]) {
          state.summary.sheets[sheetKey] = {
            solved: false,
            solvedAt: null,
            mode: null,
            outputChecks: 0,
            shadingChecks: 0,
            activeMs: 0,
          };
        }
        const sheetSummary = state.summary.sheets[sheetKey];

        // Always use the stored log (not a per-tab cache) so time from other open tabs isn't counted twice
        let lastTime;
        for (let i = state.events.length - 1; i >= 0; i--) {
          if (state.events[i].data?.set === data.set && state.events[i].data?.sheet === data.sheet) {
            lastTime = state.events[i].t;
            break;
          }
        }
        if (lastTime !== undefined) {
          const gap = Math.max(0, t - lastTime);
          const cappedGap = Math.min(gap, MAX_ACTIVE_GAP_MS);
          sheetSummary.activeMs += cappedGap;
        }

        // Update checks/solved summary metrics
        if (type === 'outputs_checked') {
          sheetSummary.outputChecks += 1;
          if (data.mode) sheetSummary.mode = data.mode;
        } else if (type === 'shading_checked') {
          sheetSummary.shadingChecks += 1;
          if (data.mode) sheetSummary.mode = data.mode;
        } else if (type === 'sheet_solved') {
          sheetSummary.solved = true;
          sheetSummary.solvedAt = new Date(t).toISOString();
          if (data.mode) sheetSummary.mode = data.mode;
        }
      }

      const seq = state.seq + 1;

      // Compute hash chain prevHash from latest stored event
      let prevHash;
      if (state.lastEvent) {
        prevHash = await sha256Hex(canonicalJsonStringify(state.lastEvent), this.subtle);
      } else {
        prevHash = GENESIS_HASH;
      }

      const event = {
        seq,
        t,
        sessionId: this.sessionId,
        type,
        data: { ...data },
        prevHash,
      };

      state.seq = seq;
      state.events.push(event);
      state.lastEvent = event;

      // Optimistic concurrency verification where locks are unavailable
      if (!this.storageError && this.storage) {
        const latestRaw = this._safeStorageGet(USAGE_STORAGE_KEY);
        if (latestRaw) {
          try {
            const latestParsed = JSON.parse(latestRaw);
            if (latestParsed && typeof latestParsed.seq === 'number' && latestParsed.seq !== initialSeq) {
              // Another tab wrote while computing hash; retry with fresh state
              continue;
            }
          } catch {
            // ignore
          }
        }
      }

      this._saveState(state);
      this.state = state;
      return event;
    }
  }

  getSavedStudentInfo() {
    const raw = this._safeStorageGet(STUDENT_INFO_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fall through
      }
    }
    return { name: '', classCode: '' };
  }

  saveStudentInfo(info = {}) {
    const clean = {
      name: typeof info.name === 'string' ? info.name.trim() : '',
      classCode: typeof info.classCode === 'string' ? info.classCode.trim() : '',
    };
    this._safeStorageSet(STUDENT_INFO_KEY, JSON.stringify(clean));
    return clean;
  }

  async buildExport(studentInfo = {}) {
    await this.queue;
    return this._runWithLock(async () => {
      // Re-read storage so all latest events from all tabs are included in export
      const state = this._loadState();
      this.state = state;

      const name = studentInfo.name ?? this.getSavedStudentInfo().name;
      const classCode = studentInfo.classCode ?? this.getSavedStudentInfo().classCode;
      const student = { name, classCode };

      const payload = buildExportPayload({
        student,
        installId: this.installId,
        sessions: state.sessions,
        events: state.events,
        summary: state.summary,
        appVersion: this.appVersion,
        exportedAt: new Date(this.clock()).toISOString(),
      });

      const payloadWithIntegrity = await withIntegrity(payload, this.subtle);
      const filename = createExportFilename(name, this.installId, this.clock());

      return {
        payload: payloadWithIntegrity,
        filename,
      };
    });
  }

  isStorageAvailable() {
    return !this.storageError && this.storage !== null;
  }
}
