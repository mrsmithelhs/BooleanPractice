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
- Generate all regions for one, two, and three variables.
- Evaluate an AST across regions using the shared evaluator.
- Compare selected region ids to expected true regions and return missed/extra regions.
- Provide display labels that can support diagrams and accessible fallback controls.
- Test agreement between Venn regions and truth table rows for representative expressions.

## Validation Checklist

- [ ] Region generation returns 2, 4, and 8 regions for one, two, and three variables.
- [ ] Expected true regions match evaluator output.
- [ ] Verification reports missed and extra regions.
- [ ] Tests cover three-variable expressions.
