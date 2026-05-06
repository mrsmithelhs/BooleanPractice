import { describe, expect, it } from 'vitest';
import { buildCrossRepresentationComparison, getProblemById } from '@shared/index';

describe('cross representation comparison', () => {
  it('maps each truth-table row to the matching venn region by shared id', () => {
    const comparison = buildCrossRepresentationComparison(getProblemById('tt-09-three-variable-venn'));

    expect(comparison).not.toBeNull();
    expect(comparison.pairs).toHaveLength(8);
    expect(comparison.pairs.map((pair) => pair.rowId)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(comparison.pairs.map((pair) => pair.regionId)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(comparison.pairs[0]).toMatchObject({
      assignmentLabel: 'a=F, b=F, c=F',
      assignmentAccessibleLabel: 'a false, b false, c false',
      regionLabel: 'a=F, b=F, c=F',
      regionAccessibleLabel: 'a false, b false, c false',
    });
  });

  it('returns null for problems that are not cross-representation compatible', () => {
    expect(buildCrossRepresentationComparison(getProblemById('tt-05-precedence'))).toBeNull();
  });
});
