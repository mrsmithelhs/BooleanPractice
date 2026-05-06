import { describe, expect, it } from 'vitest';
import { getProblemById } from '../src/catalog/index.js';
import { getEquivalenceChallengeById } from '../src/equivalence/index.js';
import { getSimplificationChallengeById } from '../src/simplification/index.js';
import {
  buildAdaptiveFeatureVector,
  buildAdaptiveFixturePool,
  buildCoverageCounts,
  scoreAdaptiveSimilarity,
  selectAdaptiveNextItem,
} from './helpers/adaptive-assignment.js';

describe('adaptive assignment design prototype', () => {
  it('builds feature vectors from shared challenge records', () => {
    const identity = buildAdaptiveFeatureVector(getProblemById('tt-12-identity-and-true'));
    const equivalence = buildAdaptiveFeatureVector(getEquivalenceChallengeById('eq-04-de-morgan'));
    const simplification = buildAdaptiveFeatureVector(getSimplificationChallengeById('tt-19-nested-constants'));

    expect(identity.kind).toBe('problem');
    expect(identity.variableCount).toBe(1);
    expect(identity.operatorCounts).toEqual({ not: 0, and: 1, or: 0 });
    expect(identity.truthDensity).toBe(0.5);

    expect(equivalence.kind).toBe('equivalence');
    expect(equivalence.pairedExpressionCount).toBe(2);
    expect(equivalence.modeSuitability.equivalence).toBe(true);
    expect(equivalence.conceptTags).toContain('de-morgan');

    expect(simplification.kind).toBe('simplification');
    expect(simplification.pairedExpressionCount).toBe(1);
    expect(simplification.modeSuitability.simplification).toBe(true);
    expect(simplification.lawFamily).toBe('negation');
  });

  it('prefers shared concept tags over superficial string similarity for a retry', () => {
    const current = buildAdaptiveFeatureVector(getProblemById('tt-12-identity-and-true'));
    const identityRetry = buildAdaptiveFeatureVector(getProblemById('tt-13-identity-or-false'));
    const stringSimilarButDifferentConcept = buildAdaptiveFeatureVector(
      getProblemById('tt-14-domination-or-true'),
    );

    expect(scoreAdaptiveSimilarity(current, identityRetry)).toBeGreaterThan(
      scoreAdaptiveSimilarity(current, stringSimilarButDifferentConcept),
    );

    const next = selectAdaptiveNextItem({
      pool: [
        getProblemById('tt-12-identity-and-true'),
        getProblemById('tt-13-identity-or-false'),
        getProblemById('tt-14-domination-or-true'),
      ],
      currentId: 'tt-12-identity-and-true',
      lastOutcome: { correct: false },
      retryCount: 0,
    });

    expect(next?.id).toBe('tt-13-identity-or-false');
  });

  it('switches to contrast coverage after the retry threshold', () => {
    const next = selectAdaptiveNextItem({
      pool: [
        getProblemById('tt-12-identity-and-true'),
        getProblemById('tt-13-identity-or-false'),
        getProblemById('tt-14-domination-or-true'),
        getProblemById('tt-17-absorption-or'),
        getProblemById('tt-20-xor-like'),
      ],
      currentId: 'tt-12-identity-and-true',
      lastOutcome: { correct: false },
      retryCount: 2,
      completedIds: new Set(['tt-13-identity-or-false', 'tt-14-domination-or-true']),
      coverageTargets: {
        absorption: 2,
        identity: 1,
        domination: 1,
        'xor-like': 1,
      },
    });

    expect(next?.id).toBe('tt-17-absorption-or');
  });

  it('counts concept coverage from completed items', () => {
    const coverageCounts = buildCoverageCounts(
      buildAdaptiveFixturePool().filter((item) => ['tt-12-identity-and-true', 'tt-17-absorption-or'].includes(item.id)),
    );

    expect(coverageCounts.get('identity')).toBe(1);
    expect(coverageCounts.get('absorption')).toBe(1);
    expect(coverageCounts.get('domination')).toBeUndefined();
  });
});

