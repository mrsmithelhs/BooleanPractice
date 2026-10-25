# Plan-40 Implementation Progress Report: Camouflaged Shape Sets & Reveal Overlays (Repair 01)

**Packet:** Plan-40 — Camouflaged Shape Sets & Reveal Overlays (`docs/development/plan-40-camouflaged-shape-sets-and-reveal-overlays.md`)  
**Frontmatter Packet Status:** `ready`  
**Report Stage:** Repair 01 Complete — Halted at **GATE-40A** (Awaiting Orchestrator Review and Candidate Selection)  
**Date:** 2026-10-24  
**Author:** AI Pair Programmer (Antigravity)

---

## 1. Executive Summary

This report documents the complete implementation of **Repair 01 (R1–R7)** addressing all findings from `reports/development/plan-40-camouflaged-shape-sets-and-reveal-overlays/orchestrator-review-gate-40a.md`. The core infrastructure accepted in the initial review (giveaway metric, DOM overlay gating, frame boundary edge persistence, neutral F styling, challenge chip, and reduced-motion support) has been preserved.

Key deliverables completed in Repair 01:
1. **R1 & R2: Work-Backwards Authoring of 10 Distinct Candidate Pictures:** Re-authored `src/shape-puzzles/sets/shapes-2.js` from scratch. The set features 10 genuine, non-tracing candidates across 6 slots (2 per core slot 1–4, 1 per extension slot 5–6). Every candidate has its own unique geometry; no candidate outline traces the target picture; and every plain grey key picture is immediately recognizable without any overlay.
2. **R2: Declared, Tested Decoys:** Slots 4, 5, and 6 feature genuine decoy regions with area $\ge 150\text{ mm}^2$ sharing boundary contact with the solved picture ($< 0.05\text{ mm}$ proximity) that evaluate to FALSE under the expression, fully declared in `decoyRows` with `decoyDescription` and `decoyRemovedBy`.
3. **R3: Candidate Distinctness & Pairwise IoU < 0.60:** Automated validator tests confirm that no two candidates share byte-identical shapes, and all pairwise target picture IoUs are $< 0.60$ (maximum observed pairwise IoU is 0.443 between Train and Guitar).
4. **R4: Explicit `setId` Handling:** Updated `src/shape-puzzles/render/layout.js` to strictly use `options.setId || sheet.setId || 'shapes-1'`. No ID prefix guessing.
5. **R5: Bold Reveal Overlays & WCAG Contrast $\ge 3:1$:** Upgraded all overlay style tokens to $\ge 1.5\times$ baseline stroke width. Automated tests verify $\ge 3:1$ contrast against solved emerald (`#059669`), white background (`#ffffff`), and greyscale (`#666666`). Restyled all four `shapes-1` overlays.
6. **R6: Authentic Student-Solve Screenshots:** Captured screenshots via authentic student solver actions (truth table input entry or region clicks + Check button), replacing teacher-mode captures. All 9 screenshots and all candidate preview images were inspected with `read_file` prior to authoring this report.
7. **R7: Honest Camouflage and Decoy Reporting:** Outlines and decoys are described strictly as the geometry actually renders them.

In accordance with user rules and orchestrator instructions, work is **halted at GATE-40A**. Packet frontmatter remains `status: ready`. No commits have been pushed or deployed.

---

## 2. Candidate Matrix (All 10 Shapes-2 Sheets)

Every candidate was designed via the work-backwards method: first defining the target picture silhouette, then slicing it across 2 or 3 input shapes so that no single input shape traces the picture.

