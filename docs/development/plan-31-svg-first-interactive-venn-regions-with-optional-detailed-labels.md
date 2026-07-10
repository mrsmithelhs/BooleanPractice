---
id: plan-31
title: "SVG-First Interactive Venn Regions With Optional Detailed Labels"
status: complete
depends_on: [plan-05, plan-08, plan-28, plan-29]
gate: "before changing Venn semantics or removing the exact-region fallback"
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "make the Venn experience feel like a real interactive diagram where the regions themselves are the controls, while keeping the canonical region engine and accessibility intact."
---
# Plan 31: SVG-First Interactive Venn Regions With Optional Detailed Labels

## Packet Metadata

- Packet id: 31
- Packet title: SVG-First Interactive Venn Regions With Optional Detailed Labels
- Status: (see frontmatter)
- Owner/model: Codex mini or stronger
- Date: 2026-05-07
- Packet type: frontend, accessibility, tests
- Mutation level: source-code, tests, docs
- Approval gate: before changing Venn semantics or removing the exact-region fallback
- Expected artifacts: a Venn display setting in the student controls panel, SVG-first interactive region geometry, optional detailed region labels, updated tests, progress report
- Progress report folder: `reports/development/plan-31-svg-first-interactive-venn-regions-with-optional-detailed-labels/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: make the Venn experience feel like a real interactive diagram where the regions themselves are the controls, while keeping the canonical region engine and accessibility intact.
- Non-goals: do not change boolean semantics, do not add four-variable Venns, do not remove keyboard access, and do not remove the exact-region fallback details view.
- Depends on: Plans 05, 08, 28, and 29.
- Blocks: clearer Venn region interaction and a less cluttered default Venn presentation.
- Why this packet exists: blind review feedback showed that the current Venn view still exposes too much visual text by default and needs a cleaner interaction model with optional detail labels, while keeping the 1-, 2-, and 3-input region mapping accurate.

## Authority And Contracts

Name the sources of truth the implementing agent must obey.

Common Boolean Practice references:

- Product and pedagogy:
  - `docs/product-spec.md`
  - `docs/architecture.md`
  - `docs/development/README.md`
- Venn implementation:
  - `src/venn/`
  - `ui/components/VennDiagram.vue`
  - `ui/components/VennPractice.vue`
  - `ui/components/EquivalencePractice.vue`
  - `ui/components/SimplificationPractice.vue`
- Assignment mode:
  - `ui/components/AssignmentPractice.vue`
- UI shell:
  - `ui/App.vue`
  - `ui/style.css`
- Validation:
  - `tests/`

Project-level decisions this packet must not redefine:

- Venn mode must support one, two, and three variables.
- The canonical region ids and correctness logic remain the source of truth.
- The exact-region fallback list/details view stays available for precision and accessibility.
- Keyboard users must be able to activate regions without a pointer device.
- Circle identifiers like `A`, `B`, and `C` stay visible at all times.
- Detailed region labels are optional and hidden by default.

If the implementation discovers that the current region model cannot support the requested interaction cleanly, stop and report rather than quietly changing semantics.

## Required Reading

- `docs/packet-creation-guidance.md`
- `docs/development/README.md`
- `docs/architecture.md`
- `ui/App.vue`
- `ui/components/VennDiagram.vue`
- `ui/components/VennPractice.vue`
- `ui/components/EquivalencePractice.vue`
- `ui/components/SimplificationPractice.vue`
- `ui/style.css`
- `tests/venn-diagram.test.js`
- `tests/venn-practice.test.js`

## Scope

### In Scope

- Add a Venn display setting in the existing Student controls area.
- Hide detailed region labels by default and toggle them on demand.
- Keep the circle identifiers visible regardless of the toggle.
- Preserve region click/tap, keyboard navigation, and accessibility semantics.
- Apply the same visual contract to Venn practice, Venn proof views, and assignment-mode Venn items.

### Out Of Scope

- Do not change the canonical region engine or the meaning of region ids.
- Do not add four-variable diagrams.
- Do not remove the exact-region fallback list/details view.
- Do not redesign the whole page layout.

## Work Plan

1. Inspect the current Venn shell and shared diagram component.
2. Add the new student-facing toggle in the existing controls panel.
3. Thread the setting through the Venn practice and proof components.
4. Update the shared diagram rendering so detailed labels are optional and hidden by default.
5. Add focused tests for the toggle and for unchanged region behavior.
6. Run the relevant validation commands and report results.

## Implementation Requirements

### Venn Display Toggle

- Required behavior:
  - The Student controls panel includes one checkbox for showing detailed Venn region labels.
  - The checkbox defaults to off.
  - The setting applies to Venn practice, Venn proof views, and assignment-mode Venn items.
- Constraints:
  - Circle identifiers must remain visible even when detailed labels are off.
  - The toggle must affect presentation only, not region ids or correctness checks.
- Expected artifact or code change:
  - A small shell-level state value passed into the shared diagram component.

### SVG-First Region Interaction

- Required behavior:
  - Each canonical region remains directly clickable/tappable through the SVG region geometry itself.
  - Cursor and focus states make the region shapes feel interactive.
  - Keyboard users can tab through regions and activate them.
  - The diagram remains valid for one-, two-, and three-input layouts.
- Constraints:
  - Accessibility labels must still expose the full region meaning when the visible labels are hidden.
  - The exact-region fallback list/details view remains available.
- Expected artifact or code change:
  - Shared Venn diagram rendering that supports interactive SVG regions with optional labels.

### Label Visibility Rules

- Required behavior:
  - Only the basic circle identifiers are always visible.
  - Region display labels, bit patterns, and extra descriptive text are shown only when the checkbox is enabled.
  - Tooltips may be used as a secondary aid, but not as the only label mechanism.
- Constraints:
  - The hidden state must still be understandable via screen readers and the fallback details view.
- Expected artifact or code change:
  - Conditional label rendering plus accessibility-safe fallback text.

## Testing Requirements

- Component tests for the toggle default and toggled-on state.
- Tests that verify region ids and selection behavior do not change when the labels toggle changes.
- Tests that confirm circle identifiers stay visible.
- Keyboard-accessibility tests for the region controls.
- Regression coverage for both practice and proof views.

## Validation Checklist

- [ ] Checkbox exists in the existing Student controls panel.
- [ ] Detailed Venn labels are hidden by default.
- [ ] Circle identifiers remain visible at all times.
- [ ] Region click/tap and keyboard activation still work.
- [ ] Venn practice and proof views both honor the same label toggle.
- [ ] The exact-region fallback remains available.
- [ ] Tests cover default-off and toggled-on behavior.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Relevant Playwright tests pass if UI layout or interaction changes.
- [ ] No unrelated files were changed.

## Stop Conditions

Stop and ask for review if:

- the region interaction model would require changing Venn semantics
- the toggle cannot be added without removing the accessibility fallback
- the only workable implementation is a broad rewrite of the Venn engine
- the label toggle makes the diagram harder for keyboard or screen-reader users
- another packet is needed first to settle a contract that this one depends on
