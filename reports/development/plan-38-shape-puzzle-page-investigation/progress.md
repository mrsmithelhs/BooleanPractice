# Plan 38: Shape Puzzle Page Investigation (P3) — Progress Report

- **Packet ID:** `plan-38-shape-puzzle-page-investigation`
- **Gate:** GATE-38A (Investigation findings, screenshot evidence, and proposed implementation packet outline)
- **Role:** Investigator
- **Date:** 2026-10-24
- **Mutation Level:** Generated-local (`local/plan-38-prototype/` only; zero production `src/` or `ui/` modifications)
- **Status:** Complete for investigation; stopped at GATE-38A awaiting orchestrator and owner review.
- **Ready for Orchestrator Review:** Yes

---

## 1. Executive Summary

This investigation tested the feasibility, architecture, UI layout, accessibility, and pedagogical ergonomics of **P3: an online shape-puzzle practice page** for the owner's Engineering Tech course (CourseENG).

All experiments were executed with throwaway prototypes under `local/plan-38-prototype/` consuming production `src/shape-puzzles/` and `src/notation/`. A test suite of **22 full-resolution screenshots** was captured across the required viewports (1366×768 Chromebook, 1280×720 Projector, and 390×844 Mobile), covering greyscale simulation, keyboard focus synchronization, 2-variable and 3-variable sets (`shapes-1`: Sun, Gem, Cabin, Rocket), and the Cozy Cabin's disconnected split-row regions.

Every screenshot was opened and visually verified before recording descriptions.

### Summary of Question Rulings

| # | Question | Rival Options | Falsification Criterion | Experimental Result | Ruling |
|---|---|---|---|---|---|
| **Q1** | **Hosting** | (a) Vite multi-page entry `ui/puzzle.html` in same build<br>(b) Separate Vite build | (a) ruled out if breaks relative `base: './'` asset paths or drags main app bundle in | Programmatic Vite build confirmed multi-page produces an isolated 2.56 kB entry chunk + shared 94.8 kB polygon-clipping chunk. Relative `./assets/` paths resolve cleanly on subpaths. Main app bundle (132.5 kB js + 26.5 kB css) is NOT imported. Option (b) adds unnecessary maintenance overhead and workflow edits. | **Option (a) Wins** |
| **Q2** | **Component Reuse** | (a) Reuse `VennDiagram.vue`<br>(b) New lean component on `src/` | (a) ruled out if irregular regions leak puzzle concerns into AP app, or labels can't move outside without forking | `VennDiagram.vue` hardcodes `<circle>` tags, fixed viewBox `-4 -8 108 116`, inside-circle labels, and circle-only model generation. Forcing arbitrary polygon clipping, outside labels, swatches, leader lines, and multi-piece badges into it heavily leaks puzzle concerns. Lean component takes ~120 lines of Vue template and cleanly consumes `src/shape-puzzles/`. | **Option (b) Wins** (Option (a) Ruled Out) |
| **Q3** | **Region Interaction** | (a) Tri-state (neutral/selected/available)<br>(b) Two-state (shade/unshade with Check) | Judged against the "nothing decided yet" legibility problem | Tri-state initial canvas is heavily textured with diagonal stripes across all regions (`01`), looking pre-shaded. Two-state initial canvas is clean white with crisp boundaries (`02`), and shaded regions are vibrant blue (`03`). | **Consistent with both** (Strong visual evidence favoring Option (b); owner pedagogical choice) |
| **Q4** | **Labels** | (a) Outside labels with swatches & leaders<br>(b) Color-coded outlines + legend<br>(c) Both | Ruled out if unreadable at 1366×768 or in greyscale | Option (b) was **falsified and ruled out** by `08`: in greyscale, all three shape outlines and legend swatches become identical grey lines, destroying shape identity. Option (a) (`06`) and Option (c) (`10`) preserve 100% legibility in greyscale via line dash styles. | **Option (b) Ruled Out**; **Consistent with both (a) and (c)** |
| **Q5** | **Region ↔ Row Panel** | (a) Full truth table with hover/focus linking<br>(b) Compact single-row inspector | Ruled out if doesn't fit next to diagram at 1366×768 without scrolling | Both (a) (`11`) and (b) (`12`) easily fit side-by-side at 1366×768 with >200px vertical headroom! Both also fit at 1280×720 (`13`). On mobile 390×844 (`14`, `15`), elements stack vertically. | **Consistent with both** (Recommend full table on desktop ≥860px, inspector on mobile) |
| **Q6** | **Stepwise Flow** | (a) Subexpression steps<br>(b) Whole expression in one step | Pedagogy call for the owner. Provide screenshots on 3-variable set | Evaluated on Cabin in `16` (whole expression) vs `17` (stepwise). Whole expression keeps page stripped-down and matches printable puzzle goal. Stepwise adds AP CSA-style multi-step cognitive overhead. | **Consistent with both** (Owner pedagogical call) |

