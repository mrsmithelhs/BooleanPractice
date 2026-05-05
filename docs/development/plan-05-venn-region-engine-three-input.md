# Plan 05: Venn Region Engine With Three Inputs

## Packet Metadata

- Packet id: 05
- Packet title: Venn Region Engine With Three Inputs
- Status: ready
- Owner/model: Codex mini or stronger
- Date: 2026-05-05
- Packet type: implementation, core logic, tests
- Mutation level: source-code, tests
- Approval gate: before changing region naming or assignment ordering after tests are written
- Expected artifacts: Venn/set region module, one/two/three-input support, equivalence tests with truth tables
- Progress report folder: `reports/development/plan-05-venn-region-engine-three-input/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: make Venn mode a tested representation of boolean assignments for one, two, and three variables.
- Non-goals: do not draw the final UI in this packet.
- Depends on: Plan 03.
- Blocks: Venn learning UI and robust test suite.
- Why this packet exists: the archived UI is fixed to two variables, but the revised app must support three-input Venn practice.

## Implementation Requirements

- Represent regions as assignment objects and stable ids, such as bitmask-style ids.
- Use one documented variable ordering everywhere so region ids, labels, truth tables, and verification results all line up.
- Generate all regions for one, two, and three variables, yielding `2^n` regions for `n` variables.
- Evaluate an AST across regions using the shared evaluator from Plan 03.
- Compare selected region ids to expected true regions and return missed/extra regions along with readable labels.
- Provide display labels that can support diagrams and accessible fallback controls without inventing a separate semantic model.
- Keep region-generation logic rendering-agnostic.
- Test agreement between Venn regions and truth table rows for representative expressions.
- Include a regression test that three-variable expressions produce all eight regions in a stable order.

## Required Behavior

- Region ids must remain stable once tests are written.
- Selection checking should report missing and extra regions separately.
- The engine should not decide visual styling, diagram layout, or canvas/SVG rendering.

## Stop Conditions

- If a different region ordering seems visually preferable, stop and confirm before changing the engine contract.
- If the implementation would require a separate evaluator for Venn, stop; the packet only allows the shared evaluator.

## Validation Checklist

- [ ] Region generation returns 2, 4, and 8 regions for one, two, and three variables.
- [ ] Expected true regions match evaluator output.
- [ ] Verification reports missed and extra regions.
- [ ] Tests cover three-variable expressions.
- [ ] Region ordering is stable across repeated runs.
- [ ] Truth table and Venn results agree for representative expressions.
