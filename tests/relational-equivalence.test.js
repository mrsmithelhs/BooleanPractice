import { describe, expect, it } from 'vitest';
import {
  buildNumericRelationalKnowledgeGraph,
  compareNumericRelationalAtoms,
  getInverseNumericComparisonAtom,
  getNumericRelationalRuleById,
  getNumericRelationalRuleByOperator,
  getNumericRelationalUnsupportedExamples,
  getNumericVariableTeachingCopy,
  normalizeNumericComparisonAtom,
} from '@shared/index';

describe('numeric relational equivalence', () => {
  it('documents the supported numeric comparison graph and student-facing variable note', () => {
    const graph = buildNumericRelationalKnowledgeGraph();
    const note = getNumericVariableTeachingCopy();

    expect(graph.title).toBe('Numeric relational equivalence knowledge graph');
    expect(graph.nodes).toHaveLength(6);
    expect(graph.edges).toHaveLength(6);
    expect(graph.nodes.map((node) => node.operator)).toEqual(['>', '>=', '<', '<=', '==', '!=']);
    expect(getNumericRelationalRuleById('numeric-rel-01-greater-than')?.inverseOperator).toBe(
      '<=',
    );
    expect(getNumericRelationalRuleByOperator('==')?.supportedShapes).toEqual([
      'identifier-literal',
      'identifier-identifier',
    ]);
    expect(note.lede).toContain('stands in for an unknown number');
    expect(note.points).toContain(
      'Dot notation, object fields, method calls, arrays, and collections are out of scope for this packet.',
    );
    expect(getNumericRelationalUnsupportedExamples()).toEqual(
      expect.arrayContaining(['str.length()', 'items.length', 'car.milesPerHour()', 'list.size()']),
    );
  });

  it('normalizes supported numeric comparisons and preserves readable labels', () => {
    const comparison = normalizeNumericComparisonAtom({ left: 'score', operator: '>', right: 10 });
    const variableComparison = normalizeNumericComparisonAtom({
      left: 'count',
      operator: '==',
      right: 'y',
    });

    expect(comparison).toMatchObject({
      display: 'score > 10',
      inverseDisplay: 'score <= 10',
      accessibleLabel: 'score greater than 10',
      shape: 'identifier-literal',
      ruleId: 'numeric-rel-01-greater-than',
    });
    expect(variableComparison).toMatchObject({
      display: 'count == y',
      inverseDisplay: 'count != y',
      accessibleLabel: 'count equal to y',
      shape: 'identifier-identifier',
      ruleId: 'numeric-rel-05-equal',
    });
  });

  it('rejects unsupported shapes without widening the model', () => {
    expect(() =>
      normalizeNumericComparisonAtom({ left: 'str.length()', operator: '>', right: 5 }),
    ).toThrow('plain identifier');
    expect(() =>
      normalizeNumericComparisonAtom({ left: 'score', operator: '>', right: 'items.length' }),
    ).toThrow('plain identifier');
    expect(() =>
      normalizeNumericComparisonAtom({ left: 'score + 1', operator: '>', right: 5 }),
    ).toThrow('plain identifier');
    expect(() =>
      normalizeNumericComparisonAtom({ left: 'score', operator: '>', right: 'count' }),
    ).toThrow('Only equality and inequality can compare two numeric variables in this packet.');
    expect(() =>
      normalizeNumericComparisonAtom({ left: 'score', operator: '===', right: 5 }),
    ).toThrow('Unsupported numeric comparison operator');
  });

  it('returns inverse forms for each supported rule in both directions', () => {
    const examples = [
      [{ left: 'score', operator: '>', right: 10 }, { left: 'score', operator: '<=', right: 10 }],
      [{ left: 'score', operator: '>=', right: 90 }, { left: 'score', operator: '<', right: 90 }],
      [{ left: 'age', operator: '<', right: 13 }, { left: 'age', operator: '>=', right: 13 }],
      [{ left: 'limit', operator: '<=', right: 20 }, { left: 'limit', operator: '>', right: 20 }],
      [{ left: 'count', operator: '==', right: 'y' }, { left: 'count', operator: '!=', right: 'y' }],
      [{ left: 'count', operator: '!=', right: 0 }, { left: 'count', operator: '==', right: 0 }],
    ];

    for (const [leftSource, rightSource] of examples) {
      const left = normalizeNumericComparisonAtom(leftSource);
      const right = normalizeNumericComparisonAtom(rightSource);

      expect(getInverseNumericComparisonAtom(leftSource)).toMatchObject(right);
      expect(getInverseNumericComparisonAtom(rightSource)).toMatchObject(left);
      expect(compareNumericRelationalAtoms(leftSource, rightSource)).toMatchObject({
        supported: true,
        equivalent: true,
      });
      expect(compareNumericRelationalAtoms(rightSource, leftSource)).toMatchObject({
        supported: true,
        equivalent: true,
      });
    }
  });

  it('flags non-inverse comparisons as non-equivalent while staying supported', () => {
    const result = compareNumericRelationalAtoms(
      { left: 'score', operator: '>', right: 10 },
      { left: 'score', operator: '>=', right: 10 },
    );

    expect(result.supported).toBe(true);
    expect(result.equivalent).toBe(false);
    expect(result.reason).toContain('operators are not inverse');
  });
});
