---
id: plan-23
title: "Java Predicate Atoms"
status: complete
depends_on: [plan-15, plan-16, plan-17]
gate: "before accepting freeform Java syntax or adding relational equivalence rules"
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "let catalog problems use boolean-valued numeric predicates, such as `x > 10` or `count == 0`, as meaningful atoms in larger boolean expressions."
---
# Plan 23: Java Predicate Atoms

## Packet Metadata

- Packet id: 23
- Packet title: Java Predicate Atoms
- Status: (see frontmatter)
- Owner/model: Codex mini or stronger; stronger model recommended for UI/pedagogy decisions
- Date: 2026-05-06
- Packet type: implementation, pedagogy, parser/display, frontend, tests
- Mutation level: source-code, tests, docs
- Approval gate: before accepting freeform Java syntax or adding relational equivalence rules
- Expected artifacts: predicate atom metadata, readable truth table/Venn presentation, tests, docs, progress report
- Progress report folder: `reports/development/plan-23-java-predicate-atoms/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: let catalog problems use boolean-valued numeric predicates, such as `x > 10` or `count == 0`, as meaningful atoms in larger boolean expressions.
- Non-goals: do not parse arbitrary Java, do not rely on dot notation, and do not reason about relational inverses yet.
- Depends on: Plans 15-17 preferred.
- Blocks: Plan 24 relational equivalence knowledge graph.
- Why this packet exists: AP CSA students need to connect abstract boolean variables to real conditions used in selection and iteration.

## Pedagogy Constraint

The UI must not immediately hide predicates behind `a`, `b`, and `c` so completely that the Java connection disappears. Indirection may be necessary for readability, but the predicate meaning must stay visible and useful.

## Scope

In scope:

- Add catalog support for pre-authored boolean atoms with display labels, such as:
  - `P: x > 10`
  - `Q: count == 0`
  - `R: index < limit`
- Evaluate them internally as boolean variables.
- Show a readable legend or compact table headers that preserve the predicate connection.
- Ensure truth table and Venn layouts remain readable.
- Add tests for atom metadata, display, and evaluation mapping.

Out of scope:

- Do not allow students to type arbitrary Java predicates.
- Do not transform `!(x > 10)` into `x <= 10`.
- Do not add dot notation, object fields, method calls, arrays, or collections.

## Implementation Requirements

- Support abstraction/indirection with aliases, but always present the full predicate near the working surface.
- Use pre-authored atoms only.
- Avoid table headers so long they break layout; prefer alias headers plus persistent legend or expandable detail.
- Include examples tied to AP CSA conditionals and loops that stay within plain numeric variables.

## Validation Checklist

- [ ] Predicate atoms render readably in truth table and Venn modes.
- [ ] Full predicate meaning remains visible.
- [ ] Evaluation still uses shared boolean semantics.
- [ ] Tests cover alias/legend mapping.
- [ ] No freeform Java parser was introduced.

## Stop Conditions

Stop if preserving readability requires a larger UI redesign or if implementation starts parsing arbitrary Java expressions.
