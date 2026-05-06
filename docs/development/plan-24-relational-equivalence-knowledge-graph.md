# Plan 24: Numeric Relational Equivalence Knowledge Graph

## Packet Metadata

- Packet id: 24
- Packet title: Numeric Relational Equivalence Knowledge Graph
- Status: ready
- Owner/model: stronger model recommended
- Date: 2026-05-06
- Packet type: pedagogy, algorithm design, implementation, tests
- Mutation level: docs, tests, source-code after design approval
- Approval gate: required before changing parser grammar or claiming relational equivalence coverage
- Expected artifacts: scoped equivalence rules, knowledge graph/design doc, tests, optional implementation, progress report
- Progress report folder: `reports/development/plan-24-relational-equivalence-knowledge-graph/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: teach and recognize equivalences involving negated numeric comparisons, such as `!(x > 10)` and `x <= 10`.
- Non-goals: do not build a full Java parser or theorem prover, and do not support dot notation, objects, method calls, arrays, or collections.
- Depends on: Plan 23 and preferably Plan 17.
- Blocks: advanced AP CSA predicate simplification.
- Why this packet exists: AP CSA often tests the relationship between boolean operators and numeric comparisons, especially negated inequalities and equality checks.

## Scope

In scope after design approval:

- Define a small numeric-comparison model.
- Add equivalence rules for:
  - `!(x > n)` <-> `x <= n`
  - `!(x >= n)` <-> `x < n`
  - `!(x < n)` <-> `x >= n`
  - `!(x <= n)` <-> `x > n`
  - `!(x == y)` <-> `x != y`
  - `!(x != y)` <-> `x == y`
- Add tests for each rule.
- Integrate with equivalence/simplification feedback only where the model is confident.

Out of scope:

- Do not parse arbitrary method calls or compound arithmetic.
- Do not reason about floating point, object equality, string comparison semantics, array length, collection size, or side effects.
- Do not infer numeric domains unless explicitly modeled.

## Design Questions To Resolve In The Packet

- Which comparison shapes are supported?
- Are operands restricted to numeric identifiers and integer literals?
- Should variable-vs-variable comparisons be supported in the first version, or only variable-vs-literal comparisons?
- How should the UI explain that a numeric variable is a stand-in for an unknown number without exposing implementation plumbing?
- How should the UI explain that a comparison atom has a matching inverse form?
- How does this interact with alias display from Plan 23?
- How should the packet describe unsupported examples like object fields, method calls, array length, and collection size so students are not misled into thinking those are in scope?

## Validation Checklist

- [ ] Supported relational shapes are documented.
- [ ] Unsupported shapes fail safely.
- [ ] Equivalence rules are tested bidirectionally.
- [ ] UI copy does not imply broader Java reasoning than supported.
- [ ] UI copy explains numeric variables in student-facing terms without exposing app internals.
- [ ] Parser/evaluator behavior remains compatible with earlier boolean packets.

## Stop Conditions

Stop after design if the supported subset cannot be made clear, testable, and AP CSA-relevant without large grammar expansion.
