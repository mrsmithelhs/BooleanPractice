# Plan 39: Orchestrator Review at GATE-39A

- Reviewer: BP orchestrator
- Date: 2026-10-24
- Commit reviewed: `d379ee3`
- Verdict: **Not ready for owner review.** The architecture is sound, and the isolation and scope are clean. But the check feedback lets students brute-force both steps, which defeats DECISION-008 #5 (prediction first). One batched repair is needed (Repair 01).

## Verified

| Item | How checked | Result |
|---|---|---|
| Scope | `git diff --stat 64bdb31 d379ee3` | Only new `ui/components/shape-puzzles/`, `ui/puzzle*`, the `vite.config.js` inputs, tests, docs, and the report. No edits to AP components, `App.vue`, the parser, `src/feedback`, `src/venn`, or workflows |
| Suites | Re-ran them myself | 150/150 unit, 39/39 e2e, build emits `index.html` plus `puzzle.html` (39.6 kB JS, 13.0 kB CSS) |
| Isolation | Isolation test plus build output | The puzzle chunk is separate. Accepted |
| Hints | Read `feedback.js` and the `checkOutputs` code | Uses the shared `getHintStage` and `buildTruthTableHint`. The shading hints add a shape-specific stage on top of the same ladder. The AP text is untouched. Good |
| Screenshots | Opened 04, 06, 08 | Clean two-state start; colored and line-styled outlines with outside labels; badges in split pieces; solved state correct (rows 2, 4, 5, 6, 8) |

## Repair 01 (batch all)

**R1. Truth-table check reveals per-row correctness (blocking).**
- After *any* check, `ShapePuzzleTable.vue` marks every row `is-row-correct` / `is-row-error` (lines 90–91; the mobile inspector at 185).
- Combined with the "Fill All T / Fill All F" buttons, a student can fill all T, check once, flip the red rows, and pass without reasoning.
- Fix:
  - a failed check must **not** color individual rows. It shows only the staged hint message, which already names at most one row, and only at the specific stage;
  - **remove "Fill All T / Fill All F"** from the puzzle page. On an 8-row table they only serve guessing. A per-row cycle is enough;
  - keep the row coloring for the **verified** state only.
- Add e2e tests:
  - after a wrong check, no row carries a correct or error class;
  - no bulk-fill controls exist without `teacher=1`.

**R2. Shading check reveals the missed and extra regions (blocking).**
- After a failed shading check, the canvas outlines every missed region amber and every extra region red (`ShapePuzzleCanvas.vue` 78–79, 479–480).
- On the badge-free sheets (gem, rocket), a student can check with nothing shaded and then shade the outlined regions. That skips the region↔row identification those sheets exist to practice.
- Fix:
  - remove the per-region missed and extra highlighting. Feedback comes only through the staged hint text (`buildShapePuzzleShadingHint`), which names at most one region, and only at the specific stage;
  - keep the solved-state fill.
- Add an e2e test: after a wrong shading check, no region carries a missed or extra class.

**R3. Row 8 is hidden at 1366×768.**
- The page doesn't scroll, but the truth-table card scrolls internally, and row 8 and part of "Check Table Outputs" sit below its fold (screenshot 04). Students may never see row 8.
- Fit all 8 rows plus the check button without an inner scroll at 1366×768: tighten the row height, or let the card size to its content.
- Add an e2e assertion that the last row's and the button's bounding boxes are within the viewport and the card has no inner scroll.

**R4. Docs and lint:**
- add the one-line mentions of the second page to `README.md` and `docs/deployment.md`, required by packet scope item 7 and currently missing;
- run `eslint --fix` on `ui/components/shape-puzzles/`. 69 new formatting warnings; the count should return to the 2 old ones.

## Noted, no action

- The phone view (390 px) is usable, but the diagram's labels and badges are very small. Chromebooks are the target, so this is acceptable for now.
- `build.manifest: true` also publishes `dist/.vite/manifest.json` to Pages. It's harmless (asset names only) and kept so the isolation test can run.
- `pictureName` is absent from the student DOM before success, but it is in the JS bundle. A static site can't hide data from someone reading its source. That's acceptable for a practice page and is noted for the owner.