---

## 2. Findings Per Question

### Q1: Hosting — Single Multi-Page Build vs. Separate Build

- **Rivals:**
  - **Option (a):** A secondary Vite HTML entry point `ui/puzzle.html` in the existing Vite configuration and build pipeline.
  - **Option (b):** A separate Vite configuration (e.g. `vite.config.puzzle.js`) and separate build script (`npm run build:puzzle`).
- **Falsifying Observation:**
  - Option (a) is ruled out if the second entry point breaks relative `base: './'` asset paths on a GitHub Pages subpath (e.g., `https://owner.github.io/BooleanPractice/puzzle.html`), or drags the main AP CSA app's bundle into `puzzle.html`.
  - Option (b) is ruled out if Option (a) works without path breakage or bundle dragging, making Option (b) an unnecessary maintenance burden.
- **Experiment:**
  - Implemented programmatic Vite build test in `local/plan-38-prototype/test-q1-hosting.mjs`.
  - Tested building `mock-ui` containing both `index.html` (main app entry) and `puzzle.html` (lean puzzle entry) with `base: './'`.
- **Results:**
  - Build completed successfully in 706 ms. Emitted bundle manifest:
    - `puzzle.html`: 0.42 kB (gzip: 0.29 kB)
    - `index.html`: 0.68 kB (gzip: 0.39 kB)
    - `assets/puzzle-DvdCQaL7.js`: **2.56 kB** (gzip: 1.12 kB) — dedicated entry chunk!
    - `assets/polygon-clipping.esm-hlVzZJ60.js`: 94.83 kB (gzip: 35.10 kB) — shared geometry chunk.
    - `assets/main-CPIlinhK.js`: 132.48 kB (gzip: 33.30 kB) — main app code.
    - `assets/main-Bq1NQL7R.css`: 26.54 kB (gzip: 5.52 kB) — main app stylesheet.
  - Inspected emitted HTML tags:
    - `puzzle.html` strictly references:
      - `<script type="module" crossorigin src="./assets/puzzle-DvdCQaL7.js"></script>`
      - `<link rel="modulepreload" crossorigin href="./assets/polygon-clipping.esm-hlVzZJ60.js">`
    - `puzzle.html` does **not** import `main-CPIlinhK.js` and does **not** link `main-Bq1NQL7R.css`.
    - Relative paths `./assets/...` resolve correctly when loaded from root (`/puzzle.html`) or subdirectory (`/BooleanPractice/puzzle.html`).
    - Output directory is `dist/puzzle.html`. Because GitHub Pages deployment workflow (`.github/workflows/pages.yml`) publishes the entire `dist/` directory, **zero changes** are required to the GitHub Actions workflow!
  - In contrast, Option (b) would require:
    - Managing two separate Vite configuration files.
    - Managing two separate dev servers (or custom multi-server proxying).
    - Adding custom build scripts that coordinate non-destructive outDirs.
    - Editing `.github/workflows/pages.yml`.
- **Ruling: Option (a) Wins.** Option (a) satisfies all constraints with zero path breakage, clean code splitting, and zero workflow changes. Option (b) is ruled out by unnecessary complexity.

---

### Q2: Component Reuse — VennDiagram.vue vs. New Lean Component

- **Rivals:**
  - **Option (a):** Reuse `ui/components/VennDiagram.vue` by adapting it to accept polygon-region input.
  - **Option (b):** Build a new lean component (`ShapePuzzleCanvas.vue`) directly consuming `src/shape-puzzles/` modules.
- **Falsifying Observation:**
  - Option (a) is ruled out if irregular-shape regions need props or behavior that leak puzzle concerns into the AP CSA app, or if label placement cannot move outside the shapes without forking or adding heavy conditional branching.
- **Experiment:**
  - Audited `ui/components/VennDiagram.vue`, `ui/components/VennPractice.vue`, and `src/venn/diagram.js`.
  - Constructed `local/plan-38-prototype/components/ShapePuzzleCanvas.vue` to measure the actual contract delta.
