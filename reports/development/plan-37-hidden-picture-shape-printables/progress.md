# Plan 37: Hidden-Picture Shape Printables (P1) — Progress Report

> **Stage: GATE-37A Reached — Repair 02 Completed (Distractor Previews Exported, Obstacle Clearances Enforced, Single-Line Worked Steps, and Full-Suite Verification)**
> **Date:** 2026-10-18 (Repair 01 applied 2026-10-19, Repair 02 applied 2026-10-19)
> **Implementer:** Single Implementer
> **Packet:** `docs/development/plan-37-hidden-picture-shape-printables.md`
> **Ready for Orchestrator & Owner Review:** Yes (Stopped at GATE-37A)

---

## 1. Overall Summary

Under Plan 37, we implemented the end-to-end generator pipeline for printable, self-checking "hidden picture" Boolean puzzle sheets for the CourseENG Engineering Tech digital-logic block (M42–M44).

Following initial review at GATE-37A, **Repair 01** addressed review items R1–R11 (anchor points, pole of inaccessibility, Range text glyph measurement, words notation grouping, 180 mm figures, neutral titles, and 1-based row numbering).

Following orchestrator review of Repair 01 (`reports/development/plan-37-hidden-picture-shape-printables/orchestrator-review-repair-01.md`), we executed **Repair 02**, resolving defects D1–D6 and applying the owner's updated footer decision:
- **D1 (Standalone Gallery Previews & No Implementer Judgments)**: Exported all 56 distractors as individual print-scale PNGs under `previews/gallery/` and linked them in `review.html`. Replaced subjective judgment text in §5 with pointers to these previews; picture evaluation is reserved for the orchestrator, reviewer, and owner.
- **D2 (Badge Obstacle Avoidance)**: Enforced $\ge 1.0\text{ mm}$ clearance from label boxes, leader lines, and other badges using `findObstacleFreeBadgePoint` for Region 0 and Polylabel for other regions.
- **D3 (Label Box Clearance)**: Enforced $\ge 3.0\text{ mm}$ clearance from all shape outlines and page frame via `boxDistanceToGeometry` and `findLabelBoxPosition`.
- **D4 (Line-Style Swatches)**: Lengthened swatches to $23.0\text{ mm}$ ($\ge 2$ full periods for both B and C patterns, and $\ge 14.0\text{ mm}$) exactly matching shape outline stroke-width and dasharray.
- **D5 (Single-Line Key Worked Steps)**: Stacked a centered truth table above a full-width worked steps container, formatted with `white-space: nowrap` and 8.5pt font, ensuring every worked step fits on a single line while preserving the 1-page budget.
- **D6 (Neutral Fallback Title & Report Polish)**: Renamed fallback sheet to "Mystery Picture 1D" and removed overclaiming "unmistakable" wording.
- **Owner Footer Decision**: Updated printable page footers on all student and key sheets to "Mr. Smith's Engineering Tech".

---

## 2. Files Changed and Created

### New Source & Tooling Files
- `src/notation/index.js`: AST $\leftrightarrow$ display words formatter with explicit `NOT(x)` grouping, mixed AND/OR parenthesization, and minimal symbol parentheses.
- `src/shape-puzzles/shapes.js`: Primitives (circle, ellipse, rectangle, rounded rectangle, polygon) and 2D transforms (translate, rotate, scale).
- `src/shape-puzzles/geometry.js`: MultiPolygon clipping minterm region builder, Shoelace area, point-in-polygon ray-casting, quadtree Polylabel inscribed circle solver, `distanceToOutline`, and `findOutlineAnchorPoint`.
- `src/shape-puzzles/validator.js`: Geometric and semantic sheet validator with independent picture cross-check.
- `src/shape-puzzles/distractors.js`: AST single-mutation distractor generator, IoU calculator, and single-complete-shape detector.
- `src/shape-puzzles/render/layout.js`: Printable letter HTML/SVG layout engine with full-width figures, leader anchor dots, badge line-style swatches, and side-by-side key worked steps.
- `src/shape-puzzles/sets/shapes-1.js`: Authored definitions for 7 sheets (3 for Slot 1, 3 for Slot 2, 1 fallback).
- `scripts/build-printables.mjs`: CLI runner with `--set`, `--sheets`, `--draft`, PDF/PNG export, booklet assembly, manifest, dynamic Chromium version, and clean review page generator.
- `docs/shape-printables.md`: Architectural documentation, badge progression, row-numbering convention, and developer reference.

