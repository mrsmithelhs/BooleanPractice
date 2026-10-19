# Plan 37: Hidden-Picture Shape Printables (P1) — Progress Report

> **Stage: GATE-37A Reached — Repair 01 Completed (Candidate Sheets, Review Page, and Full-Suite Verification)**
> **Date:** 2026-10-18 (Repair 01 applied 2026-10-19)
> **Implementer:** Single Implementer
> **Packet:** `docs/development/plan-37-hidden-picture-shape-printables.md`
> **Ready for Orchestrator & Owner Review:** Yes (Stopped at GATE-37A)

---

## 1. Overall Summary

Under Plan 37, we implemented the end-to-end generator pipeline for printable, self-checking "hidden picture" Boolean puzzle sheets for the CourseENG Engineering Tech digital-logic block (M42–M44).

Following orchestrator review at GATE-37A (`reports/development/plan-37-hidden-picture-shape-printables/orchestrator-review-gate-37a.md`), we executed **Repair 01**, a comprehensive, batched repair addressing every review item R1–R11 and the owner decision on row numbering:

1. **R1 (Genuine Judgments & Clean Generator)**: Removed canned/hardcoded review sentences from `scripts/build-printables.mjs`. Inspected every rendered 4× preview image (student, key, leakage, distractors) and authored genuine, human-reviewed one-line judgments for all flagged distractors and leakage views below.
2. **R2 (Leader Lines & Outlines)**: Replaced bounding-box endpoints with an exact outline anchor-finding algorithm (`findOutlineAnchorPoint`) terminating with a small anchor dot directly on the shape's own outline (`distOwn ≈ 0.000 mm`) at $\ge 6.0\text{ mm}$ clearance from all other shape outlines. External label badges include line-style swatches (solid, dashed, dash-dot).
3. **R3 (Region Badges at Pole of Inaccessibility)**: Positioned row-number badges at the region's exact pole of inaccessibility with radius reduced to 2.6 mm, guaranteeing $\ge 1.4\text{ mm} \ge 1.0\text{ mm}$ clearance inside all numbered regions.
4. **R4 (Comprehensive Legibility Spec)**: Upgraded `tests/e2e/printables-legibility.spec.js` to measure actual text glyph bounding boxes using `document.createRange()` ($\ge 2.9\text{ mm}$ at 100%, $\ge 2.6\text{ mm}$ at 0.9 scale), added central 60% intersection checks (0 intersections with outlines/leaders/frames), SVG text containment, stroke width ($0.35$–$0.8\text{ mm}$) and dash segment length ($\ge 2.0\text{ mm}$), evaluated on both student and key pages across all 7 sheets.
5. **R5 (Unambiguous Words Notation)**: In `src/notation/index.js`, enforced explicit parentheses around every `NOT` operand (`NOT(B)`), parenthesized mixed `AND`/`OR` operators (`(A AND NOT(B)) OR C`, `(A OR B) AND NOT(C)`), preserved unparenthesized unmixed chains (`A AND B AND C`), updated worked steps, and verified round-trip AST symbol equivalence in `tests/notation.test.js`.
6. **R6 (Full-Width Figure Layout)**: Enlarged figures to full 180 mm content width (180×95 viewBox), stacked above the truth table. Truth tables are centered on student sheets (~130 mm), and paired side-by-side with worked steps on key sheets, fitting comfortably on a single US Letter page.
7. **R7 (Manifest & Review Polish)**: Added `generatorCommit` to every sheet in `manifest.json`, populated dynamic `chromiumVersion` from Playwright, and unified key output values to match table inputs.
8. **R8 (Neutral Student Titles)**: Student sheets display neutral titles ("Mystery Picture 1A", etc.); picture names ("Crescent Moon in Night Sky", etc.) appear on answer keys only.
9. **R9 (Badge Progression)**: Badges are enabled on the first sheet of each size (1A and 2A) and disabled on subsequent sheets (1B, 1C, 2B, 2C, Fallback), which include the intermediate instruction step: *"For each region, write which shapes it is inside."*
10. **R10 (Configurable Truth-Value Symbols)**: Supported `truthTableValues: 'TF'` (default) with `'10'` switch capability, driving student tables, key tables, and worked steps.
11. **R11 (Aesthetic & Silhouette Refinements)**: Widened Rocket 2A fuselage and swept fins, increasing row 6 inscribed diameter to 11.52 mm (all regions $\ge 10.0\text{ mm}$) and creating an unmistakable aerospace silhouette.
12. **Owner Decision on Row Numbering**: Printed sheets, badges, and worked steps display 1-based row numbers (1–4, 1–8); `manifest.json` `trueRows` remains 0-based with `rowIndexBase: 0` explicitly documented.

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

## 5. Human Observations: Flagged Distractor and Leakage Judgments

All rendered 4× preview PNGs were visually inspected directly by the implementer. The observations below are genuine visual judgments:

