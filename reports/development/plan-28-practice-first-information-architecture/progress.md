# Plan 28 Progress Report

## Task
Practice-First Information Architecture And Density Reduction

## Summary Of Work Completed
- Reworked the main app shell into a compact, practice-first layout so the active workspace appears before dense metadata and hero-scale copy.
- Collapsed secondary problem details into a default-closed disclosure panel while keeping the selected expression, concept tags, modes, variables, numeric-variable explanation, predicate atoms, metadata, and hints available on demand.
- Reordered the desktop and mobile shell so the practice surface is the primary visual target and the supporting controls/details sit in a subordinate column or below the work surface.
- Slimmed the Sheets assignment view so the queue and roster details move behind disclosure, leaving the current item and progress visible first.
- Converted truth-table row feedback to show only the rows that still need attention in the primary feedback area, with the full row notes available behind an explicit disclosure.
- Reworked the problem review summary so the completion banner, submit action, and key next-action information stay visible while step review, review highlights, cross-representation comparison, next-practice rationale, and submission metrics move behind collapsible disclosure.
- Added and updated unit/component/browser coverage for the new collapsed details behavior, practice-first shell state, targeted truth-table feedback, and completion-summary disclosure.
- Updated the architecture and testing docs to make the practice-first and progressive-disclosure contract explicit.

## Files Changed
- `ui/App.vue`
- `ui/components/AssignmentPractice.vue`
- `ui/components/ProblemReviewSummary.vue`
- `ui/components/TruthTablePractice.vue`
- `ui/style.css`
- `tests/app-shell.test.js`
- `tests/problem-review-summary.test.js`
- `tests/truth-table-practice.test.js`
- `tests/e2e/smoke.spec.js`
- `docs/architecture.md`
- `docs/testing.md`

## Artifacts Produced
- Updated static build output in `dist/`

## Commands Run And Results
- `npx vitest run tests/app-shell.test.js tests/truth-table-practice.test.js tests/problem-review-summary.test.js tests/venn-practice.test.js` - passed
- `npm test` - passed
- `npm run lint` - passed
- `npm run build` - passed
- `npm run test:e2e` - passed

## Approval Gates Honored
- No boolean semantics were changed.
- No Venn diagram rendering was added.
- No student-visible information was deleted outright; secondary content was collapsed behind disclosure instead.

## Stop Conditions Encountered, If Any
- None.

## Remaining Risks Or Follow-Ups
- The practice components still expose several useful secondary cards by default; if the next review batch still finds them too dense, the next packet can continue collapsing the workbench in a more mode-specific way.
- The assignment flow was compacted conservatively to avoid disturbing workbook-driven progression, but it may still benefit from another pass once the practice-first shell settles.

## Ready For Integration
yes
