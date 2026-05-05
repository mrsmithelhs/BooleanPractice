# Plan 07: Truth Table Learning UI

## Packet Metadata

- Packet id: 07
- Packet title: Truth Table Learning UI
- Status: ready
- Owner/model: Codex mini or stronger
- Date: 2026-05-05
- Packet type: implementation, frontend, pedagogy, tests
- Mutation level: source-code, tests
- Approval gate: before changing answer/feedback semantics from the product spec
- Expected artifacts: truth table component, step reveal, feedback model, tests
- Progress report folder: `reports/development/plan-07-truth-table-learning-ui/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: rebuild truth table practice with better feedback and accessible interaction.
- Non-goals: do not implement Venn UI or long-term progress storage.
- Depends on: Plans 03, 04, and 06.
- Blocks: visual polish and robust E2E tests.
- Why this packet exists: truth tables are the clearest bridge from code expressions to exhaustive boolean reasoning.

## Implementation Requirements

- Render fixed variable columns and editable answer columns.
- Prevent students from changing fixed assignment values.
- Reveal subexpression columns progressively.
- Provide row/column feedback without `alert()`.
- Include keyboard-accessible toggles and clear focus states.
- Test answer checking, revealed steps, incorrect rows, and fixed variable cells.

## Validation Checklist

- [ ] Fixed assignment cells cannot be edited.
- [ ] Step feedback identifies correct and incorrect cells.
- [ ] Feedback is visible without modal alerts.
- [ ] Tests cover representative truth table interactions.