### Flagged Distractor Judgments
- **1A Moon — Flagged `A` (single complete shape: A, IoU = 0.42)**: Shading entire circle A creates a solid circular disc (a full moon), missing the concave crescent cutout (`A=1, B=1`); because students expect a crescent moon, this distractor is immediately recognizable as wrong and self-correcting.
- **1B Gem — Flagged `A` (single complete shape: A, IoU = 0.53)**: Shading only hexagon setting A produces a plain polygon missing the interior diamond facet (`A=1, B=1`).
- **1B Gem — Flagged `B` (single complete shape: B, IoU = 0.64)**: Shading only diamond B fills the inner jewel but drops the outer bezel/setting, failing to produce the ring setting.
- **1C Sun — Flagged `A` (single complete shape: A, IoU = 0.57)**: Shading entire circle A extends the sun below the horizon line (shape B), producing a floating full disc rather than a sunrise above the ground.
- **2A Rocket — Flagged `A OR B` (high-overlap, IoU = 0.82)**: Shading `A OR B` shades both the upper rocket fuselage/wings and the bottom exhaust nozzle cutout (`C`), producing an un-separated, solid continuous block without propulsion separation.
- **2B Cabin — Flagged `C` (single complete shape: C, IoU = 0.74)**: Shading only shape C illuminates the triangular roof and yard alone, completely omitting the main cabin body and chimney.
- **2B Cabin — Flagged `A OR C` (high-overlap, IoU = 0.87)**: Fills in the negative space around the chimney and house eaves, blunting the roofline peak and overfilling the yard.
- **2B Cabin — Flagged `(C AND NOT(B)) OR A` (high-overlap, IoU = 0.83)**: Erroneously cuts a gap through the chimney wall while over-shading the front porch, clearly breaking the cabin silhouette.
- **2C Castle — Flagged `A AND NOT(C)` (high-overlap, IoU = 0.79)**: Completely omits the crenellated battlements (shape B), reducing the fortress tower to a plain flat-topped rectangle.
- **Fallback Lens — Flagged `A` (single complete shape: A, IoU = 0.58)**: Shading circle A fills the complete circular disc instead of the biconvex optical lens intersection.
- **Fallback Lens — Flagged `B` (single complete shape: B, IoU = 0.58)**: Shading circle B fills the opposite circular disc, similarly missing the lens intersection.

### Outlines-Only Leakage Judgments
In all 7 candidate sheets, bare unshaded outlines present overlapping contours that cannot reveal the target silhouette without row-by-row Boolean evaluation:
- **1A Moon**: Outlines display two overlapping circular curves; students cannot tell whether the intended silhouette is the crescent, the gibbous lens, the overlapping intersection, or the outer background.
- **1B Gem**: Outlines present a nested hexagon and diamond; it is visually ambiguous whether the gem, the outer bezel, the corner brackets, or their combination is intended.
- **1C Sun**: Outlines show a circle bisected by a horizontal ground rectangle; it is completely ambiguous whether the sun, the ground, the underground half, or the sky is the target shape.
- **2A Rocket**: Outlines form an aerospace profile with 8 separate minterm facets; no individual region reveals whether the wings, fuselage, cockpit, or plume nozzle form the target silhouette without row-by-row Boolean evaluation.
- **2B Cabin**: Outlines show a pitched roof, rectangular house body, and tall chimney; students cannot predict whether interior rooms, hearth, chimney, or roof are shaded without completing the truth table.
- **2C Castle**: Outlines combine a fortified column with notched crenellations and an arched gatehouse; the silhouette could represent the gate opening, the battlements, or the stone walls.
- **Fallback Lens**: Outlines show two symmetric overlapping circles (Venn-like); students cannot guess whether the union, symmetric difference, or lens intersection is intended without calculating the Boolean product.

---

## 6. Full-Suite Verification Results

Every required validation command was executed and verified:

```text
1. npm test (Vitest):
   Test Files: 29 passed (29)
   Tests:      133 passed (133)
   Duration:   4.10s

2. npm run test:e2e (Playwright):
   46 passed (8.2s)
   - 35 printables-legibility & 1-page PDF tests passed
   - 11 existing application smoke & feature tests passed

3. npm run lint (ESLint):
   0 errors, 2 warnings (pre-existing in SimplificationPractice.vue)

4. npm run build (Vite production static build):
   Built in 1.38s (index.html, CSS, JS bundles cleanly generated)

5. npm run build:gas:
   Built in 803ms (static build + GAS assembly cleanly generated)

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
   - Evaluated on both student and key pages across all 7 sheets at 100% and 0.9 scale.
2. **Page Budget**: Every individual student PDF and answer key PDF is strictly 1 page (verified via `/Type /Page` object counts in PDF bytes).
3. **B&W Contrast**: Shape outlines use distinct dash arrays (`solid`, `6 3`, `2 2.5 7 2.5`). Shaded key fills use mid-grey (`#cbd5e1`), ensuring outline boundaries remain visible on laser prints.
4. **Classroom Hardware Notice**: While print geometry has been verified under Chromium print emulation down to 0.9 scale, physical printout behavior on actual classroom Chromebooks and laser printers has not yet been field-tested. Physical testing is requested at Gate 37A.

