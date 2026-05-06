# Plan 22: Adaptive Assignment Algorithm Design

## Packet Metadata

- Packet id: 22
- Packet title: Adaptive Assignment Algorithm Design
- Status: ready
- Owner/model: stronger model recommended
- Date: 2026-05-06
- Packet type: scan-only, pedagogy, algorithm design, tests
- Mutation level: docs, tests or prototype fixtures only
- Approval gate: before production implementation or student-impacting behavior
- Expected artifacts: adaptive algorithm design doc, feature-vector definition, fixture tests/prototype, progress report
- Progress report folder: `reports/development/plan-22-adaptive-assignment-algorithm-design/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: sharply define and test an adaptive assignment algorithm before implementing it in classroom mode.
- Non-goals: do not deploy adaptive assignment or mutate live Sheets.
- Depends on: Plans 15 and 21.
- Blocks: future adaptive assignment implementation.
- Why this packet exists: adaptive practice can be excellent, but only if "similar problem," difficulty, retry, and coverage are defined rigorously.

## Scope

In scope:

- Define problem feature vectors.
- Define similarity scoring.
- Define difficulty progression and retry behavior.
- Define target coverage by concept tags.
- Build deterministic fixtures or prototype tests that prove the algorithm's choices.
- Document student-facing and teacher-facing behavior.

Out of scope:

- Do not wire the algorithm into live assignment mode.
- Do not write to Sheets.
- Do not personalize from long-term history unless a future data policy exists.

## Design Requirements

Feature vectors should consider:

- variable count
- operator counts for `!`, `&&`, `||`
- AST depth
- literals
- parentheses/precedence reliance
- concept tags such as De Morgan, identity, domination, absorption, distributive, xor-like, equivalence, simplification
- truth density
- negation complexity
- mode suitability
- known misconception target

Similarity should prefer shared concept tags and comparable complexity over string similarity.

Retry policy should define:

- when to give a similar retry after failure
- when to give a contrast problem
- how many retries before moving on
- how to preserve target coverage without trapping students

## Validation Checklist

- [ ] Algorithm design defines inputs, outputs, and invariants.
- [ ] Similarity uses feature vectors, not raw string distance.
- [ ] Fixtures prove expected selections for representative mistakes.
- [ ] Design explains fairness and classroom usability.
- [ ] Implementation follow-up is clearly scoped.

## Stop Conditions

Stop before production implementation unless the integration owner explicitly authorizes it.

