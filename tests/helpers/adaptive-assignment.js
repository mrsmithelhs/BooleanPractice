import { getProblemById } from '../../src/catalog/index.js';
import { getEquivalenceChallengeById } from '../../src/equivalence/index.js';
import { parseBooleanExpression } from '../../src/parser/index.js';
import { getSimplificationChallengeById } from '../../src/simplification/index.js';
import { generateTruthTable } from '../../src/truth-table/index.js';

export const ADAPTIVE_RETRY_THRESHOLD = 2;

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) {
      deepFreeze(item);
    }
  }

  return value;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

function normalizeConceptTags(tags = []) {
  return uniqueSorted(tags.filter((tag) => typeof tag === 'string' && tag.length > 0));
}

function inferKind(source) {
  if (source?.leftExpression && source?.rightExpression) {
    return 'equivalence';
  }

  if (source?.originalExpression) {
    return 'simplification';
  }

  return 'problem';
}

function resolveAnchorExpression(source, kind) {
  if (kind === 'equivalence') {
    return source.leftExpression;
  }

  if (kind === 'simplification') {
    return source.originalExpression;
  }

  return source.expression;
}

function computeAstProfile(node) {
  const profile = {
    astDepth: 1,
    binaryNodeCount: 0,
    identifierCount: 0,
    literalCount: 0,
    operatorCounts: {
      not: 0,
      and: 0,
      or: 0,
    },
    unaryNodeCount: 0,
  };

  function visit(current, depth) {
    profile.astDepth = Math.max(profile.astDepth, depth);

    switch (current.type) {
      case 'Literal':
        profile.literalCount += 1;
        return;
      case 'Identifier':
        profile.identifierCount += 1;
        return;
      case 'UnaryExpression':
        profile.operatorCounts.not += 1;
        profile.unaryNodeCount += 1;
        visit(current.argument, depth + 1);
        return;
      case 'BinaryExpression':
        profile.binaryNodeCount += 1;
        if (current.operator === '&&') {
          profile.operatorCounts.and += 1;
        } else if (current.operator === '||') {
          profile.operatorCounts.or += 1;
        }
        visit(current.left, depth + 1);
        visit(current.right, depth + 1);
        return;
      default:
        throw new TypeError(`Unsupported AST node type: ${current.type}`);
    }
  }

  visit(node, 1);
  return profile;
}

function buildModeSuitability(source, kind) {
  const supportedModes = source.supportedModes ?? source.supportedProofModes ?? [];

  return {
    assignment: kind === 'problem',
    equivalence: kind === 'equivalence',
    simplification: kind === 'simplification',
    truthTable: supportedModes.includes('truth-table'),
    venn: supportedModes.includes('venn'),
  };
}

export function normalizeAdaptiveItem(source) {
  if (!source || typeof source !== 'object') {
    throw new TypeError('Adaptive assignment items must be objects.');
  }

  const kind = inferKind(source);
  const anchorExpression = resolveAnchorExpression(source, kind);

  if (typeof anchorExpression !== 'string' || anchorExpression.length === 0) {
    throw new Error('Adaptive assignment items must declare a usable boolean expression.');
  }

  const conceptTags = normalizeConceptTags(source.conceptTags);
  const variables = uniqueSorted(
    Array.isArray(source.variables)
      ? source.variables.filter((variable) => typeof variable === 'string' && variable.length > 0)
      : [],
  );
  const parsed = parseBooleanExpression(anchorExpression);
  const truthTable = generateTruthTable(parsed);
  const trueCount = truthTable.rows.filter((row) => row.result).length;
  const profile = computeAstProfile(parsed);

  return deepFreeze({
    id: source.id,
    kind,
    title: source.title ?? '',
    sequence: Number.isInteger(source.sequence) ? source.sequence : 0,
    difficulty: source.difficulty ?? 'easy',
    conceptTags,
    variables: variables.length > 0 ? variables : truthTable.variables,
    variableCount: truthTable.variables.length,
    anchorExpression,
    pairedExpressionCount: kind === 'equivalence' ? 2 : 1,
    lawFamily: source.lawFamily ?? 'unknown',
    estimatedComplexity: Number.isInteger(source.estimatedComplexity) ? source.estimatedComplexity : 1,
    misconceptionTarget: source.lawFamily ?? conceptTags[0] ?? 'unknown',
    modeSuitability: buildModeSuitability(source, kind),
    operatorCounts: profile.operatorCounts,
    astDepth: profile.astDepth,
    binaryNodeCount: profile.binaryNodeCount,
    unaryNodeCount: profile.unaryNodeCount,
    identifierCount: profile.identifierCount,
    literalCount: profile.literalCount,
    groupingDepth: Math.max(0, profile.astDepth - 1),
    truthDensity: truthTable.rows.length === 0 ? 0 : trueCount / truthTable.rows.length,
    ast: parsed,
  });
}

