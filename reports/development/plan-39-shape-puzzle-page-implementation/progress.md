# Plan 39: Shape Puzzle Page Implementation (P3) — Progress Report

- **Packet ID:** `plan-39-shape-puzzle-page-implementation`
- **Gate:** GATE-39A (Page implemented, build isolation verified, full test suites green, screenshots described, stopped before deployment)
- **Role:** Implementer
- **Date:** 2026-10-24
- **Mutation Level:** Source code, tests, docs. No deploy.
- **Status:** Complete for implementation (Repair 01 applied); stopped at GATE-39A awaiting orchestrator and owner review.
- **Ready for Orchestrator Review:** Yes

---

## 1. Executive Summary

This packet built the online shape logic puzzle practice page as a second static Vite multi-page entry (`ui/puzzle.html` and `ui/puzzle-main.js`) serving CourseENG Engineering Tech students.

The implementation strictly satisfies all six owner decisions from GATE-38A / DECISION-008:
1. **Two-state clean shading:** Regions start clean white and unshaded; clicking or pressing Space toggles clean vibrant blue fill (`#2563eb`).
2. **Colored outlines plus line styles:** Each shape outline features a distinct color (Shape A: blue, Shape B: crimson, Shape C: emerald) *and* distinct dash pattern (solid, dashed, dash-dot), outside label boxes with matching swatch lines, and leader lines pointing to the shape boundary. Fully distinguishable in 100% greyscale.
3. **Responsive screen layouts:** Full truth table beside the diagram on desktop ($\ge 860$ px); compact single-row inspector on narrow screens and phones ($< 860$ px). Fits 1366×768 Chromebook viewport with zero vertical scroll in the default state and no inner scrolling inside the truth table card.
4. **Whole expression in one step:** Subexpression breakdown is optional via a collapsible disclosure and is never mandatory.
5. **Output gating:** Students fill the truth table output column ($T/F$) and verify it before region shading checks can be unlocked.
6. **No student answer key:** Zero "solve" or answer controls appear on the student surface. A teacher view is available exclusively at `?teacher=1` without any links from the student UI.

**Zero changes** were made to the AP CSA web application (`ui/App.vue`, existing `ui/components/*.vue`, `src/venn/diagram.js`, the parser, or deployment workflows).

---

## 2. Files Changed and Created

### New Puzzle Page Source Files
- `ui/puzzle.html`: Multi-page HTML entry point for the shape logic puzzle.
- `ui/puzzle-main.js`: Lean JavaScript entry mounting `ShapePuzzleApp.vue` with dedicated stylesheet.
- `ui/components/shape-puzzles/ShapePuzzleApp.vue`: Top-level app shell with sheet navigation (1..4), expression banner, notation toggle, status and hint feedback area, and teacher key handling.
- `ui/components/shape-puzzles/ShapePuzzleCanvas.vue`: Interactive SVG canvas with letter-proportioned viewBox (`180 95`), polygon region layers, outside label boxes, leaders, swatches, and fading row badges for split regions.
- `ui/components/shape-puzzles/ShapePuzzleTable.vue`: Responsive truth table with student $T/F$ output column, optional "Break it down" disclosure, and mobile row inspector.
- `ui/components/shape-puzzles/feedback.js`: Shape-specific feedback wrapper reusing `getHintStage` and `buildTruthTableHint` from `@shared/feedback/index.js`.
- `ui/components/shape-puzzles/url.js`: URL query parser and builder enforcing parameter validation and fallbacks.
- `ui/components/shape-puzzles/puzzle.css`: Dedicated, self-contained stylesheet isolated from `ui/style.css`.

### Config & Documentation
- `vite.config.js`: Added `manifest: true` and configured multi-page input (`index.html` and `puzzle.html`).
- `docs/shape-puzzle-page.md`: New specification document covering architecture, URL contract, pedagogical flow, design decisions, and set extension guide.
- `README.md`: Added pointer to `docs/shape-puzzle-page.md` and `ui/puzzle.html`.
- `docs/deployment.md`: Added note detailing multi-page `dist/` output for GitHub Pages.

