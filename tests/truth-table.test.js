import { describe, expect, it } from 'vitest';
import { evaluateBooleanAst, generateTruthTable, parseBooleanExpression } from '@shared/index';

describe('truth table generation', () => {
  it('generates rows for one and two variables in stable order', () => {
    expect(generateTruthTable('a').rows.map((row) => row.assignment)).toEqual([
      { a: false },
      { a: true },
    ]);

    expect(generateTruthTable('a && b').rows.map((row) => row.assignment)).toEqual([
      { a: false, b: false },
      { a: false, b: true },
      { a: true, b: false },
      { a: true, b: true },
    ]);
  });

  it('generates deterministic rows for three variables', () => {
    const table = generateTruthTable('a && !b || c');

    expect(table.variables).toEqual(['a', 'b', 'c']);
    expect(table.subexpressions.map((entry) => entry.label)).toEqual(['!b', '(a && !b)', '((a && !b) || c)']);
    expect(table.rows.map((row) => row.assignment)).toEqual([
      { a: false, b: false, c: false },
      { a: false, b: false, c: true },
      { a: false, b: true, c: false },
      { a: false, b: true, c: true },
      { a: true, b: false, c: false },
      { a: true, b: false, c: true },
      { a: true, b: true, c: false },
      { a: true, b: true, c: true },
    ]);
  });

  it('matches evaluator output for representative expressions', () => {
    const expressions = ['a', '!a', 'a && b', '!a && b || c', '(a && b) || (a && !b)', 'true && !false'];

    for (const expression of expressions) {
      const table = generateTruthTable(expression);

      for (const row of table.rows) {
        expect(row.result).toBe(evaluateBooleanAst(table.ast, row.assignment));

        for (const step of table.subexpressions) {
          expect(row.values[step.id]).toBe(evaluateBooleanAst(step.node, row.assignment));
        }
      }
    }
  });

  it('matches evaluator output for every row', () => {
    const ast = parseBooleanExpression('!(a && b) || c');
    const table = generateTruthTable(ast);

    for (const row of table.rows) {
      expect(row.result).toBe(evaluateBooleanAst(ast, row.assignment));
      for (const step of table.subexpressions) {
        expect(row.values[step.id]).toBe(evaluateBooleanAst(step.node, row.assignment));
      }
    }
  });

  it('handles expressions with no variables', () => {
    const table = generateTruthTable('true && !false');

    expect(table.variables).toEqual([]);
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0].assignment).toEqual({});
    expect(table.rows[0].result).toBe(true);
  });
});
