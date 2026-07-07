# Plan 28: Practice-First Information Architecture And Density Reduction

## Packet Metadata

- Packet id: 28
- Packet title: Practice-First Information Architecture And Density Reduction
- Status: complete
- Owner/model: stronger model recommended
- Date: 2026-05-06
- Packet type: UX redesign, responsive layout, pedagogy, implementation, tests
- Mutation level: source-code, tests, docs
- Approval gate: required before removing any student-visible information entirely
- Expected artifacts: revised practice-first layout, collapsed secondary information, mobile workspace improvements, targeted feedback behavior, tests, progress report
- Progress report folder: `reports/development/plan-28-practice-first-information-architecture/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: reduce the app's opening information density so the student sees a learning workspace first, not a dashboard of metadata.
- Non-goals: do not remove important pedagogical context permanently, do not redesign boolean semantics, and do not implement visual Venn diagrams in this packet.
- Depends on: Plans 06 through 19, 23, and 26.
- Blocks: better mobile learning flow, more effective blind UI review results, and cleaner later visual upgrades.
- Why this packet exists: three blind UI reviews of the Plan 26 screenshot tour agreed that the app is visually cohesive but over-dense. The strongest repeated concern was that the loaded app reads like a reference or finance dashboard rather than a CS learning space. Students must scroll through large hero text, controls, metadata, hints, and review panels before reaching the work.

## Source Review Evidence

This packet is based on the blind reviews under:

```text
local/ui-reviews/2026-05-06T22-15-51/reviews/
```

Repeated findings to address:

- The large persistent hero consumes prime real estate on every screen.
- Mobile users must scroll through multiple screens before reaching the interactive practice surface.
- The desktop layout creates a wall of cards across controls, current problem, metadata, hints, and practice.
- Completion states become very long, and the Submit action is buried far below the moment of completion.
- Truth-table wrong-answer feedback lists every row, even when only a few rows need attention.
- Predicate atom definitions and other reference details are sometimes separated from the practice table where students need them.
- Several secondary panels are useful but too prominent by default.

## Core Design Principle

The app should be practice-first:

1. The current task and expression should be visible immediately.
2. The student's next required action should be obvious.
3. Details, metadata, hints, history, and cross-representation review should stay available but should not compete with the active work.
4. Mobile layout should optimize for doing a problem, not reading every available card in document order.

Do not interpret this as "hide everything." The goal is progressive disclosure: show the minimum useful context at first, then reveal supporting context when the student asks for it or reaches the appropriate state.

## Scope

### In Scope

- Collapse or replace the persistent hero after app load or when a problem is selected.
- Make the active practice panel the primary visual surface on desktop and mobile.
- Reorder mobile content so the student can reach the practice interaction quickly.
- Collapse secondary problem metadata by default:
  - catalog metadata
  - implementation-like complexity details
  - numeric variable detail blocks
  - longer hint/reference sections
  - session overview content that duplicates controls or current state
- Keep a compact current-expression summary visible near the practice surface.
- Add a compact inline predicate legend inside the practice panel whenever predicate atoms are active.
- Convert long completion summaries into progressive disclosure:
  - completion banner
  - primary next action or submission action near the top
  - expandable step review
  - expandable cross-representation comparison
  - expandable next-practice rationale
  - expandable submission details when relevant
- Make truth-table feedback targeted:
  - show only incorrect or changed rows in text feedback
  - let table highlights carry the full visual detail
  - keep correct-row dumps out of the primary feedback area
- Improve mobile feedback placement so feedback does not push the active table or diagram completely out of reach.
- Preserve keyboard accessibility and screen-reader access to collapsed information.

### Out Of Scope

- Do not implement actual Venn circle diagrams; that is Plan 29.
- Do not change parser, evaluator, AST, or catalog semantics.
- Do not remove teacher-useful data from submission payloads.
- Do not add a full onboarding or marketing landing page.
- Do not build a teacher dashboard.
- Do not implement new assignment/adaptive-learning algorithms.

## Work Plan

### Stage 0: Inspect Current Layout And State Ownership

1. Identify components that render:
   - hero/app intro
   - app tabs and mode controls
   - problem controls
   - current problem details
   - hints
   - practice panels
   - feedback panels
   - completion summaries
   - submission output
2. Identify the state variables that tell whether:
   - no problem is selected
   - a problem is loaded but not started
   - the student is mid-step
   - the problem is completed
   - submission is available, pending, successful, or failed
3. Write a short implementation map in the progress report before making broad layout edits.

### Stage 1: Reduce Initial Load Density

Required behavior:

- Replace the marketing-scale hero with a compact app header once the user is in the practice workspace.
- Keep project identity visible, but do not let the headline occupy a large share of the viewport during practice.
- Remove redundant session overview content or move it into a secondary details area.
- Rename any "overview" block that remains so it describes what a student can do with it.

Recommended behavior:

- Use a compact top bar or small title row containing:
  - app name
  - current mode
  - current problem title or expression
  - optional status/progress
- Keep the full explanatory headline only for a true empty/intro state if it remains valuable.

### Stage 2: Rebalance Desktop Layout

Required behavior:

- Make the practice surface visually dominant.
- Keep problem selection controls discoverable but not larger than the work.
- Make current problem details scannable, not a dense document.
- Collapse secondary sections by default with clear labels such as "Problem details", "Hints", "Teacher metadata", or "More context".
- Avoid exposing implementation-like metadata in the first view unless it directly supports student reasoning.

Recommended layout direction:

- Desktop can use a two-zone structure:
  - compact controls/context region
  - large practice workspace
- If a three-column layout remains, the center/right rails must not feel equally important to the active exercise.

### Stage 3: Reprioritize Mobile Flow

Required behavior:

- On mobile, the student must reach the first interactive practice control within roughly one viewport after selecting a problem.
- The active expression, current step, and primary action should remain easy to return to.
- Long details must collapse before the practice surface.
- Completion and feedback states must not require long scrolls before the student can act.

Recommended behavior:

- Consider a sticky compact task header for:
  - expression
  - mode
  - current step/progress
- Consider a sticky or near-top primary action region for:
  - Check Step
  - Check Regions
  - Check Guess
  - Submit Completion
- If a sticky element is used, test that it does not hide table rows, diagram regions, feedback, or form fields.

### Stage 4: Target Feedback To Student Action

Required behavior:

- Truth-table wrong-answer feedback should identify only the rows needing attention.
- Correct rows should not be repeated in the main text feedback.
- Feedback should name what changed or what to inspect next.
- Visual highlights in the table or region surface should remain the full-detail source.
- Detailed feedback can be available behind "Show details" if needed for teaching, debugging, or accessibility.

Example direction:

```text
Rows 3 and 6 still need work. Check the highlighted cells and compare the inputs in those rows.
```

Avoid:

```text
Row 1 expected T and you entered T. Row 2 expected F and you entered F...
```

### Stage 5: Compact Completion And Submission Flow

Required behavior:

- The moment a problem is completed, show a short completion state near the top of the practice panel.
- If submission is enabled, the Submit action must be visible without scrolling through the entire review summary.
- Step review, cross-representation comparison, next-practice recommendation, and submission metrics should be grouped into expandable sections.
- The detailed review should remain available for students and teachers who want it.

### Stage 6: Predicate Legend Where Students Work

Required behavior:

- If predicate atoms are active, include a compact legend inside or immediately adjacent to the practice table.
- The legend should preserve the pedagogical value of predicates such as `p: count > 0`, not prematurely hide them as generic booleans.
- Table column headers for predicate variables should expose definitions through visible compact labels, tooltips, or an inline legend.

## Implementation Requirements

### Student Language

- Replace developer-facing terms in first-view UI with student-facing language.
- Technical or teacher-facing metadata may remain behind details controls.
- Do not over-explain; the interface should show the active task through hierarchy and affordances.

### Accessibility

- Collapsed sections must be keyboard-operable.
- Expanded/collapsed state must be announced to assistive technology.
- Sticky or compact headers must not trap focus or obscure focused controls.
- Feedback must not depend only on red/green color.
- Mobile tap targets must remain comfortable.

### Responsive Validation

At minimum, verify:

- desktop/laptop viewport around 1366x768 or 1440x900
- mobile viewport around 390x844 or 412x915
- at least one completed truth-table problem
- at least one predicate-atom problem
- at least one wrong-answer state
- at least one completion/submission-ready state

## Testing Requirements

- Add or update component tests for collapsed secondary panels.
- Add or update tests for targeted row feedback.
- Add or update tests that completion summary sections remain accessible after collapsing.
- Add or update Playwright coverage for:
  - mobile reaches practice surface quickly
  - Submit action is visible near completion when submission is enabled
  - predicate legend appears in the practice panel when needed
  - targeted feedback appears after an incorrect truth-table step
- Run the standard unit and build checks.

## Validation Checklist

- [ ] Practice panel is visually primary on desktop.
- [ ] Mobile users can reach the interactive surface quickly after selecting a problem.
- [ ] Persistent hero no longer dominates every practice state.
- [ ] Secondary metadata is available but collapsed or visually subordinate.
- [ ] Truth-table feedback lists only rows needing attention in the primary feedback area.
- [ ] Completion state exposes the next action or Submit action near the top.
- [ ] Predicate atom definitions are visible near the table when predicate atoms are active.
- [ ] Collapsed content remains accessible by keyboard and screen reader.
- [ ] Screenshots from the Plan 26 workflow show a visibly less dense first impression.

## Stop Conditions

Stop and ask for review if:

- reducing density would require deleting information that teachers or later packets depend on
- mobile practice-first ordering conflicts with core state assumptions
- sticky controls cause overlap or focus problems that cannot be resolved within this packet
- a proposed layout change would make truth table, Venn, equivalence, and simplification modes inconsistent in a way students would notice
