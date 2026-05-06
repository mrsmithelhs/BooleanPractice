const VALID_RELATIONAL_OPERATORS = ['>', '>=', '<', '<=', '==', '!='];

const RELATIONAL_OPERATOR_WORDS = {
  '>': 'greater than',
  '>=': 'greater than or equal to',
  '<': 'less than',
  '<=': 'less than or equal to',
  '==': 'equal to',
  '!=': 'not equal to',
};

const RELATIONAL_OPERATOR_INVERSES = {
  '>': '<=',
  '>=': '<',
  '<': '>=',
  '<=': '>',
  '==': '!=',
  '!=': '==',
};

const SUPPORT_NOTE = Object.freeze({
  title: 'Numeric variables',
  lede: 'A numeric variable stands in for an unknown number. It can change from one case to the next, but the comparison rules stay the same.',
  points: [
    'Read values such as score, count, age, or limit as numbers that may vary.',
    'Focus on the comparison boundary instead of guessing a hidden object or method result.',
    'Dot notation, object fields, method calls, arrays, and collections are out of scope for this packet.',
  ],
  unsupportedExamples: ['str.length()', 'items.length', 'car.milesPerHour()', 'list.size()'],
});

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) {
      deepFreeze(item);
    }
  }

  return value;
}

function cloneRule(rule) {
  return {
    ...rule,
    supportedShapes: [...rule.supportedShapes],
    conceptTags: [...rule.conceptTags],
    examples: rule.examples.map((example) => ({
      left: { ...example.left },
      right: { ...example.right },
    })),
    examplePairs: rule.examplePairs.map((examplePair) => ({
      left: { ...examplePair.left },
      right: { ...examplePair.right },
    })),
  };
}

function normalizeIdentifier(value, role) {
  if (typeof value !== 'string') {
    throw new TypeError(`Numeric comparison ${role} must be a plain identifier.`);
  }

  const trimmed = value.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
    throw new Error(
      `Numeric comparison ${role} must be a plain identifier, not dot notation, a method call, or a compound expression.`,
    );
  }

  return {
    kind: 'identifier',
    value: trimmed,
    label: trimmed,
    accessibleLabel: trimmed,
  };
}

function normalizeIntegerLiteral(value, role) {
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Error(`Numeric comparison ${role} must be an integer literal.`);
    }

    return {
      kind: 'integer-literal',
      value,
      label: String(value),
      accessibleLabel: String(value),
    };
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      throw new Error(`Numeric comparison ${role} must be an integer literal.`);
    }

    const parsed = Number.parseInt(trimmed, 10);
    return {
      kind: 'integer-literal',
      value: parsed,
      label: String(parsed),
      accessibleLabel: String(parsed),
    };
  }

  throw new Error(`Numeric comparison ${role} must be an integer literal.`);
}

function normalizeNumericTerm(value, role) {
  if (value && typeof value === 'object' && typeof value.kind === 'string') {
    if (value.kind === 'identifier') {
      return normalizeIdentifier(value.value ?? value.label, role);
    }

    if (value.kind === 'integer-literal') {
      return normalizeIntegerLiteral(value.value ?? value.label, role);
    }
  }

  if (typeof value === 'number') {
    return normalizeIntegerLiteral(value, role);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^-?\d+$/.test(trimmed)) {
      return normalizeIntegerLiteral(trimmed, role);
    }

    return normalizeIdentifier(trimmed, role);
  }

  throw new TypeError(`Numeric comparison ${role} must be a plain identifier or integer literal.`);
}

function buildExample(left, operator, right) {
  const normalizedLeft = normalizeNumericTerm(left, 'example left');
  const normalizedRight = normalizeNumericTerm(right, 'example right');

  return {
    left: normalizedLeft,
    operator,
    right: normalizedRight,
    display: `${normalizedLeft.label} ${operator} ${normalizedRight.label}`,
    accessibleLabel: `${normalizedLeft.accessibleLabel} ${RELATIONAL_OPERATOR_WORDS[operator]} ${normalizedRight.accessibleLabel}`,
    inverseOperator: RELATIONAL_OPERATOR_INVERSES[operator],
  };
}

