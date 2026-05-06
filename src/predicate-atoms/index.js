function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) {
      deepFreeze(item);
    }
  }

  return value;
}

function normalizeText(value, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizePredicateAtom(atom, variables) {
  if (!atom || typeof atom !== 'object') {
    throw new TypeError('Predicate atoms must be objects.');
  }

  const variable = normalizeText(atom.variable);
  const alias = normalizeText(atom.alias);
  const predicate = normalizeText(atom.predicate);

  if (!variable) {
    throw new Error('Predicate atoms must declare a variable.');
  }

  if (!variables.includes(variable)) {
    throw new Error(`Predicate atom "${variable}" does not match the enclosing expression variables.`);
  }

  if (!alias) {
    throw new Error(`Predicate atom "${variable}" must declare an alias.`);
  }

  if (!predicate) {
    throw new Error(`Predicate atom "${variable}" must declare a predicate label.`);
  }

  return deepFreeze({
    variable,
    alias,
    predicate,
    label: `${alias}: ${predicate}`,
    accessibleLabel: `${alias}: ${predicate}`,
    description: normalizeText(atom.description),
  });
}

export function normalizePredicateAtoms(predicateAtoms, variables) {
  if (predicateAtoms === undefined) {
    return [];
  }

  if (!Array.isArray(predicateAtoms)) {
    throw new TypeError('Predicate atoms must be provided as an array.');
  }

  if (predicateAtoms.length === 0) {
    return [];
  }

  const normalizedVariables = [...variables];
  const atoms = predicateAtoms.map((atom) => normalizePredicateAtom(atom, normalizedVariables));
  const seenVariables = new Set();
  const seenAliases = new Set();

  for (const atom of atoms) {
    if (seenVariables.has(atom.variable)) {
      throw new Error(`Predicate atom variable "${atom.variable}" is duplicated.`);
    }

    if (seenAliases.has(atom.alias)) {
      throw new Error(`Predicate atom alias "${atom.alias}" is duplicated.`);
    }

    seenVariables.add(atom.variable);
    seenAliases.add(atom.alias);
  }

  if (atoms.length !== normalizedVariables.length) {
    throw new Error('Predicate atoms must cover every variable in the expression.');
  }

  const atomVariables = atoms.map((atom) => atom.variable).sort();
  const expectedVariables = normalizedVariables.slice().sort();

  if (atomVariables.join(',') !== expectedVariables.join(',')) {
    throw new Error('Predicate atom variables must match the parsed expression variables.');
  }

  return deepFreeze(
    atoms.sort((left, right) => left.variable.localeCompare(right.variable)).map((atom) => ({ ...atom })),
  );
}

export function getPredicateAtomLegend(problem) {
  if (!problem?.predicateAtoms?.length) {
    return [];
  }

  return problem.predicateAtoms.map((atom) => ({ ...atom }));
}

export function getPredicateAtomForVariable(problem, variable) {
  if (!problem?.predicateAtoms?.length) {
    return null;
  }

  const atom = problem.predicateAtoms.find((entry) => entry.variable === variable);
  return atom ? { ...atom } : null;
}

export function getPredicateAtomDisplayLabel(problem, variable) {
  return getPredicateAtomForVariable(problem, variable)?.alias ?? variable;
}

export function getPredicateAtomAccessibleLabel(problem, variable) {
  return getPredicateAtomForVariable(problem, variable)?.accessibleLabel ?? variable;
}

