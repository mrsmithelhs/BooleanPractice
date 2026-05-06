import { collectBooleanVariables, formatBooleanExpression, parseBooleanExpression } from '../parser/index.js';
import { evaluateBooleanAst } from '../evaluator/index.js';

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_PROOF_MODES = ['truth-table', 'venn'];

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
    supportedProofModes: [...challenge.supportedProofModes],
    supportedModes: [...challenge.supportedModes],
    variables: [...challenge.variables],
    hints: [...challenge.hints],
  };
}

function buildAssignments(variables) {
  const totalRows = 2 ** variables.length;
  return Array.from({ length: totalRows }, (_, rowIndex) => {
    const assignment = {};
    variables.forEach((variable, variableIndex) => {
      const bit = variables.length - variableIndex - 1;
      assignment[variable] = Boolean(rowIndex & (1 << bit));
    });
    return assignment;
  });
}

function assignmentToBits(assignment, variables) {
  return variables.map((variable) => (assignment[variable] ? '1' : '0')).join('');
}

function assignmentToLabel(assignment, variables) {
  return variables.map((variable) => `${variable}=${assignment[variable] ? 'T' : 'F'}`).join(', ');
}

function assignmentToAccessibleLabel(assignment, variables) {
  return variables.map((variable) => `${variable} ${assignment[variable] ? 'true' : 'false'}`).join(', ');
}

function resolveAstSource(nodeOrSource) {
  return typeof nodeOrSource === 'string' ? parseBooleanExpression(nodeOrSource) : nodeOrSource;
}

function createChallenge(challenge) {
  if (typeof challenge.id !== 'string' || challenge.id.length === 0) {
    throw new Error('Equivalence challenges must declare an id.');
  }

  if (!Number.isInteger(challenge.sequence) || challenge.sequence < 1) {
    throw new Error(`Challenge ${challenge.id} has an invalid sequence value.`);
  }

  if (typeof challenge.equivalent !== 'boolean') {
    throw new Error(`Challenge ${challenge.id} must declare whether the pair is equivalent.`);
  }

  if (!VALID_DIFFICULTIES.includes(challenge.difficulty)) {
    throw new Error(`Challenge ${challenge.id} has unsupported difficulty metadata.`);
  }

  if (!Array.isArray(challenge.supportedProofModes) || challenge.supportedProofModes.length === 0) {
    throw new Error(`Challenge ${challenge.id} must declare supported proof modes.`);
  }

  if (!challenge.supportedProofModes.every((mode) => VALID_PROOF_MODES.includes(mode))) {
    throw new Error(`Challenge ${challenge.id} has unsupported proof mode metadata.`);
  }

  if (!Array.isArray(challenge.conceptTags) || challenge.conceptTags.length === 0) {
    throw new Error(`Challenge ${challenge.id} must declare at least one concept tag.`);
  }

  if (!Array.isArray(challenge.hints) || challenge.hints.length === 0) {
    throw new Error(`Challenge ${challenge.id} must declare at least one hint.`);
  }

  if (typeof challenge.lawFamily !== 'string' || challenge.lawFamily.length === 0) {
    throw new Error(`Challenge ${challenge.id} must declare a law family.`);
  }

  if (
    !Number.isInteger(challenge.estimatedComplexity) ||
    challenge.estimatedComplexity < 1 ||
    challenge.estimatedComplexity > 5
  ) {
    throw new Error(`Challenge ${challenge.id} has invalid estimated complexity metadata.`);
  }

  const leftAst = parseBooleanExpression(challenge.leftExpression);
  const rightAst = parseBooleanExpression(challenge.rightExpression);
  const leftVariables = collectBooleanVariables(leftAst);
  const rightVariables = collectBooleanVariables(rightAst);
  const variables = [...new Set([...leftVariables, ...rightVariables])].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );

  if (variables.length < 1 || variables.length > 3) {
    throw new Error(`Challenge ${challenge.id} must use one to three variables.`);
  }

  const assignments = buildAssignments(variables);
  const counterexamples = assignments.filter((assignment) => {
    const leftResult = evaluateBooleanAst(leftAst, assignment);
    const rightResult = evaluateBooleanAst(rightAst, assignment);
    return leftResult !== rightResult;
  });

  if (challenge.equivalent && counterexamples.length > 0) {
    throw new Error(`Challenge ${challenge.id} is marked equivalent but fails truth-table verification.`);
  }

  if (!challenge.equivalent && counterexamples.length === 0) {
    throw new Error(`Challenge ${challenge.id} is marked non-equivalent but has no counterexample.`);
  }

  const expression = `${formatBooleanExpression(leftAst)} ≡ ${formatBooleanExpression(rightAst)}`;

  return deepFreeze({
    ...challenge,
    expression,
    leftAst,
    rightAst,
    supportedModes: [...challenge.supportedProofModes],
    variableCount: variables.length,
    lawFamily: challenge.lawFamily,
    estimatedComplexity: challenge.estimatedComplexity,
    equivalenceReady: true,
    simplificationReady: false,
    variables,
  });
}

