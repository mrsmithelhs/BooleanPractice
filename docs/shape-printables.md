# Hidden-Picture Shape Printables Architecture

> **Contract & Developer Reference for Printable Logic Puzzles**
> Implemented under Plan 37 for the CourseENG Engineering Tech digital-logic block.

---

## 1. Overview & Pedagogical Purpose

The Hidden-Picture Shape Printables generator produces self-checking printable logic worksheets for secondary students learning digital logic (CourseENG M42–M44).
Each worksheet provides:
1. Two or three irregular, outlined geometric shapes labeled with uppercase letters ($A$, $B$, $C$).
2. A Boolean expression written in unambiguous words notation (`AND`, `OR`, `NOT`).
3. A blank truth table with prefilled input columns ($A$, $B$, $C$) and a row number column.
4. An instruction to complete the truth table and shade all regions whose corresponding row evaluates to `TRUE`.

When correctly solved and shaded, the true regions combine to reveal a recognizable silhouette (e.g., Crescent Moon, Gem, Rocket, Cabin, Castle). A separate answer key displays the shaded silhouette, the completed truth table, the symbol-grammar expression (`&&`, `||`, `!`), and worked steps explaining the evaluation for every row.

---

## 2. Core Architecture & Pure Semantics

In adherence to project architecture constraints (**DECISION-001** and **DECISION-007**):
- **Zero grammar/tokenizer mutations**: The shared parser (`src/parser/index.js`) and evaluator (`src/evaluator/index.js`) remain untouched. Expressions in puzzle definitions are authored in symbol grammar (`&&`, `||`, `!`) with lowercase tokens.
- **Words-notation display printer (`src/notation/index.js`)**:
  - `NOT` always takes parentheses around its operand: `NOT(B)`, `NOT(A OR B)`.
  - Mixed `AND`/`OR` operators are always explicitly parenthesized so introductory engineering students never rely on operator precedence: e.g., `(A AND NOT(B)) OR C` and `(A OR B) AND NOT(C)`.
  - Single-operator chains omit redundant parentheses: `A AND B AND C`.
  - Output round-trips to equivalent ASTs when parsed.
- **Pure geometry engine (`src/shape-puzzles/`)**:
  - `shapes.js`: Primitives (circles, ellipses, polygons, rectangles, rounded rectangles) and 2D affine transforms (translate, rotate, scale).
  - `geometry.js`: MultiPolygon boolean clipping via `polygon-clipping`, Shoelace area calculation, point-in-polygon ray-casting, `findOutlineAnchorPoint` (finding boundary points with $\ge 6.0\text{ mm}$ clearance from other shapes), and a quadtree Polylabel pole-of-inaccessibility algorithm for finding the center and diameter of the largest inscribed circle for any region.
  - `validator.js`: Verifies every puzzle sheet against hard geometric and semantic requirements before rendering.
  - `distractors.js`: AST mutation engine that generates single-mutation distractors, calculates Intersection-over-Union (IoU) overlap against the target silhouette, and flags distractors with IoU $\ge 0.75$ or single-complete-shape solutions.
  - `render/layout.js`: HTML/SVG layout engine providing B&W-safe visual styling (distinct stroke dash arrays, line style swatches on badges, external leader lines ending on anchor dots on outlines, dominant-baseline centering, worked step evaluation, full-width figure stacked above truth tables).

---

## 3. Printable Output Structure & Git-Ignored Isolation

All generated student worksheets, answer keys, booklets, PNG previews, review pages, and manifest files are written strictly to local, git-ignored storage:

```
local/exports/printables/<set-id>/
├── student/
│   ├── <sheet-id>.pdf             # 1-page student sheet
│   └── ...
├── keys/
│   ├── <sheet-id>.pdf             # 1-page answer key with worked steps
│   └── ...
├── student-booklet.pdf            # Multi-page combined student booklet
├── key-booklet.pdf                # Multi-page combined answer key booklet
├── previews/
│   ├── <sheet-id>-student.png     # 4x high-resolution student preview
│   ├── <sheet-id>-key.png         # 4x high-resolution key preview
│   └── <sheet-id>-leakage.png     # 4x unshaded outline leakage preview
├── review.html                    # Unified review page for gate inspection
└── manifest.json                  # Cryptographic manifest with SHA-256 hashes
```

