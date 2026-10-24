# Plan 39: Orchestrator Review of Repair 02 (alternating modes)

- Reviewer: BP orchestrator
- Date: 2026-10-24
- Commit reviewed: `b0bfaee`. Inline fixes are in the commit that adds this file.
- Verdict: **Accepted. Ready for the owner's GATE-39A preview.** M1–M7 are done. Three small polish items were fixed inline.

## Verified

| Item | How checked | Result |
|---|---|---|
| Scope | `git diff --stat 77b1d47 b0bfaee` | Only `ui/components/shape-puzzles/`, tests, `docs/shape-puzzle-page.md`, the capture script, and the report. No edits to `src/shape-puzzles/`, `src/feedback/`, AP components, or workflows |
| Suites | Re-ran them myself | 157/157 unit, 46/46 e2e, lint at the 2 old warnings, `build` and `build:gas` OK |
| Mode logic | Read `modes.js`, `url.js`, `ShapePuzzleApp.vue` | Index-based default (table on odd sheets); `mode=` override is kept across navigation only when it was given; bogus values fall back and show a message |
| Table mode | Code and screenshots 01–02 | Regions have no role and are out of the tab order. Clicks and Space are ignored both in the canvas and in the app handler. No shading toolbar. A correct check shades the TRUE regions |
| Shade mode | Code and screenshots 03–05 | The table is behind a `v-if`, so it is not in the DOM until the sheet is solved. Shading is enabled from the start. A correct check shows the verified, read-only table |
| Shade-only hints | `buildShapePuzzleShadeOnlyHint`, plus an e2e test asserting there is no "table" or "row" | Location wording only. The specific stage names one region |
| No-reveal | e2e computed-style comparisons in both modes | Hold |
| Teacher view | Screenshot 06 | Badge shows the mode; both representations are solved |

## Fixed inline by the orchestrator

1. Deleted `buildShapePuzzleShadingHint`. It was dead code that still talked about "your table" and "Row N", and nothing called it. The directive said to delete it if it was unused.
2. The table heading said "Step 1: Predict outputs", but there is no step 2 any more. It now says "Predict outputs" (and "Set the output for each row" in the mobile inspector).
3. On table sheets, the table's "Shaded" column showed four or eight empty circles before the sheet was solved, a dead column. It, and the inspector's shaded tag, now appear only once the outputs are verified, or in the teacher view.

After the fixes: 157/157 unit, 46/46 e2e, lint at the 2 old warnings, and the build is OK. I checked sheet 3 in the live preview: the table has no Shaded column before it is solved.

## Report accuracy

- The report says the packet status is "`ready`". It is `in-progress`, and it was not changed. The claim is wrong but harmless.
- The screenshot descriptions match the images I opened (01, 02, 03, 05).

## Noted for the owner (not regressions; present since Repair 01)

- **The solved diagram loses the top and bottom edges of its frame** (screenshots 02 and 05; the old Repair 01 screenshot shows the same). This is cosmetic.
- **In the solved table, F values are tinted red and T values green.** Students may read the red Fs as "wrong" even when the sheet is solved. A neutral style for F would avoid that.

Both are small. They can go into plan-40's canvas work or a quick fix. It's the owner's call.

## For the owner (GATE-39A preview)

- Run `npm run build`, then `npm run preview`, and open `http://127.0.0.1:4173/puzzle.html`.
- Sheets 1 and 3 are table-only, and sheets 2 and 4 are shade-only.
- Override the mode with `&mode=table` or `&mode=shade`. Teacher key: `&teacher=1`.
- After your sign-off, the Pages deploy is your step (GATE-39B), and plan-40 can start.