const RAW_EQUIVALENCE_CHALLENGES = [
  {
    id: 'eq-01-identity-left',
    sequence: 1,
    title: 'Identity Pair: A && true',
    difficulty: 'easy',
    equivalent: true,
    lawFamily: 'identity',
    estimatedComplexity: 1,
    leftExpression: 'a && true',
    rightExpression: 'a',
    conceptTags: ['equivalence', 'identity', 'constants'],
    supportedProofModes: ['truth-table', 'venn'],
    hints: ['AND with true keeps the original value.', 'Check whether either side can change the result.'],
  },
  {
    id: 'eq-02-identity-right',
    sequence: 2,
    title: 'Identity Pair: B || false',
    difficulty: 'easy',
    equivalent: true,
    lawFamily: 'identity',
    estimatedComplexity: 1,
    leftExpression: 'b || false',
    rightExpression: 'b',
    conceptTags: ['equivalence', 'identity', 'constants'],
    supportedProofModes: ['truth-table', 'venn'],
    hints: ['OR with false keeps the original value.', 'The extra constant should not add any new true rows.'],
  },
  {
    id: 'eq-03-double-negation',
    sequence: 3,
    title: 'Double Negation',
    difficulty: 'medium',
    equivalent: true,
    lawFamily: 'double-negation',
    estimatedComplexity: 2,
    leftExpression: '!!a',
    rightExpression: 'a',
    conceptTags: ['equivalence', 'double-negation', 'negation'],
    supportedProofModes: ['truth-table', 'venn'],
    hints: ['A double negation returns the original value.', 'Work from the inside out.'],
  },
  {
    id: 'eq-04-de-morgan',
    sequence: 4,
    title: 'De Morgan Pair',
    difficulty: 'medium',
    equivalent: true,
    lawFamily: 'de-morgan',
    estimatedComplexity: 3,
    leftExpression: '!(a && b)',
    rightExpression: '!a || !b',
    conceptTags: ['equivalence', 'de-morgan', 'negation'],
    supportedProofModes: ['truth-table', 'venn'],
    hints: ['A negated AND becomes a case where at least one part is false.', 'Check the rows where both inputs are true.'],
  },
  {
    id: 'eq-05-absorption',
    sequence: 5,
    title: 'Absorption Pair',
    difficulty: 'medium',
    equivalent: true,
    lawFamily: 'absorption',
    estimatedComplexity: 3,
    leftExpression: 'a || (a && b)',
    rightExpression: 'a',
    conceptTags: ['equivalence', 'absorption', 'redundancy'],
    supportedProofModes: ['truth-table', 'venn'],
    hints: ['The shared a makes the extra term redundant.', 'Ask whether the second term can add a new true case.'],
  },
  {
    id: 'eq-06-distribution',
    sequence: 6,
    title: 'Distribution Pair',
    difficulty: 'hard',
    equivalent: true,
    lawFamily: 'distribution',
    estimatedComplexity: 4,
    leftExpression: 'a && (b || c)',
    rightExpression: '(a && b) || (a && c)',
    conceptTags: ['equivalence', 'distribution', 'three-variable'],
    supportedProofModes: ['truth-table', 'venn'],
    hints: ['The outer a must still be true in both forms.', 'Compare the rows where b or c makes the inner expression true.'],
  },
  {
    id: 'eq-07-near-miss-and-or',
    sequence: 7,
    title: 'Near Miss: AND vs OR',
    difficulty: 'hard',
    equivalent: false,
    lawFamily: 'near-miss',
    estimatedComplexity: 4,
    leftExpression: 'a && b',
    rightExpression: 'a || b',
    conceptTags: ['equivalence', 'near-miss', 'and', 'or'],
    supportedProofModes: ['truth-table', 'venn'],
    hints: ['These expressions look similar but they do not accept the same rows.', 'Look for a row where only one variable is true.'],
  },
  {
    id: 'eq-08-near-miss-negation',
    sequence: 8,
    title: 'Near Miss: Negation Pair',
    difficulty: 'hard',
    equivalent: false,
    lawFamily: 'near-miss',
    estimatedComplexity: 4,
    leftExpression: '!(a || b)',
    rightExpression: '!a && b',
    conceptTags: ['equivalence', 'near-miss', 'de-morgan'],
    supportedProofModes: ['truth-table', 'venn'],
    hints: ['The structures are similar, but the second side keeps b instead of negating it.', 'Check the rows where b is true.'],
  },
];

