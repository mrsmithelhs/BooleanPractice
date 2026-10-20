---
id: plan-37
title: "Hidden-Picture Shape Printables (P1)"
status: complete
resolution: "Final 4-sheet shapes-1 set (sun, gem, cabin, rocket) generated at 4183328, verified by orchestrator and CourseENG, owner print-checked on US Letter 2026-10-19; released to CourseENG."
depends_on: [plan-05]
gate: "GATE-37A: stop after 2 end-to-end sheets (one 2-variable, one 3-variable) plus keys, wrong-answer galleries, and a review page; owner approval required before producing the rest of the set"
summary: >-
  Generate printable, self-checking "hidden picture" Boolean puzzle sheets for the CourseENG Engineering Tech digital-logic block:
  2-3 irregular shapes act as sets, shading the regions where an AND/OR/NOT expression is true reveals a picture, and each
  sheet pairs the picture with a truth table. Includes a minterm validator, a words-notation printer, a wrong-answer gallery,
  mm-based print-legibility tests, letter-size B&W student sheets and separate keys exported to a git-ignored folder, a review
  page, and a manifest with commit and per-file hashes.
---
# Plan 37: Hidden-Picture Shape Printables (P1)

## Packet Metadata

- Packet id: `plan-37-hidden-picture-shape-printables`
- Packet title: Hidden-Picture Shape Printables (P1)
- Status: (see frontmatter)
- Owner/model: implementer (single)
- Date: 2026-10-18 (revised the same day with ClassroomApps printable lessons)
- Packet type: feature (content generator + printable content)
- Mutation level: scripts + source-data. Generated output is **local and git-ignored only**. Nothing is published.
- Approval gate: **GATE-37A.** After 2 complete sheets, their keys, galleries, and the review page, stop and report. The owner reviews (relayed through the orchestrator and CourseENG) before the remaining sheets are made.
- Depends on: plan-05 (Venn region engine, complete)
- Expected artifacts: listed under "Files and areas likely touched" below.
- Progress report: `reports/development/plan-37-hidden-picture-shape-printables/progress.md`

## Goal

Produce a small set of printable, self-checking Boolean puzzle sheets (4–6 total) for the CourseENG Engineering Tech digital-logic block (meetings M42–M44, Mon Oct 26 – Wed Oct 28, 2026). Each sheet gives 2 or 3 irregular, outlined shapes labeled A, B, (C), an expression in AND/OR/NOT words, and a truth table. Students fill in the truth table, then shade the regions whose row comes out TRUE, and a recognizable picture appears. A separate key shows the picture, the TRUE rows, and short worked steps. Everything is generated from tracked puzzle definitions through the shared parser and evaluator.

Target date: the full set should be ready by **Fri Oct 23, 2026**, and Gate 37A should be reached by about **Wed Oct 21**. Earlier is welcome.

## Non-goals

- No online puzzle page. That is P3 (plan-38).
- No changes to the parser grammar or tokenizer. Words are **display only**.
- No changes to the existing Venn practice mode, `src/venn/diagram.js` behavior, or the `ui/` app shell.
- **Nothing generated goes into tracked or published paths.** That means nothing under `ui/public`, no Pages deploy, no workflow edits, and no push. Keys must never be reachable from Pages.
- No new runtime dependencies. Playwright (already a dev dependency) is the PDF and PNG renderer.
- No PLTW material. No student data.
- No extension or challenge tiers in this packet. Record ideas in the report for a follow-up.

## Why this packet exists

The owner decided on 2026-10-18 (see DECISION-007) to build shape-composition Boolean puzzles for the CourseENG course, starting with printables because they can land before the M42–M44 block. These puzzles serve CourseENG learning targets:
- **C2:** complete 2- and 3-input truth tables;
- **C3:** evaluate AND/OR/NOT expressions;
- **E8:** series and parallel switches.

Two failure modes from earlier projects shape this packet:
- **The self-check might not work.** The "hidden picture" mechanic only checks itself if wrong answers look wrong. A crescent built as `A AND NOT B` becomes a full, recognizable moon if a student writes `A`. That makes the wrong-answer gallery a required review artifact.
- **Print work has repeatedly failed in ways DOM-level tests miss.** In ClassroomApps print packets (plans 16, 17, 20, 21 in that repo), these needed repair rounds:
  - text shrank when an SVG viewBox grew;
  - labels spilled outside the figure;
  - lines crossed through labels;
  - a background grid let students count their way to the answer;
  - figures were too small;
  - content was clipped at page edges.
  
  Implementers there also:
  - reported green while running only their new specs;
  - wrote tautological tests;
  - described screenshots that didn't match the images.
  
  This packet asks for the controls that fixed those.