- **Results:**
  - `VennDiagram.vue` is fundamentally coupled to standard circle Venn diagrams:
    1. Fixed SVG ViewBox: hardcoded to `viewBox="-4 -8 108 116"`. Irregular shape puzzles require letter-proportioned viewports (e.g. `180 95`).
    2. Circle-Only Outline Layer: hardcoded `<circle class="venn-diagram__circle" :cx="circle.cx" :cy="circle.cy" :r="circle.r" />`.
    3. Center-Only Labels: hardcoded `<text class="venn-diagram__circle-label" :x="circle.labelX" :y="circle.labelY">{{ circle.variable }}</text>`. In a 3-circle Venn, label C is placed at (50, 40), sitting directly over the A∩B intersection line.
    4. Model Factory: lines 150 & 208 import and invoke `buildVennDiagramModel` from `src/venn/diagram.js`, which hardcodes `ONE_VARIABLE_CIRCLES`, `TWO_VARIABLE_CIRCLES`, `THREE_VARIABLE_CIRCLES`.
    5. Disconnected Pieces: `VennDiagram.vue` assumes each region is a single connected polygon with one anchor; it cannot render multiple badges for split regions (e.g., Cabin rows 5 and 6).
  - Attempting to force irregular shape support into `VennDiagram.vue` would require adding:
    - `viewBox` prop override;
    - `shapes` polygon dictionary prop;
    - conditional template branches for polygon outlines vs circle outlines;
    - leader line paths, anchor dots, and swatch lines;
    - multi-piece badge arrays per region;
    - or a branching flag `isShapePuzzle: Boolean`.
  - This would severely violate modularity, leaking CourseENG puzzle-specific geometry and layout logic into the stable AP CSA Venn component, risking regressions across Venn Practice, Equivalence, and Simplification.
  - In contrast, `ShapePuzzleCanvas.vue` was implemented in only **120 lines of template and computed logic**, directly consuming `buildShapeRegions` and geometry helpers from `src/shape-puzzles/geometry.js`.
- **Ruling: Option (b) Wins.** Option (a) is definitively ruled out by leaky abstraction and component boundary violations.

---

### Q3: Region Interaction — Tri-State vs. Two-State

- **Rivals:**
  - **Option (a):** Tri-state interaction (neutral = hatched pattern; click cycles neutral -> selected -> available -> neutral), mirroring the existing AP CSA Venn UI.
  - **Option (b):** Two-state interaction (unshaded = false/blank; shaded = true/selected), with an explicit "Check Regions" action button.
- **Falsifying Observation:**
  - Judged against the "nothing decided yet" legibility problem noted in the packet (an all-hatched canvas is difficult to read as unstarted).
- **Experiment:**
  - Implemented both interaction modes in `local/plan-38-prototype/App.vue` and `ShapePuzzleCanvas.vue`.
  - Captured side-by-side Chromebook screenshots:
    - `01-q3-interaction-tristate-initial.png` (tri-state initial load)
    - `02-q3-interaction-twostate-initial.png` (two-state initial load)
    - `03-q3-interaction-twostate-shaded.png` (two-state partially shaded)
    - `04-q3-interaction-twostate-checked-correct.png` (two-state completed and verified)
- **Results:**
  - In `01` (tri-state initial load), every single region of the Cabin diagram is filled with diagonal stripes (`#cbd5e1` on `#f1f5f9`). Visually, the canvas looks completely filled in and textured before the student has taken any action. The diagonal stripes visually compete with the dashed line strokes of Shape B and Shape C.
  - In `02` (two-state initial load), the canvas is clean white with black shape outlines. There is zero visual clutter. The unshaded state unambiguously conveys "blank / nothing shaded yet".
  - In `03` (two-state shaded), clicking regions 0 and 2 fills them with crisp solid blue (`#3b82f6e0`), creating immediate figure-ground contrast against the clean white unshaded regions.
  - In `04` (two-state checked), clicking "Check Regions" validates against the trueRows set, turns correct regions vibrant emerald green, and displays an affirmative feedback message.
  - While Option (b) completely eliminates the "nothing decided yet" legibility defect, tri-state provides an internal "ruled-out / available" marker without submitting. Whether 8th-grade Engineering Tech students benefit from an explicit "cross-off" state or prefer a simple color-in model is a pedagogical choice for the owner.
