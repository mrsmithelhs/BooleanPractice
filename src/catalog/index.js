import { collectBooleanVariables, parseBooleanExpression } from '../parser/index.js';

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_MODES = ['truth-table', 'venn'];

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
    hints: [...problem.hints],
  };
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
    hints: ['Negation happens first.', 'Then evaluate AND before OR.', 'Parentheses would change the grouping.'],
  },
  {
    id: 'tt-06-parentheses',
    sequence: 6,
    title: 'Parentheses Practice',
    expression: '!(a && b)',
    difficulty: 'medium',
    conceptTags: ['parentheses', 'negation'],
    supportedModes: ['truth-table', 'venn'],
    variables: ['a', 'b'],
    hints: ['Evaluate the parentheses before applying ! to the result.', 'This is a De Morgan setup.'],
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
    hints: ['Negate the grouped OR first.', 'Then combine the result with c.'],
  },
];

const PROBLEM_CATALOG = RAW_PROBLEM_CATALOG.map((problem) => {
  const parsed = parseBooleanExpression(problem.expression);
  const parsedVariables = collectBooleanVariables(parsed);

  if (!problem.supportedModes.every((mode) => VALID_MODES.includes(mode))) {
    throw new Error(`Problem ${problem.id} has unsupported mode metadata.`);
  }

  if (!VALID_DIFFICULTIES.includes(problem.difficulty)) {
    throw new Error(`Problem ${problem.id} has unsupported difficulty metadata.`);
  }

  if (parsedVariables.join(',') !== problem.variables.join(',')) {
    throw new Error(`Problem ${problem.id} has variable metadata that does not match the parsed expression.`);
  }

  return deepFreeze({
    ...problem,
    ast: parsed,
    variables: parsedVariables,
  });
});

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

export function validateProblemCatalog() {
  return PROBLEM_CATALOG.map((problem) => ({
    id: problem.id,
    valid: Boolean(problem.ast),
  }));
}

export function isProblemSupported(problem, mode) {
  return problem.supportedModes.includes(mode);
}
