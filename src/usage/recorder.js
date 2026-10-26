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

export class UsageRecorder {
  constructor(options = {}) {
    this.storage = options.storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    this.clock = options.clock ?? (() => Date.now());
    this.generateUUID = options.generateUUID ?? defaultGenerateUUID;
    this.subtle = options.subtle ?? (typeof crypto !== 'undefined' ? crypto.subtle : null);
    this.appVersion = options.appVersion ?? APP_VERSION;
    this.isTeacher = Boolean(options.isTeacher);
    this.storageError = false;

    this.installId = this._initInstallId();
    this.sessionId = this.generateUUID();
    this.sessionStartedAt = new Date(this.clock()).toISOString();
    this.urlParams = options.urlParams ? { ...options.urlParams } : {};
    delete this.urlParams.teacher;

    // Track active time per sheet in memory: sheetKey -> last event timestamp
    this.lastSheetEventTime = {};
    // Track teacher_view_opened per sheet in current session to enforce exactly once per sheet
    this.teacherViewsLogged = new Set();

    // Promise chain for serializing event recording
    this.queue = Promise.resolve();

    this.state = this._loadState();
    this._initSession();
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

  _loadState() {
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

  _saveState() {
    this._applyRetention();
    const serialized = JSON.stringify(this.state);
    this._safeStorageSet(USAGE_STORAGE_KEY, serialized);
  }

  _applyRetention() {
    const now = this.clock();
    const cutoff = now - RETENTION_MS;
    const initialCount = this.state.events.length;

    // Filter by age (last 60 days)
    let retained = this.state.events.filter((e) => e.t >= cutoff);

    // Filter by count (max 5000)
    if (retained.length > MAX_EVENTS) {
      retained = retained.slice(retained.length - MAX_EVENTS);
    }

    if (retained.length < initialCount) {
      this.state.summary.eventsTruncated = true;
      if (retained.length > 0) {
        this.state.summary.firstRetainedSeq = retained[0].seq;
      }
    }

    this.state.events = retained;
    this.state.summary.totalEvents = this.state.seq;
  }

  _initSession() {
    const sessionObj = {
      sessionId: this.sessionId,
      startedAt: this.sessionStartedAt,
      lastActivityAt: this.sessionStartedAt,
      urlParams: this.urlParams,
    };
    this.state.sessions.push(sessionObj);
    this._saveState();
  }

  getSheetSummary(sheetKey) {
    if (!this.state.summary.sheets[sheetKey]) {
      this.state.summary.sheets[sheetKey] = {
        solved: false,
        solvedAt: null,
        mode: null,
        outputChecks: 0,
        shadingChecks: 0,
        activeMs: 0,
      };
    }
    return this.state.summary.sheets[sheetKey];
  }

  recordEvent(type, data = {}) {
    this.queue = this.queue.then(async () => {
      await this._recordEventInternal(type, data);
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
    const seq = this.state.seq + 1;
    this.state.seq = seq;

    // Compute active time if this event is associated with a specific sheet
    if (data && data.set && data.sheet !== undefined) {
      const sheetKey = `${data.set}:${data.sheet}`;
      const sheetSummary = this.getSheetSummary(sheetKey);

      if (this.lastSheetEventTime[sheetKey] !== undefined) {
        const gap = Math.max(0, t - this.lastSheetEventTime[sheetKey]);
        const cappedGap = Math.min(gap, MAX_ACTIVE_GAP_MS);
        sheetSummary.activeMs += cappedGap;
      }
      this.lastSheetEventTime[sheetKey] = t;

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

    // Compute hash chain prevHash
    let prevHash;
    if (this.state.lastEvent) {
      prevHash = await sha256Hex(canonicalJsonStringify(this.state.lastEvent), this.subtle);
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

    this.state.events.push(event);
    this.state.lastEvent = event;

    // Update session lastActivityAt
    const currentSession = this.state.sessions.find((s) => s.sessionId === this.sessionId);
    if (currentSession) {
      currentSession.lastActivityAt = new Date(t).toISOString();
    }

    this._saveState();
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
    const name = studentInfo.name ?? this.getSavedStudentInfo().name;
    const classCode = studentInfo.classCode ?? this.getSavedStudentInfo().classCode;
    const student = { name, classCode };

    const payload = buildExportPayload({
      student,
      installId: this.installId,
      sessions: this.state.sessions,
      events: this.state.events,
      summary: this.state.summary,
      appVersion: this.appVersion,
      exportedAt: new Date(this.clock()).toISOString(),
    });

    const payloadWithIntegrity = await withIntegrity(payload, this.subtle);
    const filename = createExportFilename(name, this.installId, this.clock());

    return {
      payload: payloadWithIntegrity,
      filename,
    };
  }

  isStorageAvailable() {
    return !this.storageError && this.storage !== null;
  }
}
