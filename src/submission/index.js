const DEFAULT_BUILD_TARGET = 'static';
const DEFAULT_SCHEMA_VERSION = 1;
const DEFAULT_ACTION_NAME = 'recordSubmission';

export const SUBMISSION_HEADER_ROW = [
  'schemaVersion',
  'submittedAt',
  'buildTarget',
  'appVersion',
  'assignmentId',
  'assignmentTitle',
  'assignmentItemId',
  'assignmentSequence',
  'problemId',
  'expressionId',
  'problemTitle',
  'expressionText',
  'mode',
  'conceptTags',
  'variables',
  'attempts',
  'hintsUsed',
  'autofillUses',
  'bulkActionUses',
  'correctness',
  'stepCount',
  'reviewHighlights',
  'nextPracticeTargetId',
  'nextPracticeExpression',
  'nextPracticeReason',
  'studentName',
  'className',
  'section',
  'studentEmail',
];

function normalizeString(value, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value) => String(value));
}

function normalizeNonNegativeInteger(value, fallback = 0) {
  const number = Number(value);

  if (Number.isInteger(number) && number >= 0) {
    return number;
  }

  return fallback;
}

function cloneArray(values) {
  return Array.isArray(values) ? [...values] : [];
}

function resolveGlobalGoogleScriptRun() {
  const googleScriptRun = globalThis?.google?.script?.run ?? globalThis?.__BOOLEAN_PRACTICE_GOOGLE_SCRIPT_RUN__ ?? null;

  if (
    googleScriptRun &&
    typeof googleScriptRun.withSuccessHandler === 'function' &&
    typeof googleScriptRun.withFailureHandler === 'function'
  ) {
    return googleScriptRun;
  }

  return null;
}

export function resolveBuildTarget() {
  const buildTarget = globalThis?.__BOOLEAN_PRACTICE_BUILD_TARGET__;
  return normalizeString(buildTarget, DEFAULT_BUILD_TARGET);
}

export function buildSubmissionPayload({
  problem,
  mode,
  summary = null,
  attempts,
  hintsUsed,
  autofillUses = 0,
  bulkActionUses = 0,
  appVersion = null,
  buildTarget = resolveBuildTarget(),
  submittedAt = new Date().toISOString(),
  assignmentContext = null,
  studentEmail = '',
  studentName = '',
  className = '',
  section = '',
} = {}) {
  if (!problem || typeof problem !== 'object') {
    throw new TypeError('Submission payload requires a problem record.');
  }

  const normalizedMode = normalizeString(mode);
  if (!normalizedMode) {
    throw new TypeError('Submission payload requires a non-empty mode.');
  }

  const conceptTags = normalizeStringArray(problem.conceptTags);
  const variables = normalizeStringArray(problem.variables);
  const problemId = normalizeString(problem.id);
  const problemTitle = normalizeString(problem.title);
  const expressionText = normalizeString(problem.expression);
  if (!problemId || !problemTitle || !expressionText) {
    throw new TypeError('Submission payload requires a problem id, title, and expression.');
  }

  const nextPracticeTarget = summary?.nextPracticeTarget ?? null;
  const assignmentSource = assignmentContext?.assignment ?? assignmentContext ?? null;
  const itemSource = assignmentContext?.item ?? assignmentContext ?? null;
  const studentSource = assignmentContext?.student ?? assignmentContext ?? null;
  const normalizedAttempts = normalizeNonNegativeInteger(
    attempts ?? summary?.totalAttempts ?? summary?.attempts ?? 0,
  );
  const normalizedHintsUsed = normalizeNonNegativeInteger(
    hintsUsed ?? summary?.totalHintsUsed ?? summary?.hintsUsed ?? 0,
  );

  return {
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    submittedAt: normalizeString(submittedAt, new Date().toISOString()),
    buildTarget: normalizeString(buildTarget, DEFAULT_BUILD_TARGET),
    appVersion: normalizeString(appVersion, ''),
    assignmentId: normalizeString(assignmentSource?.assignmentId ?? assignmentSource?.id ?? '', ''),
    assignmentTitle: normalizeString(
      assignmentSource?.title ?? assignmentSource?.assignmentTitle ?? '',
      '',
    ),
    assignmentItemId: normalizeString(itemSource?.assignmentItemId ?? itemSource?.id ?? '', ''),
    assignmentSequence: normalizeNonNegativeInteger(
      itemSource?.sequence ?? itemSource?.assignmentSequence ?? 0,
    ),
    problemId,
    expressionId: problemId,
    problemTitle,
    expressionText,
    mode: normalizedMode,
    conceptTags,
    variables,
    variableCount: normalizeNonNegativeInteger(problem.variableCount ?? variables.length, variables.length),
    attempts: normalizedAttempts,
    hintsUsed: normalizedHintsUsed,
    autofillUses: normalizeNonNegativeInteger(autofillUses),
    bulkActionUses: normalizeNonNegativeInteger(bulkActionUses),
    correctness: 'correct',
    stepCount: normalizeNonNegativeInteger(summary?.stepSummaries?.length, 0),
    reviewHighlights: cloneArray(summary?.reviewHighlights),
    nextPracticeTargetId: normalizeString(nextPracticeTarget?.id, ''),
    nextPracticeExpression: normalizeString(summary?.nextPracticeExpression, ''),
    nextPracticeReason: normalizeString(summary?.nextPracticeReason, ''),
    studentName: normalizeString(studentName || studentSource?.name || '', ''),
    className: normalizeString(className || studentSource?.className || '', ''),
    section: normalizeString(section || studentSource?.section || '', ''),
    studentEmail: normalizeString(studentEmail || studentSource?.email || '', ''),
  };
}

