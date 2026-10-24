# Plan 39: Repair 02 (alternating table-only and shade-only sheets)

- Reviewer: BP orchestrator
- Date: 2026-10-24
- Base commit: `54e45a7`, plus the DECISION-008 amendment in this commit
- Trigger: the owner's GATE-39A preview. The page looks right, but doing both steps on every sheet turns the second step into mechanical translation.
- Authority: the **DECISION-008 amendment** in `docs/decision-log.md` (read it first). Everything else in the plan-39 packet still holds: scope files, non-goals, accessibility, notation, the no-reveal rules from Repair 01, and the stop conditions.

## The change in one paragraph

- Each sheet now asks for one representation.
  - On a **table** sheet, the student fills the output column, as today, and the regions can't be shaded.
  - On a **shade** sheet, the student shades regions straight from the expression, and the table is hidden.
- When the student's check is correct, the page fills in the *other* representation as feedback, and the sheet is solved:
  - on a table sheet, the TRUE regions are shaded;
  - on a shade sheet, the full table appears with its outputs filled in.
- Modes alternate through the set, starting with table. For shapes-1:
  - 1 sun: **table**, with badges;
  - 2 gem: **shade**;
  - 3 cabin: **table**, with badges;
  - 4 rocket: **shade**.

## Repairs (batch all)

**M1. Mode source (page-side, not in shared set data).**
- `src/shape-puzzles/sets/shapes-1.js` is shared with the printables. **Don't edit it.**
- Add a small module `ui/components/shape-puzzles/modes.js` with `getSheetMode(sheetIndex, override)`:
  - by default, an even 0-based index gives `'table'` and an odd one gives `'shade'`;
  - an override of `'table'` or `'shade'` wins.
- Extend `url.js`:
  - an optional `&mode=table|shade` sets the override, so the teacher can choose either mode for any sheet;
  - an unknown mode value falls back to the default, with a gentle message in the existing URL-error style;
  - `buildPuzzleUrl` keeps an explicit `mode` across prev/next navigation **only** if one was given.
- Unit-test both functions.

**M2. Table mode (sheets 1 and 3 by default).**
- Before success:
  - the table works as it does now: inputs filled, outputs blank, per-row T/F, check, staged hints, no per-row coloring on failure;
  - the canvas shows the outlines, labels, and badges (per `showRegionRowNumbers`);
  - regions are **not** shading controls: no click or Space toggle, not in the tab order, and no Clear or Check Shading buttons;
  - the hover/focus link from table rows to regions stays, because it is the scaffold that helps students map rows to regions;
  - the text fallback region list stays, as plain text.
- On a correct output check:
  - the page shades exactly the TRUE regions, using the existing solved fill;
  - the sheet is solved, and the same success message appears.

**M3. Shade mode (sheets 2 and 4 by default).**
- Before success:
  - **no truth table in the DOM**, on desktop or in the mobile inspector, and no "Break it down";
  - the diagram uses the freed width, and the 1366×768 no-scroll rule still holds;
  - regions toggle as today, with Clear Shading and Check Shading;
  - **shading is enabled from the start**. There is no outputs gate in this mode.
- Hints use the same ladder (`getHintStage`), with wording that **never mentions a table or row numbers** (the student has no table). Add `buildShapePuzzleShadeOnlyHint` in `feedback.js`. Leave `buildShapePuzzleShadingHint` for teacher/`mode` combinations only if it is still used; otherwise delete it with its tests.
  - **neutral:** "The shaded regions do not match yet. For each region, decide whether it is inside or outside each shape, then test the expression."
  - **guided:** the existing operator guidance.
  - **specific:** names one missed or extra region by location only, for example "The region inside Shape A and outside Shape B makes the expression TRUE, so it should be shaded." Use the existing `describeRegionLocation`.
- On a correct shading check:
  - the table appears below or beside the diagram, with inputs **and outputs filled in**, read-only, and verified styling;
  - the sheet is solved.
- A failed check still must not mark individual regions (Repair 01, R2).

**M4. Teacher view (`teacher=1`).** Unchanged: it shows both representations solved, whatever the mode. Add a small "Mode: table/shade" note on the teacher badge so the owner can see which mode the students get.

**M5. Success text: no wording change in this repair.** Keep the current solved message. The owner still has the "picture revealed" framing open, and it will be handled with the next shape sets.

**M6. Tests.**
- **Unit:**
  - mode defaults and overrides;
  - URL parsing of `mode`;
  - flow state per mode: table mode never enables shading; shade mode never requires outputs;
  - shade-only hint stages contain neither "table" nor "Row".
- **E2E**: update the existing specs to the new defaults, and add:
  - sheet 1 (table) keyboard-only solve. After success, the regions carry the solved fill, and the TRUE-region count matches the sheet;
  - sheet 2 (shade) keyboard-only solve. Before success, there is no table element in the DOM. After success, the table is visible with the correct T/F outputs;
  - in table mode, the regions are not focusable and toggle nothing on click or Space;
  - the no-reveal guarantees from Repair 01 still hold in each mode: compare computed styles before and after a wrong check, and don't just test for absent class names;
  - `pictureName` is absent from the DOM before success in **both** modes;
  - `?sheet=1&mode=shade` and `?sheet=2&mode=table` work, and `mode=bogus` falls back with a message;
  - 1366×768 with no vertical scroll, and 390×844 usable, in both modes.

**M7. Docs and report.**
- Update `docs/shape-puzzle-page.md`: the flow per mode, the `mode` URL parameter, and the default alternation.
- Add a "Repair 02" section to `progress.md` with the suite counts.
- Re-capture the screenshots from `npm run preview` of the real build:
  - sheet 1 at the start and solved;
  - sheet 2 at the start, after a wrong check, and solved;
  - the teacher view;
  - the phone view of sheet 2.
- Open each screenshot before describing it.

## Validation (orchestrator will re-check)

- Full `npm test`, `npm run test:e2e`, `npm run lint` (still only the 2 old warnings), `npm run build`, `npm run build:gas`, with counts.
- `git diff --stat 54e45a7` touches only `ui/components/shape-puzzles/`, `ui/puzzle*` (if needed), tests, `docs/shape-puzzle-page.md`, and the plan-39 report folder. **No** edits to `src/shape-puzzles/`, `src/feedback/`, AP components, or workflows.
- Stop and report if any requirement seems to need shared set data changes, AP hint changes, or weakening an existing test.

**Stop at GATE-39A again.** You may commit; don't push, deploy, or change the packet status.
