# Plan-40 Implementation Progress Report: Camouflaged Shape Sets & Reveal Overlays

**Packet:** Plan-40 — Camouflaged Shape Sets & Reveal Overlays (`docs/development/plan-40-camouflaged-shape-sets-and-reveal-overlays.md`)  
**Status:** In Progress — Halted at **GATE-40A** (Awaiting Owner Review and Candidate Selection)  
**Date:** 2026-10-24  
**Author:** AI Pair Programmer (Antigravity)

---

## 1. Executive Summary

This implementation delivers the foundational deliverables for Plan-40 up to gate **GATE-40A**:
1. **The Giveaway Metric (`src/shape-puzzles/giveaway.js`):** An automated IoU-based camouflage audit that measures the overlap between each individual shape (and the all-shapes union) against the target solved picture. Flags any shape or union with $\text{IoU} \ge 0.75$.
2. **The Reveal-Overlay Layer:** A non-load-bearing visual reward system rendered cleanly on solve or in teacher mode. Overlay definitions for all four `shapes-1` sheets (`Sun`, `Gem`, `Cabin`, `Rocket`) were added as a brand-new data file (`src/shape-puzzles/reveal-overlays/shapes-1.js`) with **zero modifications** to `src/shape-puzzles/sets/shapes-1.js`. Overlays for all 16 `shapes-2` candidate sheets were implemented in `src/shape-puzzles/reveal-overlays/shapes-2.js`.
3. **16 `shapes-2` Candidate Pictures across 6 Slots:** Authored using the work-backwards method, alternating modes per the DECISION-008 amendment (`table` $\to$ `shade` $\to$ `table` $\to$ `shade` $\to$ `table` $\to$ `shade`), with decoys strictly in Slots 4, 5, and 6.
4. **Plan-39 Review Carryover Polish:**
   - **Solved frame edges:** The frame boundary (`data-testid="frame-boundary"`) is rendered as a dedicated overlay stroke above filled regions with SVG `overflow: visible`, guaranteeing that all 4 outer edges are visible in every state and the bounding box matches before and after solve.
   - **Neutral F styling:** Correct `F` cells in verified/solved truth tables are styled with neutral slate (`background: #f8fafc; color: #475569; border-color: #cbd5e1;`) and `T` cells with subtle green (`background: #ecfdf5`), ensuring red is never used for a correct value.
   - **Overlay DOM Isolation:** Verified that `<g class="reveal-overlay">` does not exist in the DOM before a correct check, and appears only upon solve or when `?teacher=1` is active.

Per the instructions, work is **halted at GATE-40A**. Packet status frontmatter remains unchanged (`status: draft`). No changes have been pushed or deployed.

---

## 2. Candidate Matrix (All 16 Shapes-2 Sheets)

The table below summarizes all 16 candidates authored for `shapes-2`, their structural properties, giveaway metric results, honest outlines-only judgments, and overlay primitive counts.

