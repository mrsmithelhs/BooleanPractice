import { describe, expect, it } from 'vitest';
import { checkVennSelection, generateTruthTable, generateVennRegions, getExpectedVennRegionIds } from '@shared/index';

describe('venn region engine', () => {
  it('generates 2, 4, and 8 regions in stable order', () => {
    expect(generateVennRegions('a').regions).toHaveLength(2);
    expect(generateVennRegions('a && b').regions).toHaveLength(4);
    expect(generateVennRegions('a && !b || c').regions).toHaveLength(8);
  });

  it('agrees with the truth table evaluator for representative expressions', () => {
    const expressions = ['a', 'a && b', '!(a && b)', '(a && b) || c', 'a && !b || c'];

    for (const expression of expressions) {
      const truthTable = generateTruthTable(expression);
      const venn = generateVennRegions(expression);

      expect(venn.variables).toEqual(truthTable.variables);
      expect(venn.regions.map((region) => region.assignment)).toEqual(
        truthTable.rows.map((row) => row.assignment),
      );
      expect(venn.regions.map((region) => region.result)).toEqual(
        truthTable.rows.map((row) => row.result),
      );
      expect(checkVennSelection(expression, getExpectedVennRegionIds(expression)).isCorrect).toBe(true);
    }
  });

  it('uses the same variable ordering and assignment order as the truth table engine', () => {
    const expression = 'c || a && !b';
    const truthTable = generateTruthTable(expression);
    const venn = generateVennRegions(expression);

    expect(venn.variables).toEqual(truthTable.variables);
    expect(venn.regions.map((region) => region.assignment)).toEqual(
      truthTable.rows.map((row) => row.assignment),
    );
    expect(venn.regions.map((region) => region.result)).toEqual(truthTable.rows.map((row) => row.result));
    expect(venn.regions.map((region) => region.bits)).toEqual([
      '000',
      '001',
      '010',
      '011',
      '100',
      '101',
      '110',
      '111',
    ]);
  });

  it('returns readable labels for accessibility fallback controls', () => {
    const venn = generateVennRegions('a && b');

    expect(venn.regions[0]).toMatchObject({
      id: 0,
      bits: '00',
      label: 'a=F, b=F',
      accessibleLabel: 'a false, b false',
    });
    expect(venn.regions[3]).toMatchObject({
      id: 3,
      bits: '11',
      label: 'a=T, b=T',
      accessibleLabel: 'a true, b true',
    });
  });

  it('reports missed and extra regions separately', () => {
    const result = checkVennSelection('a && b', [0, 3]);

    expect(result.expectedRegionIds).toEqual([3]);
    expect(result.missedRegionIds).toEqual([]);
    expect(result.extraRegionIds).toEqual([0]);
    expect(result.missedRegions).toEqual([]);
    expect(result.extraRegions).toEqual([
      expect.objectContaining({
        id: 0,
        bits: '00',
      }),
    ]);
    expect(result.isCorrect).toBe(false);
  });

  it('returns correct results when the selected regions match the expression', () => {
    const result = checkVennSelection('!(a && b) || c', getExpectedVennRegionIds('!(a && b) || c'));

    expect(result.isCorrect).toBe(true);
    expect(result.missedRegionIds).toEqual([]);
    expect(result.extraRegionIds).toEqual([]);
  });

  it('rejects expressions with more than three variables', () => {
    expect(() => generateVennRegions('a && b && c && d')).toThrow(/one to three variables/);
  });
});
