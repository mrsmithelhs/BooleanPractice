const STORAGE_PREFIX = 'boolean-practice:session-memory:v1';

export const AUTOMATION_THRESHOLD = 2;

function getStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function normalizeVariables(variables) {
  if (!Array.isArray(variables)) {
    throw new TypeError('Session memory variables must be provided as an array.');
  }

  return variables.map((variable) => String(variable));
}

function normalizeExpression(expression) {
  if (typeof expression !== 'string' || expression.trim().length === 0) {
    throw new TypeError('Session memory expression must be a non-empty string.');
  }

  return expression.trim().replace(/\s+/g, ' ');
}

export function buildSessionMemoryKey({ mode, expression, variables }) {
  if (typeof mode !== 'string' || mode.trim().length === 0) {
    throw new TypeError('Session memory mode must be a non-empty string.');
  }

  const normalizedExpression = normalizeExpression(expression);
  const normalizedVariables = normalizeVariables(variables);

  return [
    STORAGE_PREFIX,
    mode,
    normalizedVariables.join(','),
    normalizedExpression,
  ].join('|');
}

function clonePayload(payload) {
  return JSON.parse(JSON.stringify(payload));
}

function removeInvalidEntry(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Ignore storage cleanup failures in non-browser environments.
  }
}

function parseStoredRecord(rawValue) {
  if (typeof rawValue !== 'string') {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function normalizeStoredRecord(record, expectedLength) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  if (!Number.isInteger(record.solveCount) || record.solveCount < 1) {
    return null;
  }

  if (!Array.isArray(record.payload)) {
    return null;
  }

  if (typeof expectedLength === 'number' && record.payload.length !== expectedLength) {
    return null;
  }

  return {
    mode: typeof record.mode === 'string' ? record.mode : '',
    expression: typeof record.expression === 'string' ? record.expression : '',
    variables: Array.isArray(record.variables) ? record.variables.map((value) => String(value)) : [],
    solveCount: record.solveCount,
    payload: clonePayload(record.payload),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
  };
}

function isPayloadValid(payload, { expectedLength, validatePayload }) {
  if (typeof expectedLength === 'number' && payload.length !== expectedLength) {
    return false;
  }

  if (typeof validatePayload === 'function' && !validatePayload(payload)) {
    return false;
  }

  return true;
}

export function readSessionMemory(
  descriptor,
  { expectedLength, validatePayload, storage = getStorage(), threshold = AUTOMATION_THRESHOLD } = {},
) {
  if (!storage) {
    return null;
  }

  const key = buildSessionMemoryKey(descriptor);
  const record = normalizeStoredRecord(parseStoredRecord(storage.getItem(key)), expectedLength);

  if (!record || !isPayloadValid(record.payload, { expectedLength, validatePayload })) {
    removeInvalidEntry(storage, key);
    return null;
  }

  return {
    key,
    ...record,
    canAutofill: record.solveCount >= threshold,
  };
}

export function writeSessionMemory(
  descriptor,
  payload,
  { expectedLength, validatePayload, storage = getStorage(), threshold = AUTOMATION_THRESHOLD } = {},
) {
  if (!storage) {
    return null;
  }

  if (!Array.isArray(payload)) {
    throw new TypeError('Session memory payload must be an array.');
  }

  if (!isPayloadValid(payload, { expectedLength, validatePayload })) {
    throw new RangeError('Session memory payload length does not match the expected length.');
  }

  const existing = readSessionMemory(descriptor, { expectedLength, storage, threshold });
  const nextRecord = {
    mode: descriptor.mode,
    expression: normalizeExpression(descriptor.expression),
    variables: normalizeVariables(descriptor.variables),
    solveCount: (existing?.solveCount ?? 0) + 1,
    payload: clonePayload(payload),
    updatedAt: new Date().toISOString(),
  };

  storage.setItem(buildSessionMemoryKey(descriptor), JSON.stringify(nextRecord));

  return {
    key: buildSessionMemoryKey(descriptor),
    ...nextRecord,
    canAutofill: nextRecord.solveCount >= threshold,
  };
}

export function clearSessionMemory(descriptor, { storage = getStorage() } = {}) {
  if (!storage) {
    return;
  }

  storage.removeItem(buildSessionMemoryKey(descriptor));
}
