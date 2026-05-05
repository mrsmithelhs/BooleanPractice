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

- Render fixed variable columns and editable answer columns from the shared truth-table generator.
- Prevent students from changing fixed assignment values.
- Reveal subexpression columns progressively in a deterministic order that matches the AST or product spec.
- Provide row/column feedback without `alert()` and without modal dialogs that block classroom use.
- Include keyboard-accessible toggles, clear focus states, and readable feedback text for screen readers.
- Use row numbers and subexpression labels in feedback so students know what reasoning step to revisit.
- Test answer checking, revealed steps, incorrect rows, fixed variable cells, and keyboard interaction.
- Keep the truth table UI dependent on shared semantics; do not duplicate evaluation logic in the component.

## Required Behavior

- Fixed assignment cells must be read-only.
- Answer checking should identify both correct and incorrect rows, not just a final score.
- Feedback should explain the next reasoning move when possible, not only say correct or incorrect.

## Stop Conditions

- If the product spec changes the answer/feedback semantics, stop and realign before coding.
- If a change would make the table less accessible or encourage guess-and-check behavior, stop and report.

## Validation Checklist

- [ ] Fixed assignment cells cannot be edited.
- [ ] Step feedback identifies correct and incorrect cells.
- [ ] Feedback is visible without modal alerts.
- [ ] Tests cover representative truth table interactions.
- [ ] Keyboard navigation works for answer cells.
- [ ] Feedback references the relevant row or subexpression.
