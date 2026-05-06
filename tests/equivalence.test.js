import { describe, expect, it } from 'vitest';
import {
  buildEquivalenceProof,
  getEquivalenceChallengeById,
  getEquivalenceChallenges,
} from '@shared/index';

describe('equivalence challenges', () => {
  it('provides curated challenges across all difficulties', () => {
    expect(getEquivalenceChallenges()).toHaveLength(8);
    expect(getEquivalenceChallenges({ difficulty: 'easy' })).toHaveLength(2);
    expect(getEquivalenceChallenges({ difficulty: 'medium' })).toHaveLength(3);
    expect(getEquivalenceChallenges({ difficulty: 'hard' })).toHaveLength(3);
  });

  it('verifies equivalent challenge pairs across truth-table and venn proof modes', () => {
    const challenge = getEquivalenceChallengeById('eq-04-de-morgan');
    const truthTableProof = buildEquivalenceProof(challenge, 'truth-table').proof;
    const vennProof = buildEquivalenceProof(challenge, 'venn').proof;

    expect(truthTableProof.equivalent).toBe(true);
    expect(truthTableProof.firstDifference).toBeNull();
    expect(truthTableProof.rows).toHaveLength(4);

    expect(vennProof.equivalent).toBe(true);
    expect(vennProof.firstDifference).toBeNull();
    expect(vennProof.regions).toHaveLength(4);
  });

  it('identifies the first differing row and region for near-miss pairs', () => {
    const challenge = getEquivalenceChallengeById('eq-07-near-miss-and-or');
    const truthTableProof = buildEquivalenceProof(challenge, 'truth-table').proof;
    const vennProof = buildEquivalenceProof(challenge, 'venn').proof;

    expect(truthTableProof.equivalent).toBe(false);
    expect(truthTableProof.firstDifference).not.toBeNull();
    expect(truthTableProof.firstDifference.rowNumber).toBe(2);
    expect(truthTableProof.firstDifference.assignmentLabel).toBe('a=F, b=T');

    expect(vennProof.equivalent).toBe(false);
    expect(vennProof.firstDifference).not.toBeNull();
    expect(vennProof.firstDifference.id).toBe(truthTableProof.firstDifference.id);
  });
});
