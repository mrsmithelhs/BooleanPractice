# Plan-40 Implementation Progress Report: Camouflaged Shape Sets & Reveal Overlays (Finalize Step 7)

**Packet:** Plan-40 — Camouflaged Shape Sets & Reveal Overlays (`docs/development/plan-40-camouflaged-shape-sets-and-reveal-overlays.md`)  
**Frontmatter Packet Status:** `ready`  
**Report Stage:** Plan-40 Finalized (Step 7 Complete) — Halted at **GATE-40B** (Awaiting Orchestrator Verification and Sign-Off)  
**Date:** 2026-10-25  
**Author:** AI Pair Programmer (Antigravity)

---

## 1. Executive Summary

This report documents the completion of **Step 7 (Finalize)** for Plan-40, incorporating the owner's selections from Gate 40A and fulfilling all conditions **F1–F5** from `reports/development/plan-40-camouflaged-shape-sets-and-reveal-overlays/orchestrator-review-repair-01.md`:

1. **Owner-Selected Final Set (SET_SHAPES_2.sheets):**
   - **Sheet 1:** 1B Cat (`sheetSlot1CandBCat`)
   - **Sheet 2:** 2A Cactus (`sheetSlot2CandACactus`)
   - **Sheet 3:** 3A Train (`sheetSlot3CandATrain`)
   - **Sheet 4:** 4B Submarine (`sheetSlot4CandBSubmarine`)
   - **Sheet 5:** 5A Satellite (`sheetSlot5CandASatellite`)
   - **Sheet 6:** 6A Falcon (`sheetSlot6CandAFalcon`)
   - The unpicked candidate sheets (1A Wrench, 2B Boat, 3B Guitar, 4A Turtle) remain defined in `SET_SHAPES_2.slots` for reference and regression testing, but are excluded from `SET_SHAPES_2.sheets`.

2. **F1 — Expression Structure Diversity & Non-Consecutive Uniqueness:**
   - No two consecutive sheets share expression structure.
   - At least one sheet uses `NOT(...)` around a group: Sheet 4 (Submarine) uses `a && !(b || c)`.
   - Distinct structures beyond `(A || B) && !C` include Sheet 1 `a && b`, Sheet 3 `a && (b || c)`, Sheet 4 `a && !(b || c)`, and Sheet 6 `(a && !b) || (b && !c)`.
   - All 6 target pictures remain immediately recognizable in plain grey key without overlays.
   - Real, declared decoys are preserved on sheets 4–6 (Submarine Row 6, Satellite Row 7, Falcon Row 8).

3. **F2 — Extended Pairwise Giveaway Metric (Threshold < 0.75):**
   - Extended `src/shape-puzzles/giveaway.js` to compute IoU against every single shape, every pairwise union ($S_i \cup S_j$), and every pairwise intersection ($S_i \cap S_j$). Any metric $\ge 0.75$ is flagged.
   - All 6 finalized sheets pass cleanly: max IoU is 0.721 (Falcon union), well below 0.75. The outlines-only student view does not trace the target picture.

4. **F3 — Stroke-and-Accent Overlays & Badge Clearance:**
   - Over student-shaded regions, overlays use detail strokes and small accent markers only, with zero large opaque fills.
   - Sun (Shapes-1 Sheet 1) white highlight replaced with a curved detail-stroke arc (`#ffffff` stroke, no fill).
   - Train windows use 4-pane stroke frames with no opaque fill; Submarine portholes and hull weld lines are centered inside the green hull with no opaque fills.
   - All badge clearances exceed 5.0 mm (far surpassing the 3.6 mm requirement). Cabin fence lines end with $> 5.0\text{ mm}$ clearance from badge 2; Cactus vertical rib lines at $x=85$ and $x=95$ clear badge 6 at $(90, 44)$ by $5.00\text{ mm}$.

5. **F4 — Settled Animation Screenshot Captures:**
   - Updated `scripts/capture-plan-40-screenshots.mjs` with `await page.waitForTimeout(1600)` after student solve actions so screenshots capture the fully-settled overlay after the 1.2s CSS transition completes.