export function buildAdaptiveFeatureVector(source) {
  return normalizeAdaptiveItem(source);
}

export function buildAdaptiveFixturePool() {
  return [
    getProblemById('tt-12-identity-and-true'),
    getProblemById('tt-13-identity-or-false'),
    getProblemById('tt-14-domination-or-true'),
    getProblemById('tt-17-absorption-or'),
    getProblemById('tt-18-absorption-and'),
    getProblemById('tt-20-xor-like'),
    getProblemById('tt-21-three-variable-de-morgan'),
    getProblemById('tt-22-three-variable-distribution'),
    getEquivalenceChallengeById('eq-04-de-morgan'),
    getEquivalenceChallengeById('eq-05-absorption'),
    getEquivalenceChallengeById('eq-07-near-miss-and-or'),
    getSimplificationChallengeById('tt-19-nested-constants'),
  ]
    .filter(Boolean)
    .map(buildAdaptiveFeatureVector);
}

export function buildCoverageCounts(items) {
  const counts = new Map();
  for (const item of items) {
    for (const tag of item.conceptTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return counts;
}

function intersectionCount(left, right) {
  const rightTags = new Set(right);
  return left.reduce((count, tag) => count + (rightTags.has(tag) ? 1 : 0), 0);
}

function compareTieBreakers(left, right) {
  return left.sequence - right.sequence || left.id.localeCompare(right.id);
}

function scoreSimilarity(current, candidate) {
  const sharedTags = intersectionCount(current.conceptTags, candidate.conceptTags);
  const operatorDistance = Math.abs(current.operatorCounts.not - candidate.operatorCounts.not)
    + Math.abs(current.operatorCounts.and - candidate.operatorCounts.and)
    + Math.abs(current.operatorCounts.or - candidate.operatorCounts.or);
  const difficultyBonus = current.difficulty === candidate.difficulty ? 2 : 0;
  const sameLawFamilyBonus = current.lawFamily === candidate.lawFamily ? 5 : 0;
  const sameMisconceptionBonus = current.misconceptionTarget === candidate.misconceptionTarget ? 4 : 0;
  const sameModeCount = Object.entries(current.modeSuitability).reduce((count, [key, currentValue]) => {
    return count + (currentValue === candidate.modeSuitability[key] ? 1 : 0);
  }, 0);
  const variablePenalty = Math.abs(current.variableCount - candidate.variableCount) * 2;
  const complexityPenalty = Math.abs(current.estimatedComplexity - candidate.estimatedComplexity) * 1.5;
  const depthPenalty = Math.abs(current.astDepth - candidate.astDepth) * 0.75;
  const truthDensityPenalty = Math.abs(current.truthDensity - candidate.truthDensity) * 4;

  return (
    sharedTags * 10 +
    sameLawFamilyBonus +
    sameMisconceptionBonus +
    difficultyBonus +
    sameModeCount -
    operatorDistance -
    variablePenalty -
    complexityPenalty -
    depthPenalty -
    truthDensityPenalty
  );
}

export function scoreAdaptiveSimilarity(current, candidate) {
  return scoreSimilarity(current, candidate);
}

function scoreCoverage(candidate, coverageCounts, coverageTargets) {
  return candidate.conceptTags.reduce((score, tag) => {
    const target = coverageTargets[tag] ?? 0;
    const completed = coverageCounts.get(tag) ?? 0;
    return score + Math.max(0, target - completed);
  }, 0);
}

function pickBestCandidate(candidates, scorer, comparator = compareTieBreakers) {
  return [...candidates]
    .map((candidate) => ({
      candidate,
      score: scorer(candidate),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return comparator(left.candidate, right.candidate);
    })[0]?.candidate ?? null;
}

function pickSimilarRetry(current, candidates) {
  const sameConceptCandidates = candidates.filter(
    (candidate) => intersectionCount(current.conceptTags, candidate.conceptTags) > 0,
  );
  const searchSpace = sameConceptCandidates.length > 0 ? sameConceptCandidates : candidates;

  return pickBestCandidate(searchSpace, (candidate) => scoreSimilarity(current, candidate));
}

function pickContrastRetry(current, candidates, coverageCounts, coverageTargets) {
  const contrastCandidates = candidates.filter(
    (candidate) => intersectionCount(current.conceptTags, candidate.conceptTags) === 0,
  );
  const searchSpace = contrastCandidates.length > 0 ? contrastCandidates : candidates;

  return pickBestCandidate(searchSpace, (candidate) => {
    const coverageScore = scoreCoverage(candidate, coverageCounts, coverageTargets);
    const sharedPenalty = intersectionCount(current.conceptTags, candidate.conceptTags) * 8;
    const difficultyPenalty = Math.abs(current.difficulty === candidate.difficulty ? 0 : 1);
    const complexityPenalty = Math.abs(current.estimatedComplexity - candidate.estimatedComplexity);
    return coverageScore * 10 - sharedPenalty - difficultyPenalty - complexityPenalty;
  });
}

function pickCoverageRetry(current, candidates, coverageCounts, coverageTargets) {
  return pickBestCandidate(candidates, (candidate) => {
    const coverageScore = scoreCoverage(candidate, coverageCounts, coverageTargets);
    return coverageScore * 10 + scoreSimilarity(current, candidate);
  });
}

export function selectAdaptiveNextItem({
  pool = [],
  currentId = '',
  lastOutcome = null,
  retryCount = 0,
  retryThreshold = ADAPTIVE_RETRY_THRESHOLD,
  completedIds = new Set(),
  coverageTargets = {},
} = {}) {
  const normalizedPool = pool.map((item) => (item && item.anchorExpression ? item : buildAdaptiveFeatureVector(item)));
  const completedSet = completedIds instanceof Set ? completedIds : new Set(completedIds);
  const current = normalizedPool.find((item) => item.id === currentId) ?? null;
  const completedItems = normalizedPool.filter((item) => completedSet.has(item.id));
  const coverageCounts = buildCoverageCounts(completedItems);
  const availableCandidates = normalizedPool.filter((item) => !completedSet.has(item.id) && item.id !== currentId);

  if (availableCandidates.length === 0) {
    return null;
  }

  if (!current) {
    return pickCoverageRetry(
      availableCandidates[0],
      availableCandidates,
      coverageCounts,
      coverageTargets,
    );
  }

  if (lastOutcome?.correct === false && retryCount < retryThreshold) {
    return pickSimilarRetry(current, availableCandidates);
  }

  if (lastOutcome?.correct === false && retryCount >= retryThreshold) {
    return pickContrastRetry(current, availableCandidates, coverageCounts, coverageTargets);
  }

  return pickCoverageRetry(current, availableCandidates, coverageCounts, coverageTargets);
}