### Tests
- `tests/shape-puzzle-isolation.test.js`: Vitest test parsing Vite's emitted `dist/.vite/manifest.json` and asserting that `puzzle.html` imports zero modules from `ui/App.vue` or AP CSA practice components.
- `tests/shape-puzzle-flow.test.js`: Vitest test covering URL query parsing, output gating, and hint ladder progression (neutral $\to$ guided $\to$ specific).
- `tests/e2e/shape-puzzle.spec.js`: Playwright e2e test suite covering keyboard-only solving, notation toggling, greyscale accessibility, viewport fit (1366×768, 1280×720, 390×844), absence of `pictureName` before success, teacher view gating, uncolored rows on failed checks (R1), absence of student bulk buttons (R1), absence of missed/extra canvas outlines on failed checks (R2), and 1366×768 row 8 / button visibility without card scroll (R3).
- `scripts/capture-plan-39-screenshots.mjs`: Automation script capturing preview screenshots across viewports.

---

## 3. URL Contract as Built

```text
puzzle.html?set=shapes-1&sheet=1..4[&teacher=1]
```

- `set`: Defaults to `shapes-1`. Invalid values display a clear error card with a one-click reset to Mystery Picture 1.
- `sheet`: 1-based sheet index within the set (1 to 4). Out-of-bounds values display a fallback error.
- `teacher`: Flag (`1` or `true`). When present, activates the teacher view: pre-fills correct truth table outputs, pre-shades true regions, unlocks bulk-fill controls ("Fill All T / Fill All F / Clear"), displays the amber `Teacher Key` badge, and reveals the picture name.

---

## 4. Build Isolation Verification (GATE-39A Check)

Vite's build manifest (`dist/.vite/manifest.json`) was parsed and verified by automated test `tests/shape-puzzle-isolation.test.js`:
- `puzzle.html` produces an isolated 39.12 kB application chunk (`assets/puzzle-*.js`) and a dedicated 13.11 kB stylesheet (`assets/puzzle-*.css`).
- `puzzle.html` does **not** link `assets/main-*.css` (26.54 kB AP CSA stylesheet).
- The only shared chunk between the entries is `polygon-clipping` (`assets/polygon-clipping.esm-*.js`, 98.83 kB).
- The chunk graph of `puzzle.html` contains **zero occurrences** of `ui/App.vue`, `AssignmentPractice`, `ProblemReviewSummary`, `EquivalencePractice`, `SimplificationPractice`, or `VennPractice`.

---

## 5. Repair 01 Implementation Details

Following orchestrator review at GATE-39A (`reports/development/plan-39-shape-puzzle-page-implementation/orchestrator-review-gate-39a.md`), all four repair items (R1–R4) were resolved:

1. **R1: Failed truth-table check does not color individual rows.**
   - In `ShapePuzzleTable.vue`, removed all error row styling (`.is-row-error`). Row coloring (`.is-row-correct`, light green background) and cell output styling (`.val-true`, `.val-false`) now only activate once `outputsCorrect` is true (verified state).
   - Removed "Fill All T / Fill All F" buttons from student view (wrapped in `v-if="isTeacher"`).
   - Added e2e tests asserting that after an incorrect check, zero rows carry correct or error classes, and verifying bulk controls are absent without `teacher=1`.
2. **R2: Failed shading check does not outline missed or extra regions.**
   - In `ShapePuzzleCanvas.vue`, removed `.is-checked-missed` and `.is-checked-extra` classes, styles, and stroke-override logic. Feedback is communicated exclusively through the staged hint banner (`buildShapePuzzleShadingHint`).
   - Added e2e test asserting zero missed or extra classes exist after an incorrect shading check.
3. **R3: All 8 rows and check button visible at 1366×768 without inner card scroll.**
   - Removed `max-height: 380px` constraint on `.table-scroll-wrap` (`overflow-y: visible`) and tightened SVG canvas/header vertical paddings.
   - Added e2e test asserting that Row 8 and the "Check Table Outputs" button have bounding boxes strictly inside the 768px viewport, and that `scrollHeight <= clientHeight` on `.table-scroll-wrap`.
4. **R4: Docs and lint cleanup.**
   - Added explicit one-line mentions of `ui/puzzle.html` to `README.md` and `docs/deployment.md`.
   - Ran `eslint --fix --ext .js,.vue ui/components/shape-puzzles/`. All 69 template attribute formatting warnings resolved; project warning count returned cleanly to the 2 baseline warnings in `SimplificationPractice.vue`.

