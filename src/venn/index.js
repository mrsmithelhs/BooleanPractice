import { collectBooleanVariables, formatBooleanExpression, parseBooleanExpression } from '../parser/index.js';
import { evaluateBooleanAst } from '../evaluator/index.js';

function buildAssignments(variables) {
  const totalRows = 2 ** variables.length;
  return Array.from({ length: totalRows }, (_, rowIndex) => {
    const assignment = {};
    variables.forEach((variable, variableIndex) => {
      const bit = variables.length - variableIndex - 1;
      assignment[variable] = Boolean(rowIndex & (1 << bit));
    });
    return assignment;
  });
}

function assignmentToBitString(assignment, variables) {
  return variables.map((variable) => (assignment[variable] ? '1' : '0')).join('');
}

function assignmentToRegionId(assignment, variables) {
  return Number.parseInt(assignmentToBitString(assignment, variables), 2);
}

function assignmentToLabel(assignment, variables) {
  return variables.map((variable) => `${variable}=${assignment[variable] ? 'T' : 'F'}`).join(', ');
}

function assignmentToAccessibleLabel(assignment, variables) {
  return variables.map((variable) => `${variable} ${assignment[variable] ? 'true' : 'false'}`).join(', ');
}

function normalizeSelectedRegionIds(selectedRegionIds) {
  if (!Array.isArray(selectedRegionIds)) {
    throw new TypeError('Selected region ids must be provided as an array.');
  }

  return selectedRegionIds.map((regionId) => {
    const numericRegionId = typeof regionId === 'string' ? Number(regionId) : regionId;
    if (!Number.isInteger(numericRegionId) || numericRegionId < 0) {
      throw new RangeError(`Invalid region id "${regionId}".`);
    }
    return numericRegionId;
  });
}

function resolveAst(nodeOrSource) {
  return typeof nodeOrSource === 'string' ? parseBooleanExpression(nodeOrSource) : nodeOrSource;
}

function resolveVariables(nodeOrSource) {
  const ast = resolveAst(nodeOrSource);
  return collectBooleanVariables(ast);
}

function ensureVennVariableCount(variables) {
  if (variables.length < 1 || variables.length > 3) {
    throw new RangeError('Venn region generation supports one to three variables.');
  }
}

export function generateVennRegions(nodeOrSource) {
  const ast = resolveAst(nodeOrSource);
  const variables = resolveVariables(ast);
  ensureVennVariableCount(variables);

  const regions = buildAssignments(variables).map((assignment) => {
    const id = assignmentToRegionId(assignment, variables);
    const result = evaluateBooleanAst(ast, assignment);

    return {
      id,
      bits: assignmentToBitString(assignment, variables),
      assignment,
      label: assignmentToLabel(assignment, variables),
      accessibleLabel: assignmentToAccessibleLabel(assignment, variables),
      result,
    };
  });

  return {
    ast,
    expression: formatBooleanExpression(ast),
    variables,
    regions,
  };
}

export function getExpectedVennRegionIds(nodeOrSource) {
  const { regions } = generateVennRegions(nodeOrSource);
  return regions.filter((region) => region.result).map((region) => region.id);
}

export function checkVennSelection(nodeOrSource, selectedRegionIds) {
  const { ast, variables, regions } = generateVennRegions(nodeOrSource);
  const normalizedSelectedRegionIds = normalizeSelectedRegionIds(selectedRegionIds);
  const regionById = new Map(regions.map((region) => [region.id, region]));
  const selectedRegionSet = new Set(normalizedSelectedRegionIds);
  const expectedRegionIds = regions.filter((region) => region.result).map((region) => region.id);
  const extraRegionIds = normalizedSelectedRegionIds.filter((regionId) => !regionById.has(regionId) || !regionById.get(regionId).result);
  const missedRegionIds = expectedRegionIds.filter((regionId) => !selectedRegionSet.has(regionId));

  return {
    ast,
    variables,
    regions,
    expectedRegionIds,
    selectedRegionIds: normalizedSelectedRegionIds,
    missedRegionIds,
    extraRegionIds,
    missedRegions: missedRegionIds.map((regionId) => regionById.get(regionId)).filter(Boolean),
    extraRegions: extraRegionIds.map((regionId) => regionById.get(regionId)).filter(Boolean),
    isCorrect: missedRegionIds.length === 0 && extraRegionIds.length === 0,
  };
}
