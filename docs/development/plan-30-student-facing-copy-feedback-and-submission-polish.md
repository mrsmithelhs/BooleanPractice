# Plan 30: Student-Facing Copy, Feedback, Progress, And Submission Polish

## Packet Metadata

- Packet id: 30
- Packet title: Student-Facing Copy, Feedback, Progress, And Submission Polish
- Status: complete
- Owner/model: Codex mini or stronger
- Date: 2026-05-06
- Packet type: UI polish, copy, accessibility, tests
- Mutation level: source-code, tests, docs
- Approval gate: required before changing GAS submission payload shape or removing existing student feedback
- Expected artifacts: student-facing copy revisions, progress indicators, input affordance improvements, safer submission states, tests, progress report
- Progress report folder: `reports/development/plan-30-student-facing-copy-feedback-and-submission-polish/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: fix the smaller but repeated UI issues from blind review that make the app feel implementation-facing, ambiguous, or unfinished.
- Non-goals: do not perform the broad layout redesign from Plan 28, do not implement visual Venn diagrams from Plan 29, and do not change classroom data contracts unless explicitly required.
- Depends on: Plans 12 through 21, 23, 26, and preferably Plan 28.
- Blocks: cleaner student trust, safer GAS classroom behavior, and better future UI review results.
- Why this packet exists: after the two major themes of information density and missing Venn visuals, reviewers still found several important polish issues: jargon labels, ambiguous progress, unclear done states, weak input affordances, buried or internal submission errors, and a few copy defects.

## Source Review Evidence

This packet is based on the blind reviews under:

```text
local/ui-reviews/2026-05-06T22-15-51/reviews/
```

Repeated or high-signal findings to address:

- Step counters display `Step 1 / ?`, leaving students unsure how much work remains.
- Problem titles can conflict with mode names, such as a Venn-titled problem appearing in Truth Table mode.
- Labels such as "DESIGN CONTROLS", "Challenge Controls", "Catalog Metadata", "Operand Preview", "Left opened", and implementation-like GAS messages feel developer-facing.
- Empty truth-table cells do not strongly advertise that they are editable.
- Equivalence correct-answer state lacks a clear completion or next-step signal.
- Simplification success copy says "1 nodes".
- GAS failure/preview states expose implementation details such as `google.script.run` or missing Sheet configuration.
- GAS failure state needs student-facing retry guidance.
- Red/green feedback should include non-color cues.

## Scope

### In Scope

- Replace internal or developer-facing labels with student-facing copy.
- Normalize control labels across modes.
- Clarify the relationship between mode, problem title, and expression title.
- Replace opaque Venn step labels such as "Operand Preview" or "Left opened" with readable language.
- Show deterministic step totals where available, or provide a meaningful progress indicator when totals are not deterministic.
- Improve empty truth-table cell affordances.
- Add clear completion/next-step states for equivalence and simplification challenges.
- Fix singular/plural grammar in node-count feedback.
- Replace implementation-facing GAS submission states with student-facing messages.
- Add retry guidance for submission failure.
- Hide or clearly mark unavailable submission controls in local/static contexts.
- Add non-color cues to feedback and status states where missing.
- Add tests for copy/state behavior that could regress.

### Out Of Scope

- Do not redesign the whole layout; Plan 28 owns density and information architecture.
- Do not create visual Venn diagrams; Plan 29 owns that work.
- Do not change assignment generation, adaptive learning, or Sheets schemas.
- Do not remove teacher-useful metrics from the GAS payload.
- Do not create a teacher UI.
- Do not add live network submission from GitHub Pages to GAS.

## Work Plan

### Stage 0: Inventory Copy And State Strings

1. Search for student-visible labels, headings, status strings, and feedback strings.
2. Separate strings into:
   - student-facing task language
   - teacher-facing metrics
   - developer-only diagnostics
   - test ids or internal constants
3. Identify which strings appear in screenshots from the Plan 26 capture.
4. Write a short before/after copy map in the progress report.

### Stage 1: Control And Heading Vocabulary

Required changes:

- Replace `DESIGN CONTROLS` with a plain label such as `Practice Controls` or `Choose a Problem`.
- Use one consistent label for the left control panel across problem, challenge, equivalence, and simplification modes.
- Replace or hide `Catalog Metadata` in student-first views; if retained in details, use a plain label such as `Problem Details`.
- Avoid first-view labels such as `immutable record`, `node-count metric`, `shared semantics`, or `predicate atom guard`.

Mode/title clarity:

- The practice panel should make the current mode clear.
- Problem titles should not imply the student is in the wrong mode.
- If a problem title is mode-specific for historical reasons, display it as secondary context or rename catalog titles to be mode-neutral.

Example:

```text
Truth Table Practice
Expression: (a && b) || c
Problem: Three-variable expression practice
```

### Stage 2: Progress And Done States

Required behavior:

- Replace `Step 1 / ?` with a deterministic total when possible.
- If the total is genuinely variable, show a meaningful progress label that does not look broken.
- Add a clear completion state after a correct equivalence answer.
- Add a clear completion or next-step state after a correct simplification guess.
- Provide a primary next action when appropriate:
  - next challenge
  - try another problem
  - review proof
  - submit completion when enabled

Do not add distracting celebration. The app should feel like a focused learning tool.

### Stage 3: Input Affordances

Required behavior:

- Empty truth-table cells should visually communicate that they can be edited or toggled.
- Add concise placeholder text, icons, borders, or button styling as appropriate.
- Ensure affordance works for keyboard and screen-reader users.
- Do not overcrowd table cells on mobile.

Recommended behavior:

- Use `T/F` placeholder text or a compact toggle affordance.
- Add accessible labels that name row, column, and expected input type without revealing the answer.

### Stage 4: Venn And Predicate Wording Polish

Required behavior:

- Replace "Operand Preview" with a student-readable label.
- Replace "Left opened" with language that explains the current subexpression or side being evaluated.
- Ensure predicate atom legends use readable Java-condition examples without hiding them as generic variables too quickly.
- Where predicate variables appear as table headers, provide definitions through inline labels, tooltips, or a nearby compact legend.

If Plan 29 has not yet been implemented, do not rename Venn mode away from "Venn Diagram" in this packet unless the user explicitly chooses a temporary naming strategy. The stronger direction is to implement real Venn diagrams in Plan 29.

### Stage 5: GAS Submission Product Safety

Required behavior:

- Student-facing submission cards must not expose raw implementation details such as:
  - `google.script.run`
  - missing internal config names
  - stack-like errors
  - developer-only simulation wording
- In local/static contexts where submission is not configured, show a product-safe state:
  - submission preview unavailable
  - classroom submission is not connected in this preview
  - use the GAS classroom build to submit
- In GAS failure states, tell the student what to do next:
  - retry
  - wait and try again
  - ask the teacher
  - keep their completion visible
- Preserve diagnostic detail for developers in console logs, dev-only details, or tests, not the main student card.
- Do not attempt static GitHub Pages to GAS HTTPS submission.

### Stage 6: Feedback Signals

Required behavior:

- Add icons, labels, borders, or text cues so success/error/warning states do not depend only on color.
- Ensure the status language is consistent across truth table, Venn, equivalence, simplification, predicate, and submission flows.
- Keep feedback concise and action-oriented.

## Testing Requirements

- Unit or component tests for step-total/progress display.
- Tests for singular/plural node-count copy.
- Tests for equivalence correct-answer completion state.
- Tests for static/local submission unavailable state.
- Tests for GAS submission failure guidance.
- Tests that internal error strings are not rendered in student-facing submission cards.
- Accessibility tests for editable table-cell labels or affordances.
- Update Playwright screenshots/tours if labels or states change.

## Validation Checklist

- [ ] Left control panel uses one student-facing label across modes.
- [ ] Current mode and problem title no longer contradict each other.
- [ ] Step progress no longer displays a bare `?` denominator unless intentionally explained.
- [ ] Empty truth-table cells look interactive.
- [ ] Equivalence success has a clear done or next-step state.
- [ ] Simplification grammar handles `1 node` and plural counts correctly.
- [ ] Venn step labels use readable student language.
- [ ] Predicate legends remain visible where students need them.
- [ ] GAS local/static unavailable state does not look like a broken developer error.
- [ ] GAS failure state gives retry or teacher-contact guidance.
- [ ] Feedback states include non-color cues.
- [ ] Standard tests, build, and relevant Playwright tests pass.

## Stop Conditions

Stop and ask for review if:

- changing copy would alter a public classroom data contract
- step totals cannot be computed without changing learning-flow semantics
- hiding GAS diagnostics would make local debugging impossible and no dev-only alternative exists
- input affordance changes make table cells too crowded on mobile
- Venn wording changes would undermine Plan 29's goal of real visual diagrams
