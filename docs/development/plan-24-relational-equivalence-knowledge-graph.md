# Plan 24: Relational Equivalence Knowledge Graph

## Packet Metadata

- Packet id: 24
- Packet title: Relational Equivalence Knowledge Graph
- Status: draft
- Owner/model: stronger model recommended
- Date: 2026-05-06
- Packet type: pedagogy, algorithm design, implementation, tests
- Mutation level: docs, tests, source-code after design approval
- Approval gate: required before changing parser grammar or claiming relational equivalence coverage
- Expected artifacts: scoped equivalence rules, knowledge graph/design doc, tests, optional implementation, progress report
- Progress report folder: `reports/development/plan-24-relational-equivalence-knowledge-graph/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: teach and recognize equivalences involving negated Java-style relational predicates, such as `!(x > 10)` and `x <= 10`.
- Non-goals: do not build a full Java parser or theorem prover.
- Depends on: Plan 23 and preferably Plan 17.
- Blocks: advanced AP CSA predicate simplification.
- Why this packet exists: AP CSA often tests the relationship between boolean operators and relational comparisons, especially negated inequalities and equality checks.

## Scope

In scope after design approval:

- Define a small relational predicate model.
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
- Do not reason about floating point, object equality, string comparison semantics, or side effects.
- Do not infer numeric domains unless explicitly modeled.

## Design Questions To Resolve In The Packet

- Which predicate shapes are supported?
- Are predicate operands restricted to identifiers and literals?
- How should `str.length() > 5` be represented without parsing arbitrary method chains?
- How should the UI explain that a predicate atom has its own internal inverse?
- How does this interact with alias display from Plan 23?

## Validation Checklist

- [ ] Supported relational shapes are documented.
- [ ] Unsupported shapes fail safely.
- [ ] Equivalence rules are tested bidirectionally.
- [ ] UI copy does not imply broader Java reasoning than supported.
- [ ] Parser/evaluator behavior remains compatible with earlier boolean packets.

## Stop Conditions

Stop after design if the supported subset cannot be made clear, testable, and AP CSA-relevant without large grammar expansion.