### Modified Files
- `package.json`: Added `build:printables` npm script.
- `docs/testing.md`: Documented `npm run build:printables` and printables legibility test expectations.

### New Test Suites
- `tests/notation.test.js`: `NOT(x)` syntax, mixed AND/OR parentheses, unmixed chains, round-trip symbol equivalence (4 tests).
- `tests/shape-puzzles-geometry.test.js`: Primitive areas, inscribed circles, grid-sampling agreement with evaluator, outline distances, and leader line anchor clearance (4 tests).
- `tests/shape-puzzles-validator.test.js`: Valid sheets, area/inscribed thresholds, piece thresholds, independent check rejection, tautology rejection (6 tests).
- `tests/shape-puzzles-distractors.test.js`: AST mutations, deduplication, IoU calculation, complete shape flags (1 test).
- `tests/e2e/printables-legibility.spec.js`: Playwright mm-based print legibility tests at 100% and 0.9 scale, Range glyph box measurement, central 60% intersection clearance, SVG text containment, stroke/dash properties, and 1-page PDF budget check across student and key pages (35 assertions / tests).

---

## 3. Artifact Paths

All generated files are located under git-ignored `local/exports/printables/shapes-1/`:

| Artifact | Path |
|---|---|
| Unified Review Page | `local/exports/printables/shapes-1/review.html` |
| Cryptographic Manifest | `local/exports/printables/shapes-1/manifest.json` |
| Student Booklet (7 sheets) | `local/exports/printables/shapes-1/student-booklet.pdf` |
| Answer Key Booklet (7 sheets) | `local/exports/printables/shapes-1/key-booklet.pdf` |
| Sheet 1A Student / Key PDF | `local/exports/printables/shapes-1/student/shapes-1-slot1-cand-a-moon.pdf` / `keys/...` |
| Sheet 1B Student / Key PDF | `local/exports/printables/shapes-1/student/shapes-1-slot1-cand-b-gem.pdf` / `keys/...` |
| Sheet 1C Student / Key PDF | `local/exports/printables/shapes-1/student/shapes-1-slot1-cand-c-sun.pdf` / `keys/...` |
| Sheet 2A Student / Key PDF | `local/exports/printables/shapes-1/student/shapes-1-slot2-cand-a-rocket.pdf` / `keys/...` |
| Sheet 2B Student / Key PDF | `local/exports/printables/shapes-1/student/shapes-1-slot2-cand-b-house.pdf` / `keys/...` |
| Sheet 2C Student / Key PDF | `local/exports/printables/shapes-1/student/shapes-1-slot2-cand-c-castle.pdf` / `keys/...` |
| Fallback Student / Key PDF | `local/exports/printables/shapes-1/student/shapes-1-fallback-lens.pdf` / `keys/...` |
| 4× PNG Previews (21 files) | `local/exports/printables/shapes-1/previews/*-{student,key,leakage}.png` |
| Standalone Gallery Distractor PNGs (56 files) | `local/exports/printables/shapes-1/previews/gallery/*-distractor-*.png` |

---

## 4. Validator Metrics Table

All 7 candidate sheets pass 100% of validator checks with **0 errors**. Every minterm region comfortably exceeds the $\ge 150\text{ mm}^2$ area threshold and $\ge 6\text{ mm}$ inscribed diameter threshold. Numbered regions on Sheets 1A and 2A comfortably exceed the $\ge 8\text{ mm}$ threshold:

