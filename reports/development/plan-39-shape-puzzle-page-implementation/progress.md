# Plan 39: Shape Puzzle Page Implementation (P3) — Progress Report

- **Packet ID:** `plan-39-shape-puzzle-page-implementation`
- **Gate:** GATE-39A (Page implemented, build isolation verified, full test suites green, screenshots described, stopped before deployment)
- **Role:** Implementer
- **Date:** 2026-10-24
- **Mutation Level:** Source code, tests, docs. No deploy.
- **Status:** Complete for implementation (Repair 02 applied); stopped at GATE-39A awaiting orchestrator and owner review.
- **Ready for Orchestrator Review:** Yes

---

## 1. Executive Summary

This packet built the online shape logic puzzle practice page as a second static Vite multi-page entry (`ui/puzzle.html` and `ui/puzzle-main.js`) serving CourseENG Engineering Tech students.

Following the owner's DECISION-008 amendment (2026-10-24) and Repair 02, each sheet asks for **one representation**, alternating through the set starting with truth table:
- **Sheets 1 & 3: Table Mode.** Students predict the truth table outputs. Regions are not shading controls. Correct check automatically shades the TRUE regions with emerald picture fill (`#059669`) and solves the puzzle.
- **Sheets 2 & 4: Shade Mode.** Students shade regions directly from the boolean expression. No truth table exists in the DOM before success. Shading is enabled immediately. Hints never mention a table or row numbers. Correct check reveals the hidden picture and makes the completed, verified truth table appear with read-only outputs.
- An optional `&mode=table|shade` URL parameter allows teacher overrides for any sheet.

**Zero changes** were made to `src/shape-puzzles/sets/shapes-1.js` (shared with printables), `src/feedback/`, AP CSA components (`ui/App.vue`, `ui/components/*.vue`), or deployment workflows.

---

## 2. Files Changed and Created

### New Puzzle Page Source Files
- `ui/puzzle.html`: Multi-page HTML entry point for the shape logic puzzle.
- `ui/puzzle-main.js`: Lean JavaScript entry mounting `ShapePuzzleApp.vue` with dedicated stylesheet.
- `ui/components/shape-puzzles/modes.js`: Page-side mode calculation module (`getSheetMode`) defining default alternation and overrides.
- `ui/components/shape-puzzles/ShapePuzzleApp.vue`: Top-level app shell with sheet navigation (1..4), alternating mode coordination, expression banner, notation toggle, status banner, fallback error/warning containers, and teacher key handling.
- `ui/components/shape-puzzles/ShapePuzzleCanvas.vue`: Interactive SVG canvas supporting both table mode (static non-interactive visual reference) and shade mode (interactive region toggle, no gating), outside labels, swatches, and fading row badges for split regions.
- `ui/components/shape-puzzles/ShapePuzzleTable.vue`: Responsive truth table with student $T/F$ output column, read-only mode support, and mobile row inspector.
- `ui/components/shape-puzzles/feedback.js`: Feedback ladders including `buildShapePuzzleTableHint` and `buildShapePuzzleShadeOnlyHint` (never mentions table or row numbers).
- `ui/components/shape-puzzles/url.js`: URL query parser and builder with `&mode=table|shade` override handling, fallback warnings, and mode persistence across sheet navigation.
- `ui/components/shape-puzzles/puzzle.css`: Dedicated, self-contained stylesheet isolated from `ui/style.css`.

### Config & Documentation
- `vite.config.js`: Added `manifest: true` and configured multi-page rollup inputs (`index.html` and `puzzle.html`).
- `docs/shape-puzzle-page.md`: Specification document updated for DECISION-008 amendment (alternating modes, URL contract, no-reveal guarantees).
- `README.md`: Added pointer to `docs/shape-puzzle-page.md` and `ui/puzzle.html`.
- `docs/deployment.md`: Added note detailing multi-page `dist/` output for GitHub Pages.

### Tests
- `tests/shape-puzzle-isolation.test.js`: Vitest test parsing Vite's emitted `dist/.vite/manifest.json` and asserting that `puzzle.html` imports zero modules from `ui/App.vue` or AP CSA practice components.
- `tests/shape-puzzle-flow.test.js`: Vitest test covering mode defaults/overrides (`modes.js`), URL mode parsing and warnings, shade-only hint ladder (absence of "table" and "row"), and flow states.
- `tests/e2e/shape-puzzle.spec.js`: Playwright e2e test suite covering table mode keyboard solve with auto-shading, shade mode keyboard solve with auto-revealed table, computed style no-reveal assertions on failed checks in both modes, absence of `pictureName` before success in both modes, URL overrides (`&mode=shade`, `&mode=table`, `&mode=bogus`), 1366×768 fit without vertical scroll in both modes, and 390×844 mobile responsiveness.
- `scripts/capture-plan-39-screenshots.mjs`: Automation script capturing preview screenshots from real build.

