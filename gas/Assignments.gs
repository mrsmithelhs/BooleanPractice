function buildAssignmentBootstrap_(e) {
  const assignmentContext = getAssignmentBootstrapContext_(e);
  return `<script>window.__BOOLEAN_PRACTICE_ASSIGNMENT_CONTEXT__ = ${safeJsonStringify_(
    assignmentContext,
  )};</script>`;
}

function getAssignmentBootstrapContext_(e) {
  const workbook = getAssignmentWorkbook_();
  const activeUser = Session.getActiveUser();
  const effectiveUser = Session.getEffectiveUser();
  const activeEmail = activeUser ? activeUser.getEmail() : '';
  const effectiveEmail = effectiveUser ? effectiveUser.getEmail() : '';
  const studentEmail = activeEmail || effectiveEmail || '';
  const requestAssignmentId =
    e && e.parameter && typeof e.parameter.assignmentId === 'string'
      ? e.parameter.assignmentId
      : '';
  const studentContext = resolveStudentContext_(workbook, studentEmail);

  return {
    workbook,
    assignmentId: requestAssignmentId,
    student: studentContext,
    request: {
      assignmentId: requestAssignmentId,
      urlParameters: e && e.parameter ? e.parameter : {},
    },
  };
}

function getAssignmentWorkbook_() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const spreadsheetId =
    scriptProperties.getProperty('ASSIGNMENT_SHEET_ID') ||
    scriptProperties.getProperty('SUBMISSION_SHEET_ID');

  if (!spreadsheetId) {
    return {
      assignments: [],
      assignmentItems: [],
      roster: [],
      submissions: [],
    };
  }

  let spreadsheet = null;

  try {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    return {
      assignments: [],
      assignmentItems: [],
      roster: [],
      submissions: [],
    };
  }

  return {
    assignments: loadSheetRecords_(spreadsheet, getSheetName_(scriptProperties, 'ASSIGNMENTS_SHEET_NAME', 'Assignments')),
    assignmentItems: loadSheetRecords_(
      spreadsheet,
      getSheetName_(scriptProperties, 'ASSIGNMENT_ITEMS_SHEET_NAME', 'Assignment Items'),
    ),
    roster: loadSheetRecords_(spreadsheet, getSheetName_(scriptProperties, 'ROSTER_SHEET_NAME', 'Roster')),
    submissions: loadSheetRecords_(
      spreadsheet,
      getSheetName_(scriptProperties, 'SUBMISSIONS_SHEET_NAME', 'Boolean Practice Submissions'),
    ),
  };
}

function getSheetName_(scriptProperties, propertyName, fallback) {
  return scriptProperties.getProperty(propertyName) || fallback;
}

function loadSheetRecords_(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    return [];
  }

  const values = sheet.getDataRange().getValues();
  if (values.length === 0) {
    return [];
  }

  const headers = values[0].map((value) => String(value || '').trim());
  const rows = [];

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex];
    if (row.every((cell) => cell === '' || cell === null)) {
      continue;
    }

    const record = {};

    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      const header = headers[columnIndex];
      if (!header) {
        continue;
      }

      record[header] = row[columnIndex];
    }

    rows.push(record);
  }

  return rows;
}

function resolveStudentContext_(workbook, studentEmail) {
  const normalizedEmail = String(studentEmail || '').trim().toLowerCase();
  const rosterRow = normalizedEmail
    ? workbook.roster.find(
        (row) =>
          String(row.active ?? 'true').toLowerCase() !== 'false' &&
          String(row.studentEmail || row.email || '')
            .trim()
            .toLowerCase() === normalizedEmail,
      ) || null
    : null;

  return {
    email: rosterRow ? String(rosterRow.studentEmail || rosterRow.email || '').trim() : normalizedEmail,
    name: rosterRow ? String(rosterRow.studentName || rosterRow.name || '').trim() : '',
    className: rosterRow ? String(rosterRow.className || '').trim() : '',
    section: rosterRow ? String(rosterRow.section || '').trim() : '',
    assignmentId: rosterRow ? String(rosterRow.assignmentId || '').trim() : '',
    rosterRowNumber: rosterRow ? workbook.roster.indexOf(rosterRow) + 2 : 0,
  };
}

function safeJsonStringify_(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
