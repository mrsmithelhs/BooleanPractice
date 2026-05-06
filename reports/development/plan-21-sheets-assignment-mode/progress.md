# Plan 21 Progress Report

## Summary

- Added a shared Sheets assignment loader in `src/assignments/index.js` that validates workbook rows, hydrates assignment items, and selects a student assignment safely.
- Extended the submission payload and GAS submission row so assignment ids, item ids, sequence numbers, and roster fields can be recorded with completions.
- Added a GAS bootstrap in `gas/Assignments.gs` and updated `gas/Code.gs` so a Sheets workbook can be injected into the client as assignment context.
- Added an `AssignmentPractice` wrapper and a dedicated assignment branch in `ui/App.vue` so GAS-hosted assignment sessions render as a locked queue instead of the normal catalog filter shell.
- Kept truth-table, Venn, equivalence, and simplification flows usable inside assignment mode through the shared practice components.
- Documented the workbook layout in `docs/sheets-assignments.md` and updated the architecture, deployment, and testing docs to reflect the new assignment workflow.

## Files Changed

- `src/assignments/index.js`
- `src/submission/index.js`
- `src/index.js`
- `ui/App.vue`
- `ui/components/AssignmentPractice.vue`
- `ui/components/TruthTablePractice.vue`
- `ui/components/VennPractice.vue`
- `ui/components/EquivalencePractice.vue`
- `ui/components/SimplificationPractice.vue`
- `ui/components/ProblemReviewSummary.vue`
- `ui/style.css`
- `gas/Assignments.gs`
- `gas/Code.gs`
- `gas/Submission.gs`
- `scripts/build-gas.mjs`
- `docs/sheets-assignments.md`
- `docs/architecture.md`
- `docs/deployment.md`
- `docs/testing.md`
- `tests/assignments.test.js`
- `tests/app-shell.test.js`
- `tests/problem-review-summary.test.js`
- `tests/submission.test.js`

## Artifacts Produced

- Updated static build output in `dist/`
- Updated GAS bundle in `gas-dist/`

## Commands Run And Results

- `npx vitest run tests/assignments.test.js tests/submission.test.js tests/problem-review-summary.test.js tests/app-shell.test.js` - passed
- `npm test` - passed
- `npm run lint` - passed
- `npm run build` - passed
- `npm run build:gas` - passed
- `npm run test:e2e` - passed

## Approval Gates Honored

- No live Sheet migration was performed.
- No `clasp push` was performed.
- No production classroom deployment was attempted.

## Stop Conditions Encountered

- None.

## Remaining Risks Or Follow-Ups

- The workbook still needs a real Sheets deployment with the configured spreadsheet id and sheet names before teachers can use it.
- Equivalence and simplification assignment items are supported for sequencing, but the same GAS submission card is currently only shown by the truth-table and Venn practice components.
- Future teacher-facing UI work remains deferred, as intended by the packet.

## Ready For Integration

yes
