import { buildTruthTableHint, getHintStage } from '@shared/feedback/index.js';
import { parseBooleanExpression } from '@shared/parser/index.js';

export { getHintStage, buildTruthTableHint } from '@shared/feedback/index.js';

// The AP truth-table hint's first stage says "Recheck the current row", but this page
// checks the whole output column at once, so it has no current row. Later stages name
// a specific row and are reused unchanged.
export function buildShapePuzzleTableHint(options) {
  if (getHintStage(options.attemptCount) === 'neutral') {
    return options.isBlank
      ? `Some rows for ${options.step.label} are still blank. Fill every row with T or F.`
      : `Some rows for ${options.step.label} do not match yet. Recheck each row using the expression.`;
  }

  return buildTruthTableHint(options);
}

export function describeRegionLocation(regionId, variables) {
  const inside = [];
  const outside = [];

  variables.forEach((v, index) => {
    const bit = variables.length - index - 1;
    if ((regionId & (1 << bit)) !== 0) {
      inside.push(`Shape ${v}`);
    } else {
      outside.push(`Shape ${v}`);
    }
  });

  if (inside.length === 0) {
    return 'outside all shapes';
  }
  if (outside.length === 0) {
    return `inside ${inside.join(' and ')}`;
  }
  return `inside ${inside.join(' and ')} and outside ${outside.join(' and ')}`;
}

function describeOperatorGuidance(ast) {
  if (ast.type === 'BinaryExpression') {
    if (ast.operator === '&&') {
      return 'The AND operator requires both parts of the expression to be true at the same time.';
    }
    if (ast.operator === '||') {
      return 'The OR operator is true if either part of the expression is true.';
    }
  }
  if (ast.type === 'UnaryExpression') {
    return 'The NOT operator inverts the region, selecting everything outside.';
  }
  return 'Test the expression against each region’s inside/outside conditions.';
}

/**
 * Shade-only hint ladder (Repair 02 / M3):
 * Never mentions truth table or row numbers because the student has no table.
 */
export function buildShapePuzzleShadeOnlyHint({
  attemptCount,
  sheet,
  missedRegionIds = [],
  extraRegionIds = [],
}) {
  const stage = getHintStage(attemptCount);
  const variables = sheet.variables || [];
  const ast =
    typeof sheet.expression === 'string'
      ? parseBooleanExpression(sheet.expression)
      : sheet.expression;

  if (stage === 'neutral') {
    return 'The shaded regions do not match yet. For each region, decide whether it is inside or outside each shape, then test the expression.';
  }

  if (stage === 'guided') {
    return `Try checking the regions again. ${describeOperatorGuidance(ast)}`;
  }

  // Stage 3 (specific): names one missed or extra region by location only
  if (missedRegionIds.length > 0) {
    const firstMissed = missedRegionIds[0];
    const loc = describeRegionLocation(firstMissed, variables);
    return `The region ${loc} makes the expression TRUE, so it should be shaded.`;
  }
  if (extraRegionIds.length > 0) {
    const firstExtra = extraRegionIds[0];
    const loc = describeRegionLocation(firstExtra, variables);
    return `The region ${loc} makes the expression FALSE, so it should not be shaded.`;
  }

  return 'The shaded regions do not match yet. Recheck the shapes and expression.';
}