---

## 3. URL Contract as Built

```text
puzzle.html?set=shapes-1&sheet=1..4[&mode=table|shade][&teacher=1]
```

- `set`: Defaults to `shapes-1`. Invalid values display a clear error card with a one-click reset to Mystery Picture 1.
- `sheet`: 1-based sheet index within the set (1 to 4). Out-of-bounds values display a fallback error.
- `mode`: Optional override (`table` or `shade`). By default, even 0-based indices (sheets 1 & 3) use `table` mode; odd indices (sheets 2 & 4) use `shade` mode. Unknown values fall back to the sheet's default mode and display a warning banner.
- `teacher`: Flag (`1` or `true`). Activates teacher key view with prefilled outputs, shaded regions, mode indication on badge, and revealed picture name.

---

## 4. Build Isolation Verification (GATE-39A Check)

Vite's build manifest (`dist/.vite/manifest.json`) was parsed and verified by automated test `tests/shape-puzzle-isolation.test.js`:
- `puzzle.html` produces an isolated 41.62 kB application chunk (`assets/puzzle-*.js`) and a dedicated 13.70 kB stylesheet (`assets/puzzle-*.css`).
- `puzzle.html` does **not** link `assets/main-*.css` (26.54 kB AP CSA stylesheet).
- The only shared chunk between the entries is `polygon-clipping` (`assets/polygon-clipping.esm-*.js`, 98.83 kB).
- The chunk graph of `puzzle.html` contains **zero occurrences** of `ui/App.vue`, `AssignmentPractice`, `ProblemReviewSummary`, `EquivalencePractice`, `SimplificationPractice`, or `VennPractice`.

---

## 5. Repair 01 Summary

- R1: Failed truth-table checks do not color individual rows. Removed student bulk-fill buttons.
- R2: Failed shading checks do not outline missed or extra regions in amber or red.
- R3: Fixed 1366×768 table card overflow (`overflow-y: visible`, all 8 rows and check button visible without inner scrolling).
- R4: Added second-page mentions in `README.md` and `docs/deployment.md`. Resolved 69 template formatting warnings with `eslint --fix`.

---

## 6. Repair 02 Implementation Details (DECISION-008 Amendment)

Following the owner's DECISION-008 amendment and orchestrator review (`orchestrator-repair-02-alternating-modes.md`), items M1–M7 were implemented in one batched pass:

1. **M1: Mode Source (`modes.js` & `url.js`):**
   - Implemented `ui/components/shape-puzzles/modes.js` with `getSheetMode(sheetIndex, override)`.
   - Updated `url.js` to parse optional `&mode=table|shade`, fall back gracefully with `modeWarning` on unknown values, and preserve explicit `mode` in `buildPuzzleUrl` only when provided.
2. **M2: Table Mode (Sheets 1 & 3 default):**
   - Canvas regions are not interactive controls (`tabindex="-1"`, no button role, no check/clear shading buttons, plain text fallback). Hover/focus row link remains active.
   - Checking correct table outputs automatically shades the TRUE regions in emerald green picture fill and solves the sheet immediately.
3. **M3: Shade Mode (Sheets 2 & 4 default):**
   - No truth table exists in the DOM before success (desktop table and mobile inspector absent). Diagram uses freed width in `.is-single-pane` layout.
   - Shading is enabled immediately from the start (no gating).
   - Added `buildShapePuzzleShadeOnlyHint` in `feedback.js`: ladder stages never mention "table" or "row".
   - Checking correct shading reveals the picture and causes the filled-in, verified truth table to appear with read-only outputs.
4. **M4: Teacher View:**
   - Both representations are prefilled and solved. Added `Mode: table/shade` text to the amber teacher badge.
5. **M5: Success Framing:**
   - Maintained existing celebratory solved banner `🎉 Picture Revealed: <pictureName>!`.
6. **M6: Test Coverage:**
   - Added unit tests for `modes.js`, URL mode parsing/warnings, shade-only hint absence of table/row words, and flow states.
   - Added e2e tests for keyboard solve in both modes, computed styles no-reveal comparisons on failed checks in both modes, absence of `pictureName` before success in both modes, and URL mode overrides/fallbacks.
