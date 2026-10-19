import { describe, expect, it } from 'vitest';
import { parseBooleanExpression } from '../src/parser/index.js';
import {
  areAstsEquivalent,
  formatExpressionSymbols,
  formatExpressionWords,
  wordsToSymbols,
} from '../src/notation/index.js';

describe('words-notation formatter', () => {
  it('formats simple identifiers in uppercase with NOT(...)', () => {
    expect(formatExpressionWords('a')).toBe('A');
    expect(formatExpressionWords('!a')).toBe('NOT(A)');
    expect(formatExpressionWords('!!a')).toBe('NOT(NOT(A))');
  });

  it('formats binary expressions with explicit parentheses for mixed AND/OR and NOT(...)', () => {
    expect(formatExpressionWords('a && b')).toBe('A AND B');
    expect(formatExpressionWords('a || b')).toBe('A OR B');
    expect(formatExpressionWords('!a && b')).toBe('NOT(A) AND B');
    expect(formatExpressionWords('a && !b')).toBe('A AND NOT(B)');
    expect(formatExpressionWords('!(a && b)')).toBe('NOT(A AND B)');
    expect(formatExpressionWords('!(a || b)')).toBe('NOT(A OR B)');
    expect(formatExpressionWords('a && b || c')).toBe('(A AND B) OR C');
    expect(formatExpressionWords('(a || b) && c')).toBe('(A OR B) AND C');
    expect(formatExpressionWords('a && (b || c)')).toBe('A AND (B OR C)');
    expect(formatExpressionWords('a && !b || c')).toBe('(A AND NOT(B)) OR C');
    expect(formatExpressionWords('(a || b) && !c')).toBe('(A OR B) AND NOT(C)');
    expect(formatExpressionWords('a && b && c')).toBe('A AND B AND C');
    expect(formatExpressionWords('(a && b) && c')).toBe('A AND B AND C');
    expect(formatExpressionWords('a && (b && c)')).toBe('A AND (B AND C)');
    expect(formatExpressionWords('a || b || c')).toBe('A OR B OR C');
  });

  it('formats expressions with symbol notation preserving uppercase variable names', () => {
    expect(formatExpressionSymbols('!a && b')).toBe('!A && B');
    expect(formatExpressionSymbols('(a || b) && c')).toBe('(A || B) && C');
    expect(formatExpressionSymbols('a && !b || c')).toBe('A && !B || C');
  });

  it('round-trips words notation back to an equivalent AST', () => {
    const expressions = [
      'a',
      '!a',
      '!!a',
      'a && b',
      'a || b',
      '!a && b',
      'a && !b',
      '!(a && b)',
      '!(a || b)',
      'a && b || c',
      'a && (b || c)',
      '(a || b) && c',
      '(a && !b) || (!a && b)',
      '!(a && b) || c',
      'a && (b && c)',
      '(a && b) && c',
      'a || (b || c)',
      '(a || b) || c',
      '!(a || b) && c',
    ];

    for (const expr of expressions) {
      const ast = parseBooleanExpression(expr);
      const words = formatExpressionWords(ast);
      const symbols = wordsToSymbols(words);
      const roundTrippedAst = parseBooleanExpression(symbols);

      expect(areAstsEquivalent(ast, roundTrippedAst), `Failed for ${expr} -> ${words} -> ${symbols}`).toBe(true);
    }
  });
});