- **Ruling: Consistent with both.** There is overwhelming visual evidence favoring Option (b) for legibility and simplicity, but Option (a) is not functionally impossible. The choice is submitted for owner decision at GATE-38A.
  - *Next experiment if not decided:* Classroom A/B testing with 8th-grade students to observe whether students spontaneously attempt to mark regions "available / ruled out" or simply shade true regions.

---

### Q4: Shape Label Placement — Swatches vs. Color vs. Both

- **Rivals:**
  - **Option (a):** Shape labels outside the shapes with dashed/solid line swatches and leader lines ending on the outline (plan-37 convention).
  - **Option (b):** Color-coded outlines with an external legend (e.g. Shape A = Blue, Shape B = Red, Shape C = Green), without leader lines or swatches.
  - **Option (c):** Both: color-coded outlines and labels combined with outside label boxes, leader lines, and line-style swatches.
- **Falsifying Observation:**
  - Ruled out if the result is unreadable at Chromebook width (1366×768) or in greyscale (accessibility / color-blindness constraint).
- **Experiment:**
  - Implemented all three labeling styles in `ShapePuzzleCanvas.vue`.
  - Captured comparative screenshots at 1366×768 in full color and in 100% greyscale:
    - Option (a): `05-q4-labels-outside-swatch.png` (color) & `06-q4-labels-outside-swatch-greyscale.png` (greyscale)
    - Option (b): `07-q4-labels-color-outline.png` (color) & `08-q4-labels-color-outline-greyscale.png` (greyscale)
    - Option (c): `09-q4-labels-both.png` (color) & `10-q4-labels-both-greyscale.png` (greyscale)
- **Results:**
  - **Option (b) was definitively FALSIFIED and RULED OUT by `08`:**
    In `08-q4-labels-color-outline-greyscale.png`, all three shape outlines convert to identical solid grey borders. The legend below the diagram displays three identical grey dashes: `— Shape A  — Shape B  — Shape C`. Without outside labels, leader lines, or distinct dash patterns, it is completely impossible to determine which shape is which! This violates the project accessibility guardrail ("keep visual state distinctions legible without relying on color alone").
  - **Option (a)** (`05` and `06`):
    In `06` (greyscale), Shape A is solid, Shape B is dashed (`5 2.5`), and Shape C is dash-dot (`5 2 2 2`). Outside label boxes clearly display the letter, the swatch line, and the leader line pointing to the outline. Legibility is 100% preserved in greyscale.
  - **Option (c)** (`09` and `10`):
    In `09`, colored outlines (blue, red, green) add high visual appeal for color-sighted students. In `10` (greyscale), the line-style swatches and dashed outlines ensure 100% legibility even when color is removed.
- **Ruling: Option (b) is Ruled Out.** **Consistent with both Option (a) and Option (c).**
  - Recommendation: Adopt Option (c) (or configurable Option a/c) so sighted students enjoy colored shape accents while maintaining complete accessibility and print parity via line-style swatches.
  - *Next experiment / owner decision:* Owner decides whether colored shape outlines (c) are desirable for the web experience or if monochrome outline styling (a) should be kept identical to the printables.

---

### Q5: Region ↔ Truth-Table Panel Layout at 1366×768

- **Rivals:**
  - **Option (a):** A full truth table (4 rows for 2-var; 8 rows for 3-var) side-by-side with the diagram, with bidirectional hover/focus highlighting.
  - **Option (b):** A compact single-row inspector showing only the currently hovered/focused region's truth values and expression evaluation.
- **Falsifying Observation:**
  - Ruled out if it does not fit next to the diagram at 1366×768 without vertical scrolling.
- **Experiment:**
  - Tested both layouts side-by-side with the Cabin diagram (viewBox 180×95, max-width 640px) at viewports:
    - 1366×768 (Chromebook): `11-q5-panel-full-table-chromebook-1366x768.png` vs. `12-q5-panel-current-row-chromebook-1366x768.png`
    - 1280×720 (Projector): `13-q5-panel-full-table-projector-1280x720.png`
    - 390×844 (Mobile): `14-q5-panel-full-table-mobile-390x844.png` vs. `15-q5-panel-current-row-mobile-390x844.png`