## Authority and contracts

Required reading:

- `AGENTS.md`
- `docs/decision-log.md` (especially DECISION-001, -002, -003, -007)
- `docs/architecture.md`
- `src/parser/index.js`, `src/evaluator/index.js`, `src/truth-table/index.js`, `src/venn/index.js`, `src/venn/diagram.js` (`buildRegionGeometry` is the clipping pattern to follow)
- Optional prior art, read-only in a sibling repo:
  - `C:\AI\ClassroomApps\apps\isometric-drawing\src\print\layout.js` and `figures.js`;
  - `C:\AI\ClassroomApps\apps\isometric-drawing\tests\behavior\dimension-legibility.spec.mjs` (mm-based print assertions);
  - `C:\AI\ClassroomApps\scripts\dev\isometric-review-page.mjs` (review-page pattern).
  
  Borrow the approach. Do not copy code wholesale, and do not edit that repo.

Contracts this packet must preserve:

- **One shared semantics source (DECISION-001).** Region membership, truth-table rows, and shaded rows must come from the existing parser, evaluator, and truth-table code, not from a reimplementation.
- **Parser contract unchanged (DECISION-007).** Definitions store expressions in the existing symbol grammar (`&&`, `||`, `!`). AND/OR/NOT words are produced by a display printer.
- **Truth-table row order** matches `generateTruthTable` (stable alphabetical variable order), so the sheet, key, and manifest agree with the app.
- **Keys are never committed or published.**

## Scope

### In scope

1. **A shape-set region builder** (new pure module, e.g. `src/shape-puzzles/geometry.js`).
   - Input: a map from variable to polygon geometry, in `polygon-clipping` format.
   - Output: one region per minterm, in the same bits/row identity the Venn engine uses.
   - Method: start from the viewbox, intersect the included shapes, subtract the excluded shapes. This is the same method as `buildRegionGeometry`.
   - Also returns the area of each region.
   - **Do not modify `src/venn/diagram.js`.** If sharing a helper would be cleaner, propose it in the report instead.
2. **Shape construction helpers** for authoring: circle, ellipse, rectangle, rounded rectangle, regular or star polygon, and free point lists, each with transforms (translate, scale, rotate). A single set shape may be the union of several primitives, e.g. a key is a ring plus a shaft plus teeth.
3. **Sheet definitions** in tracked source (`src/shape-puzzles/sets/<set-id>.js` or JSON). Each sheet records:
   - `id`, `title`, `variables`, `shapes`;
   - `expression`, in symbol grammar;
   - **`intendedTrueRows`**: the picture, declared separately from the expression;
   - `pictureName`: what students should see, used only in the key;
   - `instructions`: the instruction strings, kept as data;
   - `showRegionRowNumbers`;
   - `frozen`: set to true once a sheet has been used in class. A frozen sheet's definition must not change.
   
   Any randomness, if used, comes from a recorded seed.
4. **Validator.** Each sheet must pass all of the following, or generation fails with a clear message:
   - 2 or 3 variables only. The expression's variables equal the shape variables.
   - **Every minterm (all 2^n rows, including "outside all shapes") has a region that can be shaded**: printed area at least **150 mm²**, and its largest inscribed circle at least **6 mm** in diameter so a pencil can reach it. Measure at the printed scale, not in viewBox units. This is a CourseENG requirement.
   - A row may be split into several disconnected pieces; report the count, but don't fail on it. Each piece needs a printed area of at least **40 mm²** and an inscribed circle of at least **4 mm**, or the validator fails. Area alone lets a 1 × 40 mm sliver through.
   - When `showRegionRowNumbers` is on, every numbered region needs an inscribed circle of at least **8 mm**, so the number fits with clearance.
   - The "outside all shapes" region is bounded by a **visible printed frame**, so students can see where it ends.
   - These thresholds are **starting points, not field-tested numbers**. The orchestrator may adjust any of them within ±25% with owner sign-off. A picture that misses a threshold is reported with the measured values; it is not a stop condition.
   - Each shape is a simple polygon (no self-intersection), lies inside the viewbox, and has at most 250 vertices.
   - The expression is neither always true nor always false.
   - **Independent picture check:** the rows the evaluator computes from `expression` must equal `intendedTrueRows`. This is a second, separate derivation, so a generator bug can't certify itself.
