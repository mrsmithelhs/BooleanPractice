import { describe, expect, it } from 'vitest';
import {
  generateTruthTable,
  getProblemById,
  getPredicateAtomAccessibleLabel,
  getPredicateAtomDisplayLabel,
  getPredicateAtomLegend,
} from '@shared/index';

describe('predicate atom metadata', () => {
  it('exposes readable aliases and legend text for AP CSA-style predicates', () => {
    const problem = getProblemById('pa-27-three-atom-guard');
    const legend = getPredicateAtomLegend(problem);

    expect(legend).toHaveLength(3);
    expect(legend.map((atom) => atom.alias)).toEqual(['P', 'Q', 'R']);
    expect(legend.map((atom) => atom.predicate)).toEqual([
      'score >= 90',
      'count == 0',
      'index < limit',
    ]);
    expect(getPredicateAtomDisplayLabel(problem, 'p')).toBe('P');
    expect(getPredicateAtomDisplayLabel(problem, 'q')).toBe('Q');
    expect(getPredicateAtomAccessibleLabel(problem, 'r')).toBe('R: index < limit');
  });

  it('keeps evaluation mapped to the shared boolean engine while exposing the legend', () => {
    const problem = getProblemById('pa-25-score-and-count');
    const truthTable = generateTruthTable(problem.ast);

    expect(truthTable.variables).toEqual(['p', 'q']);
    expect(truthTable.rows).toHaveLength(4);
    expect(truthTable.rows.map((row) => row.assignment.p)).toEqual([false, false, true, true]);
    expect(truthTable.rows.map((row) => row.assignment.q)).toEqual([false, true, false, true]);
    expect(truthTable.expression).toBe('(p && q)');
    expect(getPredicateAtomLegend(problem).map((atom) => atom.label)).toEqual([
      'P: score > 10',
      'Q: count == 0',
    ]);
  });
});