- **Results:**
  - In `11` (full table at 1366×768):
    - Diagram column height is 355 px (SVG + action buttons).
    - Full 8-row truth table column height is 348 px.
    - Combined top card + columns end at y ≈ 560 px.
    - Total available viewport height is 768 px.
    - The layout fits with **over 200 px of vertical margin to spare**! Zero scrolling is required!
  - In `12` (single-row inspector at 1366×768):
    - Inspector card height is 220 px. Fits with over 320 px of headroom.
  - In `13` (full table at 1280×720 projector):
    - Layout ends at y ≈ 580 px, leaving 140 px of vertical margin. Fits cleanly without scrolling.
  - In `14` & `15` (mobile 390×844):
    - At 390 px width, side-by-side is impossible; columns stack vertically.
    - In `14` (full table), the table extends below the 844 px fold (only rows 1–2 visible without scrolling).
    - In `15` (compact inspector), the inspector is more immediate, but mobile still requires scrolling.
- **Ruling: Consistent with both.**
  - Neither Option (a) nor Option (b) is ruled out by the 1366×768 Chromebook fit criterion. Both fit comfortably without scrolling.
  - Option (a) is pedagogically superior for desktop/Chromebook because seeing all 8 rows simultaneously reinforces the connection between truth-table rows and geometric regions.
  - Recommendation: Use a responsive strategy — render Option (a) (Full Table) on viewports ≥860 px, and allow Option (b) (Compact Inspector) or collapsible table on mobile (<860 px).
  - *Next experiment / owner decision:* Owner decides whether desktop defaults to Full Table (a) or Single-Row Inspector (b).

---

### Q6: Shading Flow — Stepwise vs. Whole Expression

- **Rivals:**
  - **Option (a):** Stepwise subexpression-by-subexpression flow (e.g. Step 1: shade `A AND NOT(B)`; Step 2: shade `... OR C`), mirroring the existing AP CSA Venn Practice.
  - **Option (b):** Whole-expression shading in a single step (shade all regions where `(A AND NOT(B)) OR C` is true), with an optional "Break it down" reference helper.
- **Falsifying Observation:**
  - Pedagogical call for the owner. Provide side-by-side screenshots on a 3-variable set (Cozy Cabin).
- **Experiment:**
  - Implemented both modes on Mystery Picture 3 (Cabin: `(A AND NOT(B)) OR C`):
    - `16-q6-flow-whole-expression.png` (whole expression)
    - `17-q6-flow-stepwise-subexpression.png` (stepwise subexpression step 1)
- **Results:**
  - In `16` (whole expression):
    - The task is direct and unified: "Shade regions where: `(A AND NOT(B)) OR C`".
    - The student reasons through each region or truth-table row and shades the matching regions.
    - The UI is stripped-down, clean, and requires no multi-step wizard state or intermediate step transitions.
    - This directly mirrors the plan-37 printable puzzle experience ("Complete truth table -> shade TRUE rows -> reveal picture").
  - In `17` (stepwise):
    - Adds a step banner: "Step 1 of 2: First shade subexpression: `A AND NOT(B)`".
    - Truth table adds an intermediate evaluation column for `A AND NOT(B)`.
    - Requires student to complete and check Step 1 before proceeding to Step 2.
    - While useful for AP CSA students learning operator precedence in code, it interrupts the visual "hidden picture" game flow of CourseENG puzzles.
- **Ruling: Consistent with both (Owner Pedagogical Call).**
  - Recommendation: Default to Option (b) (Whole Expression) to match the plan-37 printable experience and keep P3 stripped-down, while providing an optional "Break it down" disclosure in the truth table panel for students who want step-by-step assistance.
  - *Next experiment / owner decision:* Owner decides pedagogical flow for CourseENG students at GATE-38A.

---

## 3. Sweep Results: Viewports, Greyscale, Keyboard, and Split Rows

### Viewport Sweep
- **1366×768 (Chromebook landscape):** Tested across screenshots `01`–`12`, `16`–`22`. The two-column grid (`1.15fr 1fr`, gap 20px) fits the 640px SVG diagram and 460px truth table with zero vertical scrolling (total height ~560px vs 768px viewport).
- **1280×720 (Projector):** Tested in `13`. Layout fits cleanly side-by-side with ~140px vertical margin.
- **390×844 (Phone):** Tested in `14` (full table) and `15` (compact inspector). Columns stack cleanly at `@media (max-width: 860px)`.

### Greyscale Sweep
- Tested in `06` (Option a greyscale), `08` (Option b greyscale), and `10` (Option c greyscale).
- Confirmed that relying on color outlines alone (`08`) fails completely in greyscale, while outside labels with line-style swatches (`06`, `10`) preserve 100% legibility.

