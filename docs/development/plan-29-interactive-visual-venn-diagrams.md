# Plan 29: Interactive Visual Venn Diagrams

## Packet Metadata

- Packet id: 29
- Packet title: Interactive Visual Venn Diagrams
- Status: ready
- Owner/model: stronger model recommended
- Date: 2026-05-06
- Packet type: pedagogy, visual interaction, rendering, accessibility, tests
- Mutation level: source-code, tests, docs
- Approval gate: required before replacing the existing region-grid workflow or changing Venn semantics
- Expected artifacts: visual Venn diagram renderer, interactive region selection, comparison/proof visuals, accessibility support, tests, progress report
- Progress report folder: `reports/development/plan-29-interactive-visual-venn-diagrams/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: make Venn mode use actual visual Venn diagrams with clickable shaded regions while preserving the tested region engine.
- Non-goals: do not rewrite boolean evaluation, do not remove the region grid until the visual diagram is proven usable, and do not add arbitrary set-theory notation beyond the existing app scope.
- Depends on: Plan 05, Plan 08, Plan 14, Plan 16, Plan 17, Plan 28 preferred.
- Blocks: a credible Venn learning mode and stronger cross-representation teaching.
- Why this packet exists: all blind UI reviews identified a major expectation mismatch: the app says "Venn Diagram" but shows a boolean region grid. The current grid is semantically useful, but it does not teach the spatial reasoning that makes Venn diagrams pedagogically distinct.

## Source Review Evidence

This packet is based on the blind reviews under:

```text
local/ui-reviews/2026-05-06T22-15-51/reviews/
```

Repeated findings to address:

- "Venn Diagram" mode contains no overlapping circles.
- The existing region grid reads like a truth table in disguise.
- Region tiles such as `a=F, b=T, c=F` require students to perform the spatial mapping mentally.
- Venn proof tabs in equivalence and simplification modes also show region grids instead of diagrams.
- Region colors need clearer meaning and should not rely on color alone.
- Mobile Venn region tiles are dense and uncomfortable as the primary input surface.

## Core Design Principle

The visual diagram is the teaching surface. The existing region engine should remain the source of truth, but students should be able to see and manipulate regions as spatial areas inside overlapping circles.

The app can still expose a compact region grid or textual region list as a support view, accessibility fallback, debug aid, or details panel. It should no longer be the only Venn representation.

## Scope

### In Scope

- Add a reusable visual Venn renderer for one-, two-, and three-variable expressions.
- Use SVG or another accessible DOM-friendly vector approach unless there is a compelling reason not to.
- Render overlapping circles with visible labels for variables.
- Divide the diagram into selectable regions that map exactly to existing region identifiers.
- Let students click/tap regions to select or unselect them in Venn practice.
- Preserve keyboard-accessible region selection.
- Show selected, correct, missed, extra, locked, and neutral states visually and non-color-dependently.
- Add an inline legend for region states.
- Support proof/comparison views:
  - expression left/right diagrams in equivalence mode
  - original/guess diagrams in simplification mode
  - differing regions highlighted in comparison mode
- Preserve or provide access to the current region grid as a secondary "region list" or accessibility/detail view if useful.
- Update tests to prove visual region mapping agrees with the tested region engine.

### Out Of Scope

- Do not change the meaning of Venn regions.
- Do not add four-variable Venn diagrams.
- Do not implement arbitrary freehand shading.
- Do not add animations that make correctness harder to inspect.
- Do not make the diagram purely canvas unless accessibility is solved.
- Do not remove truth-table mode or cross-representation comparison.

## Work Plan

### Stage 0: Confirm Region Model And Rendering Strategy

1. Inspect the region engine and current Venn UI.
2. Identify the canonical region identifiers for one-, two-, and three-variable problems.
3. Decide the renderer approach:
   - recommended: SVG with explicit region paths and ARIA labels
   - acceptable: SVG plus hidden accessible controls
   - avoid: inaccessible canvas-only interaction
4. Document the selected approach in the progress report.

### Stage 1: Static Diagram Geometry

Required behavior:

- Render a one-variable diagram with inside/outside regions.
- Render a two-variable diagram with left-only, overlap, right-only, and outside regions.
- Render a three-variable diagram with all eight regions represented.
- Label circles with variables or predicate aliases.
- Ensure diagrams scale responsively without clipping or distorted hit targets.

Implementation guidance:

- Prefer deterministic region path definitions over ad hoc geometry that changes between renders.
- Keep hit areas large enough for touch.
- Add visible focus rings for keyboard navigation.
- Represent outside-of-all region clearly, since it is easy to forget in boolean/Venn mapping.

### Stage 2: Interactive Practice Diagram

Required behavior:

- Clicking or tapping a region toggles student selection.
- Keyboard users can move through regions and toggle them.
- Region labels or accessible names must describe the assignment, for example:
  - `a true, b false, c true`
  - `inside a only`
  - `outside all sets`
- Existing bulk controls still work:
  - shade all
  - clear/neutral
  - copy previous step
- Existing feedback states still apply:
  - selected
  - correct
  - extra
  - missed
  - available/neutral
  - locked/previous step if applicable

### Stage 3: Visual Feedback And Legend

Required behavior:

- Add a compact legend explaining diagram states.
- Use non-color signals:
  - icons
  - patterns
  - borders
  - labels
  - shape overlays
- Error and success states must meet contrast requirements.
- Incorrect submissions should make extra and missed regions visually distinct without creating a wall of text.

### Stage 4: Proof And Comparison Diagrams

Required behavior:

- In equivalence proof Venn view, render visual diagrams for both expressions.
- Highlight differing regions between the two expressions.
- In simplification proof Venn view, render visual diagrams for original and guess.
- In cross-representation comparison, make the relationship between truth-table rows and Venn regions easier to see.
- Preserve the ability to inspect exact region assignments, either through labels, tooltips, accessible names, or a details list.

### Stage 5: Mobile Layout

Required behavior:

- The diagram must be usable on narrow mobile viewports.
- Hit targets must remain comfortable.
- Region labels must not overlap incoherently.
- Bulk controls and Check Regions must remain reachable.
- If the full three-variable diagram is too dense for small screens, provide a focused interaction pattern such as:
  - zoomed diagram with pan-free responsive sizing
  - selected-region detail below the diagram
  - optional region list fallback

## Implementation Requirements

### Semantic Mapping Contract

- Every visual region must map to exactly one canonical region from the existing engine.
- Every canonical region must appear in the visual diagram.
- The diagram must not infer correctness independently; correctness comes from existing evaluated region sets.
- Tests must catch any swapped or missing region mappings.

### Accessibility Contract

- The diagram must have a clear accessible name.
- Each region must be keyboard reachable or have an equivalent keyboard control.
- Selected and feedback states must be announced.
- Color cannot be the only signal.
- Focus state must be visible.

### Pedagogy Contract

- The visual should help students connect:
  - boolean assignments
  - truth table rows
  - spatial regions
  - shaded expression results
- Keep the option to show exact assignments, but do not make `a=F,b=T,c=F` the primary first impression.
- Predicate atoms should remain readable; if variables stand for Java-style predicates, labels or legends should show that mapping near the diagram.

## Testing Requirements

- Unit tests for region-to-path or region-to-control mapping.
- Unit tests proving one-, two-, and three-variable diagrams expose every canonical region exactly once.
- Component tests for toggling regions and applying feedback states.
- Accessibility tests for keyboard operation and ARIA labels.
- Playwright tests for:
  - selecting a region visually
  - submitting an incorrect Venn answer
  - progressing a Venn step
  - completing a Venn problem
  - viewing equivalence Venn proof
  - viewing simplification Venn proof
  - mobile diagram usability
- Existing region engine tests must continue to pass.

## Validation Checklist

- [ ] Venn practice visibly shows overlapping circles.
- [ ] One-, two-, and three-variable diagrams render correctly.
- [ ] Outside-of-all region is visible and selectable.
- [ ] Visual region selection agrees with existing Venn semantics.
- [ ] Bulk controls still work.
- [ ] Feedback states are clear and non-color-dependent.
- [ ] Equivalence and simplification Venn proof views use visual diagrams.
- [ ] Mobile diagrams are usable without tiny text-tile interaction as the only option.
- [ ] Accessibility tests cover region names, focus, and selected states.
- [ ] The Plan 26 screenshot tour no longer produces a "Venn mode has no Venn" finding.

## Stop Conditions

Stop and ask for review if:

- the only feasible implementation is an inaccessible canvas-only diagram
- three-variable region geometry cannot be mapped confidently to the existing engine
- mobile diagrams become less usable than the current region grid without a fallback
- the packet would need to rewrite parser/evaluator semantics
- visual polish starts to obscure exact boolean-region correctness
