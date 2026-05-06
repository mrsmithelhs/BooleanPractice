const SUBMISSION_HEADERS = [
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

function recordSubmission(payload) {
  const record = normalizeSubmissionPayload_(payload);
  const email = getSubmissionIdentity_() || record.studentEmail;
  const sheet = getSubmissionSheet_();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SUBMISSION_HEADERS);
  }

  sheet.appendRow(buildSubmissionRow_(record, email));

  return {
    ok: true,
    rowNumber: sheet.getLastRow(),
    sheetName: sheet.getName(),
  };
}

function normalizeSubmissionPayload_(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Submission payload must be an object.');
  }

  const conceptTags = Array.isArray(payload.conceptTags) ? payload.conceptTags.map(String) : [];
  const variables = Array.isArray(payload.variables) ? payload.variables.map(String) : [];
  const reviewHighlights = Array.isArray(payload.reviewHighlights)
    ? payload.reviewHighlights.map(String)
    : [];

  if (typeof payload.problemId !== 'string' || payload.problemId.trim().length === 0) {
    throw new Error('Submission payload is missing problemId.');
  }

  if (typeof payload.expressionText !== 'string' || payload.expressionText.trim().length === 0) {
    throw new Error('Submission payload is missing expressionText.');
  }

  if (typeof payload.mode !== 'string' || payload.mode.trim().length === 0) {
    throw new Error('Submission payload is missing mode.');
  }

  return {
    schemaVersion: Number.isInteger(payload.schemaVersion) ? payload.schemaVersion : 1,
    submittedAt:
      typeof payload.submittedAt === 'string' && payload.submittedAt.trim().length > 0
        ? payload.submittedAt
        : new Date().toISOString(),
    buildTarget:
      typeof payload.buildTarget === 'string' && payload.buildTarget.trim().length > 0
        ? payload.buildTarget
        : 'gas',
    appVersion:
      typeof payload.appVersion === 'string' && payload.appVersion.trim().length > 0
        ? payload.appVersion
        : '',
    assignmentId:
      typeof payload.assignmentId === 'string' && payload.assignmentId.trim().length > 0
        ? payload.assignmentId
        : '',
    assignmentTitle:
      typeof payload.assignmentTitle === 'string' && payload.assignmentTitle.trim().length > 0
        ? payload.assignmentTitle
        : '',
    assignmentItemId:
      typeof payload.assignmentItemId === 'string' && payload.assignmentItemId.trim().length > 0
        ? payload.assignmentItemId
        : '',
    assignmentSequence:
      Number.isInteger(payload.assignmentSequence) && payload.assignmentSequence >= 0
        ? payload.assignmentSequence
        : 0,
    problemId: payload.problemId,
    expressionId:
      typeof payload.expressionId === 'string' && payload.expressionId.trim().length > 0
        ? payload.expressionId
        : payload.problemId,
    problemTitle:
      typeof payload.problemTitle === 'string' && payload.problemTitle.trim().length > 0
        ? payload.problemTitle
        : payload.problemId,
    expressionText: payload.expressionText,
    mode: payload.mode,
    conceptTags: conceptTags,
    variables: variables,
    attempts: Number.isInteger(payload.attempts) && payload.attempts >= 0 ? payload.attempts : 0,
    hintsUsed:
      Number.isInteger(payload.hintsUsed) && payload.hintsUsed >= 0 ? payload.hintsUsed : 0,
    autofillUses:
      Number.isInteger(payload.autofillUses) && payload.autofillUses >= 0
        ? payload.autofillUses
        : 0,
    bulkActionUses:
      Number.isInteger(payload.bulkActionUses) && payload.bulkActionUses >= 0
        ? payload.bulkActionUses
        : 0,
    correctness:
      typeof payload.correctness === 'string' && payload.correctness.trim().length > 0
        ? payload.correctness
        : 'correct',
    stepCount:
      Number.isInteger(payload.stepCount) && payload.stepCount >= 0 ? payload.stepCount : 0,
    reviewHighlights: reviewHighlights,
    nextPracticeTargetId:
      typeof payload.nextPracticeTargetId === 'string' ? payload.nextPracticeTargetId : '',
    nextPracticeExpression:
      typeof payload.nextPracticeExpression === 'string' ? payload.nextPracticeExpression : '',
    nextPracticeReason:
      typeof payload.nextPracticeReason === 'string' ? payload.nextPracticeReason : '',
    studentName:
      typeof payload.studentName === 'string' && payload.studentName.trim().length > 0
        ? payload.studentName
        : '',
    className:
      typeof payload.className === 'string' && payload.className.trim().length > 0
        ? payload.className
        : '',
    section:
      typeof payload.section === 'string' && payload.section.trim().length > 0
        ? payload.section
        : '',
    studentEmail:
      typeof payload.studentEmail === 'string' && payload.studentEmail.trim().length > 0
        ? payload.studentEmail
        : '',
  };
}

function buildSubmissionRow_(record, email) {
  return [
    record.schemaVersion,
    record.submittedAt,
    record.buildTarget,
    record.appVersion,
    record.assignmentId,
    record.assignmentTitle,
    record.assignmentItemId,
    record.assignmentSequence,
    record.problemId,
    record.expressionId,
    record.problemTitle,
    record.expressionText,
    record.mode,
    record.conceptTags.join(', '),
    record.variables.join(', '),
    record.attempts,
    record.hintsUsed,
    record.autofillUses,
    record.bulkActionUses,
    record.correctness,
    record.stepCount,
    record.reviewHighlights.join(' | '),
    record.nextPracticeTargetId,
    record.nextPracticeExpression,
    record.nextPracticeReason,
    record.studentName,
    record.className,
    record.section,
    email,
  ];
}

function getSubmissionSheet_() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const spreadsheetId = scriptProperties.getProperty('SUBMISSION_SHEET_ID');
  const sheetName = scriptProperties.getProperty('SUBMISSION_SHEET_NAME') || 'Boolean Practice Submissions';

  if (!spreadsheetId) {
    throw new Error('SUBMISSION_SHEET_ID is not configured.');
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function getSubmissionIdentity_() {
  const activeUser = Session.getActiveUser();
  const effectiveUser = Session.getEffectiveUser();
  const activeEmail = activeUser ? activeUser.getEmail() : '';
  const effectiveEmail = effectiveUser ? effectiveUser.getEmail() : '';

  return activeEmail || effectiveEmail || '';
}