| Slot | Cand | Picture Name | Expression | Mode | Badges | Decoy | Max Shape IoU | Union IoU | Flagged ($\ge 0.75$) | Reveal Prims | Outlines-Only Honest Judgment |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | A | Mechanic Open-End Wrench | `a && !b` | Table | Yes | None | 0.670 (A) | 0.550 | No | 9 | **Clean camouflage.** Shape A has an elongated handle and circular head; notch B cuts an angle and has an upper lobe outside A. Silhouette cannot be recognized without subtracting B. |
| **1** | B | Stylized Cat Silhouette | `a && b` | Table | Yes | None | 0.658 (A, B) | 0.490 | No | 12 | **Clean camouflage.** Symmetric rounded rectangles rotated at opposing angles; looks like an abstract chevron or cross before intersection is computed. |
| **1** | C | Sailboat on Harbor Water | `a && !b` | Table | Yes | None | 0.699 (A) | 0.240 | No | 9 | **Clean camouflage.** Shape A is a tall triangular hull/sail contour; Shape B is a wide horizontal ellipse cutting through the middle. Appears as arbitrary intersecting geometries. |
| **2** | A | Vintage Biplane Aircraft | `(a \|\| b) && !c` | Shade | Yes | None | 0.432 (A) | 0.380 | No | 9 | **Clean camouflage.** Upper wing A and fuselage/lower wing B overlap. Rectangular strut C slices through. Looks like staggered engineering panels. |
| **2** | B | Articulated Desk Lamp | `(a \|\| b) && !c` | Shade | Yes | None | 0.409 (B) | 0.370 | No | 6 | **Clean camouflage.** Lamp arm A and shade B overlap; lower base cutout C masks the joint. Outlines look like intersecting pill shapes. |
| **2** | C | Robotic Planetary Rover | `(a \|\| b) && !c` | Shade | Yes | None | 0.397 (A) | 0.360 | No | 8 | **Clean camouflage.** Rover chassis A and mast/antenna B overlap; wheel-well cutout C creates wheels on subtraction. Looks like overlapping cards. |
| **3** | A | Classic Steam Locomotive | `(a && b) \|\| c` | Table | No | None | 0.612 (C) | 0.787 | **YES (Union)** | 11 | **Flagged for review.** Expression is TRUE for 5 of 7 active minterms, causing high union overlap. However, the three shapes are abstract rounded rectangles (cab, boiler, cowcatcher/undercarriage) that look like a block stack rather than a locomotive until shaded. |
| **3** | B | Laboratory Compound Microscope | `(a && b) \|\| c` | Table | No | None | 0.584 (C) | 0.766 | **YES (Union)** | 6 | **Flagged for review.** Expression evaluates TRUE for 5 minterms, triggering union IoU 0.766. Individual outlines are orthogonal rectangles and a vertical tube; unrecognizable as a microscope without shading. |
| **3** | C | Solid-Body Electric Guitar | `(a && b) \|\| c` | Table | No | None | 0.601 (C) | 0.781 | **YES (Union)** | 7 | **Flagged for review.** Union overlap 0.781. Geometry comprises two offset rounded rectangles and a vertical neck rectangle. Looks like an abstract geometric diagram. |
| **4** | A | Gliding Oceanic Sea Turtle | `a && !(b \|\| c)` | Shade | No | **Yes (Decoy)** | 0.364 (A) | 0.280 | No | 8 | **Strong camouflage with decoy.** Shape C features a compound decoy fin that mimics turtle anatomy but is excluded by `!(b || c)`. Prevents students from guessing turtle body from A alone. |
| **4** | B | Deep-Sea Research Submarine | `a && !(b \|\| c)` | Shade | No | **Yes (Decoy)** | 0.401 (A) | 0.310 | No | 7 | **Strong camouflage with decoy.** Shape B includes an elevated decoy tower that resembles a conning tower, while Shape C masks the true hull boundary. |
| **4** | C | Rescue Transport Helicopter | `a && !(b \|\| c)` | Shade | No | **Yes (Decoy)** | 0.364 (A) | 0.280 | No | 6 | **Strong camouflage with decoy.** Shape C features a high decoy mast/rotor blade that looks like a main rotor but is eliminated during evaluation. |
| **5** | A | Orbital Research Satellite | `(a \|\| b) && !c` | Table | No | **Yes (Decoy)** | 0.457 (A) | 0.380 | No | 7 | **Clean extension camouflage.** Central bus A and solar wing B with decoy solar array lobe on C. Geometry resembles an abstract plus-sign until shaded. |
| **5** | B | Forging Anvil on Block | `(a \|\| b) && !c` | Table | No | **Yes (Decoy)** | 0.451 (A) | 0.370 | No | 4 | **Clean extension camouflage.** Anvil horn/face A and mounting block B with decoy base footing C. Looks like stacked crossbars. |
| **6** | A | Raptor Falcon in Flight | `(a && !b) \|\| (b && !c)` | Shade | No | **Yes (Decoy)** | 0.531 (B) | 0.440 | No | 9 | **Clean extension camouflage.** Wing A and body B with decoy lower tailfeathers on C. Outlines show three staggered rounded rectangles with zero resemblance to a bird. |
| **6** | B | Multi-Masted Sailing Galleon | `(a && !b) \|\| (b && !c)` | Shade | No | **Yes (Decoy)** | 0.526 (B) | 0.430 | No | 7 | **Clean extension camouflage.** Main hull A, sail rigging B, and decoy bowsprit/waves on C. Outlines appear as three overlapping horizontal boxes. |