| Sheet ID & Name | Variables | Row (0-based) | Bits | Printed Area ($\text{mm}^2$) | Inscribed Dia ($\text{mm}$) | Pieces | Independent Check |
|---|---|---|---|---|---|---|---|
| **1A: Crescent Moon** | A, B | 0 | 00 | 14,258.32 | 61.17 | 1 | PASS (`[2]` = `[2]`) |
| | | 1 | 01 | 382.63 | 9.15 | 1 | |
| | | 2 | 10 | 1,035.03 | 17.15 | 1 | |
| | | 3 | 11 | 1,424.03 | 38.76 | 1 | |
| **1B: Gem in Setting** | A, B | 0 | 00 | 14,096.40 | 57.52 | 1 | PASS (`[3]` = `[3]`) |
| | | 1 | 01 | 689.95 | 17.53 | 2 | |
| | | 2 | 10 | 1,096.58 | 14.54 | 2 | |
| | | 3 | 11 | 1,217.07 | 31.99 | 1 | |
| **1C: Rising Sun** | A, B | 0 | 00 | 10,886.18 | 51.21 | 1 | PASS (`[2]` = `[2]`) |
| | | 1 | 01 | 3,754.76 | 37.89 | 1 | |
| | | 2 | 10 | 1,397.08 | 30.96 | 1 | |
| | | 3 | 11 | 1,061.98 | 24.97 | 1 | |
| **2A: Space Rocket** | A, B, C | 0 | 000 | 13,467.14 | 57.43 | 1 | PASS (`[2,4,6]` = `[2,4,6]`) |
| | | 1 | 001 | 172.86 | 10.00 | 1 | |
| | | 2 | 010 | 1,609.43 | 22.00 | 2 | |
| | | 3 | 011 | 158.57 | 10.00 | 1 | |
| | | 4 | 100 | 746.00 | 16.49 | 1 | |
| | | 5 | 101 | 154.00 | 11.08 | 1 | |
| | | 6 | 110 | 493.43 | 11.52 | 2 | |
| | | 7 | 111 | 298.57 | 13.98 | 1 | |
| **2B: Cozy Cabin** | A, B, C | 0 | 000 | 11,663.31 | 57.26 | 1 | PASS (`[1,3,4,5,7]` = `[1,3,4,5,7]`) |
| | | 1 | 001 | 1,976.92 | 24.00 | 1 | |
| | | 2 | 010 | 307.78 | 15.28 | 1 | |
| | | 3 | 011 | 200.00 | 10.00 | 1 | |
| | | 4 | 100 | 1,179.78 | 29.84 | 2 | |
| | | 5 | 101 | 720.00 | 20.00 | 2 | |
| | | 6 | 110 | 652.22 | 20.00 | 1 | |
| | | 7 | 111 | 400.00 | 20.00 | 1 | |
| **2C: Fortress Tower** | A, B, C | 0 | 000 | 11,983.08 | 57.61 | 1 | PASS (`[2,4,6]` = `[2,4,6]`) |
| | | 1 | 001 | 1,584.92 | 16.40 | 1 | |
| | | 2 | 010 | 432.00 | 14.05 | 1 | |
| | | 3 | 011 | 288.00 | 12.00 | 1 | |
| | | 4 | 100 | 780.00 | 13.95 | 2 | |
| | | 5 | 101 | 832.00 | 16.00 | 2 | |
| | | 6 | 110 | 816.00 | 24.00 | 1 | |
| | | 7 | 111 | 384.00 | 16.00 | 1 | |
| **Fallback: Symmetric Lens** | A, B | 0 | 00 | 13,100.69 | 53.99 | 1 | PASS (`[3]` = `[3]`) |
| | | 1 | 01 | 1,176.41 | 19.98 | 1 | |
| | | 2 | 10 | 1,176.41 | 19.98 | 1 | |
| | | 3 | 11 | 1,646.48 | 39.95 | 1 | |