---

## 6. Test Suite Verification & Counts

All project test suites were run and verified:

| Suite | Command | Total Files | Total Tests | Status |
|---|---|---|---|---|
| **Vitest** | `npm test` | 32 passed (32) | 150 passed (150) | ✓ Green (+2 files, +11 tests) |
| **Playwright** | `npm run test:e2e` | 3 spec files | 43 passed (43) | ✓ Green (+12 tests) |
| **ESLint** | `npm run lint` | All project files | 0 errors, 2 warnings | ✓ Baseline clean (0 errors, 2 warnings in `SimplificationPractice.vue`) |
| **Static Build** | `npm run build` | 61 modules | Multi-page build | ✓ Built in ~725ms |
| **GAS Build** | `npm run build:gas` | Full build + package | Apps Script dist | ✓ Built in ~716ms |
| **Packet Status**| `plan-status.js lint`| Frontmatter checks | Zero violations | ✓ Clean |

---

## 7. Screenshot Index & Descriptions

All 11 screenshots were captured using Playwright against `npm run preview` of the production build (`dist/`) and inspected directly after opening each image:

| Screenshot | Viewport | Subject & State | Description After Opening File |
|---|---|---|---|
| `01-sheet1-start.png` | 1366×768 | Sheet 1: Mystery Picture 1 (Start) | Expression `A AND NOT(B)` in Words mode. Truth table shows input columns $A, B$ filled with $T/F$ and output column blank with dashed `–` buttons. No bulk-fill buttons exist. Canvas shows clean white unshaded regions with row badges 1..4. Shape A outline is blue solid with outside label box and swatch; Shape B is crimson dashed with outside label box and swatch. "Check Shading" button is locked (`🔒 Complete Table First`). Ample vertical headroom with zero page scrolling. |
| `02-sheet1-table-wrong.png` | 1366×768 | Sheet 1: Wrong Truth-Table Check (R1) | Student entered incorrect outputs across all rows ($T, T, F, T$) and clicked "Check Table Outputs". Feedback banner displays staged hint: *"The row for A AND NOT(B) does not match yet. Recheck the current row."* Crucially, **zero rows** carry green or red row coloring; all rows display neutral styling. Canvas remains locked. |
| `03-sheet1-outputs-checked.png` | 1366×768 | Sheet 1: Outputs Checked (Verified) | Student corrected all truth table outputs ($F, F, T, F$). With table verified, all rows now show light green background highlight and check button displays green `✓ Outputs Verified`. Top banner prompts student to shade TRUE regions. "Check Shading" button unlocked in emerald green. Canvas unshaded awaiting student interaction. |
| `04-sheet1-shading-wrong.png` | 1366×768 | Sheet 1: Wrong Shading Check (R2) | Student shaded wrong Region 1 (outside all shapes) instead of Region 3 (inside A, outside B) and clicked "Check Shading". Feedback banner displays staged hint: *"The shaded regions do not match yet. Recheck which rows are TRUE in your completed truth table."* Crucially, **no missed (amber) or extra (red) contour outlines appear** on the canvas; outlines retain clean blue solid and crimson dashed lines. |
| `05-sheet1-solved.png` | 1366×768 | Sheet 1: Solved | Region 3 (inside A and outside B) is shaded with solid emerald picture fill (`#059669`), forming a rising semi-circle over the horizontal base. Celebratory top banner displays: `🎉 Picture Revealed: Sun Rising Over Horizon!`. The picture name appears for the first time. Canvas button reads `✓ Solved`. |
| `06-sheet3-start.png` | 1366×768 | Sheet 3: Mystery Picture 3 (Cabin Start, R3) | Expression `(A AND NOT(B)) OR C`. All 8 truth table rows (1..8) and the "Check Table Outputs" button are completely visible inside the card with **zero inner scrolling** (`overflow-y: visible`). Canvas shows 3 shapes with outside labels: Shape A (house, solid blue), Shape B (chimney, dashed red), Shape C (yard, dash-dot green). Disconnected split-row regions 5 and 6 display duplicate row badges in both pieces. |
| `07-sheet3-outputs-checked.png` | 1366×768 | Sheet 3: Outputs Checked | All 8 truth table outputs filled ($F, T, F, T, T, T, F, T$). Table check button displays `✓ Outputs Verified` with all 8 rows verified in green. "Check Shading" button unlocked. |
| `08-sheet3-solved.png` | 1366×768 | Sheet 3: Solved | All intended true regions (Rows 2, 4, 5, 6, 8) are filled with solid emerald green, revealing the Cozy Cabin with its hearth chimney and surrounding yard. Celebratory banner reads: `🎉 Picture Revealed: Cozy Cabin with Hearth and Yard!`. |
| `09-teacher-view.png` | 1366×768 | Teacher View (`?teacher=1`) | Accessed via `puzzle.html?set=shapes-1&sheet=3&teacher=1`. Amber `Teacher Key` badge displayed in top header. Teacher bulk-fill controls ("Fill All T / Fill All F / Clear") appear above the table. Solved cabin picture and outputs prefilled. Solved picture name displayed immediately. |
| `10-phone-view.png` | 390×844 | Mobile Phone View | iPhone viewport width. Desktop table is hidden and replaced by the Truth Table Inspector. Diagram scales cleanly without horizontal overflow. Row selector tabs ($R1, R2, R3, R4$) allow easy touch selection. Active Row 1 card displays variable values ($A: F, B: F$), expression, and large $T/F$ cycling toggle button. |
| `11-greyscale.png` | 1366×768 | 100% Greyscale Simulation | Cabin diagram rendered in pure greyscale. Shape A (solid), Shape B (dashed `5 2.5`), and Shape C (dash-dot `5 2 2 2`) outlines, along with their respective outside label boxes and swatch lines, remain 100% distinguishable with zero reliance on color. |

