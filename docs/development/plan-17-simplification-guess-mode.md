# Plan 17: Simplification Guess Mode

## Packet Metadata

- Packet id: 17
- Packet title: Simplification Guess Mode
- Status: ready
- Owner/model: Codex mini or stronger; stronger model recommended for simplification rules
- Date: 2026-05-06
- Packet type: implementation, pedagogy, core logic, frontend, tests
- Mutation level: source-code, tests, docs
- Approval gate: before claiming mathematically minimal simplification or adding Java predicate equivalences
- Expected artifacts: simplification challenge mode, expression input/parse validation, equivalence proof, tests, progress report
- Progress report folder: `reports/development/plan-17-simplification-guess-mode/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: ask students to propose a simpler expression, then prove whether the guess is equivalent to the original.
- Non-goals: do not build a full Karnaugh-map, Quine-McCluskey, or globally minimal boolean simplifier.
- Depends on: Plan 16.
- Blocks: Plan 24 relational equivalence and later advanced simplification.
- Why this packet exists: simplification is where evaluation turns into algebraic reasoning, but the app should verify student guesses before trying to become a theorem prover.

## Scope

In scope:

- Let students type or construct a proposed simpler expression using the existing grammar.
- Parse and validate the guess.
- Compare original and guess by truth table/region equivalence.
- Report whether the guess is equivalent.
- Optionally report a simple complexity metric, such as token count or AST node count.
- Add a small rewrite-rule helper only if it is clearly bounded and tested.

Out of scope:

- Do not promise "the simplest possible form."
- Do not add Java relational predicate inversion.
- Do not add freeform Java parsing.

## Implementation Requirements

- The app may say "a simpler equivalent form" but should not say "the simplest form" unless a formal cost model exists.
- If rewrite suggestions are included, limit them to safe rules: identity, domination, idempotence, double negation, De Morgan, and absorption.
- Reject malformed guesses with helpful parser feedback.
- Show counterexample rows/regions when a guess is not equivalent.

## Validation Checklist

- [ ] Valid simplification guesses can be checked.
- [ ] Invalid syntax is handled gracefully.
- [ ] Equivalent but longer guesses are recognized as equivalent but not simpler by the chosen metric.
- [ ] Non-equivalent guesses show a counterexample.
- [ ] Tests cover rewrite rules if added.

## Stop Conditions

Stop if implementation starts requiring a canonical minimizer or ambiguous "simplest" policy.

