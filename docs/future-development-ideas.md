# Future Development Ideas

These ideas are promising but intentionally deferred from the current packet sequence.

## Teacher Assignment UI

Plan 21 should use Sheets-authored assignments first. A later packet may add a teacher-facing UI for creating, editing, previewing, and publishing assignment sequences without manually editing Sheets rows.

Open questions for a future teacher UI:

- Should the UI live in the GAS web app only, or also in local/static preview mode?
- Should teachers generate assignments from catalog filters, adaptive targets, or hand-picked problems?
- How should teachers preview what a student will see?
- What permissions model is needed so students cannot access teacher controls?

## Advanced Java Condition Modeling

Plan 23 introduces pre-authored numeric predicate atoms, and Plan 24 scopes relational equivalence rules. Later work could consider richer numeric condition modeling for AP CSA examples, but only after the supported subset remains clear and testable.

## Guided Student Onboarding

Plan 28 should reduce first-load density without adding a full onboarding system. A later packet could add a short optional first-run tour that teaches the workflow through interaction rather than long explanatory cards.

Possible directions:

- A one-problem guided walkthrough that highlights one table cell, one Venn region, and one feedback state.
- A "How this works" overlay that students can reopen but that never blocks regular practice.
- Teacher/projector-friendly introduction mode for whole-class explanation.

## Projector And Classroom Display Mode

The blind reviews focused on desktop and mobile screenshots. A future packet could tune a classroom/projector viewport where the teacher displays the app while students reason aloud.

Possible directions:

- Larger expression and diagram surfaces.
- Reduced controls and metadata while projecting.
- High-contrast mode for classroom displays.
- Teacher narration prompts that are not shown in normal student practice.

## Structured Blind Review Output

Plan 27 assumed synthesis could add value after unstructured reviews. In practice, review quality was high but output structure varied by agent. A future packet could revise the Plan 26 review prompt and capture workflow so reviewers produce both natural-language notes and a predictable `findings.json`.

Possible directions:

- Required finding ids, severity, confidence, screenshot references, and category fields.
- A lightweight schema validator for review folders.
- A "review completeness" checker that does not judge the findings, only confirms the shape.
- A synthesis workflow that groups structured findings while still preserving raw reviewer notes.

## Visual Regression And Screenshot Diffing

Plan 26 captures UI tours for blind review, not regression testing. A later workflow could compare screenshots across captures to catch accidental UI drift.

Possible directions:

- Baseline screenshots for stable stories.
- Thresholded image diffs for layout regressions.
- Separate review-tour screenshots from CI visual-regression screenshots so blind review remains flexible.

## Advanced Venn Teaching Aids

Plan 29 should make Venn diagrams genuinely visual. Later work could add optional teaching aids after the core diagrams are stable.

Possible directions:

- Animated connection between a truth-table row and the matching Venn region.
- Hover or focus explanations for why a region belongs to an expression.
- Step-by-step shading previews for compound expressions.
- Teacher-controlled overlays for "inside A", "outside B", and "intersection" language.
