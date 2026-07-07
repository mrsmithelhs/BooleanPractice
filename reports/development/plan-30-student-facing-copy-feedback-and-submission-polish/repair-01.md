# Repair 01: Remaining Plan 30 Acceptance Gaps

Date: 2026-07-07

## Context

Plan 30 remains partially implemented but should not be marked complete yet. A targeted audit on 2026-07-07 found that several neighboring improvements from Plans 28, 29, and 31 are present, but multiple explicit Plan 30 requirements still have live gaps.

Targeted validation command run during audit:

```powershell
npm test -- tests\truth-table-practice.test.js tests\equivalence-practice.test.js tests\simplification.test.js tests\submission.test.js tests\problem-review-summary.test.js
```

Result: 5 test files passed, 23 tests passed.

Passing targeted tests are useful evidence, but they do not cover all Plan 30 acceptance criteria.

## Evidence Of Implemented Portions

- Step progress shows real totals such as `1/3` and `1/2` in truth table and Venn practice.
- Truth-table feedback now focuses primary text on rows needing attention, with full row notes available behind details.
- Empty truth-table cells are rendered as interactive buttons with row/step/blank ARIA labels.
- Predicate atom legends are present near truth table and Venn practice surfaces.
- Completion review sections are more collapsible than the original screenshot review state.

## Required Repairs

### 1. Replace Remaining Student-Visible Developer Labels

Files to inspect:

- `ui/App.vue`
- `ui/components/VennPractice.vue`

Known live strings:

- `Catalog Metadata` still appears in `ui/App.vue`.
- `Operand Preview` still appears in `ui/components/VennPractice.vue`.

Required repair:

- Replace `Catalog Metadata` with student-facing language, or move it behind a clearly secondary teacher/developer details label.
- Replace `Operand Preview` with a student-readable label that explains the current subexpression or side being evaluated.
- Confirm no first-view student UI exposes internal labels called out by Plan 30.

### 2. Fix Simplification Node Count Grammar

Files to inspect:

- `src/simplification/index.js`
- `ui/components/SimplificationPractice.vue`
- simplification tests

Known live issue:

- Status text can still say `1 nodes vs 3`.

Required repair:

- Add singular/plural formatting for node counts.
- Cover both `1 node` and plural cases in tests.
- Update existing tests that assert only broad text such as `Equivalent and simpler by this metric` so they also guard the grammar.

### 3. Make GAS Submission Messages Product-Safe

Files to inspect:

- `src/submission/index.js`
- `ui/components/ProblemReviewSummary.vue`
- `tests/submission.test.js`
- component tests for `ProblemReviewSummary` if present or newly added

Known live issues:

- Static/unavailable student-facing state can include `google.script.run is unavailable in this build.`
- Failure state currently renders raw thrown error messages directly.
- Failure state lacks reliable retry, wait, or teacher-contact guidance.

Required repair:

- Keep raw `google.script.run` and missing-sheet diagnostics out of the main student-facing submission card.
- Show product-safe static/local copy, for example that classroom submission is not connected in this preview.
- For failure, show a student action prompt such as retrying, waiting briefly, or contacting the teacher while keeping the completion visible.
- Preserve detailed diagnostics in developer-only places such as thrown errors, console logs, tests, or hidden dev details if needed.
- Add tests that assert internal strings like `google.script.run` and raw config names are not rendered in the student-facing submission card.

### 4. Clarify Equivalence Completion State

Files to inspect:

- `ui/components/EquivalencePractice.vue`
- `ui/App.vue`
- assignment mode components if completion behavior differs there
- equivalence tests

Known live issue:

- `EquivalencePractice` emits `complete`, but the standalone app shell does not appear to handle it.
- A correct answer shows feedback text, but Plan 30 asked for a clearer done or next-step state.

Required repair:

- Add a visible completion/next-step state after a correct equivalence answer.
- Keep the proof visible.
- Provide a clear next action where appropriate, such as try another challenge, review proof, or load another problem.
- Add a focused test for the visible completion state, not only the feedback sentence.

### 5. Add Missing Regression Coverage

Required tests:

- Student-facing copy does not include raw `google.script.run` in submission unavailable UI.
- GAS failure UI gives retry or teacher-contact guidance.
- Simplification grammar handles `1 node` and plural counts.
- Equivalence success shows a clear completion or next-step state.
- Remaining Plan 30 label replacements are covered by component or E2E assertions where practical.

## Suggested Validation

Run targeted tests after the repair:

```powershell
npm test -- tests\truth-table-practice.test.js tests\equivalence-practice.test.js tests\simplification.test.js tests\submission.test.js tests\problem-review-summary.test.js
```

Run broader validation if UI/source changes are not tightly isolated:

```powershell
npm test
npm run build
```

Run relevant Playwright coverage if labels, submission flow, or completion states alter visible workflows:

```powershell
npm run test:e2e
```

## Acceptance Criteria

- Plan 30 validation checklist can be answered honestly as complete.
- No raw GAS implementation errors appear in student-facing submission UI.
- Simplification text uses correct singular/plural node wording.
- Venn and problem-detail labels use student-facing language.
- Equivalence success has a visible done or next-action state.
- Tests protect the repaired behaviors.

## Review Update

The repair was reported complete and reviewed on 2026-07-07. One small stale equivalence-completion state was fixed during review, targeted tests and build passed afterward, and Plan 30 was marked complete in the current pre-Bootstrap packet metadata.
