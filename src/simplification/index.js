import { parseBooleanExpression } from '../parser/index.js';
import { buildExpressionComparisonProof } from '../equivalence/index.js';
import { listSimplificationProblems } from '../catalog/index.js';

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) {
      deepFreeze(item);
    }
  }

  return value;
}

function cloneChallenge(challenge) {
  return {
    ...challenge,
    conceptTags: [...challenge.conceptTags],
    hints: [...challenge.hints],
  };
}

function countAstNodes(node) {
  switch (node.type) {
    case 'Literal':
    case 'Identifier':
      return 1;
    case 'UnaryExpression':
      return 1 + countAstNodes(node.argument);
    case 'BinaryExpression':
      return 1 + countAstNodes(node.left) + countAstNodes(node.right);
    default:
      throw new TypeError(`Unsupported AST node type: ${node.type}`);
  }
}

export function formatNodeCountLabel(count) {
  return count === 1 ? '1 node' : `${count} nodes`;
}

function formatComparisonText(comparison) {
  if (!comparison.equivalent) {
    if (comparison.mode === 'truth-table') {
      const row = comparison.firstDifference;
      return `Not equivalent. First difference is row ${row.rowNumber} (${row.assignmentLabel}).`;
    }

    const region = comparison.firstDifference;
    return `Not equivalent. First difference is region ${region.bits} (${region.label}).`;
  }

  return 'Equivalent.';
}

function buildChallenge(challenge) {
  const ast = parseBooleanExpression(challenge.expression);
  const nodeCount = countAstNodes(ast);

  return deepFreeze({
    ...challenge,
    ast,
    nodeCount,
    simplificationReady: true,
    originalExpression: challenge.expression,
    originalNodeCount: nodeCount,
  });
}

const RAW_SIMPLIFICATION_CHALLENGE_IDS = [
  'tt-12-identity-and-true',
  'tt-13-identity-or-false',
  'tt-14-domination-or-true',
  'tt-15-domination-and-false',
  'tt-16-double-negation',
  'tt-17-absorption-or',
  'tt-18-absorption-and',
  'tt-19-nested-constants',
  'tt-20-xor-like',
  'tt-21-three-variable-de-morgan',
  'tt-22-three-variable-distribution',
];

const SIMPLIFICATION_CHALLENGES = listSimplificationProblems().filter((problem) =>
  RAW_SIMPLIFICATION_CHALLENGE_IDS.includes(problem.id),
).map(buildChallenge);

deepFreeze(SIMPLIFICATION_CHALLENGES);

export const simplificationChallenges = SIMPLIFICATION_CHALLENGES;

export function getSimplificationChallenges({ difficulty } = {}) {
  const source = difficulty
    ? SIMPLIFICATION_CHALLENGES.filter((challenge) => challenge.difficulty === difficulty)
    : SIMPLIFICATION_CHALLENGES;

  return source.slice().sort((left, right) => left.sequence - right.sequence).map(cloneChallenge);
}

export function getSimplificationChallengeById(id) {
  const challenge = SIMPLIFICATION_CHALLENGES.find((entry) => entry.id === id);
  return challenge ? cloneChallenge(challenge) : null;
}

export function buildSimplificationCheck(challenge, guessSource, proofMode = 'truth-table') {
  const resolvedChallenge =
    typeof challenge === 'string' ? getSimplificationChallengeById(challenge) : cloneChallenge(challenge);

  if (!resolvedChallenge) {
    throw new ReferenceError('Unknown simplification challenge.');
  }

  const guessAst = parseBooleanExpression(guessSource);
  const guessNodeCount = countAstNodes(guessAst);
  const proof = buildExpressionComparisonProof(
    resolvedChallenge.originalExpression,
    guessSource,
    proofMode,
  );

  const isSimpler = guessNodeCount < resolvedChallenge.originalNodeCount;
  const statusText = proof.equivalent
    ? isSimpler
      ? `Equivalent and simpler by this metric (${formatNodeCountLabel(guessNodeCount)} vs ${formatNodeCountLabel(resolvedChallenge.originalNodeCount)}).`
      : `Equivalent, but not simpler by this metric (${formatNodeCountLabel(guessNodeCount)} vs ${formatNodeCountLabel(resolvedChallenge.originalNodeCount)}).`
    : formatComparisonText(proof);

  return {
    challenge: resolvedChallenge,
    guessSource,
    guessAst,
    guessNodeCount,
    originalNodeCount: resolvedChallenge.originalNodeCount,
    isSimpler,
    proof,
    statusText,
  };
}