**Guardrail**: Generated artifacts, keys, and PDFs must never be placed in `ui/public` or tracked git paths, preventing answers from ever being published to GitHub Pages.

---

## 4. Key Conventions & Progression Rules

1. **Row Numbering Convention**:
   - **Student and key sheets**: Numbered **1–4** (for 2-variable) and **1–8** (for 3-variable) — 1-based indexing for students.
   - **Manifest and evaluator**: `trueRows` remains **0-based** (`[2]`, `[2, 4, 6]`), matching evaluator and truth table array indexing. The manifest records `rowIndexBase: 0`.
2. **Badge Progression (R9)**:
   - Region row-number badges are enabled on the **first sheet of each size** (Sheet 1A Moon and Sheet 2A Rocket).
   - Badges are disabled on later sheets (1B, 1C, 2B, 2C, Fallback). Sheets without badges feature an intermediate instruction step: *"For each region, write which shapes it is inside."*
3. **Leader Line and Swatch Contract (R2)**:
   - Every leader line terminates with an anchor dot directly on its own shape's outline.
   - The anchor point maintains $\ge 6.0\text{ mm}$ clearance from every other shape's outline.
   - Each label badge includes a horizontal line swatch reproducing the shape's exact stroke weight and dash pattern.
4. **Configurable Truth-Value Symbols (R10)**:
   - Configurable per-set via `truthTableValues: 'TF' | '10'` (defaulting to `'TF'`).
   - The selected convention consistently drives input cells, key output cells, and worked step substitutions.
5. **Neutral Student Titles (R8)**:
   - Student sheets use neutral identifiers ("Mystery Picture 1A", "Mystery Picture 2A") to avoid revealing the picture.
   - The picture name (e.g., "Crescent Moon", "Space Rocket") appears strictly on the answer key and review page.

---

## 5. Validator Thresholds & Independent Verification

Every sheet must satisfy the following criteria:
1. **Variable count**: Exactly 2 or 3 variables, matching the shape definitions.
2. **Region sizes at print scale**:
   - Every minterm region (including the outside-all-shapes frame) must have an area $\ge 150\text{ mm}^2$ and largest inscribed circle diameter $\ge 6\text{ mm}$.
   - Disconnected pieces of a region must have an area $\ge 40\text{ mm}^2$ and inscribed circle diameter $\ge 4\text{ mm}$.
   - Numbered regions (when `showRegionRowNumbers` is true) must have an inscribed circle diameter $\ge 8\text{ mm}$, guaranteeing $\ge 1.0\text{ mm}$ clearance around the badge.
3. **Shape bounds and complexity**: Simple polygons with $\le 250$ vertices, no self-intersections, fully contained within the viewBox.
4. **Non-triviality**: The expression cannot be a tautology (all true) or contradiction (all false).
5. **Independent picture check**: The evaluated `TRUE` rows from `expression` must strictly equal `intendedTrueRows`.

---

## 6. Generator CLI & Commands

Run from repository root:

```bash
# Build printables for a set (draft mode skips dirty check):
npm run build:printables -- --set shapes-1 --draft

# Build specific sheets:
npm run build:printables -- --set shapes-1 --sheets shapes-1-slot1-cand-a-moon

# Run print-legibility and geometry tests (Playwright):
npm run test:e2e
```

---

## 7. Verification and Legibility Checks

- **mm-based print assertions**: Tested under Playwright `emulateMedia({ media: 'print' })` across 100% and 90% print dialog fit-to-page scales.
- **Text height**: Measured on rendered glyph ranges via `Range` APIs: $\ge 2.9\text{ mm}$ at 100% scale; $\ge 2.6\text{ mm}$ at 0.9 scale.
- **Table cell dimensions**: Minimum $7\text{ mm}$ height by $10\text{ mm}$ width.
- **Clearance**: Central 60% of all text boxes and row-number badge circles has zero intersection with outlines, leader lines, or frames.
- **Containment**: All SVG text elements remain inside the SVG container bounds.
- **Outline strokes**: Stroke widths between $0.35$ and $0.8\text{ mm}$, with dash segments $\ge 2.0\text{ mm}$.
- **Page budget**: Student and key sheets strictly adhere to a 1-page PDF budget.
