# Online Shape Logic Puzzles (`puzzle.html`)

This document describes the interactive online shape logic puzzle page shipped in Plan 39 (P3) as a companion to the CourseENG printables (Plan 37) and the AP Computer Science A web application.

---

## 1. Overview & Architecture

The puzzle page is built as a second Vite multi-page entry (`ui/puzzle.html` and `ui/puzzle-main.js`) in the static build output (`dist/puzzle.html`).
- **Complete Isolation:** `puzzle.html` loads only its dedicated entry chunk, shared geometry (`polygon-clipping`), and vendor runtime. It does not import `ui/App.vue` or any AP CSA practice components.
- **Static Hosting:** Relative asset paths (`base: './'`) allow the page to run directly on GitHub Pages at `https://<owner>.github.io/<repo>/puzzle.html` without requiring backend services, workflows, or server configuration.
- **Shared Semantics:** All parsing, evaluation, geometry clipping, and sets reuse `src/parser/`, `src/evaluator/`, `src/truth-table/`, `src/notation/`, `src/feedback/`, and `src/shape-puzzles/`.

---

## 2. URL Contract

The page contract is parameter-driven via standard query parameters:

```text
puzzle.html?set=shapes-1&sheet=1
puzzle.html?set=shapes-1&sheet=3&teacher=1
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `set` | string | `shapes-1` | Identifier of the shape puzzle set (e.g. `shapes-1`). Unknown values display a fallback notice. |
| `sheet` | integer | `1` | 1-based index of the sheet within the set (1 to 4 for `shapes-1`). Out-of-bounds values display a fallback notice. |
| `teacher` | flag (`1` or `true`) | absent | Unlocks the teacher key view with prefilled outputs, shaded regions, and revealed picture name. |

---

## 3. Pedagogical Flow & Interaction Model

The puzzle follows a two-step reasoning model rather than trial-and-error clicking:

1. **Step 1 — Predict Truth Table Outputs:**
   - Input columns ($A, B$ or $A, B, C$) are prefilled with truth values ($T/F$).
   - The expression output column starts blank (`–`).
   - Students cycle or toggle values ($T$, $F$, or blank) for each row.
   - An optional **"Break it down"** disclosure expands subexpression columns for students who need intermediate reasoning steps. It is never mandatory.
   - Students click **Check Table Outputs**. Staged feedback follows the hint ladder:
     - *Attempt 1 (Neutral):* Identifies the row needing attention.
     - *Attempt 2 (Guided):* Explains the logical operator rules (AND / OR / NOT).
     - *Attempt 3+ (Specific):* Provides targeted variable and subexpression reasoning.
2. **Step 2 — Shade Diagram Regions:**
   - Shading can be checked only after the truth table outputs are verified correct.
   - Regions start clean and unshaded. Clicking or pressing Space/Enter toggles shading between unshaded and solid vibrant blue.
   - Hovering or focusing a region highlights the corresponding row in the truth table, and vice-versa.
   - Clicking **Check Shading** validates against the set's `intendedTrueRows`. If incorrect, feedback provides staged guidance without revealing the answer key.
3. **Step 3 — Solved Picture Reveal:**
   - When all intended regions are correctly shaded, the picture is revealed in solid fill.
   - The picture name (e.g., *Sun Rising Over Horizon*, *Cozy Cabin with Hearth and Yard*) is revealed **only after success**. It never appears in the student DOM or page title before solving.

---

## 4. Key Design Decisions (DECISION-008)

1. **Two-state clean shading:** Regions start unshaded (white) with crisp borders; toggling applies vibrant blue fill.
2. **Colored outlines plus line styles:** Each shape outline features a distinct color (A: blue, B: crimson, C: emerald) *and* distinct dash style (solid, dashed, dash-dot), outside label boxes, swatches, and leader lines. 100% distinguishable in greyscale.
3. **Responsive screen layouts:** Full truth table beside diagram on desktop ($\ge 860$ px); compact single-row inspector with row selector tabs on mobile ($< 860$ px). Fits 1366×768 with no vertical scroll in default state.
4. **Whole expression in one step:** Subexpression breakdown is optional via a disclosure.
5. **Output gating:** Students must verify the truth table before region shading can be checked.
6. **No student answer key:** Zero "solve" or key buttons on student view. Teacher key accessible only via `?teacher=1`.

---

## 5. How to Add a New Puzzle Set

1. Author the shapes, expressions, and geometry in a set file under `src/shape-puzzles/sets/` (following the schema in `src/shape-puzzles/sets/shapes-1.js`).
2. Export the set definition object containing `id`, `title`, and `sheets: [sheet1, sheet2, ...]`.
3. Register the new set in `AVAILABLE_SETS` inside `ui/components/shape-puzzles/url.js`:
   ```javascript
   import { SET_NEW } from '@shared/shape-puzzles/sets/set-new.js';

   export const AVAILABLE_SETS = {
     [SET_SHAPES_1.id]: SET_SHAPES_1,
     [SET_NEW.id]: SET_NEW,
   };
   ```
4. Access via URL: `puzzle.html?set=set-new&sheet=1`.