5. **Words-notation printer** (pure, e.g. `src/notation/index.js`).
   - AST → `AND` / `OR` / `NOT` words, with variables in uppercase (`A AND NOT B`).
   - Parentheses are inserted only where the parser's precedence requires them.
   - Round-trip test: the printed words, mapped back to symbols, parse to an equivalent AST.
   - Check `rg "getExpressionText|formatExpression"` first, and reuse an existing symbol printer if there is one.
6. **Wrong-answer generator and gallery.** For each sheet:
   - Generate likely-mistake expressions by single mutations of the correct AST:
     - drop each NOT;
     - add NOT to each variable;
     - swap AND↔OR at each operator;
     - replace each binary node with its left operand, and separately with its right operand;
     - swap variable names pairwise.
   - Dedupe by truth table, and drop any that are equivalent to the correct answer.
   - Compute each mistake's picture overlap with the correct picture, IoU = shared area / combined area. Flag any distractor with IoU ≥ 0.75 or whose picture is a single complete shape.
   - In the report, the implementer also notes any distractor whose picture looks like a *different* recognizable picture.
   - **A flag needs a one-line judgment, not a redesign.** Redesigns are decided at the gate.
   - Also render an **"outlines only" leakage view**: the bare student figure at print size. The reviewer can then judge whether the picture can be guessed from the outlines without doing the logic.
7. **Page rendering** (HTML/SVG → Playwright `page.pdf`).
   - Use `@page { size: letter portrait; margin: 12mm 15mm }`, `preferCSSPageSize: true`, and `printBackground: true`. Page size comes from CSS only.
   - All layout is specified in **mm**.
   - Minimum text height is **2.9 mm** at 100%, for SVG and HTML text alike. That leaves margin for the Chromebook dialog's fit-to-page scaling of about 0.9.
   - Outline weight is 0.35–0.8 mm, and dash segments are at least 2 mm long.
   - The truth-table value convention is **T/F, matching the app**, unless the owner chooses 1/0 at the gate. Whichever is used must be the same on the sheet, the key, and the manifest.
   - **Black-and-white safe:**
     - each shape outline gets a distinct dash pattern and line weight;
     - each label sits **outside** its shape with a short leader line, never on an outline crossing;
     - no information is carried by colour;
     - key shading uses mid-grey fills, not black, so the outlines stay visible.
   - **Student page**, one sheet per page with every element on the same page:
     - header: title plus a `Name ________` line;
     - one or two short imperative instructions at grade-8 reading level;
     - the expression in words;
     - the unshaded outlines;
     - a truth table with a row-number column (matching the region row numbers when those are shown), input columns pre-filled, and an empty output column;
     - footer: attribution line, set id, sheet id, and `Page N`.
     - Optional per-sheet `showRegionRowNumbers`: small row numbers inside the regions. Default: on for 2-variable sheets, and the gate decides for 3-variable sheets.
   - **Key page** (separate PDF), mirroring the student page:
     - **"ANSWER KEY" in large type in the header of every key page**;
     - the picture as grey-filled regions;
     - the completed truth table with TRUE rows marked;
     - **short worked steps** for each row (e.g. `A=1, B=0: 1 AND NOT 0 = 1 AND 1 = TRUE`), so the key says why, not just what;
     - the symbol form (`A && !B`) in small print as the bridge to CS;
     - the picture name.
   - **No baked-in captions:** instructions and hint text are rendered from the definition's `instructions` data and also listed in the manifest, so CourseENG can place or omit them.
8. **Generator script and npm script.**
   - `scripts/build-printables.mjs`, run with `npm run build:printables -- --set <id> [--sheets <ids>] [--draft]`.
   - Output goes under **`local/exports/printables/<set-id>/`**, which is git-ignored:
     - `student/` and `keys/` folders, as separate PDFs per sheet;
     - one combined `student-booklet.pdf` and one `key-booklet.pdf`, each with a page map in the manifest;
     - 4× PNG previews of every page;
     - the galleries;
     - `review.html`;
     - `manifest.json`.
   - Without `--draft`, generation refuses to run when the puzzle definition files have uncommitted changes. It also refuses to regenerate a `frozen` sheet whose definition hash changed.
   - A frozen sheet records both its `definitionHash` and the `generatorCommit` it was rendered with, because renderer changes can alter the printed page too.
