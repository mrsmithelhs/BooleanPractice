import { describe, expect, it } from 'vitest';
import {
  getProblemById,
  getProblemCatalog,
  isProblemSupported,
  listProblems,
  problemCatalog,
  validateProblemCatalog,
} from '@shared/index';

describe('problem catalog', () => {
  it('exposes a frozen, ordered source catalog', () => {
    expect(Object.isFrozen(problemCatalog)).toBe(true);
    expect(problemCatalog.map((problem) => problem.sequence)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it('validates all entries and keeps expressions parseable', () => {
    expect(validateProblemCatalog()).toEqual([
      { id: 'tt-01-literal-a', valid: true },
      { id: 'tt-02-negation-a', valid: true },
      { id: 'tt-03-and-a-b', valid: true },
      { id: 'tt-04-or-a-b', valid: true },
      { id: 'tt-05-precedence', valid: true },
      { id: 'tt-06-parentheses', valid: true },
      { id: 'tt-07-de-morgan', valid: true },
      { id: 'tt-08-equivalence', valid: true },
      { id: 'tt-09-three-variable-venn', valid: true },
      { id: 'tt-10-three-variable-precedence', valid: true },
      { id: 'tt-11-de-morgan-three', valid: true },
    ]);
  });

  it('includes explicit supported modes and three-variable problems', () => {
    const catalog = getProblemCatalog();
    const threeVariableProblems = catalog.filter((problem) => problem.variables.length === 3);
    const vennSupportedThreeVariableProblems = threeVariableProblems.filter((problem) =>
      problem.supportedModes.includes('venn'),
    );

    expect(catalog.every((problem) => Array.isArray(problem.supportedModes) && problem.supportedModes.length > 0)).toBe(
      true,
    );
    expect(threeVariableProblems).toHaveLength(4);
    expect(vennSupportedThreeVariableProblems).toHaveLength(2);
    expect(catalog.some((problem) => problem.supportedModes.includes('truth-table'))).toBe(true);
    expect(catalog.some((problem) => problem.supportedModes.includes('venn'))).toBe(true);
  });

  it('filters without mutating the source catalog', () => {
    const sourceBefore = getProblemCatalog();
    const vennProblems = listProblems({ mode: 'venn' });

    expect(vennProblems.length).toBeGreaterThan(0);
    expect(vennProblems.every((problem) => problem.supportedModes.includes('venn'))).toBe(true);
    expect(vennProblems.every((problem, index) => problem.sequence === sourceBefore.filter((entry) => entry.supportedModes.includes('venn'))[index].sequence)).toBe(true);
    expect(vennProblems[0]).not.toBe(sourceBefore.find((problem) => problem.id === vennProblems[0].id));

    vennProblems[0].supportedModes.push('bogus');
    vennProblems[0].title = 'Changed title';

    const sourceAfter = getProblemById(vennProblems[0].id);
    expect(sourceAfter.supportedModes).not.toContain('bogus');
    expect(sourceAfter.title).not.toBe('Changed title');
  });

  it('rejects unsupported catalog filters', () => {
    expect(() => listProblems({ mode: 'canvas' })).toThrow(/Unsupported mode/);
    expect(() => listProblems({ difficulty: 'legendary' })).toThrow(/Unsupported difficulty/);
  });

  it('provides selectable problems by id', () => {
    const problem = getProblemById('tt-09-three-variable-venn');

    expect(problem).toMatchObject({
      id: 'tt-09-three-variable-venn',
      difficulty: 'hard',
      supportedModes: ['truth-table', 'venn'],
    });
    expect(isProblemSupported(problem, 'venn')).toBe(true);
    expect(isProblemSupported(problem, 'truth-table')).toBe(true);
  });
});
