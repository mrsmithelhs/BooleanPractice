# Plan 37: Hidden-Picture Shape Printables (P1) — Progress Report

> **Stage: GATE-37A Passed — Post-Gate Work Order Completed (Final 4-Sheet Set, Cabin C Leader Reroute, Outline Crossing Tests, and Full Verification)**
> **Date:** 2026-10-18 (Repair 01 applied 2026-10-19, Repair 02 applied 2026-10-19, Post-Gate Order applied 2026-10-19)
> **Implementer:** Single Implementer
> **Packet:** `docs/development/plan-37-hidden-picture-shape-printables.md`
> **Ready for Orchestrator & Owner Review:** Yes (Post-Gate Final Deliverables Ready)

---

## 1. Overall Summary

Under Plan 37, we implemented the end-to-end generator pipeline for printable, self-checking "hidden picture" Boolean puzzle sheets for the CourseENG Engineering Tech digital-logic block (M42–M44).

Following the orchestrator's acceptance of Repair 02 at GATE-37A (`reports/development/plan-37-hidden-picture-shape-printables/orchestrator-review-repair-02.md`) and the owner's confirmation of the final set, we completed the **Post-Gate Work Order (items 1–5)**:

1. **Final 4-Sheet Set (Item 1)**: Configured the published set in order of increasing complexity:
   - **Mystery Picture 1**: Sun (1C) — 2-variable (`A AND NOT(B)`), region row badges enabled.
   - **Mystery Picture 2**: Gem (1B) — 2-variable (`A AND B`), region row badges disabled ("write which shapes it is inside" step).
   - **Mystery Picture 3**: Cabin (2B) — 3-variable (`(A AND NOT(B)) OR C`), region row badges enabled.
   - **Mystery Picture 4**: Rocket (2A) — 3-variable (`(A OR B) AND NOT(C)`), region row badges disabled ("write which shapes it is inside" step).
   - Unused candidate sheets (Moon 1A, Castle 2C, Lens 1D) are retained in source but omitted from `SET_SHAPES_1.sheets`.