const RAW_RELATIONAL_RULES = [
  {
    id: 'numeric-rel-01-greater-than',
    operator: '>',
    inverseOperator: '<=',
    supportedShapes: ['identifier-literal'],
    conceptTags: ['relational-equivalence', 'inequality', 'negation'],
    studentExplanation:
      'If a numeric variable is not greater than a number, it is that number or less.',
    inverseExplanation:
      'The inverse of a greater-than comparison is less-than-or-equal-to.',
    examples: [
      { left: 'score', operator: '>', right: 10 },
      { left: 'count', operator: '>', right: 0 },
    ],
  },
  {
    id: 'numeric-rel-02-greater-than-or-equal',
    operator: '>=',
    inverseOperator: '<',
    supportedShapes: ['identifier-literal'],
    conceptTags: ['relational-equivalence', 'inequality', 'negation'],
    studentExplanation:
      'If a numeric variable is not greater than or equal to a number, it must be less than that number.',
    inverseExplanation:
      'The inverse of a greater-than-or-equal comparison is less-than.',
    examples: [
      { left: 'score', operator: '>=', right: 90 },
      { left: 'count', operator: '>=', right: 1 },
    ],
  },
  {
    id: 'numeric-rel-03-less-than',
    operator: '<',
    inverseOperator: '>=',
    supportedShapes: ['identifier-literal'],
    conceptTags: ['relational-equivalence', 'inequality', 'negation'],
    studentExplanation:
      'If a numeric variable is not less than a number, it is that number or greater.',
    inverseExplanation:
      'The inverse of a less-than comparison is greater-than-or-equal-to.',
    examples: [
      { left: 'age', operator: '<', right: 13 },
      { left: 'index', operator: '<', right: 5 },
    ],
  },
  {
    id: 'numeric-rel-04-less-than-or-equal',
    operator: '<=',
    inverseOperator: '>',
    supportedShapes: ['identifier-literal'],
    conceptTags: ['relational-equivalence', 'inequality', 'negation'],
    studentExplanation:
      'If a numeric variable is not less than or equal to a number, it must be greater than that number.',
    inverseExplanation:
      'The inverse of a less-than-or-equal comparison is greater-than.',
    examples: [
      { left: 'limit', operator: '<=', right: 20 },
      { left: 'score', operator: '<=', right: 10 },
    ],
  },
  {
    id: 'numeric-rel-05-equal',
    operator: '==',
    inverseOperator: '!=',
    supportedShapes: ['identifier-literal', 'identifier-identifier'],
    conceptTags: ['relational-equivalence', 'equality', 'negation'],
    studentExplanation:
      'If two numeric values are not equal, they must be different numbers.',
    inverseExplanation:
      'The inverse of equal-to is not-equal-to.',
    examples: [
      { left: 'count', operator: '==', right: 0 },
      { left: 'x', operator: '==', right: 'y' },
    ],
  },
  {
    id: 'numeric-rel-06-not-equal',
    operator: '!=',
    inverseOperator: '==',
    supportedShapes: ['identifier-literal', 'identifier-identifier'],
    conceptTags: ['relational-equivalence', 'equality', 'negation'],
    studentExplanation:
      'If two numeric values are equal, then they are not different.',
    inverseExplanation:
      'The inverse of not-equal-to is equal-to.',
    examples: [
      { left: 'count', operator: '!=', right: 0 },
      { left: 'x', operator: '!=', right: 'y' },
    ],
  },
];

const OPERATOR_TO_RULE_ID = Object.freeze(
  RAW_RELATIONAL_RULES.reduce((map, rule) => {
    map[rule.operator] = rule.id;
    return map;
  }, {}),
);

function buildRule(rule) {
  const placeholder = rule.supportedShapes.includes('identifier-identifier') ? 'y' : 'n';

  return deepFreeze({
    ...rule,
    sourcePattern: `!(x ${rule.operator} ${placeholder})`,
    inversePattern: `x ${rule.inverseOperator} ${placeholder}`,
    displayPattern: `x ${rule.operator} ${placeholder}`,
    inverseDisplayPattern: `x ${rule.inverseOperator} ${placeholder}`,
    examplePairs: rule.examples.map((example) => ({
      left: buildExample(example.left, example.operator, example.right),
      right: buildExample(example.left, rule.inverseOperator, example.right),
    })),
  });
}

const NUMERIC_RELATIONAL_RULES = deepFreeze(RAW_RELATIONAL_RULES.map(buildRule));

function normalizeComparisonShape(left, right) {
  if (left.kind !== 'identifier') {
    throw new Error('Numeric comparison left side must be a numeric variable identifier.');
  }

  if (right.kind === 'identifier') {
    return 'identifier-identifier';
  }

  if (right.kind === 'integer-literal') {
    return 'identifier-literal';
  }

  throw new Error('Unsupported numeric comparison shape.');
}

