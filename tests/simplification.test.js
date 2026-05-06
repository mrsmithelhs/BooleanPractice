import { describe, expect, it } from 'vitest';
import {
  buildSimplificationCheck,
  getSimplificationChallengeById,
  getSimplificationChallenges,
} from '@shared/index';

describe('simplification challenges', () => {
  it('provides curated simplification prompts across difficulty levels', () => {
    expect(getSimplificationChallenges()).toHaveLength(10);
    expect(getSimplificationChallenges({ difficulty: 'easy' }).length).toBeGreaterThan(0);
    expect(getSimplificationChallenges({ difficulty: 'medium' }).length).toBeGreaterThan(0);
    expect(getSimplificationChallenges({ difficulty: 'hard' }).length).toBeGreaterThan(0);
  });

  it('recognizes a shorter equivalent guess', () => {
    const challenge = getSimplificationChallengeById('tt-12-identity-and-true');
    const check = buildSimplificationCheck(challenge, 'a', 'truth-table');

    expect(check.proof.equivalent).toBe(true);
    expect(check.isSimpler).toBe(true);
    expect(check.guessNodeCount).toBeLessThan(check.originalNodeCount);
    expect(check.statusText).toContain('Equivalent and simpler');
  });

  it('recognizes an equivalent but longer guess', () => {
    const challenge = getSimplificationChallengeById('tt-17-absorption-or');
    const check = buildSimplificationCheck(challenge, 'a || (a && b && c)', 'venn');

    expect(check.proof.equivalent).toBe(true);
    expect(check.isSimpler).toBe(false);
    expect(check.guessNodeCount).toBeGreaterThan(check.originalNodeCount);
    expect(check.statusText).toContain('Equivalent, but not simpler');
  });

  it('shows a counterexample for a non-equivalent guess', () => {
    const challenge = getSimplificationChallengeById('tt-18-absorption-and');
    const check = buildSimplificationCheck(challenge, 'a || b', 'truth-table');

    expect(check.proof.equivalent).toBe(false);
    expect(check.proof.firstDifference).not.toBeNull();
    expect(check.statusText).toContain('Not equivalent');
  });
});