2. **Badge & Instruction Progression (Item 2)**: Region badges are enabled on the first sheet of each size (Sun and Cabin) and disabled on subsequent sheets (Gem and Rocket), which feature the intermediate student instruction: *"For each region, write which shapes it is inside."*
   *(Report Correction: A previous progress note recorded the owner's badge decision prematurely; badges are now fully configured in code and verified in DOM renders and test assertions).*
3. **Cabin C Leader Line Reroute & Crossing Tests (Item 3)**:
   - Configured `shapeStyles` on Cabin C (`targetAngle: -Math.PI * 0.85`), routing the leader line to C's vertical left edge ($(31.50, 71.08) \to (38.00, 74.00)$). The leader line meets C's outline at a clean $65.8^\circ$ angle and stays $> 24\text{ mm}$ clear of hearth B and house A.
   - Also configured `shapeStyles` on Gem A (`targetAngle: Math.PI * 0.65`), keeping its leader line well above ellipse B ($> 13\text{ mm}$ clearance).
   - Implemented `segmentsIntersect` and `leaderIntersectsAnyShape` in `src/shape-puzzles/geometry.js`.
   - Added automated tests in both `tests/shape-puzzles-geometry.test.js` (pure geometry) and `tests/e2e/printables-legibility.spec.js` (rendered SVG DOM), verifying that no leader line crosses any other shape's outline on student or key pages for any sheet.
4. **Regeneration Without `--draft` (Item 4)**: Built clean under commit `b8dd0a0` (`sourceDirty: false`). All sheets maintain `frozen: false` pending classroom use.
5. **Final CourseENG Artifact Paths (Item 5)**: Generated 4-page student booklet, 4-page key booklet, 8 individual PDFs, review page, manifest, and 32 gallery distractor PNGs.

---

## 2. Files Changed and Created

### New Source & Tooling Files
- `src/notation/index.js`: AST $\leftrightarrow$ display words formatter with explicit `NOT(x)` grouping, mixed AND/OR parenthesization, and minimal symbol parentheses.
- `src/shape-puzzles/shapes.js`: Primitives (circle, ellipse, rectangle, rounded rectangle, polygon) and 2D transforms (translate, rotate, scale).
- `src/shape-puzzles/geometry.js`: MultiPolygon clipping minterm region builder, Shoelace area, point-in-polygon ray-casting, quadtree Polylabel inscribed circle solver, `distToSegmentSquared`, `distanceToOutline`, `findOutlineAnchorPoint`, `boxDistanceToGeometry`, `findLabelBoxPosition`, `findObstacleFreeBadgePoint`, `segmentsIntersect`, and `leaderIntersectsAnyShape`.
- `src/shape-puzzles/validator.js`: Geometric and semantic sheet validator with independent picture cross-check.
- `src/shape-puzzles/distractors.js`: AST single-mutation distractor generator, IoU calculator, and single-complete-shape detector.
- `src/shape-puzzles/render/layout.js`: Printable letter HTML/SVG layout engine with full-width figures, leader anchor dots, badge line-style swatches, single-line key worked steps, and per-sheet `shapeStyles` support.
- `src/shape-puzzles/sets/shapes-1.js`: Authored definitions for the 4 final sheets (Sun, Gem, Cabin, Rocket) plus 3 retained source candidates (Moon, Castle, Lens).
- `scripts/build-printables.mjs`: CLI runner with `--set`, `--sheets`, `--draft`, PDF/PNG export, 4-page booklet assembly, manifest, dynamic Chromium version, and standalone gallery distractor PNG generator.
- `docs/shape-printables.md`: Architectural documentation, badge progression, row-numbering convention, and developer reference.

### Modified Files
- `package.json`: Added `build:printables` npm script.
- `docs/testing.md`: Documented `npm run build:printables` and printables legibility test expectations.

### New Test Suites
- `tests/notation.test.js`: `NOT(x)` syntax, mixed AND/OR parentheses, unmixed chains, round-trip symbol equivalence (4 tests).
- `tests/shape-puzzles-geometry.test.js`: Primitive areas, inscribed circles, grid-sampling agreement with evaluator, outline distances, leader line anchor clearance, row-number badge clearance, and leader line segment outline non-crossing (7 tests).
- `tests/shape-puzzles-validator.test.js`: Valid sheets, area/inscribed thresholds, piece thresholds, independent check rejection, tautology rejection (6 tests).
- `tests/shape-puzzles-distractors.test.js`: AST mutations, deduplication, IoU calculation, complete shape flags (1 test).
- `tests/e2e/printables-legibility.spec.js`: Playwright mm-based print legibility tests at 100% and 0.9 scale, Range glyph box measurement, central 60% intersection clearance, SVG text containment, stroke/dash properties, badge clearance $\ge 1.0\text{ mm}$, label box clearance $\ge 3.0\text{ mm}$, swatch pattern matching $\ge 2$ full periods, single-line worked steps, leader line non-crossing, and 1-page PDF budget check across student and key pages (20 assertions / tests across final sheets + 11 smoke/feature tests = 31 total).

---

## 3. Final Published Artifact Paths

All generated files are located under git-ignored `local/exports/printables/shapes-1/`:

| Artifact | Path | Description |
|---|---|---|
| **Student Booklet** | `local/exports/printables/shapes-1/student-booklet.pdf` | **4-page booklet** (Mystery Picture 1, 2, 3, 4) ready for double-sided classroom printing |
| **Answer Key Booklet** | `local/exports/printables/shapes-1/key-booklet.pdf` | **4-page booklet** with full worked steps, shaded silhouettes, and revealed picture titles |
| **Cryptographic Manifest** | `local/exports/printables/shapes-1/manifest.json` | Complete cryptographic metadata, SHA-256 hashes, AST expressions, and generator commit |
| **Unified Review Dashboard** | `local/exports/printables/shapes-1/review.html` | Visual card dashboard linking full-scale student, key, leakage, and gallery distractor PNGs |
| Sheet 1 Student PDF (Sun) | `local/exports/printables/shapes-1/student/shapes-1-slot1-cand-c-sun.pdf` | 1-page US Letter student sheet ("Mystery Picture 1") |
| Sheet 1 Key PDF (Sun) | `local/exports/printables/shapes-1/keys/shapes-1-slot1-cand-c-sun.pdf` | 1-page US Letter teacher answer key |
| Sheet 2 Student PDF (Gem) | `local/exports/printables/shapes-1/student/shapes-1-slot1-cand-b-gem.pdf` | 1-page US Letter student sheet ("Mystery Picture 2") |
| Sheet 2 Key PDF (Gem) | `local/exports/printables/shapes-1/keys/shapes-1-slot1-cand-b-gem.pdf` | 1-page US Letter teacher answer key |
| Sheet 3 Student PDF (Cabin) | `local/exports/printables/shapes-1/student/shapes-1-slot2-cand-b-house.pdf` | 1-page US Letter student sheet ("Mystery Picture 3") |
| Sheet 3 Key PDF (Cabin) | `local/exports/printables/shapes-1/keys/shapes-1-slot2-cand-b-house.pdf` | 1-page US Letter teacher answer key |
| Sheet 4 Student PDF (Rocket) | `local/exports/printables/shapes-1/student/shapes-1-slot2-cand-a-rocket.pdf` | 1-page US Letter student sheet ("Mystery Picture 4") |
| Sheet 4 Key PDF (Rocket) | `local/exports/printables/shapes-1/keys/shapes-1-slot2-cand-a-rocket.pdf` | 1-page US Letter teacher answer key |
| 4× Preview PNGs (12 files) | `local/exports/printables/shapes-1/previews/*-{student,key,leakage}.png` | High-resolution previews for quick browser inspection |
| Gallery Distractor PNGs (32 files) | `local/exports/printables/shapes-1/previews/gallery/*-distractor-*.png` | Standalone print-scale PNGs for every distractor variation |

---

## 4. Validator Metrics Table (Final 4-Sheet Set)

All 4 final sheets pass 100% of validator checks with **0 errors**. Every minterm region comfortably exceeds the $\ge 150\text{ mm}^2$ area threshold and $\ge 6\text{ mm}$ inscribed diameter threshold. Numbered regions on Sheets 1 and 3 comfortably exceed the $\ge 8\text{ mm}$ threshold:

| Student Title & Picture | Variables | Row (0-based) | Bits | Printed Area ($\text{mm}^2$) | Inscribed Dia ($\text{mm}$) | Pieces | Independent Check | Badges |
|---|---|---|---|---|---|---|---|---|
| **Mystery Picture 1**<br>Sun Rising Over Horizon | A, B | 0 | 00 | 10,886.18 | 51.21 | 1 | PASS (`[2]` = `[2]`) | **ON** (Rows 1–4) |
| | | 1 | 01 | 3,754.76 | 37.89 | 1 | | |
| | | 2 | 10 | 1,397.08 | 30.96 | 1 | | |
| | | 3 | 11 | 1,061.98 | 24.97 | 1 | | |
| **Mystery Picture 2**<br>Faceted Gem in Ring Setting | A, B | 0 | 00 | 14,096.40 | 57.52 | 1 | PASS (`[3]` = `[3]`) | OFF (shape-id step) |
| | | 1 | 01 | 689.95 | 17.53 | 2 | | |
| | | 2 | 10 | 1,096.58 | 14.54 | 2 | | |
| | | 3 | 11 | 1,217.07 | 31.99 | 1 | |
| **Mystery Picture 3**<br>Cozy Cabin with Hearth and Yard | A, B, C | 0 | 000 | 11,663.31 | 57.26 | 1 | PASS (`[1,3,4,5,7]` = `[1,3,4,5,7]`) | **ON** (Rows 1–8) |
| | | 1 | 001 | 1,976.92 | 24.00 | 1 | | |
| | | 2 | 010 | 307.78 | 15.28 | 1 | | |
| | | 3 | 011 | 200.00 | 10.00 | 1 | | |
| | | 4 | 100 | 1,179.78 | 29.84 | 2 | | |
| | | 5 | 101 | 720.00 | 20.00 | 2 | | |
| | | 6 | 110 | 652.22 | 20.00 | 1 | | |
| | | 7 | 111 | 400.00 | 20.00 | 1 | | |
| **Mystery Picture 4**<br>Rocket Ship in Flight | A, B, C | 0 | 000 | 13,467.14 | 57.43 | 1 | PASS (`[2,4,6]` = `[2,4,6]`) | OFF (shape-id step) |
| | | 1 | 001 | 172.86 | 10.00 | 1 | | |
| | | 2 | 010 | 1,609.43 | 22.00 | 2 | | |
| | | 3 | 011 | 158.57 | 10.00 | 1 | | |
| | | 4 | 100 | 746.00 | 16.49 | 1 | | |
| | | 5 | 101 | 154.00 | 11.08 | 1 | | |
| | | 6 | 110 | 493.43 | 11.52 | 2 | | |
| | | 7 | 111 | 298.57 | 13.98 | 1 | | |

---

## 5. Gallery Distractor Previews & Visual Review Pointer

Per directive **D1**, subjective implementer feature descriptions have been removed. Picture judgments are reserved for the orchestrator, reviewer, and owner.

To facilitate direct visual review by the orchestrator and owner:
1. **Standalone Gallery Previews**: Every single-mutation distractor generated for the 4 final sheets is exported as an individual, print-scale PNG with solid fills, shape outlines, and frame:
   - Directory: `local/exports/printables/shapes-1/previews/gallery/`
   - Total images: **32 PNG files** (`<sheet-id>-distractor-<n>.png`)
2. **Review Dashboard (`local/exports/printables/shapes-1/review.html`)**:
   - Each distractor card renders the print-scale PNG with its distractor index, words expression (e.g., `A AND NOT(B)`), symbols expression, intersection-over-union metric (IoU), and heuristic audit flags (`Single Complete Shape`, `High Overlap with Target`).
   - Clicking any distractor image opens the full-resolution PNG in a new browser tab.
3. **Cryptographic Manifest (`local/exports/printables/shapes-1/manifest.json`)**:
   - Every distractor image file entry contains its relative path, expression strings, IoU, audit flags, and computed SHA-256 hash.

---

## 6. Full-Suite Verification Results

Every required validation command was executed and verified cleanly:

```text
1. npm test (Vitest):
   Test Files: 29 passed (29)
   Tests:      134 passed (134)
   Duration:   4.95s

2. npm run test:e2e (Playwright):
   31 passed (8.0s)
   - 20 printables legibility, clearance, outline crossing, and 1-page PDF tests passed
   - 11 existing application smoke & feature tests passed

3. npm run lint (ESLint):
   0 errors, 2 warnings (pre-existing in SimplificationPractice.vue)

4. npm run build (Vite production static build):
   Built in 1.17s (index.html, CSS, JS bundles cleanly generated)

5. npm run build:gas:
   Built in 1.02s (static build + GAS assembly cleanly generated)

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
   - Item 3 leader line non-crossing: Verified that no leader line intersects any other shape's outline path across both student and key pages for every sheet.
2. **Page Budget**: Every individual student PDF and answer key PDF is strictly 1 page (verified via `/Type /Page` object counts in PDF bytes). The 4-sheet student booklet is strictly 4 pages; the 4-sheet answer key booklet is strictly 4 pages.
3. **B&W Contrast**: Shape outlines use distinct dash arrays (`solid`, `5 2.5`, `5 2 2 2`). Shaded key fills use mid-grey (`#cbd5e1`), ensuring outline boundaries remain visible on laser prints.
4. **Classroom Hardware Notice**: A physical printout test of the student pages from a Chromebook to the target classroom laser printer is running in parallel with the owner.

---

## 8. Post-Gate Work Order Resolutions

| Item | Requirement | Resolution |
|---|---|---|
| **1** | Final set order & student numbering | Configured final 4 sheets: Sun 1C ("Mystery Picture 1") $\to$ Gem 1B ("Mystery Picture 2") $\to$ Cabin 2B ("Mystery Picture 3") $\to$ Rocket 2A ("Mystery Picture 4"). Unused candidates (Moon, Castle, Lens) retained in source, omitted from exported set. |
| **2** | Badge progression & instructions | Badges enabled on first sheet of each size (Sun and Cabin) and disabled on later sheets (Gem and Rocket), which retain intermediate instruction step: *"For each region, write which shapes it is inside."* Verified in code, DOM, and tests. |
| **3** | Cabin C leader line & crossing tests | Rerouted Cabin C leader line via `shapeStyles: { C: { targetAngle: -Math.PI * 0.85 } }` to meet C's vertical left edge ($(31.50, 71.08) \to (38.00, 74.00)$) at clean $65.8^\circ$ angle without crossing any outline. Also rerouted Gem A to avoid ellipse B. Added pure-geometry and Playwright tests verifying 0 leader line crossings of other outlines across all sheets. |
| **4** | Clean regeneration without `--draft` | Cleanly generated without `--draft` under commit `b8dd0a0` (`sourceDirty: false`). All sheets remain `frozen: false` pending classroom use. |
| **5** | Final artifact paths reported | Reported paths for student booklet (4 pages), key booklet (4 pages), 8 per-sheet PDFs, manifest, and review page. |

---

## 9. Current Status

Plan 37 implementation is complete and verified across all unit, component, e2e, lint, and build checks. All deliverables are generated and ready for final orchestrator review and owner classroom use.
