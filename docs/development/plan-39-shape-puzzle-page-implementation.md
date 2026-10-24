---
id: plan-39
title: "Shape Puzzle Page Implementation (P3)"
status: ready
depends_on: [plan-38]
gate: "GATE-39A: page implemented, build isolation re-verified, full suites green, local preview screenshots; owner review before any deploy (GATE-39B is the owner's own Pages deploy and sign-off)"
superseded_by: null
resolution: null
summary: >-
  Build the P3 online shape-puzzle page as a second Vite entry (puzzle.html) on the existing static Pages build. Students fill
  the truth-table output column, then shade the regions of irregular shapes for an AND/OR/NOT expression; feedback uses the
  existing hint ladder, with no answer key on the student surface. Reuses src/shape-puzzles and src/notation; zero changes to
  the AP CSA app.
---
# Plan 39: Shape Puzzle Page Implementation (P3)

## Packet Metadata

- Packet id: `plan-39-shape-puzzle-page-implementation`
- Packet title: Shape Puzzle Page Implementation (P3)
- Status: (see frontmatter)
- Owner/model: implementer (single)
- Date: 2026-10-24
- Packet type: feature
- Mutation level: source-code, tests, docs. No deploy.
- Approval gate: **GATE-39A**: stop with a local preview, screenshots, and full suites. The owner reviews, then runs the Pages deploy himself (GATE-39B).
- Depends on: plan-38 (investigation, complete)
- Progress report: `reports/development/plan-39-shape-puzzle-page-implementation/progress.md`

## Goal

Ship a stripped-down online puzzle page at `puzzle.html?set=shapes-1&sheet=N`.
- It shows one sheet at a time: the expression in AND/OR/NOT words (with a toggle to the Java symbols), the irregular shapes, and a truth table.
- The student first predicts the output column, then shades the regions whose row is TRUE.
- The page checks both steps with staged hints and reveals the hidden picture when everything is correct.

It reuses the shared semantics, the plan-37 geometry, and the conventions from plan-37 and plan-38. It is completely separate from the AP CSA app.

## Non-goals

- No changes to the AP CSA app: `ui/App.vue`, existing `ui/components/*.vue`, `src/venn/diagram.js`, or the parser.
- No student data, accounts, persistence beyond optional per-viewer `localStorage` progress, analytics, or GAS submission.
- No P2 (build-the-target) and no P4 (circuits).
- No Pages deploy and no workflow edits. The existing workflow already publishes `dist/`.
- No new runtime dependencies.

## Owner decisions this packet implements (GATE-38A, 2026-10-24; DECISION-008)

1. **Two-state shading.** Regions start clean and unshaded (no hatching). A click or Space toggles shaded and unshaded.
2. **Colored outlines plus outside labels** (plan-38 option c). Each shape gets a distinct color *and* its plan-37 line style (solid, dashed, dash-dot), with outside label boxes, swatches, and leaders. It must stay fully distinguishable in greyscale.
3. **Full truth table beside the diagram on desktop (≥ 860 px). A compact row inspector on narrow screens.**
4. **Whole expression in one step.** An optional "Break it down" disclosure adds subexpression columns. It is never mandatory.
5. **Students fill the output column.**
   - The table starts with the inputs filled and the output blank.
   - Students enter T/F per row, and it is checked like the existing truth-table mode.
   - Shading can be checked only after the output column is correct.
   - The diagram never shows the answers before that.
6. **No answer key or "solve" on the student surface.**
   - A teacher view is allowed only behind `?teacher=1`. It shows the solved picture and the outputs, and nothing in the student UI links to it.

## Authority and contracts

Required reading:
- `AGENTS.md` and `docs/decision-log.md` (DECISION-001, -002, -003, -006, -007, -008)
- `reports/development/plan-38-shape-puzzle-page-investigation/progress.md` and `orchestrator-review-gate-38a.md`
- `local/plan-38-prototype/`, as reference only. Rebuild properly; don't copy it wholesale.
- `src/shape-puzzles/`, `src/notation/`, `src/feedback/index.js` (`getHintStage`, `buildTruthTableHint`, `buildVennHint`), `src/truth-table/`, `vite.config.*`

Contracts:
- Shared semantics only (DECISION-001). Rows, outputs, and correct regions come from the parser, evaluator, and truth-table code, plus `src/shape-puzzles/`.
- Static Pages with no student data (DECISION-002). Relative asset paths (`base: './'`).
- Accessibility (DECISION-003, -006):
  - every region is a keyboard-focusable control with an accessible name (row number plus "inside A and C, outside B");
  - an exact text fallback lists the regions;
  - nothing relies on color alone;
  - visible focus.
- Notation (DECISION-007):
  - words are the default, `NOT(x)`, and mixed AND/OR is always parenthesized;
  - the toggle shows the Java symbols;
  - rows are numbered from 1, values are T/F.
