import { describe, expect, it } from 'vitest';
import { buildVennDiagramModel, generateVennRegions, getVennDiagramRegionDisplayLabel } from '@shared/index';

describe('venn diagram layout', () => {
  it('maps canonical regions into a visible diagram model for one, two, and three variables', () => {
    const oneVariable = buildVennDiagramModel(generateVennRegions('a'));
    const twoVariable = buildVennDiagramModel(generateVennRegions('a && b'));
    const threeVariable = buildVennDiagramModel(generateVennRegions('a && !b || c'));

    expect(oneVariable.circles).toHaveLength(1);
    expect(twoVariable.circles).toHaveLength(2);
    expect(threeVariable.circles).toHaveLength(3);

    expect(oneVariable.regions.map((region) => region.id)).toEqual([0, 1]);
    expect(twoVariable.regions.map((region) => region.id)).toEqual([0, 1, 2, 3]);
    expect(threeVariable.regions.map((region) => region.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

    expect(oneVariable.regions[1]).toMatchObject({
      includedVariables: ['a'],
      excludedVariables: [],
    });
    expect(twoVariable.regions[3]).toMatchObject({
      includedVariables: ['a', 'b'],
      excludedVariables: [],
    });
    expect(threeVariable.regions[0]).toMatchObject({
      includedVariables: [],
      excludedVariables: ['a', 'b', 'c'],
    });

    expect(new Set(threeVariable.regions.map((region) => region.anchor.x)).size).toBeGreaterThan(1);
    expect(new Set(threeVariable.regions.map((region) => region.anchor.y)).size).toBeGreaterThan(1);
  });

  it('describes regions in student-facing venn language', () => {
    expect(getVennDiagramRegionDisplayLabel('00', ['a', 'b'])).toBe('outside all sets');
    expect(getVennDiagramRegionDisplayLabel('10', ['a', 'b'])).toBe('inside a only');
    expect(getVennDiagramRegionDisplayLabel('11', ['a', 'b'])).toBe('inside both sets');
    expect(getVennDiagramRegionDisplayLabel('111', ['a', 'b', 'c'])).toBe(
      'inside all three sets',
    );
  });

  it('marks focused regions and state labels in the diagram model', () => {
    const model = buildVennDiagramModel(generateVennRegions('a && b'), {
      stateByRegionId: {
        3: 'correct',
      },
      focusRegionIds: [3],
    });

    expect(model.regions[3]).toMatchObject({
      id: 3,
      state: 'correct',
      focused: true,
      stateLabel: 'correct',
      icon: '✓',
    });
  });
});