### Keyboard Navigation & Accessibility Sweep
- Tested in `18-keyboard-navigation-focus.png`.
- Tabbing to an SVG region focuses the region with a prominent amber glow (`#f59e0b`, filter drop-shadow and stroke).
- Simultaneously, the corresponding truth-table row receives an amber focus outline (`box-shadow: inset 0 0 0 2px #f59e0b`).
- Pressing `Enter` or `Space` toggles shading.
- Screen readers receive explicit ARIA attributes:
  - `role="button"`
  - `tabindex="0"`
  - `aria-label="Row 5: inside A, currently unshaded"`
  - `aria-pressed="false"` (updates to `"true"` when shaded)

### Split-Row (Disconnected Region) Handling
- Tested on Mystery Picture 3 (Cozy Cabin) in `18` and `19-split-rows-cabin-highlight.png`.
- Rows 5 and 6 of the Cabin are split by hearth B into two disconnected pieces: an 8 mm wall strip on the left and the main house body on the right.
- In `18` and `19`, focusing or hovering Row 5 highlights **both** pieces simultaneously.
- Furthermore, following plan-37's orchestrator fix (`4183328`), **both** pieces display a row badge "5". Students are never confused about which pieces belong to the row.

### Set Sweeps (`shapes-1`)
- **2-Variable Set with Badges:** `20-2var-sun-rising-full.png` (Mystery Picture 1: Sun, `A AND NOT(B)`, badges ON).
- **2-Variable Set without Badges:** `21-2var-gem-no-badges-full.png` (Mystery Picture 2: Gem, `A AND B`, faded scaffold: badges OFF).
- **3-Variable Set with Badges & Split Rows:** `02`–`05`, `11`, `18`, `19` (Mystery Picture 3: Cabin, `(A AND NOT(B)) OR C`, badges ON).
- **3-Variable Set without Badges:** `22-3var-rocket-no-badges-full.png` (Mystery Picture 4: Rocket, `(A OR B) AND NOT(C)`, faded scaffold: badges OFF).

---

## 4. Screenshot Index

All screenshots are stored in `reports/development/plan-38-shape-puzzle-page-investigation/screens/`. Every screenshot was opened and visually verified.

| Filename | Viewport | Target / Permutation | Visual Description (Verified After Opening) |
|---|---|---|---|
| `01-q3-interaction-tristate-initial.png` | 1366×768 | Cabin, Tri-state initial | All 8 regions filled with dense diagonal hatched stripes. Canvas looks heavily textured/pre-shaded before any user action. |
| `02-q3-interaction-twostate-initial.png` | 1366×768 | Cabin, Two-state initial | Clean white canvas with crisp black outlines. Immediately reads as blank/unshaded. Badges and swatches stand out clearly. |
| `03-q3-interaction-twostate-shaded.png` | 1366×768 | Cabin, Two-state active | Rows 1 and 3 shaded in vibrant blue (`#3b82f6`). Truth table indicates shaded status with solid blue dots `●`. |
| `04-q3-interaction-twostate-checked-correct.png` | 1366×768 | Cabin, Checked correct | Shaded regions turn emerald green revealing cabin silhouette. Green checkmark banner confirms all TRUE rows matched. |
| `05-q4-labels-outside-swatch.png` | 1366×768 | Cabin, Option (a) Color | Outside label boxes A, B, C with line-style swatches (solid, dashed, dash-dot) and leader lines to shape outlines. |
| `06-q4-labels-outside-swatch-greyscale.png` | 1366×768 | Cabin, Option (a) Greyscale | 100% greyscale. Outside boxes, swatches, and leader lines remain completely distinct and readable without color. |
| `07-q4-labels-color-outline.png` | 1366×768 | Cabin, Option (b) Color | Shape outlines in blue (A), red (B), green (C) with legend bar below. No outside boxes or leader lines. |
| `08-q4-labels-color-outline-greyscale.png` | 1366×768 | Cabin, Option (b) Greyscale | **Falsifying failure:** In greyscale, all outlines and legend swatches turn to identical solid grey lines. Shape identity is lost! |
| `09-q4-labels-both.png` | 1366×768 | Cabin, Option (c) Color | Colored outlines (blue, red, green) combined with outside label boxes, swatches, and leader lines. |
| `10-q4-labels-both-greyscale.png` | 1366×768 | Cabin, Option (c) Greyscale | Greyscale view of Option (c). Degrades gracefully: line-style swatches maintain full shape distinguishability. |
| `11-q5-panel-full-table-chromebook-1366x768.png` | 1366×768 | Cabin, Full Table | Diagram and 8-row table sit side-by-side with ~200px vertical headroom. No scrollbars. |
| `12-q5-panel-current-row-chromebook-1366x768.png` | 1366×768 | Cabin, Inspector | Single-row inspector displaying Row 5 details (`A=T, B=F, C=F -> Result: TRUE`). Row 5 outlined in cyan on diagram. |
| `13-q5-panel-full-table-projector-1280x720.png` | 1280×720 | Cabin, Full Table Projector | Diagram and full table fit side-by-side at 720p height with ~140px vertical margin. Zero scrolling. |
| `14-q5-panel-full-table-mobile-390x844.png` | 390×844 | Cabin, Mobile Full Table | Stacks vertically on phone. Diagram on top; table below fold (rows 1–2 visible before scrolling). |
| `15-q5-panel-current-row-mobile-390x844.png` | 390×844 | Cabin, Mobile Inspector | Stacks vertically on phone. Diagram on top; compact inspector card sits directly beneath action buttons. |
| `16-q6-flow-whole-expression.png` | 1366×768 | Cabin, Whole Expression | Direct expression shading in a single step: `(A AND NOT(B)) OR C`. Stripped-down, minimal chrome. |
| `17-q6-flow-stepwise-subexpression.png` | 1366×768 | Cabin, Stepwise Flow | Multi-step flow: banner prompts "Step 1 of 2: First shade subexpression: A AND NOT(B)". Extra table column shown. |
| `18-keyboard-navigation-focus.png` | 1366×768 | Cabin, Keyboard Focus | Keyboard focus on Row 5: SVG region glows in amber outline around both pieces; Table Row 5 highlighted in amber. |
| `19-split-rows-cabin-highlight.png` | 1366×768 | Cabin, Split Rows Hover | Hovering Row 5 in table highlights both disconnected pieces (wall strip + main body) with cyan outline. Both badged "5". |
| `20-2var-sun-rising-full.png` | 1366×768 | Sun (Mystery Picture 1) | 2-variable set with 4-row truth table. Row badges 1–4 visible in diagram. Outside labels A and B. |
| `21-2var-gem-no-badges-full.png` | 1366×768 | Gem (Mystery Picture 2) | 2-variable set. Faded scaffold: zero row badges in diagram. Outside swatches A (solid) and B (dashed). |
| `22-3var-rocket-no-badges-full.png` | 1366×768 | Rocket (Mystery Picture 4) | 3-variable set. Faded scaffold: zero row badges. Expression: `(A OR B) AND NOT(C)`. 8-row table. |