const EQUIVALENCE_CHALLENGES = RAW_EQUIVALENCE_CHALLENGES.map(createChallenge);

deepFreeze(EQUIVALENCE_CHALLENGES);

export const equivalenceChallenges = EQUIVALENCE_CHALLENGES;

export function getEquivalenceChallenges({ difficulty } = {}) {
  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
    throw new RangeError(`Unsupported difficulty "${difficulty}".`);
  }

  return EQUIVALENCE_CHALLENGES.filter((challenge) => {
    if (difficulty && challenge.difficulty !== difficulty) {
      return false;
    }

    return true;
  })
    .sort((left, right) => left.sequence - right.sequence)
    .map(cloneChallenge);
}

export function getEquivalenceChallengeById(id) {
  const challenge = EQUIVALENCE_CHALLENGES.find((entry) => entry.id === id);
  return challenge ? cloneChallenge(challenge) : null;
}

export function buildExpressionComparisonProof(leftSource, rightSource, proofMode = 'truth-table') {
  const leftAst = resolveAstSource(leftSource);
  const rightAst = resolveAstSource(rightSource);
  const leftVariables = collectBooleanVariables(leftAst);
  const rightVariables = collectBooleanVariables(rightAst);
  const variables = [...new Set([...leftVariables, ...rightVariables])].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );

  if (variables.length < 1 || variables.length > 3) {
    throw new RangeError('Expression comparison supports one to three variables.');
  }

  if (proofMode === 'truth-table') {
    const rows = buildAssignments(variables).map((assignment, rowIndex) => {
      const leftResult = evaluateBooleanAst(leftAst, assignment);
      const rightResult = evaluateBooleanAst(rightAst, assignment);

      return {
        id: parseInt(assignmentToBits(assignment, variables), 2),
        rowNumber: rowIndex + 1,
        assignment,
        assignmentBits: assignmentToBits(assignment, variables),
        assignmentLabel: assignmentToLabel(assignment, variables),
        assignmentAccessibleLabel: assignmentToAccessibleLabel(assignment, variables),
        leftResult,
        rightResult,
        matches: leftResult === rightResult,
      };
    });

    const firstDifference = rows.find((row) => !row.matches) ?? null;

    return {
      mode: 'truth-table',
      variables,
      rows,
      equivalent: firstDifference === null,
      firstDifference,
    };
  }

  if (proofMode === 'venn') {
    const regions = buildAssignments(variables).map((assignment) => {
      const leftResult = evaluateBooleanAst(leftAst, assignment);
      const rightResult = evaluateBooleanAst(rightAst, assignment);

      return {
        id: parseInt(assignmentToBits(assignment, variables), 2),
        bits: assignmentToBits(assignment, variables),
        assignment,
        label: assignmentToLabel(assignment, variables),
        accessibleLabel: assignmentToAccessibleLabel(assignment, variables),
        leftResult,
        rightResult,
        matches: leftResult === rightResult,
      };
    });

    const firstDifference = regions.find((region) => !region.matches) ?? null;

    return {
      mode: 'venn',
      variables,
      regions,
      equivalent: firstDifference === null,
      firstDifference,
    };
  }

  throw new RangeError(`Unsupported proof mode "${proofMode}".`);
}

export function buildEquivalenceProof(challenge, proofMode = 'truth-table') {
  const resolvedChallenge =
    typeof challenge === 'string' ? getEquivalenceChallengeById(challenge) : cloneChallenge(challenge);

  if (!resolvedChallenge) {
    throw new ReferenceError('Unknown equivalence challenge.');
  }

  if (!resolvedChallenge.supportedProofModes.includes(proofMode)) {
    throw new RangeError(`Unsupported proof mode "${proofMode}" for challenge "${resolvedChallenge.id}".`);
  }

  if (proofMode === 'truth-table') {
    return {
      ...resolvedChallenge,
      proof: buildExpressionComparisonProof(
        resolvedChallenge.leftAst,
        resolvedChallenge.rightAst,
        proofMode,
      ),
    };
  }

  return {
    ...resolvedChallenge,
    proof: buildExpressionComparisonProof(
      resolvedChallenge.leftAst,
      resolvedChallenge.rightAst,
      proofMode,
    ),
  };
}