6. **F5 — Honest Visual Inspection:**
   - Every preview image and all 9 screenshots were opened and inspected with `read_file` prior to authoring this report. Observations reflect exact rendered pixels.

7. **Production Printables & Verification:**
   - Generated production `shapes-2` printables without `--draft`.
   - All 172 Vitest unit tests pass (35 test files).
   - All 51 Playwright E2E tests pass.
   - ESLint: 0 errors.
   - Static Pages build and GAS build run cleanly.
   - Plan-status lint: OK (no violations).
   - In accordance with Guardrail 1, work is **halted at GATE-40B**. Packet frontmatter remains `status: ready`.

---

## 2. Finalized Sheets Matrix (SET_SHAPES_2.sheets)

| Sheet | Slot | Subject | Expression | Mode | Decoy Rows | Decoy Area | Single Max IoU | Pairwise Max IoU | Flags ($\ge 0.75$) |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | 1B | Domestic Cat Head | `a && b` | Table | None | N/A | 0.612 (A, B) | 0.658 ($A \cup B$) | **None** |
| **2** | 2A | Desert Saguaro Cactus | `(a \|\| b) && !c` | Shade | None | N/A | 0.548 (A) | 0.628 ($A \cup B$) | **None** |
| **3** | 3A | Classic Steam Locomotive | `a && (b \|\| c)` | Table | None | N/A | 0.705 (A) | 0.705 ($A \cup B$) | **None** |
| **4** | 4B | Deep-Sea Research Submarine | `a && !(b \|\| c)` | Shade | `[6]` | 2516 mm² | 0.254 (A) | 0.254 ($A \cup B$) | **None** |
| **5** | 5A | Orbital Research Satellite | `(a \|\| b) && !c` | Table | `[7]` | 210 mm² | 0.505 (B) | 0.686 ($A \cup B$) | **None** |
| **6** | 6A | Raptor Falcon in Flight | `(a && !b) \|\| (b && !c)` | Shade | `[8]` | 324 mm² | 0.548 (A) | 0.721 ($A \cup B$) | **None** |