function getRuleByOperator(operator) {
  const rule = NUMERIC_RELATIONAL_RULES.find((entry) => entry.operator === operator);
  return rule ? cloneRule(rule) : null;
}

export function getNumericVariableTeachingCopy() {
  return {
    ...SUPPORT_NOTE,
    points: [...SUPPORT_NOTE.points],
    unsupportedExamples: [...SUPPORT_NOTE.unsupportedExamples],
  };
}

export function buildNumericRelationalKnowledgeGraph() {
  return {
    title: 'Numeric relational equivalence knowledge graph',
    variableExplanation: getNumericVariableTeachingCopy(),
    unsupportedExamples: [...SUPPORT_NOTE.unsupportedExamples],
    nodes: NUMERIC_RELATIONAL_RULES.map(cloneRule),
    edges: NUMERIC_RELATIONAL_RULES.map((rule) => ({
      fromId: rule.id,
      toId: OPERATOR_TO_RULE_ID[rule.inverseOperator],
      relation: 'negates',
    })),
  };
}

export function getNumericRelationalRuleById(id) {
  const rule = NUMERIC_RELATIONAL_RULES.find((entry) => entry.id === id);
  return rule ? cloneRule(rule) : null;
}

export function getNumericRelationalRuleByOperator(operator) {
  if (!VALID_RELATIONAL_OPERATORS.includes(operator)) {
    return null;
  }

  return getRuleByOperator(operator);
}

export function normalizeNumericComparisonAtom(atom) {
  if (!atom || typeof atom !== 'object') {
    throw new TypeError('Numeric comparisons must be objects.');
  }

  const left = normalizeNumericTerm(atom.left, 'left');
  const operator = typeof atom.operator === 'string' ? atom.operator.trim() : '';

  if (!VALID_RELATIONAL_OPERATORS.includes(operator)) {
    throw new Error(`Unsupported numeric comparison operator "${atom.operator}".`);
  }

  const right = normalizeNumericTerm(atom.right, 'right');
  const shape = normalizeComparisonShape(left, right);

  if (shape === 'identifier-identifier' && !['==', '!='].includes(operator)) {
    throw new Error('Only equality and inequality can compare two numeric variables in this packet.');
  }

  const rule = getRuleByOperator(operator);
  const inverseOperator = RELATIONAL_OPERATOR_INVERSES[operator];

  return deepFreeze({
    left,
    operator,
    right,
    shape,
    display: `${left.label} ${operator} ${right.label}`,
    accessibleLabel: `${left.accessibleLabel} ${RELATIONAL_OPERATOR_WORDS[operator]} ${right.accessibleLabel}`,
    ruleId: rule.id,
    inverseOperator,
    inverseDisplay: `${left.label} ${inverseOperator} ${right.label}`,
    inverseAccessibleLabel: `${left.accessibleLabel} ${RELATIONAL_OPERATOR_WORDS[inverseOperator]} ${right.accessibleLabel}`,
  });
}

export function getInverseNumericComparisonAtom(atom) {
  const normalized = normalizeNumericComparisonAtom(atom);
  return normalizeNumericComparisonAtom({
    left: normalized.left.value,
    operator: normalized.inverseOperator,
    right: normalized.right.kind === 'identifier' ? normalized.right.value : normalized.right.value,
  });
}

export function compareNumericRelationalAtoms(leftSource, rightSource) {
  const left = normalizeNumericComparisonAtom(leftSource);
  const right = normalizeNumericComparisonAtom(rightSource);
  const rule = getRuleByOperator(left.operator);

  if (left.left.value !== right.left.value || left.right.value !== right.right.value || left.shape !== right.shape) {
    return {
      supported: true,
      equivalent: false,
      rule,
      reason: 'The operands do not match, so these comparisons are not an inverse pair.',
      left,
      right,
    };
  }

  if (RELATIONAL_OPERATOR_INVERSES[left.operator] !== right.operator) {
    return {
      supported: true,
      equivalent: false,
      rule,
      reason: 'The operators are not inverse partners.',
      left,
      right,
    };
  }

  return {
    supported: true,
    equivalent: true,
    rule,
    reason: rule?.studentExplanation ?? 'Equivalent by a supported numeric comparison rule.',
    left,
    right,
  };
}

export function getNumericRelationalUnsupportedExamples() {
  return [...SUPPORT_NOTE.unsupportedExamples];
}