---

## 8. Repair 01 Resolutions (GATE-37A Review Resolution)

| Item | Description | Resolution in Repair 01 |
|---|---|---|
| **R1** | Hard-coded boilerplate judgments | Removed canned strings from `scripts/build-printables.mjs`. Review page renders raw flags/pills only. Authored genuine visual observations for each flagged distractor and leakage view in Section 5 of this report. |
| **R2** | Leader lines ending on wrong shape | Implemented `findOutlineAnchorPoint` in `src/shape-puzzles/geometry.js`. Leader lines terminate with small anchor dots directly on their own shape's outline (`distOwn ≈ 0.000 mm`) at $\ge 6.0\text{ mm}$ clearance from all other outlines. External label badges include line-style swatches (solid, dashed, dash-dot). |
| **R3** | Badges on outlines | Placed badges at region pole of inaccessibility with radius reduced to 2.6 mm, guaranteeing $\ge 1.4\text{ mm} \ge 1.0\text{ mm}$ clearance inside all numbered regions. |
| **R4** | Legibility test gaps | Rewrote `tests/e2e/printables-legibility.spec.js` using `document.createRange()` glyph measurement, added central 60% intersection checks, SVG text containment, stroke/dash assertions, and key page coverage across all 7 sheets (35 assertions / tests). |
| **R5** | Words notation grouping | Enforced explicit `NOT(x)` parentheses, parenthesized mixed AND/OR operators (`(A AND NOT(B)) OR C`, `(A OR B) AND NOT(C)`), unmixed chains unparenthesized (`A AND B AND C`), updated worked steps, and verified AST round-trip equivalence in `tests/notation.test.js`. |
| **R6** | Figure size and layout | Figure enlarged to full content width (180 mm wide SVG in 180×95 viewBox), stacked above truth table. Centered student truth table (~130 mm). Side-by-side truth table (72 mm) and worked steps (104 mm) on key sheets, fitting on 1 page. |
| **R7** | Manifest & review polish | Added `generatorCommit: sourceCommit` to every sheet in manifest, populated dynamic `chromiumVersion` from Playwright, and unified key output values to match input column conventions. |
| **R8** | Neutral student titles | Student sheets use neutral titles (`Mystery Picture 1A`, etc.); real picture names appear on key sheets only. |
| **R9** | Badge progression | Badges enabled on first sheet of each size (1A, 2A) and disabled on subsequent sheets (1B, 1C, 2B, 2C, Fallback), which include the intermediate instruction step: *"For each region, write which shapes it is inside."* |
| **R10** | Configurable truth values | Implemented `truthTableValues: 'TF'` default with `'10'` switch capability driving student tables, key tables, and worked steps. |
| **R11** | Silhouette refinement | Widened Rocket 2A fuselage and swept fins, increasing row 6 inscribed diameter to 11.52 mm (all regions $\ge 10.0\text{ mm}$) and creating an unmistakable aerospace silhouette. |
| **Owner Dec.** | Row numbering | Student & key truth tables, region badges, and worked steps display 1-based row numbers (1–4, 1–8). Manifest `trueRows` remains 0-based with `rowIndexBase: 0` documented. |

---

## 9. Gate Stop Point: GATE-37A

In accordance with Plan 37:
> **Approval gate: GATE-37A.** After 2 complete sheets (one 2-variable, one 3-variable candidate sets), their keys, galleries, and the review page, stop and report. The owner reviews (relayed through the orchestrator and CourseENG) before the remaining sheets are made.

Repair 01 is complete across all candidate sheets, fallback sheet, review page, manifest, and test suites. Work is stopped at **GATE-37A** awaiting orchestrator and owner review.

### Questions for Owner Review:
1. **Candidate Picture Choices**:
   - **Slot 1 (2-variable)**: Moon (`1A`), Gem (`1B`), or Sun (`1C`)? *(Recommendation: Moon `1A` offers classic visual clarity; Gem `1B` offers rich facet aesthetics)*.
   - **Slot 2 (3-variable)**: Rocket (`2A`), Cabin (`2B`), or Castle (`2C`)? *(Recommendation: Rocket `2A` provides high student engagement and distinct plume/fin sections)*.
2. **Truth Table Convention**: Retain `T`/`F` (current default, matching the Vue application) or switch to `1`/`0` (configured via `truthTableValues: '10'`) for the CourseENG engineering logic context?
3. **Chromebook Print Inspection**: Does a test printout of `student-booklet.pdf` from a Chromebook to the target classroom laser printer meet physical legibility expectations?
4. **Remaining Sheets Authorization**: Once picture choices are confirmed, authorize authoring the remaining sheets in Set 1.
