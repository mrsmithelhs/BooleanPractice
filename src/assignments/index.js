import { getEquivalenceChallengeById } from '../equivalence/index.js';
import { getProblemById } from '../catalog/index.js';
import { getSimplificationChallengeById } from '../simplification/index.js';

const VALID_ASSIGNMENT_MODES = ['truth-table', 'venn', 'equivalence', 'simplification'];

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) {
      deepFreeze(item);
    }
  }

  return value;
}

function cloneRecord(record) {
  return record ? JSON.parse(JSON.stringify(record)) : null;
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', 'yes', '1', 'active'].includes(lowered)) {
      return true;
    }
    if (['false', 'no', '0', 'inactive'].includes(lowered)) {
      return false;
    }
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  return fallback;
}

function normalizeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function normalizeRows(rows) {
  return Array.isArray(rows) ? rows.filter((row) => row && typeof row === 'object').map((row) => ({ ...row })) : [];
}

function normalizeWorkbook(workbook = {}) {
  return {
    assignments: normalizeRows(workbook.assignments),
    assignmentItems: normalizeRows(workbook.assignmentItems),
    roster: normalizeRows(workbook.roster),
    submissions: normalizeRows(workbook.submissions),
  };
}

function validateAssignmentRow(row, index, errors) {
  const assignmentId = normalizeString(row.assignmentId);
  const title = normalizeString(row.title);
  const sequence = normalizeInteger(row.sequence, 0);

  if (!assignmentId) {
    errors.push(`Assignments row ${index + 1} is missing assignmentId.`);
  }

  if (!title) {
    errors.push(`Assignments row ${index + 1} is missing title.`);
  }

  if (sequence < 1) {
    errors.push(`Assignments row ${index + 1} must have a positive sequence.`);
  }

  return {
    assignmentId,
    title,
    sequence,
    active: normalizeBoolean(row.active, true),
    className: normalizeString(row.className),
    notes: normalizeString(row.notes),
  };
}

function validateItemRow(row, index, errors, assignmentIds) {
  const assignmentId = normalizeString(row.assignmentId);
  const assignmentItemId = normalizeString(row.assignmentItemId);
  const sequence = normalizeInteger(row.sequence, 0);
  const challengeMode = normalizeString(row.challengeMode || row.mode);
  const challengeId = normalizeString(row.challengeId);

  if (!assignmentId) {
    errors.push(`Assignment items row ${index + 1} is missing assignmentId.`);
  } else if (!assignmentIds.has(assignmentId)) {
    errors.push(`Assignment items row ${index + 1} references unknown assignmentId "${assignmentId}".`);
  }

  if (!assignmentItemId) {
    errors.push(`Assignment items row ${index + 1} is missing assignmentItemId.`);
  }

  if (sequence < 1) {
    errors.push(`Assignment items row ${index + 1} must have a positive sequence.`);
  }

  if (!VALID_ASSIGNMENT_MODES.includes(challengeMode)) {
    errors.push(
      `Assignment items row ${index + 1} has unsupported challengeMode "${challengeMode}".`,
    );
  }

  if (!challengeId) {
    errors.push(`Assignment items row ${index + 1} is missing challengeId.`);
  }

  return {
    assignmentId,
    assignmentItemId,
    sequence,
    challengeMode,
    challengeId,
    active: normalizeBoolean(row.active, true),
    label: normalizeString(row.label),
    notes: normalizeString(row.notes),
  };
}

function validateRosterRow(row, index) {
  return {
    studentEmail: normalizeString(row.studentEmail || row.email),
    studentName: normalizeString(row.studentName || row.name),
    className: normalizeString(row.className),
    section: normalizeString(row.section),
    assignmentId: normalizeString(row.assignmentId),
    active: normalizeBoolean(row.active, true),
    notes: normalizeString(row.notes),
    rowNumber: index + 1,
  };
}

