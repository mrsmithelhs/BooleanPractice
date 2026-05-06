import { collectBooleanVariables, parseBooleanExpression } from '../parser/index.js';
import {
  normalizePredicateAtoms,
} from '../predicate-atoms/index.js';

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_MODES = ['truth-table', 'venn'];
const VALID_LAW_FAMILIES = [
  'absorption',
  'constant',
  'de-morgan',
  'distribution',
  'double-negation',
  'domination',
  'equivalence',
  'identity',
  'literal',
  'negation',
  'or',
  'and',
  'distribution',
  'precedence',
  'predicate-atoms',
  'redundancy',
  'three-variable',
  'xor-like',
];

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) {
      deepFreeze(item);
    }
  }

  return value;
}

function cloneProblem(problem) {
  return {
    ...problem,
    conceptTags: [...problem.conceptTags],
    supportedModes: [...problem.supportedModes],
    variables: [...problem.variables],
    hints: [...problem.hints],
    predicateAtoms: [...(problem.predicateAtoms ?? [])],
  };
}

function createProblem(problem) {
  if (typeof problem.id !== 'string' || problem.id.length === 0) {
    throw new Error('Problem catalog entries must declare an id.');
  }

  if (!Number.isInteger(problem.sequence) || problem.sequence < 1) {
    throw new Error(`Problem ${problem.id} has an invalid sequence value.`);
  }

  const parsed = parseBooleanExpression(problem.expression);
  const parsedVariables = collectBooleanVariables(parsed);

  if (!problem.supportedModes.every((mode) => VALID_MODES.includes(mode))) {
    throw new Error(`Problem ${problem.id} has unsupported mode metadata.`);
  }

  if (!VALID_DIFFICULTIES.includes(problem.difficulty)) {
    throw new Error(`Problem ${problem.id} has unsupported difficulty metadata.`);
  }

  if (!VALID_LAW_FAMILIES.includes(problem.lawFamily)) {
    throw new Error(`Problem ${problem.id} has unsupported law family metadata.`);
  }

  if (!Number.isInteger(problem.variableCount) || problem.variableCount < 1) {
    throw new Error(`Problem ${problem.id} has invalid variable count metadata.`);
  }

  if (!Array.isArray(problem.variables) || problem.variables.length === 0) {
    throw new Error(`Problem ${problem.id} must declare variables.`);
  }

  if (parsedVariables.join(',') !== problem.variables.join(',')) {
    throw new Error(`Problem ${problem.id} has variable metadata that does not match the parsed expression.`);
  }

  if (problem.variableCount !== problem.variables.length) {
    throw new Error(`Problem ${problem.id} has a variable count that does not match its variables.`);
  }

  if (!Number.isInteger(problem.estimatedComplexity) || problem.estimatedComplexity < 1 || problem.estimatedComplexity > 5) {
    throw new Error(`Problem ${problem.id} has invalid estimated complexity metadata.`);
  }

  if (typeof problem.equivalenceReady !== 'boolean' || typeof problem.simplificationReady !== 'boolean') {
    throw new Error(`Problem ${problem.id} must declare equivalence and simplification suitability.`);
  }

  if (!Array.isArray(problem.conceptTags) || problem.conceptTags.length === 0) {
    throw new Error(`Problem ${problem.id} must declare at least one concept tag.`);
  }

  if (!Array.isArray(problem.hints) || problem.hints.length === 0) {
    throw new Error(`Problem ${problem.id} must declare at least one hint.`);
  }

  const predicateAtoms = normalizePredicateAtoms(problem.predicateAtoms, parsedVariables);

  return deepFreeze({
    ...problem,
    ast: parsed,
    variables: parsedVariables,
    predicateAtoms,
  });
}