---

## 8. Problems Encountered and How Resolved

1. **Vite Manifest Generation in Multi-Page Mode:**
   - *Problem:* Enabling `build.manifest: true` initially required verification that Vite placed `manifest.json` in `dist/.vite/manifest.json` under Vite 5 and correctly split the bundle.
   - *Resolution:* Configured rollup input options pointing to `ui/index.html` and `ui/puzzle.html`. Verified that Vite 5 emitted `dist/.vite/manifest.json` with dedicated entries.
2. **ESBuild Invariant in Vitest JSDOM:**
   - *Problem:* Directly importing Vite's `build` inside JSDOM in `tests/shape-puzzle-isolation.test.js` triggered an ESBuild `TextEncoder/Uint8Array` cross-realm invariant check error.
   - *Resolution:* Added `// @vitest-environment node` to the test file docblock so the build manifest inspection executes in Node.js realm while UI component tests continue in JSDOM.
3. **Variable Case Mismatch in Truth Table Assignment:**
   - *Problem:* `src/shape-puzzles/sets/shapes-1.js` uses uppercase variable names (`['A', 'B']`), but `generateTruthTable` evaluates expressions with lowercase variable assignments (`{ a: false, b: false }`). Initially, this resulted in table cells evaluating `row.assignment['A']` as `undefined` ($F$).
   - *Resolution:* Added a case-normalizing lookup helper `getRowVarValue(row, v)` in `ShapePuzzleTable.vue` checking `row.assignment[v] ?? row.assignment[v.toLowerCase()] ?? false`. Verified across both desktop and mobile views.
4. **Brute-Force Bypass via Per-Row & Per-Region Check Highlights (Repair 01):**
   - *Problem:* Initial implementation colored rows correct/error on failed truth table checks and highlighted missed/extra regions on failed shading checks, allowing guessing without deduction.
   - *Resolution:* Confined row correctness coloring strictly to post-verification state. Removed missed/extra region contour highlighting so feedback relies solely on the staged hint text ladder. Removed bulk-fill controls from student mode.

---

## 9. Gate Disposition: Stopped at GATE-39A

- The page is implemented, repaired for R1–R4, fully tested (150 Vitest, 43 Playwright, 0 ESLint errors), and verified via build isolation and real-world screenshots.
- The repository has **not** been deployed and workflows remain untouched.
- Ready for orchestrator and owner review at **GATE-39A**.
- Implementers do not set packet frontmatter status.