function hydrateChallenge(item) {
  switch (item.challengeMode) {
    case 'truth-table':
    case 'venn': {
      const challenge = getProblemById(item.challengeId);
      if (!challenge) {
        throw new Error(
          `Assignment item ${item.assignmentItemId} references unknown problem "${item.challengeId}".`,
        );
      }

      if (!challenge.supportedModes.includes(item.challengeMode)) {
        throw new Error(
          `Assignment item ${item.assignmentItemId} uses ${item.challengeMode}, but problem "${challenge.id}" does not support it.`,
        );
      }

      return {
        ...item,
        challenge,
      };
    }
    case 'equivalence': {
      const challenge = getEquivalenceChallengeById(item.challengeId);
      if (!challenge) {
        throw new Error(
          `Assignment item ${item.assignmentItemId} references unknown equivalence challenge "${item.challengeId}".`,
        );
      }

      return {
        ...item,
        challenge,
      };
    }
    case 'simplification': {
      const challenge = getSimplificationChallengeById(item.challengeId);
      if (!challenge) {
        throw new Error(
          `Assignment item ${item.assignmentItemId} references unknown simplification challenge "${item.challengeId}".`,
        );
      }

      if (!challenge.simplificationReady) {
        throw new Error(
          `Assignment item ${item.assignmentItemId} uses simplification, but challenge "${challenge.id}" is not simplification-ready.`,
        );
      }

      return {
        ...item,
        challenge,
      };
    }
    default:
      throw new Error(`Unsupported assignment challenge mode "${item.challengeMode}".`);
  }
}

function sortNumeric(left, right) {
  return left.sequence - right.sequence || left.assignmentItemId.localeCompare(right.assignmentItemId);
}

function resolveAssignmentId(workbook, requestedAssignmentId, studentEmail) {
  if (normalizeString(requestedAssignmentId)) {
    return normalizeString(requestedAssignmentId);
  }

  const normalizedEmail = normalizeString(studentEmail);
  if (normalizedEmail) {
    const rosterMatch = workbook.roster.find(
      (row) => row.active && row.studentEmail.toLowerCase() === normalizedEmail.toLowerCase() && row.assignmentId,
    );

    if (rosterMatch) {
      return rosterMatch.assignmentId;
    }
  }

  const firstActiveAssignment = workbook.assignments.find((row) => row.active);
  return firstActiveAssignment?.assignmentId ?? '';
}

function buildStudentRecord(workbook, assignmentId, studentEmail) {
  const normalizedEmail = normalizeString(studentEmail);
  const rosterMatch = normalizedEmail
    ? workbook.roster.find(
        (row) => row.active && row.studentEmail.toLowerCase() === normalizedEmail.toLowerCase(),
      ) ?? null
    : null;

  return {
    email: rosterMatch?.studentEmail || normalizedEmail,
    name: rosterMatch?.studentName ?? '',
    className: rosterMatch?.className ?? '',
    section: rosterMatch?.section ?? '',
    assignmentId: rosterMatch?.assignmentId || assignmentId || '',
    rosterRowNumber: rosterMatch?.rowNumber ?? 0,
  };
}