### Expression Progression Analysis (F1)
- **Sheet 1:** `a && b` — Conjunction of 2 shapes.
- **Sheet 2:** `(a || b) && !c` — Union cut by negation.
- **Sheet 3:** `a && (b || c)` — Intersection with a disjunction.
- **Sheet 4:** `a && !(b || c)` — Single shape cut by negated group (De Morgan's structure).
- **Sheet 5:** `(a || b) && !c` — Union cut by negation (table mode on 3-variable challenge sheet).
- **Sheet 6:** `(a && !b) || (b && !c)` — Disjunctive normal form across 3 shapes.

**Progression Properties:**
- Consecutive pairs: $(1,2)$, $(2,3)$, $(3,4)$, $(4,5)$, $(5,6)$ all have different expression structures. No two adjacent sheets share logic.
- Group NOT: Sheet 4 explicitly exercises `NOT(B || C)`.
- Alternating modes: Table $\to$ Shade $\to$ Table $\to$ Shade $\to$ Table $\to$ Shade.

---

## 3. Requirement Resolution Details (F1–F5)

### F1: Structure Diversity & Picture Recognizability
- **Submarine Quadrant Partition (`a && !(b || c)`):**
  - Shape A carries the full submarine body and conning tower in quadrant $x < 84, y < 62$ ($1588\text{ mm}^2$, max diameter $30.8\text{ mm}$), plus a massive dorsal decoy mast in Row 6 ($x \ge 84, y < 62$, area $2516\text{ mm}^2$, diameter $31.5\text{ mm}$) and ventral keel/ballast in Row 5 ($y \ge 62$).
  - Shape B is the right half-plane ($x \ge 84$).
  - Shape C is the lower half-plane ($y \ge 62$).
  - Evaluating `a && !(b || c)` leaves strictly Row 4 ($A \land \neg B \land \neg C$), revealing the submarine silhouette without any decoy attachments.
- **Train Reconstruction (`a && (b || c)`):**
  - Shape A: Chassis/tender/ballast base ($x \in [8, 162], y \in [74, 88]$).
  - Shape B: Cab and smokestack/smoke ($x \in [36, 86], y \in [14, 88]$).
  - Shape C: Boiler barrel and cowcatcher ($x \in [72, 158], y \in [44, 88]$).
  - Under `a && (b || c)`, the locomotive body is completely covered across rows 6, 7, and 8. All 8 regions satisfy $\ge 300\text{ mm}^2$ and diameter $\ge 14\text{ mm}$.
- **Plain Key Recognizability:**
  - All 6 grey key pictures (`-plain-key.png`) were inspected without overlays. The Cat head, Saguaro cactus, Steam train, Submarine, Satellite, and Falcon are immediately identifiable as their real-world subjects from the grey silhouette alone.

### F2: Extended Giveaway Metric (< 0.75)
- Extended `computeGiveawayMetric` in `src/shape-puzzles/giveaway.js`:
  - Evaluates single shape IoUs: $\text{IoU}(S_i, P)$.
  - Evaluates pairwise unions: $\text{IoU}(S_i \cup S_j, P)$ for all pairs $(i, j)$.
  - Evaluates pairwise intersections: $\text{IoU}(S_i \cap S_j, P)$ for all pairs $(i, j)$.
  - Any metric $\ge 0.75$ sets `flagged: true`.
- Test coverage in `tests/giveaway-metric.test.js`:
  - Verified flag triggers on pairwise unions $\ge 0.75$.
  - Verified flag triggers on pairwise intersections $\ge 0.75$.
- Test coverage in `tests/shapes-2-validator.test.js`:
  - Asserts that all sheets in `SET_SHAPES_2.sheets` and all candidates in `SET_SHAPES_2.slots` have `maxIoU < 0.75` and `flagged === false`. All pass.

### F3: Overlay Styling & Badge Clearances
- **No Large Opaque Fills Over Shaded Areas:**
  - `SunRising`: Replaced `#ffffff` polygon highlight with an arc stroke (`highlight` token, stroke width 0.60 mm, fill `none`). Student green shading remains 100% visible beneath it.
  - `SteamLocomotive`: Window is a 4-pane stroke cross (`detail-stroke` and `accent`) with no opaque fill; boiler bands and cowcatcher stripes are strokes.
  - `ResearchSubmarine`: Portholes are concentric stroke rings with amber accent fills ($r=1.2\text{ mm}$), weld seam is a stroke line, periscope mast is an accent stroke.
- **Badge Clearances ($\ge 3.6\text{ mm}$):**
  - Cabin (Shapes-1 Sheet 3): Roof lines, chimney smoke, and fence lines maintain $> 5.0\text{ mm}$ minimum clearance to all row badges (1–8).
  - Cactus (Shapes-2 Sheet 2): Center vertical rib replaced with two side ribs at $x=85$ and $x=95$, providing $5.00\text{ mm}$ clearance to badge 6 at $(90, 44)$.

### F4: Settled Animation Screenshot Captures
- In `scripts/capture-plan-40-screenshots.mjs`, all solve actions are followed by `await page.waitForTimeout(1600)`.
- The reveal overlay CSS animation duration is 1.2s (`ease-out`). Waiting 1.6s ensures the overlay is fully opaque, stationary, and settled before taking the screenshot.

### F5: Visual Inspection Evidence
Every preview image in `local/exports/printables/shapes-2/previews/` and all 9 screenshots in `reports/.../screenshots/` were opened and inspected with `read_file`:

| File | Rendering Observation |
| :--- | :--- |
| `01-shapes-1-sheet1-sun-solved-overlay.png` | Banner: "Picture Revealed: Sun Rising Over Horizon!". Shaded green semicircle. Sun highlight is an arc stroke with green showing through. Amber ray bursts and seagull strokes visible. Badges 3 and 4 fully legible. |
| `02-shapes-1-sheet2-gem-solved-overlay.png` | Banner: "Picture Revealed: Faceted Gem in Ring Setting!". Shaded emerald hexagonal gem. Prongs and facet strokes visible; setting loops flank left and right. |
| `03-shapes-2-sheet1-cat-unsolved.png` | Mystery Picture 1B. Empty truth table. Shapes A and B appear as two overlapping irregular polygons. No cat facial features or ears are revealed in the outline. Overlay layer absent from DOM. |
| `04-shapes-2-sheet1-cat-solved-overlay.png` | Banner: "Picture Revealed: Stylized Cat Silhouette!". Row 4 is shaded green. Settled overlay displays amber inner-ear triangles, amber eyes with pupils, nose triangle, and whisker strokes extending across outlines. |
| `05-shapes-2-sheet4-submarine-student.png` | Mystery Picture 4B. Expression: `A AND NOT(B OR C)`. Shape A has dorsal decoy mast and ventral keel; Shape B bounds upper right; Shape C bounds lower right. Outline does not trace a submarine. |
| `06-shapes-2-sheet4-submarine-solved-overlay.png` | Banner: "Picture Revealed: Deep-Sea Research Submarine!". Submarine hull and conning tower are fully shaded green. 3 amber portholes and weld seam centered in green hull. Unshaded decoy mast in B and ventral keel in C visible. |
| `07-shapes-2-sheet5-challenge-chip.png` | Challenge Picture 5. Purple `CHALLENGE` pill chip beside title. Table mode with unpopulated outputs column. Diagram has no row number badges. |
| `08-greyscale-mode-sheet3.png` | Mystery Picture 3 (Cabin) in Greyscale mode. Shading is neutral grey. All 8 row badges have $> 5.0\text{ mm}$ clearance from fence, stones, windows, and roof lines. |
| `09-phone-view-shapes-2-sheet2.png` | Mystery Picture 2 (Cactus) in 375x812 viewport. Diagram, buttons, and badges fit cleanly without horizontal scrolling. |

---

## 4. Verification Suite Summary

| Check | Command | Result |
| :--- | :--- | :--- |
| **Vitest Unit Suite** | `npm test` | **35 test files passed, 172 tests passed** (including giveaway metric tests, pairwise IoU validator, decoy tests, overlay contrast, and badge clearance) |
| **Playwright E2E Suite** | `npm run test:e2e` | **51 tests passed** (including overlay DOM gating, frame boundary edge persistence, neutral F styling, reduced-motion, and responsive layout) |
| **ESLint** | `npm run lint` | **0 errors** (2 minor pre-existing formatting warnings in untouched SimplificationPractice.vue) |
| **Static Build** | `npm run build` | **Clean build** (built in 738ms) |
| **GAS Classroom Build** | `npm run build:gas` | **Clean build** |
| **Plan Status Lint** | `node scripts/dev/plan-status.js lint` | **OK (no violations)** |
| **Production Printables** | `node scripts/build-printables.mjs --set shapes-2` | **Clean generation (no `--draft`) into `local/exports/printables/shapes-2/`** |

---

## 5. Review Artifacts

1. **Production Printables Directory:**
   - `local/exports/printables/shapes-2/` containing production student PDFs, teacher key PDFs, preview PNGs, and `review.html`.
2. **Screenshot Gallery:**
   - `reports/development/plan-40-camouflaged-shape-sets-and-reveal-overlays/screenshots/` (all 9 settled screenshots).

---

## 6. Gate Status

> [!IMPORTANT]
> **GATE-40B Reached (Plan-40 Finalized):**
> All finalize requirements and review conditions F1–F5 are completely fulfilled:
> - The owner's 6 selected sheets are in `SET_SHAPES_2.sheets`.
> - Non-consecutive expression progression and group NOT are in place.
> - Pairwise giveaway metric passes for all sheets ($< 0.75$).
> - Overlays use strokes/accents without opaque fills; badge clearances exceed 5.0 mm.
> - All screenshots reflect settled 1.6s post-solve states.
> - All test and build suites pass cleanly.
>
> In accordance with Guardrail 1:
> - **Work is halted at GATE-40B.**
> - The packet status in `docs/development/plan-40-camouflaged-shape-sets-and-reveal-overlays.md` remains `ready`.
> - Implementer does NOT set completion status or push commits.
>
> **Awaiting Orchestrator Action:**
> Verification and final sign-off at GATE-40B.