---

## 5. Proposed Implementation Packet Outline

Below is the proposed implementation packet to be scheduled upon owner approval at GATE-38A.

### Packet Proposal: `plan-39-shape-puzzle-page-implementation`

- **Goal:** Ship P3: an online, stripped-down shape-puzzle practicing page at `puzzle.html` hosted on GitHub Pages, reusing `src/shape-puzzles/` and `src/notation/`.
- **Target URL:** `puzzle.html?set=shapes-1&puzzle=cabin` (with defaults for unparameterized entry).
- **Scope & Files:**
  1. **Build & Routing:**
     - Add `ui/puzzle.html` as a secondary Vite HTML entry point in `vite.config.js` rollupOptions (`input: { main: ..., puzzle: ... }`).
     - Create `ui/puzzle-main.js` (lean Vue entry; imports only Vue, `src/shape-puzzles/`, `src/notation/`, and puzzle components).
  2. **Components (`ui/components/shape-puzzles/`):**
     - `ShapePuzzleApp.vue`: stripped-down shell with expression banner, notation toggle pill (Words ↔ Java), and set selector.
     - `ShapePuzzleCanvas.vue`: SVG renderer using `src/shape-puzzles/geometry.js`, supporting outside label swatches, leader lines, multi-piece badge placement, two-state shading, and keyboard accessibility.
     - `ShapePuzzleTable.vue`: responsive truth-table panel (full table on desktop ≥860px; collapsible/inspector on mobile), supporting bidirectional hover and keyboard focus linking.
  3. **No Changes To:**
     - Production AP CSA components (`ui/components/VennDiagram.vue`, `ui/components/TruthTablePractice.vue`, etc.) remain untouched.
     - Parser grammar and evaluator remain untouched (`src/parser/`, `src/evaluator/`).
     - GitHub Pages workflow (`.github/workflows/pages.yml`) remains untouched.
