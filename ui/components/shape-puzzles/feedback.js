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

function describeRegionLocation(regionId, variables) {
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

  const insideText = inside.length > 0 ? `inside ${inside.join(' and ')}` : 'outside all shapes';
  const outsideText =
    outside.length > 0 && inside.length > 0 ? ` (${outside.join(', ')} outside)` : '';
  return `${insideText}${outsideText}`;
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
  return 'Compare the TRUE rows in your table directly against the diagram regions.';
}

export function buildShapePuzzleShadingHint({
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
    return 'The shaded regions do not match yet. Recheck which rows are TRUE in your completed truth table.';
  }

  if (stage === 'guided') {
    return `Try checking the regions again. ${describeOperatorGuidance(ast)}`;
  }

  // Stage 3 (specific)
  const parts = [];
  if (missedRegionIds.length > 0) {
    const firstMissed = missedRegionIds[0];
    const rowNum = firstMissed + 1;
    const loc = describeRegionLocation(firstMissed, variables);
    parts.push(`Row ${rowNum} is TRUE in your table, so the region ${loc} should be shaded.`);
  } else if (extraRegionIds.length > 0) {
    const firstExtra = extraRegionIds[0];
    const rowNum = firstExtra + 1;
    const loc = describeRegionLocation(firstExtra, variables);
    parts.push(
      `Row ${rowNum} is FALSE in your table, so the region ${loc} should remain unshaded.`,
    );
  }

  return parts.join(' ');
}