7. **M7: Docs & Report:**
   - Updated `docs/shape-puzzle-page.md` with mode alternation and URL parameters.
   - Recaptured 7 screenshots from real build preview and verified each after opening.

---

## 7. Test Suite Verification & Counts

All project test suites were run and verified:

| Suite | Command | Total Files | Total Tests | Status |
|---|---|---|---|---|
| **Vitest** | `npm test` | 32 passed (32) | 157 passed (157) | ✓ Green (+7 tests) |
| **Playwright** | `npm run test:e2e` | 3 spec files | 46 passed (46) | ✓ Green (+3 tests) |
| **ESLint** | `npm run lint` | All project files | 0 errors, 2 warnings | ✓ Baseline clean (0 errors, 2 warnings in `SimplificationPractice.vue`) |
| **Static Build** | `npm run build` | 62 modules | Multi-page build | ✓ Built in ~782ms |
| **GAS Build** | `npm run build:gas` | Full build + package | Apps Script dist | ✓ Built in ~714ms |
| **Packet Status**| `plan-status.js lint`| Frontmatter checks | Zero violations | ✓ Clean (`OK`) |

---

## 8. Screenshot Index & Descriptions (Repair 02)

All 7 screenshots were captured using Playwright against `npm run preview` of the production build (`dist/`) and inspected directly after opening each image:

| Screenshot | Viewport | Subject & State | Description After Opening File |
|---|---|---|---|
| `01-sheet1-start.png` | 1366×768 | Sheet 1: Table Mode Start | Expression `A AND NOT(B)`. Truth table outputs blank with dashed `–` buttons. Subtitle reads "Visual diagram"; no shading buttons exist on canvas card. Outlines A (solid blue) and B (dashed red) shown with outside labels, swatches, and row badges 1..4. Ample vertical headroom, zero vertical scroll. |
| `02-sheet1-solved.png` | 1366×768 | Sheet 1: Table Mode Solved | Table outputs verified ($F, F, T, F$). Check button displays green `✓ Outputs Verified`. Correct check automatically shades TRUE region 2 (inside A, outside B) with solid emerald picture fill (`#059669`). Celebratory banner displays: `🎉 Picture Revealed: Sun Rising Over Horizon!`. |
| `03-sheet2-start.png` | 1366×768 | Sheet 2: Shade Mode Start | Sheet 2: Gem (`A AND B`). **No truth table in the DOM!** Canvas card is centered in single-pane layout with freed width. Subtitle reads "Shade TRUE regions". "Check Shading" and "Clear Shading" buttons are enabled immediately from the start. Outlines A and B shown without badges. |
| `04-sheet2-wrong-check.png` | 1366×768 | Sheet 2: Wrong Shading Check | Student deliberately shaded wrong region 0 (outside all shapes) and clicked "Check Shading". Feedback banner displays shade-only hint: *"The shaded regions do not match yet. For each region, decide whether it is inside or outside each shape, then test the expression."* Zero mention of "table" or "row". Outlines retain clean contours with **zero amber/red error markers**. |
| `05-sheet2-solved.png` | 1366×768 | Sheet 2: Shade Mode Solved | Student shaded intended gem region 3 (inside A and B). Solved banner displays: `🎉 Picture Revealed: Faceted Gem in Ring Setting!`. Canvas button reads `✓ Solved`. **Truth table appears filled and verified on the right**, displaying inputs and verified outputs ($F, F, F, T$) with `✓ Outputs Verified`. |
| `06-teacher-view.png` | 1366×768 | Teacher View (`?teacher=1`) | Accessed via `puzzle.html?set=shapes-1&sheet=2&teacher=1`. Amber badge in header displays `Teacher Key · Mode: shade`. Both representations displayed prefilled and solved. Solved picture name displayed immediately. |
| `07-phone-view-sheet2.png` | 390×844 | Mobile Phone View (Sheet 2) | Narrow mobile viewport. Diagram scales cleanly with no table in DOM and zero horizontal overflow. Check Shading and Clear Shading controls stack nicely above canvas. |

---

## 9. Gate Disposition: Stopped at GATE-39A

- The page is implemented with alternating Table and Shade modes satisfying DECISION-008 amendment.
- Build isolation, no-reveal guarantees (tested via computed styles), and full test suites verified green.
- The repository has **not** been deployed and workflows remain untouched.
- Ready for orchestrator and owner review at **GATE-39A**.
- Implementers do not set packet frontmatter status.