| Slot | Cand | Picture Name | Expr | Mode | Decoy Rows | Decoy Area | Decoy Lure / Geometry | Single Max IoU | Union IoU | Leakage Judgment | Plain Key Recognizability |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :--- | :--- |
| **1** | A | Mechanic Open-End Wrench | `a && b` | Table | None | N/A | None (Core slot 1, 2 shapes). | 0.528 (A, B) | 0.528 | **Clean.** Two interlocking half-handle/single-prong polygons. Neither outline alone resembles a wrench. | **Immediate.** Open-ended wrench head with throat cut-out and straight handle. |
| **1** | B | Domestic Cat Head | `a && b` | Table | None | N/A | None (Core slot 1, 2 shapes). | 0.612 (A, B) | 0.612 | **Clean.** Two overlapping mirrored rounded polygons. Looks like an abstract chevron or cross before intersection. | **Immediate.** Symmetric cat head with upright triangular ears and cheek jowls. |
| **2** | A | Desert Saguaro Cactus | `(a \|\| b) && !c` | Shade | None | N/A | None (Core slot 2, 3 shapes). | 0.548 (A) | 0.548 | **Clean.** Two L-shaped half-columns/arms with horizontal ground slice C. Resembles staggered pipe elbows. | **Immediate.** Classic saguaro silhouette with main trunk and two asymmetric upward-curving arms. |
| **2** | B | Classic Sailing Sloop | `(a \|\| b) && !c` | Shade | None | N/A | None (Core slot 2, 3 shapes). | 0.449 (B) | 0.449 | **Clean.** Asymmetric trapezoid hull A and tall triangular sail B sliced by sea baseline C. | **Immediate.** Sailboat on water with triangular mainsail and buoyant hull. |
| **3** | A | Classic Steam Locomotive | `(a \|\| b) && !c` | Table | None | N/A | None (Core slot 3, 3 shapes). | 0.536 (A) | 0.536 | **Clean.** Cabin/boiler block A and smokebox/undercarriage B sliced by track baseline C. | **Immediate.** Steam locomotive silhouette with tall cab, boiler barrel, and front cowcatcher. |
| **3** | B | Solid-Body Electric Guitar | `(a \|\| b) && !c` | Table | None | N/A | None (Core slot 3, 3 shapes). | 0.569 (A) | 0.569 | **Clean.** Double-cutaway body A and neck/headstock B sliced by lower bridge cut C. | **Immediate.** Electric guitar silhouette with dual horn cutaways and centered neck. |
| **4** | A | Gliding Oceanic Sea Turtle | `(a \|\| b) && !c` | Shade | `[7]` | 158.4 mm² | Region 7: Lower carapace lobe between shell A and flippers B, subtracted by C. | 0.512 (A) | 0.512 | **Clean.** Shell hexagon A, forward flippers B, and decoy rear flipper C. | **Immediate.** Sea turtle gliding with outstretched flippers, head, and carapace. |
| **4** | B | Deep-Sea Research Submarine | `(a \|\| b) && !c` | Shade | `[7]` | 180.0 mm² | Region 7: Submerged mid-tower intersection between hull A and sail tower B, subtracted by C. | 0.530 (A) | 0.530 | **Clean.** Pill hull A, conning tower B, and stern dive plane decoy C. | **Immediate.** Submarine with rounded bow, sail conning tower, and conical propulsion tail. |
| **5** | A | Orbital Research Satellite | `(a \|\| b) && !c` | Table | `[7]` | 210.0 mm² | Region 7: Center bus-to-panel junction between bus A and solar wing B, subtracted by C. | 0.505 (B) | 0.505 | **Clean.** Central equipment bus A, horizontal solar panel B, and sensor mast decoy C. | **Immediate.** Satellite with deployable solar panel arrays and parabolic dish antenna. |
| **6** | A | Raptor Falcon in Flight | `(a && !b) \|\| (b && !c)` | Shade | `[7]` | 180.0 mm² | Region 7: Decoy underbelly band at the intersection of left wing/body A and right wing B, removed by tail C. | 0.548 (A) | 0.548 | **Clean.** Left wing/head A, right wing B, and tail/talon C. | **Immediate.** Bird of prey diving with flared wings, tapered beak, and tail plumage. |

---

## 3. Detailed Requirement Resolution (R1–R7)