const RAW_PROBLEM_CATALOG = [
  {
    id: 'tt-01-literal-a',
    sequence: 1,
    title: 'Literal Practice: A',
    expression: 'a',
    difficulty: 'easy',
    conceptTags: ['literals'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a'],
    variableCount: 1,
    lawFamily: 'literal',
    estimatedComplexity: 1,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Start with the value of a itself.', 'There is no operator to combine yet.'],
  },
  {
    id: 'tt-02-negation-a',
    sequence: 2,
    title: 'Negation Practice: !A',
    expression: '!a',
    difficulty: 'easy',
    conceptTags: ['single-operator', 'negation'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a'],
    variableCount: 1,
    lawFamily: 'negation',
    estimatedComplexity: 1,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Negation flips the value of a.', 'Read !a as "not a".'],
  },
  {
    id: 'tt-03-and-a-b',
    sequence: 3,
    title: 'AND Practice: A && B',
    expression: 'a && b',
    difficulty: 'easy',
    conceptTags: ['single-operator', 'and'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b'],
    variableCount: 2,
    lawFamily: 'and',
    estimatedComplexity: 2,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Both parts must be true for the whole expression to be true.', 'Check each row against both variables.'],
  },
  {
    id: 'tt-04-or-a-b',
    sequence: 4,
    title: 'OR Practice: A || B',
    expression: 'a || b',
    difficulty: 'easy',
    conceptTags: ['single-operator', 'or'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b'],
    variableCount: 2,
    lawFamily: 'or',
    estimatedComplexity: 2,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Either part can make the expression true.', 'Compare rows where one side is true and the other is false.'],
  },
  {
    id: 'tt-05-precedence',
    sequence: 5,
    title: 'Precedence: !, &&, then ||',
    expression: '!a && b || c',
    difficulty: 'medium',
    conceptTags: ['precedence', 'negation'],
    supportedModes: ['truth-table'],
    variables: ['a', 'b', 'c'],
    variableCount: 3,
    lawFamily: 'precedence',
    estimatedComplexity: 3,
    equivalenceReady: false,
    simplificationReady: false,
    hints: ['Negation happens first.', 'Then evaluate AND before OR.', 'Parentheses would change the grouping.'],
  },
  {
    id: 'tt-06-parentheses',
    sequence: 6,
    title: 'Parentheses Practice',
    expression: '!(a || b)',
    difficulty: 'medium',
    conceptTags: ['parentheses', 'negation'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b'],
    variableCount: 2,
    lawFamily: 'de-morgan',
    estimatedComplexity: 2,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Evaluate the parentheses before applying ! to the result.', 'This is a De Morgan setup for OR.'],
  },
  {
    id: 'tt-07-de-morgan',
    sequence: 7,
    title: 'De Morgan: !(A && B)',
    expression: '!(a && b)',
    difficulty: 'medium',
    conceptTags: ['de-morgan', 'negation', 'equivalence'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b'],
    variableCount: 2,
    lawFamily: 'de-morgan',
    estimatedComplexity: 3,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['A negated AND becomes a case where not both are true.', 'Look for the region where at least one part fails.'],
  },
  {
    id: 'tt-08-equivalence',
    sequence: 8,
    title: 'Equivalence Pattern',
    expression: '(a && b) || (a && !b)',
    difficulty: 'medium',
    conceptTags: ['equivalence', 'factoring'],
    supportedModes: ['truth-table'],
    variables: ['a', 'b'],
    variableCount: 2,
    lawFamily: 'equivalence',
    estimatedComplexity: 3,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Factor out the shared part mentally.', 'Ask which variable values still matter after the shared part is true.'],
  },
  {
    id: 'tt-09-three-variable-venn',
    sequence: 9,
    title: 'Three-Variable Venn Practice',
    expression: '(a && b) || c',
    difficulty: 'hard',
    conceptTags: ['three-variable', 'venn'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b', 'c'],
    variableCount: 3,
    lawFamily: 'three-variable',
    estimatedComplexity: 4,
    equivalenceReady: false,
    simplificationReady: true,
    hints: ['Start with the simpler c regions, then check the overlapping a/b regions.', 'This is a three-variable example on purpose.'],
  },
  {
    id: 'tt-10-three-variable-precedence',
    sequence: 10,
    title: 'Three-Variable Precedence',
    expression: 'a && !b || c',
    difficulty: 'hard',
    conceptTags: ['three-variable', 'precedence'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b', 'c'],
    variableCount: 3,
    lawFamily: 'precedence',
    estimatedComplexity: 4,
    equivalenceReady: false,
    simplificationReady: false,
    hints: ['Check ! before && before ||.', 'Use the truth table to verify the implied grouping.'],
  },
  {
    id: 'tt-11-de-morgan-three',
    sequence: 11,
    title: 'De Morgan with Three Variables',
    expression: '!(a || b) && c',
    difficulty: 'hard',
    conceptTags: ['de-morgan', 'three-variable'],
    supportedModes: ['truth-table'],
    variables: ['a', 'b', 'c'],
    variableCount: 3,
    lawFamily: 'de-morgan',
    estimatedComplexity: 4,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Negate the grouped OR first.', 'Then combine the result with c.'],
  },
  {
    id: 'tt-12-identity-and-true',
    sequence: 12,
    title: 'Identity: A && true',
    expression: 'a && true',
    difficulty: 'easy',
    conceptTags: ['identity', 'and', 'constants'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a'],
    variableCount: 1,
    lawFamily: 'identity',
    estimatedComplexity: 1,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['AND with true keeps the original value.', 'This shows the identity law for conjunction.'],
  },
  {
    id: 'tt-13-identity-or-false',
    sequence: 13,
    title: 'Identity: B || false',
    expression: 'b || false',
    difficulty: 'easy',
    conceptTags: ['identity', 'or', 'constants'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['b'],
    variableCount: 1,
    lawFamily: 'identity',
    estimatedComplexity: 1,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['OR with false keeps the original value.', 'This is the identity law for disjunction.'],
  },
  {
    id: 'tt-14-domination-or-true',
    sequence: 14,
    title: 'Domination: A || true',
    expression: 'a || true',
    difficulty: 'easy',
    conceptTags: ['domination', 'or', 'constants'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a'],
    variableCount: 1,
    lawFamily: 'domination',
    estimatedComplexity: 1,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['OR with true always becomes true.', 'This is the domination law for OR.'],
  },
  {
    id: 'tt-15-domination-and-false',
    sequence: 15,
    title: 'Domination: C && false',
    expression: 'c && false',
    difficulty: 'easy',
    conceptTags: ['domination', 'and', 'constants'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['c'],
    variableCount: 1,
    lawFamily: 'domination',
    estimatedComplexity: 1,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['AND with false always becomes false.', 'This is the domination law for AND.'],
  },
  {
    id: 'tt-16-double-negation',
    sequence: 16,
    title: 'Double Negation',
    expression: '!!a',
    difficulty: 'medium',
    conceptTags: ['double-negation', 'negation'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a'],
    variableCount: 1,
    lawFamily: 'double-negation',
    estimatedComplexity: 2,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['A double negation returns the original value.', 'Work from the inside out.'],
  },
  {
    id: 'tt-17-absorption-or',
    sequence: 17,
    title: 'Absorption: A || (A && B)',
    expression: 'a || (a && b)',
    difficulty: 'medium',
    conceptTags: ['absorption', 'redundancy', 'or'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b'],
    variableCount: 2,
    lawFamily: 'absorption',
    estimatedComplexity: 3,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['The shared a makes the extra part redundant.', 'Check whether the second term can add any new true rows.'],
  },
  {
    id: 'tt-18-absorption-and',
    sequence: 18,
    title: 'Absorption: A && (A || B)',
    expression: 'a && (a || b)',
    difficulty: 'medium',
    conceptTags: ['absorption', 'redundancy', 'and'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b'],
    variableCount: 2,
    lawFamily: 'absorption',
    estimatedComplexity: 3,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['The outer a already controls the result.', 'Look for rows where the inner OR cannot change the answer.'],
  },
  {
    id: 'tt-19-nested-constants',
    sequence: 19,
    title: 'Nested Constants: !(false || A)',
    expression: '!(false || a)',
    difficulty: 'medium',
    conceptTags: ['negation', 'constants', 'parentheses'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a'],
    variableCount: 1,
    lawFamily: 'negation',
    estimatedComplexity: 2,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Start with the parentheses, then negate the result.', 'false || a collapses to a before the ! applies.'],
  },
  {
    id: 'tt-20-xor-like',
    sequence: 20,
    title: 'XOR-Like Pattern',
    expression: '(a && !b) || (!a && b)',
    difficulty: 'hard',
    conceptTags: ['xor-like', 'equivalence', 'negation'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b'],
    variableCount: 2,
    lawFamily: 'xor-like',
    estimatedComplexity: 4,
    equivalenceReady: true,
    simplificationReady: false,
    hints: ['One side should be true while the other is false.', 'This pattern highlights exclusive choice.'],
  },
  {
    id: 'tt-21-three-variable-de-morgan',
    sequence: 21,
    title: 'Three-Variable De Morgan',
    expression: '!(a && b) || c',
    difficulty: 'hard',
    conceptTags: ['de-morgan', 'three-variable', 'precedence'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b', 'c'],
    variableCount: 3,
    lawFamily: 'de-morgan',
    estimatedComplexity: 4,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Handle the negated AND before combining with c.', 'This mixes two-variable logic with a third escape hatch.'],
  },
  {
    id: 'tt-22-three-variable-distribution',
    sequence: 22,
    title: 'Three-Variable Distribution',
    expression: 'a && (b || c)',
    difficulty: 'hard',
    conceptTags: ['distribution', 'three-variable', 'and'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b', 'c'],
    variableCount: 3,
    lawFamily: 'distribution',
    estimatedComplexity: 4,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['The outer a must still be true.', 'Then either b or c can satisfy the inner OR.'],
  },
  {
    id: 'tt-23-three-variable-double-negation',
    sequence: 23,
    title: 'Three-Variable Negation Mix',
    expression: '!(a && b) && !(a && c)',
    difficulty: 'hard',
    conceptTags: ['de-morgan', 'three-variable', 'redundancy'],
    supportedModes: ['truth-table'],
    variables: ['a', 'b', 'c'],
    variableCount: 3,
    lawFamily: 'de-morgan',
    estimatedComplexity: 5,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Each negated conjunction has to be checked separately.', 'Look for rows where both subexpressions can stay true.'],
  },
  {
    id: 'tt-24-three-variable-distribution-two',
    sequence: 24,
    title: 'Three-Variable Distribution II',
    expression: '((a || b) && (!a || c))',
    difficulty: 'hard',
    conceptTags: ['distribution', 'three-variable', 'precedence'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b', 'c'],
    variableCount: 3,
    lawFamily: 'distribution',
    estimatedComplexity: 5,
    equivalenceReady: true,
    simplificationReady: true,
    hints: ['Check each parenthesized clause separately.', 'This expression rewards careful grouping.'],
  },
  {
    id: 'pa-25-score-and-count',
    sequence: 25,
    title: 'Predicate Atom Pair: Score and Count',
    expression: 'p && q',
    difficulty: 'medium',
    conceptTags: ['predicate-atoms', 'conditionals', 'loops'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['p', 'q'],
    variableCount: 2,
    lawFamily: 'predicate-atoms',
    estimatedComplexity: 2,
    equivalenceReady: true,
    simplificationReady: true,
    predicateAtoms: [
      {
        variable: 'p',
        alias: 'P',
        predicate: 'score > 10',
        description: 'The score passes the AP CSA threshold.',
      },
      {
        variable: 'q',
        alias: 'Q',
        predicate: 'count == 0',
        description: 'The loop counter has reached zero.',
      },
    ],
    hints: ['Use the predicate legend instead of hiding the meaning behind plain letters.', 'Both atoms must be true here.'],
  },
  {
    id: 'pa-26-string-and-loop',
    sequence: 26,
    title: 'Predicate Atom Mix: Scores and Limits',
    expression: '!p || q',
    difficulty: 'medium',
    conceptTags: ['predicate-atoms', 'scores', 'loops'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['p', 'q'],
    variableCount: 2,
    lawFamily: 'predicate-atoms',
    estimatedComplexity: 3,
    equivalenceReady: true,
    simplificationReady: true,
    predicateAtoms: [
      {
        variable: 'p',
        alias: 'P',
        predicate: 'score > 10',
        description: 'A score check from AP CSA practice.',
      },
      {
        variable: 'q',
        alias: 'Q',
        predicate: 'index < limit',
        description: 'A loop index remains inside numeric bounds.',
      },
    ],
    hints: ['Keep the full predicate meaning visible while you work.', 'Negation flips the first atom before the OR is evaluated.'],
  },
  {
    id: 'pa-27-three-atom-guard',
    sequence: 27,
    title: 'Predicate Atom Guard: Three Conditions',
    expression: '(p && q) || r',
    difficulty: 'hard',
    conceptTags: ['predicate-atoms', 'conditionals', 'three-variable'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['p', 'q', 'r'],
    variableCount: 3,
    lawFamily: 'predicate-atoms',
    estimatedComplexity: 4,
    equivalenceReady: true,
    simplificationReady: true,
    predicateAtoms: [
      {
        variable: 'p',
        alias: 'P',
        predicate: 'score >= 90',
        description: 'A branch for high scores.',
      },
      {
        variable: 'q',
        alias: 'Q',
        predicate: 'count == 0',
        description: 'A guard for an empty loop count.',
      },
      {
        variable: 'r',
        alias: 'R',
        predicate: 'index < limit',
        description: 'A loop continuation check.',
      },
    ],
    hints: ['The legend shows which numeric condition each atom represents.', 'Work the grouped AND first, then combine it with the final OR.'],
  },
];

const PROBLEM_CATALOG = RAW_PROBLEM_CATALOG.map(createProblem);

deepFreeze(PROBLEM_CATALOG);

export const problemCatalog = PROBLEM_CATALOG;

export function getProblemCatalog() {
  return PROBLEM_CATALOG.slice()
    .sort((left, right) => left.sequence - right.sequence)
    .map(cloneProblem);
}

export function getProblemById(id) {
  const problem = PROBLEM_CATALOG.find((entry) => entry.id === id);
  return problem ? cloneProblem(problem) : null;
}

export function listProblems({ mode, difficulty } = {}) {
  if (mode && !VALID_MODES.includes(mode)) {
    throw new RangeError(`Unsupported mode "${mode}".`);
  }

  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
    throw new RangeError(`Unsupported difficulty "${difficulty}".`);
  }

  return PROBLEM_CATALOG.filter((problem) => {
    if (mode && !problem.supportedModes.includes(mode)) {
      return false;
    }

    if (difficulty && problem.difficulty !== difficulty) {
      return false;
    }

    return true;
  })
    .sort((left, right) => left.sequence - right.sequence)
    .map(cloneProblem);
}

export function listSimplificationProblems({ difficulty } = {}) {
  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
    throw new RangeError(`Unsupported difficulty "${difficulty}".`);
  }

  return PROBLEM_CATALOG.filter((problem) => {
    if (!problem.simplificationReady) {
      return false;
    }

    if (difficulty && problem.difficulty !== difficulty) {
      return false;
    }

    return true;
  })
    .sort((left, right) => left.sequence - right.sequence)
    .map(cloneProblem);
}

export function validateProblemCatalog() {
  return PROBLEM_CATALOG.map((problem) => ({
    id: problem.id,
    valid: Boolean(problem.ast),
  }));
}

export function isProblemSupported(problem, mode) {
  return problem.supportedModes.includes(mode);
}
