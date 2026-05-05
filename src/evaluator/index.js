import { parseBooleanExpression } from '../parser/index.js';

function ensureBoolean(value, variableName) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`Expected boolean value for "${variableName}".`);
  }

  return value;
}

export function evaluateBooleanAst(node, assignment = {}) {
  switch (node.type) {
    case 'Literal':
      return node.value;
    case 'Identifier':
      if (!(node.name in assignment)) {
        throw new ReferenceError(`Missing assignment for variable "${node.name}".`);
      }
      return ensureBoolean(assignment[node.name], node.name);
    case 'UnaryExpression':
      return !evaluateBooleanAst(node.argument, assignment);
    case 'BinaryExpression':
      if (node.operator === '&&') {
        return evaluateBooleanAst(node.left, assignment) && evaluateBooleanAst(node.right, assignment);
      }
      if (node.operator === '||') {
        return evaluateBooleanAst(node.left, assignment) || evaluateBooleanAst(node.right, assignment);
      }
      throw new TypeError(`Unsupported binary operator: ${node.operator}`);
    default:
      throw new TypeError(`Unsupported AST node type: ${node.type}`);
  }
}

export function evaluateBooleanExpression(nodeOrSource, assignment = {}) {
  const ast = typeof nodeOrSource === 'string' ? parseBooleanExpression(nodeOrSource) : nodeOrSource;
  return evaluateBooleanAst(ast, assignment);
}

