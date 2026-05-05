import { describe, expect, it } from 'vitest';
import {
  collectBooleanVariables,
  evaluateBooleanAst,
  evaluateBooleanExpression,
  formatBooleanExpression,
  parseBooleanExpression,
  tokenizeBooleanExpression,
} from '@shared/index';

describe('boolean parser and evaluator', () => {
  it('tokenizes whitespace and operators', () => {
    expect(tokenizeBooleanExpression('a && !b')).toEqual([
      { type: 'identifier', value: 'a', start: 0 },
      { type: 'operator', value: '&&', start: 2 },
      { type: 'operator', value: '!', start: 5 },
      { type: 'identifier', value: 'b', start: 6 },
    ]);
  });

  it('tokenizes literals and extended variable names', () => {
    expect(tokenizeBooleanExpression(' true || a1_b2 ')).toEqual([
      { type: 'literal', value: 'true', start: 1 },
      { type: 'operator', value: '||', start: 6 },
      { type: 'identifier', value: 'a1_b2', start: 9 },
    ]);
  });

  it('respects precedence and parentheses', () => {
    const ast = parseBooleanExpression('!a && b || c');

    expect(formatBooleanExpression(ast)).toBe('((!a && b) || c)');
    expect(evaluateBooleanAst(ast, { a: false, b: true, c: false })).toBe(true);
    expect(evaluateBooleanAst(ast, { a: true, b: true, c: false })).toBe(false);
  });

  it('supports nested negation and parenthesized expressions', () => {
    const ast = parseBooleanExpression('!(a && (b || false))');

    expect(formatBooleanExpression(ast)).toBe('!(a && (b || false))');
    expect(evaluateBooleanAst(ast, { a: true, b: false })).toBe(true);
    expect(evaluateBooleanAst(ast, { a: true, b: true })).toBe(false);
  });

  it('extracts variables in a stable order', () => {
    expect(collectBooleanVariables('c || a && b || a1_b2 && a')).toEqual(['a', 'a1_b2', 'b', 'c']);
  });

  it('rejects malformed and trailing-token input', () => {
    const invalidExpressions = [
      ['a &&', /Unexpected end of expression/],
      ['a b', /Unexpected trailing token/],
      ['a + b', /Unexpected character/],
      ['(', /Unexpected end of expression/],
      ['a && )', /Expected an expression/],
      ['true false', /Unexpected trailing token/],
    ];

    for (const [expression, message] of invalidExpressions) {
      expect(() => parseBooleanExpression(expression)).toThrow(message);
    }
  });

  it('evaluates expressions from source strings', () => {
    expect(evaluateBooleanExpression('true && !false')).toBe(true);
    expect(evaluateBooleanExpression('false || false')).toBe(false);
    expect(evaluateBooleanExpression('a1_b2 && true', { a1_b2: true })).toBe(true);
  });

  it('rejects missing or non-boolean assignments', () => {
    const ast = parseBooleanExpression('a && b');

    expect(() => evaluateBooleanAst(ast, { a: true })).toThrow(/Missing assignment/);
    expect(() => evaluateBooleanAst(ast, { a: true, b: 'yes' })).toThrow(/Expected boolean value/);
  });
});