9. **Review page** at `local/exports/printables/<set-id>/review.html`. It shows, at large size, for every sheet:
   - the student page;
   - the key page;
   - the outlines-only leakage view;
   - the wrong-answer gallery with IoU values and flags.
   
   This is what the orchestrator and owner review.
10. **Manifest** at `local/exports/printables/<set-id>/manifest.json`:
    - `setId`, `title`, `sourceCommit`, `sourceDirty`, `generatorVersion`, and the Chromium version;
    - `sheets[]`, each with:
      - `id`, `variables`, `expressionWords`, `expressionSymbols`, `trueRows`;
      - `instructions`, `frozen`, and `definitionHash`;
      - `files[]`, each with `path`, `kind` (student / key / preview / booklet), and `sha256`;
      - booklet page maps.
    
    PDF bytes aren't stable across Chromium versions. The hashes identify what was shipped; they are not a regeneration check.
11. **Tests (Vitest, plus Playwright where print geometry needs a browser).**
    - **Semantics:**
      - region builder and evaluator agree, using sample grid points: compute each point's membership bits from the shapes, then confirm the point falls in the region with that id;
      - the validator rejects an empty minterm, a sliver below the area or width minimum, a self-intersecting shape, too many vertices, and an `intendedTrueRows` mismatch;
      - the words printer's precedence and round-trip;
      - the distractor generator excludes equivalent expressions.
    - **Print legibility**, measured in mm under `emulateMedia('print')`. Render the exact HTML and CSS that go into `page.pdf`, at the printable-area width (letter minus the margins). Never count DOM elements. Run once at 100% and once at **0.9 scale**:
      - effective text height ≥ 2.9 mm at 100% and ≥ **2.6 mm at 0.9**. This applies to all text: SVG labels (font size × rendered mm ÷ viewBox units), region row numbers, table headers, row labels, the expression line, and the instructions;
      - labels ≥ **0.8 mm** apart;
      - every text box stays inside its SVG bounds, with no spill from overflow:visible;
      - **no outline, leader line, or frame passes through the central 60% of any text box**, including the region row numbers;
      - all content stays inside the page margins;
      - truth-table cells are at least **7 mm tall and 10 mm wide**;
      - outline weight and dash length are within spec, and the dash patterns stay distinguishable on the 4× PNG of the **grey-filled key**, not only on the blank student page.
    - **Page count:** every per-sheet student and key PDF is exactly 1 page. Count `/Type /Page` objects in the PDF bytes; no new dependency is needed. A 3-variable key with worked steps is the likeliest overflow.
    - Tests must assert real computed values against the fixtures. A test that compares a value with itself, or that filters existing fixtures out, is a defect.

### Out of scope

- Any `ui/` component or route, anything under `ui/public`, and any change to `src/venn/diagram.js`.
- Parser or tokenizer changes, including word input.
- Circuit or switch drawings (P4), and extension tiers.
- `.github/workflows/*`, deploy, push, edits to the ClassroomApps repo.

### Files and areas likely touched

- New:
  - `src/shape-puzzles/` (geometry, validator, distractors, set definitions);
  - `src/notation/` (or reuse an existing formatter);
  - `scripts/build-printables.mjs`, plus a print/layout helper module;
  - `tests/shape-puzzles*.test.js`, `tests/notation*.test.js`, `tests/e2e/printables-legibility.spec.js` (or equivalent);
  - `docs/shape-printables.md`.
- Edit: `package.json` (one `build:printables` script), `docs/testing.md` (one pointer).

## Work Plan

1. Summarize the job, run `node scripts/dev/plan-status.js check plan-37`, and confirm the assumptions above (formatter reuse, truth-table row order).
2. Build the geometry, validator, and words printer with tests.
3. Build the distractor generator, the gallery, and the leakage view.
4. Build the page rendering, PDF/PNG export, booklets, review page, manifest, npm script, and print-legibility tests.
5. Author **2 sheet slots** for set id `shapes-1`:
   - one 2-variable slot (a crescent-moon-style picture is acceptable);
   - one 3-variable slot (a more irregular picture, e.g. a key, rocket, or house).
   
   For each slot, render **2–3 candidate pictures**, so the owner picks one rather than iterating on a single design. Also render **one plain-shape fallback sheet**, ready to use rather than just described.