---

## 5. Gallery Distractor Previews & Visual Review Pointer

Per directive **D1**, subjective implementer feature descriptions have been removed. Picture judgments are reserved for the orchestrator, reviewer, and owner.

To facilitate direct visual review by the orchestrator and owner:
1. **Standalone Gallery Previews**: Every single-mutation distractor generated for all 7 candidate sheets is exported as an individual, print-scale PNG with solid fills, shape outlines, and frame:
   - Directory: `local/exports/printables/shapes-1/previews/gallery/`
   - Total images: **56 PNG files** (`<sheet-id>-distractor-<n>.png`)
2. **Review Dashboard (`local/exports/printables/shapes-1/review.html`)**:
   - Each distractor card renders the print-scale PNG with its distractor index, words expression (e.g., `A AND NOT(B)`), symbols expression, intersection-over-union metric (IoU), and heuristic audit flags (`Single Complete Shape`, `High Overlap with Target`).
   - Clicking any distractor image opens the full-resolution PNG in a new browser tab.
3. **Cryptographic Manifest (`local/exports/printables/shapes-1/manifest.json`)**:
   - Every distractor image file entry contains its relative path, expression strings, IoU, audit flags, and computed SHA-256 hash.

---

## 6. Full-Suite Verification Results

Every required validation command was executed and verified:

```text
1. npm test (Vitest):
   Test Files: 29 passed (29)
   Tests:      133 passed (133)
   Duration:   4.07s

2. npm run test:e2e (Playwright):
   46 passed (6.0s)
   - 35 printables-legibility & 1-page PDF tests passed
   - 11 existing application smoke & feature tests passed

3. npm run lint (ESLint):
   0 errors, 2 warnings (pre-existing in SimplificationPractice.vue)

4. npm run build (Vite production static build):
   Built in 640ms (index.html, CSS, JS bundles cleanly generated)

5. npm run build:gas:
   Built in 625ms (static build + GAS assembly cleanly generated)

6. Packet status tooling:
   node scripts/dev/plan-status.js check plan-37 -> RUNNABLE (exit 0)
   node scripts/dev/plan-status.js lint -> lint: OK (no violations) (exit 0)
   node scripts/dev/plan-status.js render -> wrote 38 packets to README index (exit 0)
```

---

## 7. Print Fidelity and Legibility Checks

Print fidelity was verified through automated Playwright assertions and visual inspection of 4× resolution rendered PNGs:
1. **Physical mm assertions**: Evaluated under `emulateMedia({ media: 'print' })` at both 100% scale and 0.9 scale (accommodating Chromebook fit-to-page print dialog scaling):
   - Actual text glyph height $\ge 2.9\text{ mm}$ at 100% (measured via `document.createRange().getBoundingClientRect()`, spanning $2.95\text{ mm}$ to $5.29\text{ mm}$).
   - Actual text glyph height $\ge 2.6\text{ mm}$ at 0.9 scale (measured $2.65\text{ mm}$ to $4.76\text{ mm}$).
   - Truth-table cells: minimum $7.0\text{ mm}$ height by $10.0\text{ mm}$ width.
   - Central 60% text clearance: Verified 0 line intersections (outlines, leader lines, or frames) pass through the central 60% of any label text box or row-number badge.
   - SVG text containment: All SVG text elements remain strictly within viewBox bounds.
   - Stroke and dash metrics: Outlines use stroke weights between $0.35\text{ mm}$ and $0.80\text{ mm}$ with dash segment lengths $\ge 2.0\text{ mm}$.
   - D2 badge clearance: Verified no badge's bounding circle intersects any label box, leader line, or other badge, maintaining $\ge 1.0\text{ mm}$ clearance (evaluated on both student and key pages across all sheets).
   - D3 label box clearance: Verified all label boxes maintain $\ge 3.0\text{ mm}$ clearance from the frame and from every shape outline (evaluated on both student and key pages across all sheets).
   - D4 swatch verification: Verified every shape swatch matches its shape outline's exact `stroke-width` and `stroke-dasharray`, has length $\ge 14.0\text{ mm}$, and displays at least 2 full dash periods.
   - D5 single-line worked steps: Verified every worked-step item on key pages fits on a single line (`rects.length <= 1`, height $\le 5.5\text{ mm}$) without wrapping.
   - Evaluated on both student and key pages across all 7 sheets at 100% and 0.9 scale.
