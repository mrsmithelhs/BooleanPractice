import { generateTruthTable } from '../truth-table/index.js';
import { generateVennRegions } from '../venn/index.js';

function formatAssignment(assignment, variables) {
  return variables.map((variable) => `${variable}=${assignment[variable] ? 'T' : 'F'}`).join(', ');
}

function formatAccessibleAssignment(assignment, variables) {
  return variables.map((variable) => `${variable} ${assignment[variable] ? 'true' : 'false'}`).join(', ');
}

function isCrossRepresentationCompatible(problem) {
  return (
    problem &&
    Array.isArray(problem.supportedModes) &&
    problem.supportedModes.includes('truth-table') &&
    problem.supportedModes.includes('venn') &&
    problem.variables.length >= 1 &&
    problem.variables.length <= 3
  );
}

export function buildCrossRepresentationComparison(problem) {
  if (!isCrossRepresentationCompatible(problem)) {
    return null;
  }

  const truthTable = generateTruthTable(problem.ast ?? problem.expression);
  const venn = generateVennRegions(problem.ast ?? problem.expression);
  const regionById = new Map(venn.regions.map((region) => [region.id, region]));

  const pairs = truthTable.rows.map((row, rowIndex) => {
    const region = regionById.get(row.id);

    if (!region) {
      throw new Error(`Unable to match truth table row ${row.id} to a Venn region.`);
    }

    return {
      id: row.id,
      rowId: row.id,
      rowNumber: rowIndex + 1,
      assignment: row.assignment,
      assignmentBits: row.bits,
      assignmentLabel: formatAssignment(row.assignment, truthTable.variables),
      assignmentAccessibleLabel: formatAccessibleAssignment(row.assignment, truthTable.variables),
      rowResult: row.result,
      regionId: region.id,
      regionBits: region.bits,
      regionLabel: region.label,
      regionAccessibleLabel: region.accessibleLabel,
      regionResult: region.result,
    };
  });

  return {
    expression: truthTable.expression,
    variables: truthTable.variables,
    pairs,
  };
}