---

## 3. Giveaway Metric Analysis & Observations

The giveaway metric in `src/shape-puzzles/giveaway.js` measures two distinct camouflage risks:
1. **Single-shape giveaway:** When any individual input shape outline closely matches the target solved picture ($\text{IoU}(S_i, P) \ge 0.75$). None of the 16 candidates exceeded 0.70 on single-shape IoU, demonstrating that no individual outline gives away the answer.
2. **All-shapes union giveaway:** When the union of all input shapes matches the target picture ($\text{IoU}(\bigcup S_i, P) \ge 0.75$). This occurs when an expression evaluates to TRUE for most minterms (e.g., `(a && b) || c` in Slot 3, which is TRUE for 5 of 7 non-outside minterms).
   - In Slot 3, Candidates 3A, 3B, and 3C were flagged with union IoU values of $0.787$, $0.766$, and $0.781$ respectively.
   - **Honest visual assessment:** Inspection of the leakage outlines (`-leakage.png`) for Slot 3 confirms that the outlines consist purely of three plain, overlapping rounded rectangles. Even though 5 of the 7 regions will be shaded, the student cannot identify that the combination represents a train, microscope, or guitar until the regions are actually shaded. The flag correctly reflects the mathematical density of the expression without signifying an outline defect.

---

## 4. UI Polish & Review Carryovers

### 4.1 Solved Frame Boundary
- **Issue:** Prior to Plan-40, solved puzzles could lose parts of the outer frame stroke when region 0 (outside) was shaded, and SVG `overflow: hidden` clipped the 2px boundary.
- **Solution:** 
  1. Rendered a dedicated boundary element `<rect class="frame-boundary" data-testid="frame-boundary" ... stroke="#475569" stroke-width="2" fill="none" />` positioned above the region fills in `ShapePuzzleCanvas.vue`.
  2. Set `.shape-puzzle-svg { overflow: visible; }` in `puzzle.css`.
  3. Added an explicit Playwright assertion verifying that the 4 outer edges are visible and the relative bounding box of `data-testid="frame-boundary"` matches within 0.1px before and after solving.

### 4.2 Neutral F Styling in Solved Truth Tables
- **Issue:** Student worksheets and solved views previously used red styling for False rows, conflicting with pedagogical feedback (red implies an error, whereas evaluating a row to False is correct).
- **Solution:**
  1. Updated `ShapePuzzleTable.vue` and `puzzle.css` so that solved/verified rows with value `F` receive neutral slate styling (`background: #f8fafc; color: #475569; border-color: #cbd5e1;`).
  2. Solved rows with value `T` receive subtle green emphasis (`background: #ecfdf5; color: #047857; border-color: #6ee7b7;`).
  3. Added an explicit Playwright assertion asserting that row 0 (`F`) uses slate `#f8fafc` and never red (`#ef4444` or `#fee2e2`).

### 4.3 Overlay DOM Isolation
- **Requirement:** Reveal overlay elements must not exist in the DOM before a correct check, preventing students from inspecting the DOM or using devtools to read the solution.
- **Solution:**
  1. `ShapePuzzleCanvas.vue` gates the overlay group with `v-if="(isSolved || isTeacher) && currentOverlay.length"`.
  2. Added Playwright tests verifying that `.reveal-overlay` and `.overlay-prim` count is exactly 0 on initial page load, and only renders after the puzzle is solved or when loaded with `?teacher=1`.

---

## 5. Verification Summary

All automated test suites, accessibility/browser checks, builds, and plan linting pass cleanly:

| Check | Command | Result |
| :--- | :--- | :--- |
| **Vitest Unit Suite** | `npm test` | **35 test files passed, 167 tests passed** (including giveaway metric, reveal overlay, and shapes-2 validator tests) |
| **Playwright E2E Suite** | `npm run test:e2e` | **51 tests passed** (including overlay isolation, frame stability, neutral F styling, reduced-motion, and shapes-2 navigation) |
| **ESLint** | `npm run lint` | **0 errors** (2 minor formatting warnings in untouched file) |
| **Vite Static Build** | `npm run build` | **Clean build** (dist generated in 860ms) |
| **GAS Classroom Build** | `npm run build:gas` | **Clean build** |
| **Plan Status Lint** | `node scripts/dev/plan-status.js lint` | **OK (no violations)** |
| **Printables Generation** | `node scripts/build-printables.mjs --set shapes-2 --draft` | **16 candidate PDFs, keys, leakage PNGs, and review page generated** |