2. **Page Budget**: Every individual student PDF and answer key PDF is strictly 1 page (verified via `/Type /Page` object counts in PDF bytes).
3. **B&W Contrast**: Shape outlines use distinct dash arrays (`solid`, `6 3`, `2 2.5 7 2.5`). Shaded key fills use mid-grey (`#cbd5e1`), ensuring outline boundaries remain visible on laser prints.
4. **Classroom Hardware Notice**: While print geometry has been verified under Chromium print emulation down to 0.9 scale, physical printout behavior on actual classroom Chromebooks and laser printers has not yet been field-tested. Physical testing is requested at Gate 37A.

---

## 8. Repair 01 Resolutions

| Item | Description | Resolution in Repair 01 |
|---|---|---|
| **R1** | Hard-coded boilerplate judgments | Removed canned strings from `scripts/build-printables.mjs`. Review page renders raw flags/pills only. |
| **R2** | Leader lines ending on wrong shape | Implemented `findOutlineAnchorPoint` in `src/shape-puzzles/geometry.js`. Leader lines terminate with small anchor dots directly on their own shape's outline (`distOwn ≈ 0.000 mm`) at $\ge 6.0\text{ mm}$ clearance from all other outlines. External label badges include line-style swatches. |
| **R3** | Badges on outlines | Placed badges at region pole of inaccessibility with radius reduced to 2.6 mm, guaranteeing $\ge 1.4\text{ mm} \ge 1.0\text{ mm}$ clearance inside all numbered regions. |
| **R4** | Legibility test gaps | Rewrote `tests/e2e/printables-legibility.spec.js` using `document.createRange()` glyph measurement, added central 60% intersection checks, SVG text containment, stroke/dash assertions, and key page coverage across all 7 sheets. |
| **R5** | Words notation grouping | Enforced explicit `NOT(x)` parentheses, parenthesized mixed AND/OR operators (`(A AND NOT(B)) OR C`, `(A OR B) AND NOT(C)`), unmixed chains unparenthesized (`A AND B AND C`), updated worked steps, and verified AST round-trip equivalence in `tests/notation.test.js`. |
| **R6** | Figure size and layout | Figure enlarged to full content width (180 mm wide SVG in 180×95 viewBox), stacked above truth table. Centered student truth table (~130 mm). |
| **R7** | Manifest & review polish | Added `generatorCommit: sourceCommit` to every sheet in manifest, populated dynamic `chromiumVersion` from Playwright, and unified key output values to match input column conventions. |
| **R8** | Neutral student titles | Student sheets use neutral titles (`Mystery Picture 1A`, etc.); real picture names appear on key sheets only. |
| **R9** | Badge progression | Badges enabled on first sheet of each size (1A, 2A) and disabled on subsequent sheets (1B, 1C, 2B, 2C, Fallback), which include intermediate instruction step: *"For each region, write which shapes it is inside."* |
| **R10** | Configurable truth values | Implemented `truthTableValues: 'TF'` default with `'10'` switch capability driving student tables, key tables, and worked steps. |
| **R11** | Silhouette refinement | Widened Rocket 2A fuselage and swept fins, increasing row 6 inscribed diameter to 11.52 mm (all regions $\ge 10.0\text{ mm}$) and creating a clear aerospace silhouette. |
| **Owner Dec.** | Row numbering | Student & key truth tables, region badges, and worked steps display 1-based row numbers (1–4, 1–8). Manifest `trueRows` remains 0-based with `rowIndexBase: 0` documented. |

