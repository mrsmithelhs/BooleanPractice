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
puzzle.html?set=shapes-1&sheet=2&mode=table
puzzle.html?set=shapes-1&sheet=3&teacher=1
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `set` | string | `shapes-1` | Identifier of the shape puzzle set (e.g. `shapes-1`). Unknown values display a fallback notice. |
| `sheet` | integer | `1` | 1-based index of the sheet within the set (1 to 4 for `shapes-1`). Out-of-bounds values display a fallback notice. |
| `mode` | string (`table` or `shade`) | Alternating | Optional mode override. Sheets 1 and 3 default to `table`, sheets 2 and 4 default to `shade`. Unknown values trigger a fallback warning banner and use the sheet's default mode. |
| `teacher` | flag (`1` or `true`) | absent | Unlocks the teacher key view with prefilled outputs, shaded regions, mode badge, and revealed picture name. |

---

## 3. Alternating Modes & Pedagogical Flow (DECISION-008 Amendment)

Rather than requiring both representations on every sheet (which becomes a mechanical translation once the link is understood), sheets alternate representation, starting with truth table:

- **Sheets 1 and 3: Table Mode**
  - **Task:** Students deduce the truth table output column from the boolean expression and shape variable assignments.
  - **Canvas role:** The canvas displays contours, line styles, outside labels, and row badges as a visual reference. Regions are **not** shading controls (no click or space toggle, not in the tab order, no Check/Clear Shading buttons). Hovering/focusing rows in the table continues to highlight the corresponding region as an orienting scaffold.
  - **Solved Feedback:** Checking correct outputs immediately auto-shades the TRUE regions in emerald green (`#059669`) and reveals the hidden picture.

- **Sheets 2 and 4: Shade Mode**
  - **Task:** Students read the boolean expression directly onto the geometry and shade regions without an intermediate table.
  - **DOM:** Zero truth table elements exist in the DOM before success (neither desktop table nor mobile inspector). The single diagram pane centers and uses the freed width, fitting 1366×768 without scrolling.
  - **Canvas role:** Shading is unlocked immediately from the start. Students toggle regions via mouse click, touch, or keyboard (Space/Enter).
  - **Hints:** Staged hints rely exclusively on inside/outside shape conditions and boolean operator rules, **never mentioning a truth table or row numbers**.
  - **Solved Feedback:** Checking correct shading reveals the picture and makes the completed, verified truth table appear with read-only outputs.

---

## 4. Key Design Decisions & Guarantees

1. **Two-state clean shading:** Regions start unshaded (white) with crisp borders; toggling applies vibrant blue fill (`#2563eb`). Solved regions render in emerald picture fill (`#059669`).
2. **Colored outlines plus line styles:** Each shape outline features a distinct color (A: blue, B: crimson, C: emerald) *and* distinct dash style (solid, dashed, dash-dot), outside label boxes, swatches, and leader lines. 100% distinguishable in greyscale.
3. **No-reveal feedback on failed checks:**
   - In Table Mode, an incorrect check triggers staged hints without coloring individual rows red or green (no per-row correctness reveal).
   - In Shade Mode, an incorrect check triggers staged hints without outlining missed or extra regions in amber or red.
   - Verified by e2e tests comparing computed styles before and after failed checks.
4. **No student answer key:** Zero "solve" or key buttons appear on the student UI. The picture name is completely absent from the DOM and title until the sheet is solved.
5. **Teacher key view:** Available exclusively via `?teacher=1`. Displays both representations prefilled and solved, with bulk output editing controls and an amber badge indicating the student mode for that sheet.

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