- Fading scaffold: region row badges follow each sheet's `showRegionRowNumbers`, in every piece of a split row.
- Feedback teaches a next reasoning move (the hint ladder). It doesn't just say right or wrong, and it never reveals answers before a correct attempt.

## Scope

### In scope

1. **Entry:** `ui/puzzle.html` plus `ui/puzzle-main.js`, added as a second Vite input in the existing config. `index.html` stays unchanged in behavior.
2. **Components** under `ui/components/shape-puzzles/` only:
   - `ShapePuzzleApp.vue`: title, expression banner with the notation toggle, sheet navigation (previous and next within the set), and a status area;
   - `ShapePuzzleCanvas.vue`: SVG regions from `src/shape-puzzles/geometry.js`, outside labels, colored and line-styled outlines, badges, two-state shading, keyboard handling, hover and focus linked to table rows;
   - `ShapePuzzleTable.vue`: an input-filled table with student T/F output entry, and an optional "Break it down" columns disclosure. Compact inspector mode on narrow screens.
3. **Flow:**
   1. Fill the outputs, then check them. Hints come from `buildTruthTableHint` stages.
   2. Once the outputs are correct, shading is enabled and checked. Region hints come from the hint-ladder approach.
   3. When both are correct, the revealed picture shows as a solid fill. The picture name appears only after success.
   
   Any shape-specific wording the existing Venn hints lack ("circle" vs. "shape") goes in a new puzzle-side wrapper. **Do not change the AP hint text.**
4. **URL contract:**
   - `?set=shapes-1&sheet=1..4` (defaults: the first set, sheet 1);
   - `&teacher=1` for the teacher view;
   - unknown values fall back gracefully with a message.
5. **Set data:** reuse `SET_SHAPES_1` and its exported `sheets` order. Add a neutral student-facing sheet title if one is needed. Never expose `pictureName` in the student UI before success, in the page `<title>`, or in the DOM.
6. **Tests:**
   - Vitest for flow state (outputs gate shading, the check logic, hint staging) and for URL parsing.
   - Playwright for:
     - loading `puzzle.html` from the built `dist/` under a subpath;
     - solving sheet 1 by keyboard only;
     - the notation toggle;
     - the greyscale emulation still distinguishing shapes;
     - 1366×768 with no vertical scroll at the default state, 1280×720, and 390×844;
     - `pictureName` absent from the DOM before success;
     - no answer controls without `teacher=1`.
   - **Build isolation (re-verifying plan-38 Q1 with the real entry; GATE-39A check):** `puzzle.html`'s chunk graph contains no module from `ui/App.vue` or from `ui/components/` outside `shape-puzzles/`. Shared vendor chunks (Vue, polygon-clipping) are fine. Assert this from Vite's build manifest (`build.manifest: true`) in a test, not by eye.
7. **Docs:** `docs/shape-puzzle-page.md` (URL contract, flow, how to add a set), plus one line each in `README.md` and `docs/deployment.md` noting the second page.

### Out of scope

- Any edit to existing AP components, `src/venn/diagram.js`, the parser, or the workflows.
- Restyling the main app. Its Venn label and hatching issues stay a separate future packet.

## Work Plan

1. Run `node scripts/dev/plan-status.js check plan-39` and summarize the job.
2. Add the Vite entry, then the build-isolation test (it should fail until the page exists, then pass).
3. Build the table (student output entry), then the canvas, then the app flow, with unit tests.
4. Add the e2e tests across the viewports and greyscale.
5. Run the full `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`, and `npm run build:gas`. Report every suite's counts.
6. Capture screenshots with Playwright, against `npm run preview` of the real build:
   - sheet 1 and sheet 3: at the start, with outputs checked, and solved;
   - the teacher view;
   - the phone view;
   - greyscale.
   
   Put them in the report folder. Describe each one only after opening it.
7. **GATE-39A: stop.** You may commit; don't push, deploy, or change the packet status.

## Validation Checklist

- [ ] The AP app is unchanged: the existing e2e smoke tests pass, and `git diff` shows no edits outside the scope files.
- [ ] The build-isolation test passes on the real entry.
- [ ] The output column starts blank, and shading can't be checked before the outputs are correct.
- [ ] No picture name and no answer controls appear in the student DOM before success (asserted in the e2e tests).
- [ ] The keyboard-only solve passes, and the greyscale distinguishability check passes.
- [ ] 1366×768 needs no vertical scroll in the default state.
- [ ] The full suites pass, with counts reported.
- [ ] Screenshots exist and are described honestly.

## Stop Conditions

Stop and report if:
- reusing the hint ladder would require changing AP hint text or behavior;
- isolation can't be achieved without touching existing AP components;
- any requirement seems to need a parser change, a new dependency, or a workflow edit;
- an existing test would need weakening.

## Progress Report

`reports/development/plan-39-shape-puzzle-page-implementation/progress.md`

Minimum contents:
- summary;
- files changed;
- the URL contract as built;
- suite counts;
- the isolation test result;
- the screenshot index;
- problems and remaining risks;
- the gate stop point.

Implementers do not set packet status.