---

## 6. Review Artifacts & Screenshots

### 6.1 Review HTML Page
- The interactive review dashboard for the candidate set is located at:
  `local/exports/printables/shapes-2/review.html`
- Contains side-by-side student worksheet links, answer keys, leakage outline previews, solved overlay previews, distractor audits, and giveaway metrics for all 16 candidates.

### 6.2 Browser Screenshot Gallery
High-resolution browser captures demonstrating the implementation are archived under:
`reports/development/plan-40-camouflaged-shape-sets-and-reveal-overlays/screenshots/`

1. `01-shapes-1-sheet-1-solved-table-mode.png` — Mystery Picture 1 (Sun) solved in table mode with constellation overlay and neutral F styling.
2. `02-shapes-1-sheet-2-solved-shade-mode.png` — Mystery Picture 2 (Gem) solved in shade mode with sparkle overlay.
3. `03-shapes-2-slot-1-wrench-solved.png` — Slot 1 Candidate A (Wrench) solved in table mode with mechanical jaw overlay.
4. `04-shapes-2-slot-2-biplane-shade-mode-solved.png` — Slot 2 Candidate A (Biplane) solved in shade mode with propeller and cockpit overlay.
5. `05-shapes-2-slot-3-train-table-mode-solved.png` — Slot 3 Candidate A (Train) solved in table mode with steam puffs, cab window, and wheel hubs.
6. `06-shapes-2-slot-4-turtle-shade-mode-solved.png` — Slot 4 Candidate A (Sea Turtle) solved in shade mode with flippers, eye, and shell scutes.
7. `07-shapes-2-slot-5-satellite-extension-table-mode.png` — Slot 5 Candidate A (Satellite) extension sheet showing purple "Challenge" chip, dish antenna, and solar grid.
8. `08-shapes-2-slot-6-falcon-extension-shade-mode.png` — Slot 6 Candidate A (Falcon) extension sheet in shade mode with talon, eye, and beak overlay.
9. `09-teacher-view-shapes-2-submarine.png` — Slot 4 Candidate B (Submarine) in teacher mode (`?teacher=1`) displaying periscope overlay and bulk-fill controls.

---

## 7. Gate Status & Next Steps

> [!IMPORTANT]
> **GATE-40A Reached:** Implementation of Phase 1 (giveaway metric), Phase 2 (reveal overlays), Phase 3 (16 candidate pictures), and UI polish is complete.
> In accordance with Guardrail 1 and the task contract, **work is halted at GATE-40A** awaiting owner candidate selection.
>
> **Awaiting Owner Action:**
> Select one primary candidate per slot (Slots 1–6) from `local/exports/printables/shapes-2/review.html` to finalize the official `shapes-2` set.
>
> **Recommended Selections:**
> - **Slot 1 (2 shapes, table):** Candidate 1A (Mechanic Open-End Wrench) — crisp notch subtraction geometry.
> - **Slot 2 (3 shapes, shade):** Candidate 2A (Vintage Biplane Aircraft) — balanced wing and fuselage composition.
> - **Slot 3 (3 shapes, table):** Candidate 3A (Classic Steam Locomotive) — distinct silhouette once shaded, recognizable train theme.
> - **Slot 4 (3 shapes, shade, decoy):** Candidate 4A (Gliding Oceanic Sea Turtle) — effective decoy fin that breaks symmetry.
> - **Slot 5 (extension, 3 shapes, table, decoy):** Candidate 5A (Orbital Research Satellite) — strong technical motif with solar decoy.
> - **Slot 6 (extension, 3 shapes, shade, decoy):** Candidate 6A (Raptor Falcon in Flight) — intricate multi-term boolean logic (`a && !b || b && !c`).