6. **GATE-37A, stop here.**
   - Run the **full** `npm test`, `npm run test:e2e`, `npm run lint`, and `npm run build`. Report every suite's counts, not just the new specs.
   - Write the progress report, including the path of `review.html` and every PDF.
   - For every flagged distractor and each leakage view, write a one-line judgment.
   - Describe what is in each preview PNG only after opening it.
   - Report and wait. Do not author more sheets.
   
   The orchestrator then reviews the artifacts, optionally with ClassroomApps Orch as a second reviewer. It sends the owner **one numbered question list**:
   1. which candidate picture to use for each slot;
   2. row numbers on 3-variable sheets?
   3. T/F or 1/0?
   4. does the real printout from a Chromebook on the classroom printer look right?
   5. any threshold adjustments.
   
   The answers become **one batched change list**. With the gate on Wednesday and the full set due Friday, there is room for one batched repair at most. Small fixes are made inline.
7. After the orchestrator relays owner approval and any changes:
   - author the remaining sheets (total 4–6, a mix of 2- and 3-variable);
   - regenerate the set with no `--draft`;
   - re-run the full validation and update the report.

**Fallback if Gate 37A slips or a picture fails its gallery or leakage review:** use simpler sheets built from plain shapes (crescent, lens, ring, notch) that still satisfy the validator. They are valid for C2/C3 even if the picture is less exciting. Record which sheets used the fallback.

## Implementation Requirements

### Requirement 1 — Exactness

- Region identity must use the same bit/row convention as `src/venn` and `generateTruthTable`.
- The TRUE rows in the key and manifest come from the evaluator, and are cross-checked against `intendedTrueRows`.

### Requirement 2 — Audience

- Grade-8 reading level: short imperative sentences, and no jargon such as "minterm", "set complement", "evaluate".
- Expressions on student sheets use words only.
- Each picture must be recognizable when grey-filled at the printed size, roughly 130–150 mm wide.

### Requirement 3 — Print fidelity

- US Letter, prints well on a black-and-white laser printer.
- The outlines stay distinguishable by dash pattern alone.
- Judge the 4× previews at print resolution. Low-resolution screenshots can show false seams.
- Fit-to-page on the students' Chromebook print dialog has not been verified in any prior project. The report must say so explicitly, so the owner can test one real printout at the gate.

## Validation Checklist

- [ ] The full `npm test`, `npm run test:e2e`, `npm run lint`, and `npm run build` pass, with counts reported for each. Existing Venn tests are unchanged.
- [ ] The validator passes for every sheet, and the progress report lists each region's printed area (mm²) and inscribed width (mm).
- [ ] The independent picture check (evaluator rows = `intendedTrueRows`) passes for every sheet.
- [ ] The print-legibility tests pass, measured in mm.
- [ ] `review.html` exists and shows the student page, key, leakage view, and gallery for every sheet. Every flag has a note.
- [ ] The manifest's hashes match the files on disk, and `sourceCommit` and the Chromium version are recorded.
- [ ] `git status` shows no generated output, keys, or PDFs as tracked or untracked-but-not-ignored files.
- [ ] Nothing in `src/venn/diagram.js`, `ui/`, the parser, the workflows, or the ClassroomApps repo changed.
- [ ] The progress report states what was verified and how.
- [ ] Work stopped at GATE-37A until approval was relayed.

## Stop Conditions

Stop and report if:

- the words printer would need a parser or tokenizer change to work;
- every candidate picture for a slot misses a region-size minimum by more than the ±25% adjustment band. Report the measured values and offer the fallback; never relax the validator yourself;
- PDF output needs a new dependency or a browser other than the existing Playwright Chromium;
- any change to the existing Venn mode, `ui/public`, or the Pages workflow looks necessary;
- an existing test would need to be weakened, skipped, or have fixtures filtered out.

## Progress Report

`reports/development/plan-37-hidden-picture-shape-printables/progress.md`

Minimum contents:
- summary;
- files changed;
- artifact paths (`review.html`, student and key PDFs, booklets, manifest);
- validator output per sheet;
- notes on flagged distractors and on the leakage views;
- full-suite command output counts;
- how print fidelity was checked;
- problems and remaining risks;
- the gate stop point;
- ready for orchestrator review: yes/no.

Implementers do not set packet status.
