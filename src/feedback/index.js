import { formatBooleanExpression } from '../parser/index.js';

function normalizeAttemptCount(attemptCount) {
  const value = Number(attemptCount);

  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

export function getHintStage(attemptCount) {
  const normalizedAttemptCount = normalizeAttemptCount(attemptCount);

  if (normalizedAttemptCount === 1) {
    return 'neutral';
  }

  if (normalizedAttemptCount === 2) {
    return 'guided';
  }

  return 'specific';
}

function formatAssignment(assignment) {
  return Object.entries(assignment)
    .map(([variable, value]) => `${variable}=${value ? 'T' : 'F'}`)
    .join(', ');
}

function describeTruthTableOperatorHint(node) {
  switch (node.type) {
    case 'UnaryExpression':
      return 'The NOT operator flips the operand.';
    case 'BinaryExpression':
      if (node.operator === '&&') {
        return 'The AND operator is only true when both sides are true.';
      }

      if (node.operator === '||') {
        return 'The OR operator is true when either side is true.';
      }

      return 'Check how the operator combines the two sides.';
    default:
      return 'Check the current row against the expression.';
  }
}

function describeTruthTableSpecificHint(node, assignment) {
  const assignmentText = formatAssignment(assignment);

  switch (node.type) {
    case 'UnaryExpression':
      return `For ${assignmentText}, decide ${formatBooleanExpression(node.argument)} first, then flip it for ${formatBooleanExpression(node)}.`;
    case 'BinaryExpression':
      return `For ${assignmentText}, recheck both sides of ${formatBooleanExpression(node)} before answering.`;
    default:
      return `For ${assignmentText}, use the row values to decide ${formatBooleanExpression(node)}.`;
  }
}

export function buildTruthTableHint({
  attemptCount,
  step,
  row,
  isBlank = false,
  problemHints = [],
}) {
  const stage = getHintStage(attemptCount);

  if (stage === 'neutral') {
    return isBlank
      ? `The row for ${step.label} is still blank. Recheck the current row.`
      : `The row for ${step.label} does not match yet. Recheck the current row.`;
  }

  if (stage === 'guided') {
    return `Try ${step.label} again. ${describeTruthTableOperatorHint(step.node)}`;
  }

  const hintSuffix = problemHints.length > 0 ? ` Hint: ${problemHints[0]}` : '';
  return `${step.label} still needs work. ${describeTruthTableSpecificHint(step.node, row.assignment)}${hintSuffix}`;
}

function describeVennOperatorHint(node) {
  switch (node.type) {
    case 'UnaryExpression':
      return 'The NOT step flips the operand regions.';
    case 'BinaryExpression':
      if (node.operator === '&&') {
        return 'The AND step keeps only the overlap of both operands.';
      }

      if (node.operator === '||') {
        return 'The OR step keeps any region that belongs to either operand.';
      }

      return 'Check how the two operands combine.';
    default:
      return 'Check the current regions against the expression.';
  }
}

function describeVennSpecificHint(node) {
  switch (node.type) {
    case 'UnaryExpression':
      return `Start from ${formatBooleanExpression(node.argument)}, then invert those regions for ${formatBooleanExpression(node)}.`;
    case 'BinaryExpression':
      if (node.operator === '&&') {
        return `Only the overlap of ${formatBooleanExpression(node.left)} and ${formatBooleanExpression(node.right)} belongs in ${formatBooleanExpression(node)}.`;
      }

      if (node.operator === '||') {
        return `Any region from ${formatBooleanExpression(node.left)} or ${formatBooleanExpression(node.right)} belongs in ${formatBooleanExpression(node)}.`;
      }

      return `Use both operands to decide ${formatBooleanExpression(node)}.`;
    default:
      return `Use the current regions to decide ${formatBooleanExpression(node)}.`;
  }
}

export function buildVennHint({
  attemptCount,
  step,
  missedRegions = [],
  extraRegions = [],
  problemHints = [],
}) {
  const stage = getHintStage(attemptCount);

  if (stage === 'neutral') {
    return `The current selection does not match ${step.label} yet. Recheck the chosen regions.`;
  }

  if (stage === 'guided') {
    return `Try ${step.label} again. ${describeVennOperatorHint(step.node)}`;
  }

  const parts = [`${step.label} still needs work.`];

  if (missedRegions.length > 0) {
    parts.push(`Missed regions: ${missedRegions.map((region) => region.label).join(', ')}.`);
  }

  if (extraRegions.length > 0) {
    parts.push(`Extra regions: ${extraRegions.map((region) => region.label).join(', ')}.`);
  }

  parts.push(describeVennSpecificHint(step.node));

  if (problemHints.length > 0) {
    parts.push(`Hint: ${problemHints[0]}`);
  }

  return parts.join(' ');
}
