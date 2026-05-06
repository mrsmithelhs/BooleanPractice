import { describe, expect, it } from 'vitest';
import {
  getProblemById,
  getProblemCatalog,
  isProblemSupported,
  listProblems,
  problemCatalog,
  validateProblemCatalog,
} from '@shared/index';

function getDifficultyCounts(catalog) {
  return catalog.reduce(
    (counts, problem) => {
      counts[problem.difficulty] += 1;
      return counts;
    },
    { easy: 0, medium: 0, hard: 0 },
  );
}

describe('problem catalog', () => {
  it('exposes a frozen, ordered source catalog with expanded variety', () => {
    expect(Object.isFrozen(problemCatalog)).toBe(true);
    expect(problemCatalog.length).toBeGreaterThan(20);
    expect(problemCatalog.map((problem) => problem.sequence)).toEqual(
      problemCatalog.map((_, index) => index + 1),
    );
  });

  it('validates all entries and keeps expressions parseable', () => {
    const validation = validateProblemCatalog();

    expect(validation).toHaveLength(problemCatalog.length);
    expect(validation.every((entry) => entry.valid)).toBe(true);
  });

  it('includes the required catalog metadata and balanced difficulty buckets', () => {
    const catalog = getProblemCatalog();
    const difficultyCounts = getDifficultyCounts(catalog);

    expect(catalog.every((problem) => Array.isArray(problem.supportedModes) && problem.supportedModes.length > 0)).toBe(
      true,
    );
    expect(catalog.every((problem) => Array.isArray(problem.conceptTags) && problem.conceptTags.length > 0)).toBe(
      true,
    );
    expect(catalog.every((problem) => Number.isInteger(problem.variableCount) && problem.variableCount === problem.variables.length)).toBe(
      true,
    );
    expect(catalog.every((problem) => Number.isInteger(problem.estimatedComplexity) && problem.estimatedComplexity >= 1 && problem.estimatedComplexity <= 5)).toBe(
      true,
    );
    expect(catalog.every((problem) => typeof problem.lawFamily === 'string' && problem.lawFamily.length > 0)).toBe(
      true,
    );
    expect(catalog.every((problem) => typeof problem.equivalenceReady === 'boolean')).toBe(true);
    expect(catalog.every((problem) => typeof problem.simplificationReady === 'boolean')).toBe(true);

    expect(difficultyCounts.easy).toBeGreaterThan(0);
    expect(difficultyCounts.medium).toBeGreaterThan(0);
    expect(difficultyCounts.hard).toBeGreaterThan(0);
  });

  it('includes literal-plus-variable expressions and three-variable venn-compatible problems', () => {
    const catalog = getProblemCatalog();
    const expressions = catalog.map((problem) => problem.expression);
    const requiredExpressions = ['a && true', 'b || false', '!(false || a)', 'a || true', 'c && false'];
    const threeVariableVennProblems = catalog.filter(
      (problem) => problem.variableCount === 3 && problem.supportedModes.includes('venn'),
    );

    for (const expression of requiredExpressions) {
      expect(expressions).toContain(expression);
    }

    expect(threeVariableVennProblems.length).toBeGreaterThanOrEqual(3);
    expect(
      threeVariableVennProblems.some(
        (problem) => problem.supportedModes.includes('truth-table') && problem.supportedModes.includes('venn'),
      ),
    ).toBe(true);
  });

  it('includes predicate atom problems with visible Java-style labels', () => {
    const predicateProblems = getProblemCatalog().filter((problem) => problem.predicateAtoms.length > 0);

    expect(predicateProblems.map((problem) => problem.id)).toEqual([
      'pa-25-score-and-count',
      'pa-26-string-and-loop',
      'pa-27-three-atom-guard',
    ]);
    expect(predicateProblems.every((problem) => problem.predicateAtoms.length === problem.variables.length)).toBe(
      true,
    );
    expect(predicateProblems[0].predicateAtoms[0]).toMatchObject({
      alias: 'P',
      predicate: 'score > 10',
    });
  });

  it('filters without mutating the source catalog', () => {
    const sourceBefore = getProblemCatalog();
    const vennProblems = listProblems({ mode: 'venn' });

    expect(vennProblems.length).toBeGreaterThan(0);
    expect(vennProblems.every((problem) => problem.supportedModes.includes('venn'))).toBe(true);
    expect(vennProblems.map((problem) => problem.sequence)).toEqual(
      sourceBefore.filter((entry) => entry.supportedModes.includes('venn')).map((entry) => entry.sequence),
    );
    expect(vennProblems[0]).not.toBe(sourceBefore.find((problem) => problem.id === vennProblems[0].id));

    vennProblems[0].supportedModes.push('bogus');
    vennProblems[0].title = 'Changed title';
    vennProblems[0].variables.push('z');

    const sourceAfter = getProblemById(vennProblems[0].id);
    expect(sourceAfter.supportedModes).not.toContain('bogus');
    expect(sourceAfter.title).not.toBe('Changed title');
    expect(sourceAfter.variables).not.toContain('z');
  });

  it('rejects unsupported catalog filters', () => {
    expect(() => listProblems({ mode: 'canvas' })).toThrow(/Unsupported mode/);
    expect(() => listProblems({ difficulty: 'legendary' })).toThrow(/Unsupported difficulty/);
  });

  it('provides selectable problems by id', () => {
    const problem = getProblemById('tt-20-xor-like');

    expect(problem).toMatchObject({
      id: 'tt-20-xor-like',
      difficulty: 'hard',
      supportedModes: ['truth-table', 'venn'],
      lawFamily: 'xor-like',
      variableCount: 2,
    });
    expect(isProblemSupported(problem, 'venn')).toBe(true);
    expect(isProblemSupported(problem, 'truth-table')).toBe(true);
  });
});