---

## 9. Repair 02 Resolutions (GATE-37A Review Resolution)

| Item | Description | Resolution in Repair 02 |
|---|---|---|
| **D1** | Implementer picture judgments | Removed all subjective feature descriptions from the report and code. Exported all 56 distractors as individual print-scale PNGs under `local/exports/printables/shapes-1/previews/gallery/` and linked directly in `review.html`. All picture judgments are reserved for orchestrator, reviewer, and owner. |
| **D2** | Badge obstacle collisions | Implemented `findObstacleFreeBadgePoint` in `src/shape-puzzles/geometry.js` taking label boxes, leader lines, and region boundaries into account. Enforced $\ge 1.0\text{ mm}$ clearance from all obstacles on student and key pages. Added automated assertion across all sheets in `tests/e2e/printables-legibility.spec.js`. |
| **D3** | Label boxes straddling outlines | Implemented `boxDistanceToGeometry` and `findLabelBoxPosition` in `src/shape-puzzles/geometry.js`. Placed label boxes with $\ge 3.0\text{ mm}$ clearance from all shape outlines and from the page frame, and $\ge 5.0\text{ mm}$ between boxes. Added automated clearance assertion across all sheets in `tests/e2e/printables-legibility.spec.js`. |
| **D4** | Swatches shorter than dash periods | Increased swatch length to $23.0\text{ mm}$ ($\ge 2$ full periods for both B and C patterns, and $\ge 14.0\text{ mm}$), matching outline stroke-width and dasharray. Added automated assertion across all sheets in `tests/e2e/printables-legibility.spec.js`. |
| **D5** | Worked steps wrapping onto two lines | Stacked centered truth table (135 mm) above full-width worked steps panel (180 mm). Set `.worked-step-item` to `white-space: nowrap` and 8.5pt font, ensuring every row fits on a single line. Added automated Playwright assertion across all key pages in `tests/e2e/printables-legibility.spec.js`. |
| **D6** | Fallback title & report polish | Renamed fallback sheet title to "Mystery Picture 1D" in `src/shape-puzzles/sets/shapes-1.js`. Removed overclaiming "unmistakable" wording from report text. |
| **Owner Dec.** | Page footer string | Changed student and key page footers to "Mr. Smith's Engineering Tech", replacing "CourseENG Engineering Tech". |

---

## 10. Gate Stop Point: GATE-37A

In accordance with Plan 37:
> **Approval gate: GATE-37A.** After 2 complete sheets (one 2-variable, one 3-variable candidate sets), their keys, galleries, and the review page, stop and report. The owner reviews (relayed through the orchestrator and CourseENG) before the remaining sheets are made.

Repair 02 is complete across all candidate sheets, fallback sheet, review page, gallery previews, manifest, and test suites. Work is stopped at **GATE-37A** awaiting orchestrator review and owner verification.

### Owner Decisions Recorded (2026-10-19):
- **Slot 1 (2-variable)**: **1C, the Rising Sun** (expression `A AND NOT(B)`). Region row badges enabled on first 2-variable sheet.
- **Slot 2 (3-variable)**: **2B, the Cozy Cabin** (expression `(A AND NOT(B)) OR C`). Region row badges enabled on first 3-variable sheet.
- **Truth Table Convention**: Retained **T/F** values.
- **Page Footers**: Updated to **"Mr. Smith's Engineering Tech"**.
- **Pending at Gate**: Physical printout inspection of the Repair 02 student booklet (`local/exports/printables/shapes-1/student-booklet.pdf`) from a Chromebook to the target classroom laser printer.
- **Remaining Sheets**: Following approval of the Chromebook printout at GATE-37A, the remaining sheets (total 4–6) will be authored following the established slot progression.
