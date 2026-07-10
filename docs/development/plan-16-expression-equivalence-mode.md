---
id: plan-16
title: "Expression Equivalence Mode"
status: complete
depends_on: [plan-14, plan-15]
gate: "before adding new grammar or broad AST rewrite rules"
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "ask students whether two expressions are logically equivalent, then let them prove it by comparing truth tables or Venn diagrams."
---
# Plan 16: Expression Equivalence Mode

## Packet Metadata

- Packet id: 16
- Packet title: Expression Equivalence Mode
- Status: (see frontmatter)
- Owner/model: Codex mini or stronger; stronger model recommended for pair generation logic
- Date: 2026-05-06
- Packet type: implementation, pedagogy, core logic, frontend, tests
- Mutation level: source-code, tests, docs
- Approval gate: before adding new grammar or broad AST rewrite rules
- Expected artifacts: equivalence challenge mode, pair generator/fixtures, proof comparison UI, tests, progress report
- Progress report folder: `reports/development/plan-16-expression-equivalence-mode/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: ask students whether two expressions are logically equivalent, then let them prove it by comparing truth tables or Venn diagrams.
- Non-goals: do not add simplification input or Java relational predicates.
- Depends on: Plans 14 and 15.
- Blocks: Plan 17 simplification mode and Plan 24 relational equivalence.
- Why this packet exists: AP CSA students need to recognize equivalent boolean forms, not just evaluate one expression at a time.

## Scope

In scope:

- Add equivalence challenge data or generator.
- Include equivalent-but-not-similar-looking pairs using known boolean laws.
- Include near-miss non-equivalent pairs with similar variables and complexity.
- Let students build both sides using truth tables or Venn diagrams.
- Compare final columns/regions and show the first differing row/region when not equivalent.

Out of scope:

- Do not ask students to type simplified expressions yet.
- Do not implement canonical minimum-form simplification.

## Implementation Requirements

- Prefer the student-facing term "equivalent" unless product docs explicitly choose "congruent."
- Pair generation may use AST transformations such as double negation, De Morgan, commutativity, associativity, distributivity, identity, domination, idempotence, and absorption.
- Every generated or curated pair must be verified by evaluator-based truth table comparison.
- Non-equivalent pairs should be plausible near misses, not random mismatches.

## Validation Checklist

- [ ] Equivalent pairs evaluate identically across all assignments.
- [ ] Non-equivalent pairs include at least one clear counterexample.
- [ ] UI can show side-by-side proof surfaces.
- [ ] Tests cover truth-table and Venn proof paths.
- [ ] Feedback identifies differing row/region for non-equivalence.

## Stop Conditions

Stop if robust pair generation requires a larger rewrite engine than this packet can safely specify; use curated pairs first and report the generator gap.