export function validateSubmissionPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  return (
    Number.isInteger(payload.schemaVersion) &&
    payload.schemaVersion >= 1 &&
    typeof payload.submittedAt === 'string' &&
    typeof payload.buildTarget === 'string' &&
    typeof payload.assignmentId === 'string' &&
    typeof payload.assignmentTitle === 'string' &&
    typeof payload.assignmentItemId === 'string' &&
    Number.isInteger(payload.assignmentSequence) &&
    payload.assignmentSequence >= 0 &&
    typeof payload.problemId === 'string' &&
    typeof payload.expressionId === 'string' &&
    typeof payload.problemTitle === 'string' &&
    typeof payload.expressionText === 'string' &&
    typeof payload.mode === 'string' &&
    Array.isArray(payload.conceptTags) &&
    Array.isArray(payload.variables) &&
    Number.isInteger(payload.variableCount) &&
    payload.variableCount >= 0 &&
    Number.isInteger(payload.attempts) &&
    payload.attempts >= 0 &&
    Number.isInteger(payload.hintsUsed) &&
    payload.hintsUsed >= 0 &&
    Number.isInteger(payload.autofillUses) &&
    payload.autofillUses >= 0 &&
    Number.isInteger(payload.bulkActionUses) &&
    payload.bulkActionUses >= 0 &&
    typeof payload.correctness === 'string' &&
    Number.isInteger(payload.stepCount) &&
    payload.stepCount >= 0 &&
    Array.isArray(payload.reviewHighlights) &&
    typeof payload.nextPracticeTargetId === 'string' &&
    typeof payload.nextPracticeExpression === 'string' &&
    typeof payload.nextPracticeReason === 'string' &&
    typeof payload.studentName === 'string' &&
    typeof payload.className === 'string' &&
    typeof payload.section === 'string' &&
    typeof payload.studentEmail === 'string'
  );
}

export function buildSubmissionSheetRow(payload, studentEmail = '') {
  if (!validateSubmissionPayload(payload)) {
    throw new TypeError('Submission payload is not valid.');
  }

  return [
    payload.schemaVersion,
    payload.submittedAt,
    payload.buildTarget,
    payload.appVersion,
    payload.assignmentId,
    payload.assignmentTitle,
    payload.assignmentItemId,
    payload.assignmentSequence,
    payload.problemId,
    payload.expressionId,
    payload.problemTitle,
    payload.expressionText,
    payload.mode,
    payload.conceptTags.join(', '),
    payload.variables.join(', '),
    payload.attempts,
    payload.hintsUsed,
    payload.autofillUses,
    payload.bulkActionUses,
    payload.correctness,
    payload.stepCount,
    payload.reviewHighlights.join(' | '),
    payload.nextPracticeTargetId,
    payload.nextPracticeExpression,
    payload.nextPracticeReason,
    payload.studentName,
    payload.className,
    payload.section,
    normalizeString(studentEmail || payload.studentEmail, ''),
  ];
}

export function createGoogleScriptRunSimulator({
  delayMs = 0,
  shouldFail = false,
  failureMessage = 'Simulated google.script.run failure.',
  responseFactory = (payload) => ({ ok: true, payload }),
} = {}) {
  const calls = [];
  let successHandler = null;
  let failureHandler = null;

  const run = {
    withSuccessHandler(handler) {
      successHandler = handler;
      return run;
    },
    withFailureHandler(handler) {
      failureHandler = handler;
      return run;
    },
    [DEFAULT_ACTION_NAME](payload) {
      calls.push(payload);
      setTimeout(() => {
        if (shouldFail) {
          if (typeof failureHandler === 'function') {
            failureHandler(new Error(failureMessage));
          }
          return;
        }

        if (typeof successHandler === 'function') {
          successHandler(responseFactory(payload));
        }
      }, delayMs);
      return run;
    },
  };

  return {
    calls,
    script: {
      run,
    },
  };
}

export function createSubmissionGateway({
  scriptRun = resolveGlobalGoogleScriptRun(),
  actionName = DEFAULT_ACTION_NAME,
} = {}) {
  if (
    !scriptRun ||
    typeof scriptRun.withSuccessHandler !== 'function' ||
    typeof scriptRun.withFailureHandler !== 'function' ||
    typeof scriptRun[actionName] !== 'function'
  ) {
    return {
      available: false,
      reason: 'Classroom submission is not connected in this preview.',
      submit() {
        return Promise.reject(new Error('google.script.run is unavailable in this build.'));
      },
    };
  }

  return {
    available: true,
    reason: 'Classroom submission is connected.',
    submit(payload) {
      return new Promise((resolve, reject) => {
        try {
          scriptRun
            .withSuccessHandler(resolve)
            .withFailureHandler(reject)[actionName](payload);
        } catch (error) {
          reject(error);
        }
      });
    },
  };
}
