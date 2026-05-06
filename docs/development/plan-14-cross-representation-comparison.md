# Plan 14: Cross-Representation Comparison

## Packet Metadata

- Packet id: 14
- Packet title: Cross-Representation Comparison
- Status: ready
- Owner/model: Codex mini or stronger; browser-capable model recommended
- Date: 2026-05-06
- Packet type: implementation, pedagogy, frontend, tests
- Mutation level: source-code, tests
- Approval gate: before broad UI redesign or changing Venn/truth table semantics
- Expected artifacts: compare view, synchronized row/region highlighting, tests, progress report
- Progress report folder: `reports/development/plan-14-cross-representation-comparison/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: let students see that truth table rows and Venn regions are the same assignments represented differently.
- Non-goals: do not add expression equivalence challenges yet.
- Depends on: Plans 05, 07, 08, 10, and preferably 13.
- Blocks: Plan 16 expression equivalence mode.
- Why this packet exists: cross-representation transfer is one of the strongest conceptual payoffs of the app.

## Scope

In scope:

- Add a comparison surface after a completed compatible problem.
- Highlight a truth table row and the matching Venn region together.
- Support one-, two-, and three-variable assignments.
- Add accessible labels for assignments and regions.
- Add tests for assignment-to-region mapping.

Out of scope:

- Do not require students to complete both modes for every problem.
- Do not add pairwise expression equivalence yet.

## Implementation Requirements

- Use shared assignment/region ids rather than duplicated mapping logic.
- The UI must remain readable for full predicate labels and three-variable regions.
- Color cannot be the only indicator; include labels or focus/selection state.

## Validation Checklist

- [ ] Every truth table row maps to exactly one Venn region.
- [ ] Highlighting works for three variables.
- [ ] Keyboard users can inspect the comparison.
- [ ] Tests cover truth table and Venn synchronization.

## Stop Conditions

Stop if existing data structures cannot map rows to regions without changing core contracts.

