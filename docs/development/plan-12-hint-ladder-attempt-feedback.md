# Plan 12: Hint Ladder And Attempt Feedback

## Packet Metadata

- Packet id: 12
- Packet title: Hint Ladder And Attempt Feedback
- Status: ready
- Owner/model: Codex mini or stronger; stronger model useful for feedback copy
- Date: 2026-05-06
- Packet type: implementation, pedagogy, frontend, tests
- Mutation level: source-code, tests, docs
- Approval gate: before changing boolean semantics or adding scoring/persistence
- Expected artifacts: attempt-aware hint system, inline feedback updates, tests, progress report
- Progress report folder: `reports/development/plan-12-hint-ladder-attempt-feedback/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: help students recover from mistakes with targeted hints that appear after attempts instead of immediately giving away answers.
- Non-goals: do not add accounts, long-term analytics, adaptive assignment, or new expression syntax.
- Depends on: Plans 01-11.
- Blocks: Plan 13 review summaries and later assignment/adaptive work.
- Why this packet exists: correctness feedback alone can turn practice into trial and error. Hints should point students back to operators, operands, rows, and regions.

## Required Reading

- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/testing.md`
- relevant truth table and Venn components under `ui/` or `src/`
- relevant feedback, evaluator, table, and Venn modules under `src/`
- existing tests for truth table and Venn workflows

## Scope

In scope:

- Add a small hint model for common mistakes.
- Show first-attempt feedback that identifies the mismatch without solving it.
- Show deeper hints after repeated attempts.
- Support truth table and Venn modes.
- Add tests for hint selection and attempt progression.

Out of scope:

- Do not persist hints beyond the current session.
- Do not add teacher reporting.
- Do not add expression equivalence, simplification, or Java predicates.

## Implementation Requirements

### 1. Hint Ladder

- Required behavior:
  - First incorrect attempt gives neutral feedback.
  - Later attempts provide increasingly specific hints.
  - Hints are tied to the current subexpression, operator, row, region, or operand when possible.
- Constraints:
  - Hints must never mark wrong work as correct.
  - Hints should be short enough for classroom projection and narrow screens.
- Edge cases:
  - All answers blank.
  - Only one row or region is wrong.
  - Three-variable Venn regions.
- Expected artifact:
  - Shared hint/feedback helper and UI integration.

### 2. Feedback Copy

- Required behavior:
  - Feedback should reinforce AP CSA boolean ideas: `!`, `&&`, `||`, precedence, parentheses, and assignment rows.
  - Avoid shaming language.
- Constraints:
  - Do not expose hidden answer keys in the first hint.
- Expected artifact:
  - Tests or snapshots for representative feedback states.

## Commands

```powershell
npm test
npm run build
npx playwright test
```

## Validation Checklist

- [ ] Hint state advances by attempt count.
- [ ] Truth table hints can identify rows or columns.
- [ ] Venn hints can identify missed or extra regions.
- [ ] Hints do not reveal answers too early.
- [ ] Unit/component/E2E tests cover representative failures.

## Stop Conditions

Stop if useful hints require changing core answer semantics or inventing a grading policy not described here.