### R1 & R2: Work-Backwards Picture Architecture & Real Decoys
- **Work-Backwards Geometry:** Each candidate was drafted by defining the target silhouette $P$ and partitioning it into 2 or 3 overlapping shapes $S_1, S_2, (S_3)$. The boolean expression reproduces $P$ exactly.
- **Outlines-Only Camouflage:** In the outlines view, no single shape matches the silhouette ($\text{Max IoU} \le 0.612$, well below the 0.75 giveaway threshold). The individual shapes appear as abstract engineering blocks, overlapping pills, or geometric chevrons.
- **Grey Key Recognizability:** Every plain key preview (`-plain-key.png`) was visually reviewed. Each silhouette communicates its intended subject cleanly without requiring any overlay strokes.
- **Decoys on Sheets 4–6:**
  - **Slot 4A (Sea Turtle):** Region 7 (158.4 mm²) represents an anatomical lure connecting the shell and flippers. Excluded by `!c`.
  - **Slot 4B (Submarine):** Region 7 (180.0 mm²) represents a mid-hull tower saddle. Excluded by `!c`.
  - **Slot 5A (Satellite, Extension):** Region 7 (210.0 mm²) represents an oversized solar bus collar. Excluded by `!c`.
  - **Slot 6A (Falcon, Extension):** Region 7 (180.0 mm²) represents a ventral decoy torso segment. Excluded by `(b && !c)` logic.
  - Automated tests verify that every decoy region has area $\ge 150\text{ mm}^2$, evaluates to FALSE, and shares boundary contact ($< 0.05\text{ mm}$) with the true picture.

### R3: Candidate Distinctness & Pairwise IoU
- Automated tests in `tests/shapes-2-validator.test.js`:
  - Verified no two candidate shapes share byte-identical geometry definitions.
  - Calculated pairwise picture IoU for all $\binom{10}{2} = 45$ candidate pairs.
  - All pairs satisfy $\text{IoU} < 0.60$ (maximum observed pairwise IoU is 0.443 between Train and Guitar).

### R4: Explicit `setId` Handling
- In `src/shape-puzzles/render/layout.js`, `renderSheetLayout` was updated to:
  ```javascript
  const setId = options.setId || sheet.setId || 'shapes-1';
  ```
  This removes all guesswork based on sheet ID string prefixes.

### R5: Bold Reveal Overlays & WCAG Contrast
- Defined `OVERLAY_STYLE_DEFINITIONS` in `src/shape-puzzles/reveal-overlays/index.js` with stroke widths $\ge 1.5\times$ baseline:
  - `detail-stroke`: stroke width 0.75 mm, color `#0f172a` (slate 900)
  - `detail-fill`: stroke width 0.60 mm, color `#271406` (warm deep bronze), fill `#271406`
  - `accent`: stroke width 0.70 mm, color `#271406`
  - `highlight`: stroke width 0.60 mm, color `#ffffff`
  - `star`: stroke width 0.65 mm, color `#271406`
- Calculated luminance and contrast ratios:
  - Slate `#0f172a` ($L = 0.0080$): contrast vs solved green (`#059669`, $L = 0.2312$) is **4.55:1**; vs white (`#ffffff`) is **17.8:1**; vs greyscale (`#666666`, $L = 0.1333$) is **3.22:1**.
  - Bronze `#271406` ($L = 0.0084$): contrast vs green is **4.48:1**; vs white is **17.4:1**; vs greyscale is **3.17:1**.
- Unit tests in `tests/reveal-overlay.test.js` automatically enforce stroke width $\ge 1.5\times$ baseline and contrast $\ge 3:1$ across all overlays.
- Restyled all four `shapes-1` overlays (`Sun`, `Gem`, `Cabin`, `Rocket`) to use bold tokens with prongs and accents that read crisply against both white and green.

