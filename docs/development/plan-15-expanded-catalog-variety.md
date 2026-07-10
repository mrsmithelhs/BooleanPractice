---
id: plan-15
title: "Expanded Catalog And Variety"
status: complete
depends_on: [plan-04]
gate: "before adding Java relational predicate syntax"
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "make practice feel varied while preserving a clear progression of boolean concepts."
---
# Plan 15: Expanded Catalog And Variety

## Packet Metadata

- Packet id: 15
- Packet title: Expanded Catalog And Variety
- Status: (see frontmatter)
- Owner/model: Codex mini or stronger
- Date: 2026-05-06
- Packet type: implementation, pedagogy, tests
- Mutation level: source-code, tests, docs
- Approval gate: before adding Java relational predicate syntax
- Expected artifacts: larger problem catalog, metadata, catalog tests, progress report
- Progress report folder: `reports/development/plan-15-expanded-catalog-variety/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: make practice feel varied while preserving a clear progression of boolean concepts.
- Non-goals: do not add equivalence mode, simplification mode, or Java predicate atoms in this packet.
- Depends on: Plan 04 and parser/evaluator stability.
- Blocks: Plans 16, 17, 21, and 22.
- Why this packet exists: a small catalog becomes repetitive quickly, and later modes need richer metadata.

## Scope

In scope:

- Add many expressions across variable counts, operators, literals, and concept tags.
- Include meaningful mixtures of literals and variables, such as `a && true`, `b || false`, `!(false || a)`, `a || true`, and `c && false`.
- Add or refine metadata: concept tags, variable count, difficulty, supported modes, known law family, estimated complexity, and suitability for equivalence/simplification.
- Validate every catalog expression.

Out of scope:

- Do not parse Java relational expressions yet.
- Do not generate random expressions at runtime unless already supported cleanly.
- Do not change problem selection UI beyond what is needed to consume metadata.

## Implementation Requirements

- Cover identity, domination, double negation, De Morgan, absorption, redundancy, xor-like patterns, precedence, and three-variable reasoning.
- Avoid catalog entries whose only difficulty is visual clutter.
- Keep literals pedagogically intentional; they should teach identity/domination or constant behavior.
- Include tests that fail when expressions do not parse, metadata is missing, modes are invalid, or difficulty buckets become empty.

## Validation Checklist

- [ ] Catalog has substantially more entries than before.
- [ ] Literal-plus-variable expressions are represented.
- [ ] Three-variable entries exist for truth table and Venn.
- [ ] Metadata supports later equivalence, simplification, and assignment packets.
- [ ] Catalog tests pass.

## Stop Conditions

Stop if supporting desired catalog entries requires expanding the grammar beyond current boolean variables/literals/operators.