- **Validation & Test Plan:**
  - Unit tests (`tests/shape-puzzles-page.test.js`):
    - Multi-page bundle chunk isolation (verify `puzzle.html` does not import main app bundles).
    - Bidirectional hover/focus synchronization logic.
    - Two-state shading state transitions and verification against `intendedTrueRows`.
  - Playwright e2e tests (`tests/e2e/shape-puzzle-page.spec.js`):
    - Verify page load at `puzzle.html?set=shapes-1`.
    - Viewport smoke tests at 1366×768, 1280×720, and 390×844.
    - Keyboard-only navigation test (Tab, Enter/Space toggling).
    - Notation toggle test (verifying DOM updates between words and Java symbols).
    - Solving test (verifying success feedback banner and correct region shading).
- **Gate Structure:**
  - `GATE-39A`: Multi-page build verified, lean component implemented, tests passing, zero regressions on main app.
  - `GATE-39B`: Final owner review of live `puzzle.html` on GitHub Pages preview.

---

## 6. List of Owner Decisions Needed at GATE-38A

Before implementing `plan-39`, the owner should provide decisions on four specific design choices surfaced by this investigation:

1. **Region Interaction Model (Q3):**
   - *Recommendation:* **Two-state** (clean white unshaded <-> solid blue shaded, with explicit "Check Regions" button). Eliminates the hatched "nothing decided yet" legibility issue.
   - *Owner Choice:* Approve Two-state, or specify Tri-state (neutral/selected/available).
2. **Label Styling (Q4):**
   - *Recommendation:* **Option (c) (Both)** — Outside label boxes with line-style swatches and leader lines, accented with colored outlines (Blue A, Red B, Green C). Preserves 100% greyscale legibility while providing color distinction for sighted students.
   - *Owner Choice:* Approve Option (c) (Both), or specify Option (a) (pure monochrome swatches matching printables).
3. **Desktop Panel Presentation (Q5):**
   - *Recommendation:* **Full truth table on desktop (≥860px)** (verified to fit comfortably at 1366×768 with >200px headroom), switching to collapsible/inspector on mobile (<860px).
   - *Owner Choice:* Approve Full Table default on desktop, or specify Compact Single-Row Inspector default.
4. **Shading Flow (Q6):**
   - *Recommendation:* **Whole expression in one step** with an optional "Break it down" expander in the truth table. Keeps P3 stripped-down and aligned with the printables.
   - *Owner Choice:* Approve Whole Expression, or specify AP-style mandatory stepwise subexpression checkpoints.

---

## 7. Observations on Existing AP CSA Venn Mode (for Future BP Cleanup)

During this investigation, three specific issues were documented in the existing AP CSA Venn practice mode (`ui/components/VennDiagram.vue` / `VennPractice.vue`):

1. **Circle Label Collision:**
   In 3-variable Venn diagrams, circle label "C" sits at coordinates `(50, 40)`, directly overlapping the intersection line of circles A and B. Moving circle labels outside the circles with short leaders or swatches would greatly improve AP CSA legibility.
2. **"Nothing Decided Yet" Legibility Issue:**
   The neutral state uses an all-over diagonal hatching pattern (`rgba(109, 174, 255, 0.06)` with stripe overlay). When a problem loads, the entire Venn diagram looks "already shaded". Adopting a clean unshaded neutral state or subtle boundary styling would clarify that no regions have been selected.
3. **Chrome Density:**
   The AP CSA Venn mode has substantial surrounding chrome (difficulty dropdown, mode dropdown, problem dropdown, breadcrumb badges, 3 stat breakdown cards, 5 action buttons). The stripped-down single-card layout tested in P3 provides a much cleaner model for focused student practice.

---

## 8. Commands Run and Validation Checks

- `node scripts/dev/plan-status.js check plan-38`: Exited 0 (`RUNNABLE: plan-38 is ready to implement`).
- `node local/plan-38-prototype/test-q1-hosting.mjs`: Verified multi-page build chunk sizes, relative asset paths, and chunk isolation.
- `node local/plan-38-prototype/capture-all-screens.mjs`: Generated all 22 targeted screenshots via Playwright Chromium.
- `git status`: Confirmed zero modifications to production `src/` or `ui/`. Only tracked report folder files are modified.

---

## 9. Conclusion & Stop Condition

This packet has satisfied all investigation objectives, produced concrete observational evidence for Q1–Q6, visually inspected all 22 screenshots, and proposed an implementation packet outline.

As required by **GATE-38A**, implementation stops here. This report and the proposed implementation outline are submitted for orchestrator and owner review. Implementers do not set packet status.
