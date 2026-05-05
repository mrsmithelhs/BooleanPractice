import { collectBooleanVariables, formatBooleanExpression, parseBooleanExpression } from '../parser/index.js';
import { evaluateBooleanAst } from '../evaluator/index.js';

function collectSubexpressions(node, path = '0', steps = []) {
  switch (node.type) {
    case 'UnaryExpression':
      collectSubexpressions(node.argument, `${path}.0`, steps);
      steps.push({
        id: path,
        path,
        node,
        label: formatBooleanExpression(node),
      });
      return steps;
    case 'BinaryExpression':
      collectSubexpressions(node.left, `${path}.0`, steps);
      collectSubexpressions(node.right, `${path}.1`, steps);
      steps.push({
        id: path,
        path,
        node,
        label: formatBooleanExpression(node),
      });
      return steps;
    default:
      return steps;
  }
}

function buildAssignments(variables) {
  if (variables.length === 0) {
    return [{}];
  }

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

export function generateTruthTable(nodeOrSource) {
  const ast = typeof nodeOrSource === 'string' ? parseBooleanExpression(nodeOrSource) : nodeOrSource;
  const variables = collectBooleanVariables(ast);
  const subexpressions = collectSubexpressions(ast);
  const rows = buildAssignments(variables).map((assignment) => {
    const values = {};
    for (const subexpression of subexpressions) {
      values[subexpression.id] = evaluateBooleanAst(subexpression.node, assignment);
    }

    return {
      assignment,
      values,
      result: evaluateBooleanAst(ast, assignment),
    };
  });

  return {
    ast,
    expression: formatBooleanExpression(ast),
    variables,
    subexpressions,
    rows,
  };
}

