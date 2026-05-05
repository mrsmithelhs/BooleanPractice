const BINARY_OPERATORS = new Set(['&&', '||']);

function createSyntaxError(message, token) {
  if (!token) {
    return new SyntaxError(message);
  }

  return new SyntaxError(`${message} near "${token.value}" at position ${token.start}`);
}

export function tokenizeBooleanExpression(source) {
  if (typeof source !== 'string') {
    throw new TypeError('Boolean expressions must be strings.');
  }

  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const character = source[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    const twoCharacterOperator = source.slice(index, index + 2);
    if (BINARY_OPERATORS.has(twoCharacterOperator)) {
      tokens.push({
        type: 'operator',
        value: twoCharacterOperator,
        start: index,
      });
      index += 2;
      continue;
    }

    if (character === '!') {
      tokens.push({
        type: 'operator',
        value: character,
        start: index,
      });
      index += 1;
      continue;
    }

    if (character === '(' || character === ')') {
      tokens.push({
        type: 'paren',
        value: character,
        start: index,
      });
      index += 1;
      continue;
    }

    if (/[a-z]/.test(character)) {
      let end = index + 1;
      while (end < source.length && /[a-z0-9_]/.test(source[end])) {
        end += 1;
      }

      const value = source.slice(index, end);
      const type = value === 'true' || value === 'false' ? 'literal' : 'identifier';
      tokens.push({
        type,
        value,
        start: index,
      });
      index = end;
      continue;
    }

    throw new SyntaxError(`Unexpected character "${character}" at position ${index}.`);
  }

  return tokens;
}

function parseExpression(tokens) {
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function advance() {
    const token = tokens[index];
    index += 1;
    return token;
  }

  function parsePrimary() {
    const token = peek();

    if (!token) {
      throw createSyntaxError('Unexpected end of expression');
    }

    if (token.type === 'literal') {
      advance();
      return {
        type: 'Literal',
        value: token.value === 'true',
      };
    }

    if (token.type === 'identifier') {
      advance();
      return {
        type: 'Identifier',
        name: token.value,
      };
    }

    if (token.type === 'paren' && token.value === '(') {
      advance();
      const expression = parseOrExpression();
      const closing = peek();
      if (!closing || closing.type !== 'paren' || closing.value !== ')') {
        throw createSyntaxError('Expected closing parenthesis', closing ?? token);
      }
      advance();
      return expression;
    }

    throw createSyntaxError('Expected an expression', token);
  }

  function parseUnaryExpression() {
    const token = peek();

    if (token && token.type === 'operator' && token.value === '!') {
      advance();
      return {
        type: 'UnaryExpression',
        operator: '!',
        argument: parseUnaryExpression(),
      };
    }

    return parsePrimary();
  }

  function parseAndExpression() {
    let left = parseUnaryExpression();

    let token = peek();
    while (token && token.type === 'operator' && token.value === '&&') {
      advance();
      left = {
        type: 'BinaryExpression',
        operator: '&&',
        left,
        right: parseUnaryExpression(),
      };
      token = peek();
    }

    return left;
  }

  function parseOrExpression() {
    let left = parseAndExpression();

    let token = peek();
    while (token && token.type === 'operator' && token.value === '||') {
      advance();
      left = {
        type: 'BinaryExpression',
        operator: '||',
        left,
        right: parseAndExpression(),
      };
      token = peek();
    }

    return left;
  }

  const expression = parseOrExpression();

  if (index < tokens.length) {
    throw createSyntaxError('Unexpected trailing token', peek());
  }

  return expression;
}

export function parseBooleanExpression(source) {
  return parseExpression(tokenizeBooleanExpression(source));
}

function formatAst(node) {
  switch (node.type) {
    case 'Literal':
      return node.value ? 'true' : 'false';
    case 'Identifier':
      return node.name;
    case 'UnaryExpression':
      return `!${formatAst(node.argument)}`;
    case 'BinaryExpression':
      return `(${formatAst(node.left)} ${node.operator} ${formatAst(node.right)})`;
    default:
      throw new TypeError(`Unsupported AST node type: ${node.type}`);
  }
}

export function formatBooleanExpression(nodeOrSource) {
  const ast = typeof nodeOrSource === 'string' ? parseBooleanExpression(nodeOrSource) : nodeOrSource;
  return formatAst(ast);
}

function collectNames(node, names) {
  switch (node.type) {
    case 'Literal':
      return;
    case 'Identifier':
      names.add(node.name);
      return;
    case 'UnaryExpression':
      collectNames(node.argument, names);
      return;
    case 'BinaryExpression':
      collectNames(node.left, names);
      collectNames(node.right, names);
      return;
    default:
      throw new TypeError(`Unsupported AST node type: ${node.type}`);
  }
}

export function collectBooleanVariables(nodeOrSource) {
  const ast = typeof nodeOrSource === 'string' ? parseBooleanExpression(nodeOrSource) : nodeOrSource;
  const names = new Set();
  collectNames(ast, names);
  return Array.from(names).sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}