export function validateAssignmentWorkbook(workbook = {}) {
  const normalized = normalizeWorkbook(workbook);
  const errors = [];
  const assignmentIdsSeen = new Set();

  const assignments = normalized.assignments.map((row, index) =>
    validateAssignmentRow(row, index, errors),
  );
  const assignmentIds = new Set(assignments.map((row) => row.assignmentId).filter(Boolean));

  for (const assignment of assignments) {
    if (!assignment.assignmentId) {
      continue;
    }

    if (assignmentIdsSeen.has(assignment.assignmentId)) {
      errors.push(`Assignment id "${assignment.assignmentId}" is duplicated.`);
    }

    assignmentIdsSeen.add(assignment.assignmentId);
  }

  const assignmentItems = normalized.assignmentItems.map((row, index) =>
    validateItemRow(row, index, errors, assignmentIds),
  );
  const roster = normalized.roster.map((row, index) => validateRosterRow(row, index));

  const assignmentItemIds = new Set();
  const assignmentSequenceMap = new Map();
  for (const row of assignmentItems) {
    if (!row.assignmentItemId) {
      continue;
    }

    if (assignmentItemIds.has(row.assignmentItemId)) {
      errors.push(`Assignment item id "${row.assignmentItemId}" is duplicated.`);
    }

    assignmentItemIds.add(row.assignmentItemId);

    if (row.active) {
      const sequenceKey = row.assignmentId;
      const sequenceSet = assignmentSequenceMap.get(sequenceKey) ?? new Set();
      if (sequenceSet.has(row.sequence)) {
        errors.push(
          `Assignment "${row.assignmentId}" has duplicate sequence value ${row.sequence} for assignment items.`,
        );
      }
      sequenceSet.add(row.sequence);
      assignmentSequenceMap.set(sequenceKey, sequenceSet);
    }
  }

  for (const assignment of assignments) {
    const assignmentItemCount = assignmentItems.filter(
      (item) => item.assignmentId === assignment.assignmentId && item.active,
    ).length;

    if (assignmentItemCount === 0) {
      errors.push(`Assignment "${assignment.assignmentId}" has no active items.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    workbook: {
      assignments,
      assignmentItems,
      roster,
      submissions: normalized.submissions,
    },
  };
}

export function loadAssignmentSession({
  workbook = {},
  assignmentId = '',
  studentEmail = '',
} = {}) {
  const validation = validateAssignmentWorkbook(workbook);

  if (!validation.valid) {
    return {
      status: 'error',
      errors: validation.errors,
      workbook: validation.workbook,
      assignment: null,
      student: buildStudentRecord(validation.workbook, '', studentEmail),
      items: [],
      currentItemIndex: -1,
      currentItem: null,
    };
  }

  const selectedAssignmentId = resolveAssignmentId(validation.workbook, assignmentId, studentEmail);
  const assignment = validation.workbook.assignments
    .filter((row) => row.active)
    .sort(sortNumeric)
    .find((row) => row.assignmentId === selectedAssignmentId);

  if (!assignment) {
    return {
      status: 'error',
      errors: selectedAssignmentId
        ? [`No active assignment matched assignmentId "${selectedAssignmentId}".`]
        : ['No active assignment is available.'],
      workbook: validation.workbook,
      assignment: null,
      student: buildStudentRecord(validation.workbook, '', studentEmail),
      items: [],
      currentItemIndex: -1,
      currentItem: null,
    };
  }

  let items = [];

  try {
    items = validation.workbook.assignmentItems
      .filter((row) => row.active && row.assignmentId === assignment.assignmentId)
      .sort(sortNumeric)
      .map((row) => {
        const item = hydrateChallenge(row);
        return deepFreeze({
          ...item,
          assignment: cloneRecord(assignment),
        });
      });
  } catch (error) {
    return {
      status: 'error',
      errors: [error instanceof Error ? error.message : String(error)],
      workbook: validation.workbook,
      assignment: null,
      student: buildStudentRecord(validation.workbook, '', studentEmail),
      items: [],
      currentItemIndex: -1,
      currentItem: null,
    };
  }

  const student = buildStudentRecord(validation.workbook, assignment.assignmentId, studentEmail);
  const session = {
    status: 'ready',
    workbook: validation.workbook,
    assignment: deepFreeze({
      ...cloneRecord(assignment),
      itemCount: items.length,
    }),
    student: deepFreeze(student),
    items,
    currentItemIndex: 0,
    currentItem: items[0] ?? null,
    errors: [],
  };

  return deepFreeze(session);
}

export function buildAssignmentSubmissionContext(session, item = null) {
  if (!session || session.status !== 'ready' || !session.assignment) {
    return null;
  }

  const selectedItem = item ?? session.currentItem ?? null;
  if (!selectedItem) {
    return null;
  }

  return {
    assignment: {
      assignmentId: session.assignment.assignmentId,
      title: session.assignment.title,
      sequence: session.assignment.sequence,
    },
    item: {
      assignmentItemId: selectedItem.assignmentItemId,
      sequence: selectedItem.sequence,
    },
    student: {
      email: session.student.email,
      name: session.student.name,
      className: session.student.className,
      section: session.student.section,
    },
  };
}

export const ASSIGNMENT_MODES = [...VALID_ASSIGNMENT_MODES];