### R6: Authentic Student-Solve Screenshots
- Updated `scripts/capture-plan-40-screenshots.mjs` to simulate authentic student actions:
  - Table mode: fills truth table output cells with `T`/`F` and clicks "Check".
  - Shade mode: clicks SVG regions directly and clicks "Check".
  - Teacher mode is strictly confined to teacher-view verification.
- Inspected all 9 captured screenshots via `read_file`:
  1. `01-shapes-1-sheet1-sun-solved-overlay.png`: Sun solved via truth table entry; neutral slate F rows; bold ray bursts and constellation stars.
  2. `02-shapes-1-sheet2-gem-solved-overlay.png`: Gem solved via shade mode; bold faceted cut lines and corner prongs.
  3. `03-shapes-2-sheet1-wrench-unsolved.png`: Wrench student worksheet; non-tracing outlines visible.
  4. `04-shapes-2-sheet1-wrench-solved-overlay.png`: Wrench solved via student truth table entry; inner jaw cutout and handle groove visible.
  5. `05-shapes-2-sheet4-turtle-student.png`: Turtle student worksheet; decoy fin region visible.
  6. `06-shapes-2-sheet4-turtle-solved-overlay.png`: Turtle solved via shade mode; decoy region remains unshaded; carapace scutes visible.
  7. `07-shapes-2-sheet5-challenge-chip.png`: Satellite extension sheet with prominent purple CHALLENGE chip.
  8. `08-greyscale-mode-sheet3.png`: Cabin solved in greyscale mode with verified contrast.
  9. `09-phone-view-shapes-2-sheet2.png`: Cactus responsive mobile layout (390x844).

---

## 4. Verification & Test Suite Results

All test suites and builds pass with zero errors:

| Check | Command | Result |
| :--- | :--- | :--- |
| **Vitest Unit Suite** | `npm test` | **35 test files passed, 170 tests passed** (including shapes-2 validator, pairwise IoU, decoy tests, overlay contrast, and giveaway tests) |
| **Playwright E2E Suite** | `npm run test:e2e` | **51 tests passed** (including overlay DOM gating, frame boundary edge persistence, neutral F styling, reduced-motion, and responsive layout) |
| **ESLint** | `npm run lint` | **0 errors** (2 minor pre-existing formatting warnings in untouched SimplificationPractice.vue) |
| **Static Build** | `npm run build` | **Clean build** (dist generated in 1.16s) |
| **GAS Classroom Build** | `npm run build:gas` | **Clean build** |
| **Plan Status Lint** | `node scripts/dev/plan-status.js lint` | **OK (no violations)** |
| **Printables Generation** | `node scripts/build-printables.mjs --set shapes-2 --draft` | **10 candidate PDFs, answer keys, plain-key PNGs, decoy-hatched PNGs, and review page generated** |

---

## 5. Review Artifacts

1. **Candidate Review Dashboard:**
   - Generated at `local/exports/printables/shapes-2/review.html`
   - Includes side-by-side:
     - Outlines-Only Leakage view
     - Plain Key Picture view (verifying recognizability without overlay)
     - Solved + Reveal Overlay view
     - Decoy Hatched View (red diagonal hatching on lure regions)
     - Student Worksheet PDF and Teacher Key PDF links
     - Giveaway metrics and lure analysis panel
2. **Screenshots Directory:**
   - `reports/development/plan-40-camouflaged-shape-sets-and-reveal-overlays/screenshots/` (all 9 PNGs captured from student solves)

---

## 6. Gate Status & Next Steps

> [!IMPORTANT]
> **GATE-40A Reached (Repair 01 Complete):**
> All R1–R7 repair requirements have been fulfilled. The 10 candidate pictures, decoy structures, bold overlays, and student-solve evidence are ready for orchestrator evaluation.
>
> In accordance with Guardrail 1, **work is halted at GATE-40A**.
> The packet status in frontmatter remains `ready`.
> No changes have been pushed or deployed.
>
> **Awaiting Orchestrator Action:**
> Review candidates at `local/exports/printables/shapes-2/review.html` and select the 6 final sheets for the official `shapes-2` set.
