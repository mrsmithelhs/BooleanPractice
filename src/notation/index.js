import { parseBooleanExpression } from '../parser/index.js';

const PRECEDENCE = {
  '||': 1,
  '&&': 2,
  '!': 3,
  primary: 4,
};

function getNodePrecedence(node) {
  if (node.type === 'BinaryExpression') {
    return PRECEDENCE[node.operator] ?? 0;
  }
  if (node.type === 'UnaryExpression') {
    return PRECEDENCE['!'];
  }
  return PRECEDENCE.primary;
}

function formatWordsNode(node) {
  switch (node.type) {
    case 'Literal':
      return node.value ? 'TRUE' : 'FALSE';
    case 'Identifier':
      return node.name.toUpperCase();
    case 'UnaryExpression': {
      const formattedArg = formatWordsNode(node.argument);
      return `NOT(${formattedArg})`;
    }
    case 'BinaryExpression': {
      const word = node.operator === '&&' ? 'AND' : 'OR';

      let leftText = formatWordsNode(node.left);
      if (node.left.type === 'BinaryExpression' && node.left.operator !== node.operator) {
        leftText = `(${leftText})`;
      }

      let rightText = formatWordsNode(node.right);
      if (node.right.type === 'BinaryExpression') {
        rightText = `(${rightText})`;
      }

      return `${leftText} ${word} ${rightText}`;
    }
    default:
      throw new TypeError(`Unsupported AST node type: ${node.type}`);
  }
}

function formatSymbolsNode(node) {
  switch (node.type) {
    case 'Literal':
      return node.value ? 'true' : 'false';
    case 'Identifier':
      return node.name.toUpperCase();
    case 'UnaryExpression': {
      const argPrec = getNodePrecedence(node.argument);
      const formattedArg = formatSymbolsNode(node.argument);
      if (argPrec < PRECEDENCE['!']) {
        return `!(${formattedArg})`;
      }
      return `!${formattedArg}`;
    }
    case 'BinaryExpression': {
      const parentPrec = getNodePrecedence(node);
      const symbol = node.operator;

      const leftPrec = getNodePrecedence(node.left);
      const leftText = leftPrec < parentPrec ? `(${formatSymbolsNode(node.left)})` : formatSymbolsNode(node.left);

      const rightPrec = getNodePrecedence(node.right);
      const rightText = rightPrec <= parentPrec ? `(${formatSymbolsNode(node.right)})` : formatSymbolsNode(node.right);

      return `${leftText} ${symbol} ${rightText}`;
    }
    default:
      throw new TypeError(`Unsupported AST node type: ${node.type}`);
  }
}

export function formatExpressionWords(nodeOrSource) {
  const ast = typeof nodeOrSource === 'string' ? parseBooleanExpression(nodeOrSource) : nodeOrSource;
  return formatWordsNode(ast);
}

export function formatExpressionSymbols(nodeOrSource) {
  const ast = typeof nodeOrSource === 'string' ? parseBooleanExpression(nodeOrSource) : nodeOrSource;
  return formatSymbolsNode(ast);
}

export function wordsToSymbols(wordsExpression) {
  if (typeof wordsExpression !== 'string') {
    throw new TypeError('Words expression must be a string.');
  }

  return wordsExpression
    .replace(/\bAND\b/g, '&&')
    .replace(/\bOR\b/g, '||')
    .replace(/\bNOT\b/g, '!')
    .replace(/\bTRUE\b/g, 'true')
    .replace(/\bFALSE\b/g, 'false')
    .replace(/\b([A-Z][A-Z0-9_]*)\b/g, (match) => match.toLowerCase());
}

export function areAstsEquivalent(ast1, ast2) {
  if (!ast1 || !ast2) {
    return ast1 === ast2;
  }
  if (ast1.type !== ast2.type) {
    return false;
  }
  switch (ast1.type) {
    case 'Literal':
      return ast1.value === ast2.value;
    case 'Identifier':
      return ast1.name.toLowerCase() === ast2.name.toLowerCase();
    case 'UnaryExpression':
      return ast1.operator === ast2.operator && areAstsEquivalent(ast1.argument, ast2.argument);
    case 'BinaryExpression':
      return (
        ast1.operator === ast2.operator &&
        areAstsEquivalent(ast1.left, ast2.left) &&
        areAstsEquivalent(ast1.right, ast2.right)
      );
    default:
      return false;
  }
}
