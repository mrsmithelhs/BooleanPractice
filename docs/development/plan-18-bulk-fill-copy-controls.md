# Plan 18: Bulk Fill And Copy Controls

## Packet Metadata

- Packet id: 18
- Packet title: Bulk Fill And Copy Controls
- Status: ready
- Owner/model: Codex mini or stronger
- Date: 2026-05-06
- Packet type: implementation, frontend, accessibility, tests
- Mutation level: source-code, tests
- Approval gate: before changing grading or attempt-count semantics
- Expected artifacts: truth table and Venn bulk controls, accessibility coverage, tests, progress report
- Progress report folder: `reports/development/plan-18-bulk-fill-copy-controls/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: reduce tedious repeated clicking without hiding the reasoning task.
- Non-goals: do not auto-solve problems or persist mastered subexpressions.
- Depends on: Plans 07 and 08.
- Blocks: Plan 19 and improves usability for Plans 16-17.
- Why this packet exists: literals, constants, negations, and repeated subexpressions can create interaction friction that distracts from boolean reasoning.

## Scope

In scope:

- Truth table controls: fill all true, fill all false, clear, and copy previous column/step where meaningful.
- Venn controls: shade all, unshade all, clear/neutral, and copy previous step or operand where meaningful.
- Accessible labels and keyboard operation.
- Tests for each bulk action.

Out of scope:

- Do not remember subexpressions across problems.
- Do not change answer keys or scoring.

## Implementation Requirements

- Bulk actions should only apply to editable answer cells/regions.
- Copy controls must be disabled or clearly unavailable when no source exists.
- If attempt counts exist, define whether a bulk action counts as an edit but not as a check attempt.
- Feedback should still require explicit check/submit.

## Validation Checklist

- [ ] Bulk actions cannot modify fixed variable assignments.
- [ ] Copy previous works only when a previous compatible step exists.
- [ ] Venn controls support one-, two-, and three-variable regions.
- [ ] Controls are keyboard-accessible and tested.

## Stop Conditions

Stop if bulk controls conflict with existing attempt-count or hint semantics; document the policy decision needed.

