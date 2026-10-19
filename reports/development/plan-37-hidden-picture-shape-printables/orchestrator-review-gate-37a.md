# Plan 37: Orchestrator Review at GATE-37A

- Reviewer: BP orchestrator
- Date: 2026-10-18
- Verdict: **Not ready for owner review.** The engine and the exact semantics are sound. The review content and the label legibility need one batched repair (Repair 01 below) before the gate goes to the owner.

## What I verified, and how

| Claim | How I checked | Result |
|---|---|---|
| Scope stayed inside the packet | `git status` / `git diff --stat` against `9704adb` | OK. No changes to `src/venn`, `ui/`, the parser, workflows, or `ui/public`. The work is uncommitted. |
| Full suites pass | Re-ran `vitest`, `playwright test`, `lint`, `build` myself | OK: 131/131 unit, 32/32 e2e, lint 0 errors (2 old warnings), build OK |
| Manifest hashes | Recomputed SHA-256 for all 37 files | OK, 0 mismatches |
| Every PDF is 1 page on US Letter | Opened every PDF with PyMuPDF, independently of the repo's `countPdfPages` | OK: 14 per-sheet PDFs at 1 page each, 215.9 × 279.4 mm; booklets at 7 pages |
| Semantics and the independent picture check | Read the manifest rows against the expressions, and checked the key worked steps by hand for the rocket and the cabin | OK |
| Keys are not published | All output is under ignored `local/exports/` | OK |
| Images | Opened the 4× PNGs myself: moon student, rocket student and key, cabin key | **Defects found, listed below** |

## Defects (Repair 01, batch all of these)

**R1. Gallery and leakage "judgments" are hard-coded, not judgments (blocking).**
- `scripts/build-printables.mjs:115` emits the same sentence for every flagged distractor: "Distractor has discernible geometric difference…".
- Line 168 emits the same leakage sentence for every sheet.
- So the moon's "A" distractor, a full disc (a full moon, which is exactly the case the packet warned about), is certified as fine by boilerplate. The rocket's `B AND NOT C` (IoU 0.77) gets the same text.
- This is the "describe images you didn't look at" failure the packet names.
- Fix:
  - remove the canned text, so the generator renders flags only;
  - write real one-line judgments, per flagged distractor and per leakage view, in the progress report, after opening each image;
  - the review page may show the report's judgments, but it must not invent them.

**R2. Leader lines end on the wrong shape (blocking legibility).**
- Moon: B's leader ends on A's solid outline, and A's leader ends inside A beside B's dashed edge.
- Rocket: B's leader ends on the pentagon's corner (A), not on B's dashed rectangle, and C's leader ends where A's bottom corner meets C's edge.
- Cabin: B's leader points into the house (A), and C's leader ends inside B's rectangle.

A student can't tell which outline is B. Fix:
- each leader ends with a small dot **on its own shape's outline**, at a point at least about 6 mm from any other shape's outline;
- each label badge shows a short **swatch of its shape's line style** (solid, dashed, dash-dot), so labels don't depend on leaders alone;
- add a test that measures, for each leader endpoint, the distance to its own outline (≈ 0) and to every other outline (≥ 6 mm).

**R3. Region row-number badges sit on outlines.** On the moon, badge "1" straddles B's dashed outline.
- Place each badge at the region's pole of inaccessibility. The geometry module already computes it.
- Assert the badge circle lies fully inside its region, with clearance of at least 1 mm.

**R4. The legibility spec is missing checks the packet required, and one check can't fail.** In `tests/e2e/printables-legibility.spec.js`:
- **"Table cell text height" can't fail:** it measures the `<td>` box (≥ 7 mm by design), not the text. Measure the text node's glyph box instead (a Range on the text, or a wrapping span).
- **Missing checks, now required:**
  - no outline, leader, or frame line passes through the central 60% of any text box or row-number badge. This would have caught R2 and R3;
  - text boxes stay inside their SVG bounds;
  - row-number text height is asserted (it's currently collected and never used);
  - outline stroke width is 0.35–0.8 mm and dash segments are ≥ 2 mm, read from the rendered SVG attributes at print scale.
- **The key page is never measured.** Run the same checks on `renderKeyPageHtml`.
- **0.9 scale:** keep it, but apply it to the exact HTML that goes into `page.pdf`. The current approach (a body transform) is acceptable.

**R5. Words notation is ambiguous for these students.**
- Cabin shows `A AND NOT B OR C`. Grade-8 students don't know that AND binds tighter than OR, and the key itself adds the parentheses `(F AND NOT F) OR F`.
- The owner confirmed on 2026-10-19 that intro Engineering students don't know operator precedence. When he read the cabin sheet he grouped it as `A AND (NOT B OR C)`, which is a different expression. That is the exact failure this rule prevents.
- Fix: the words printer must make every grouping visible, so students never need precedence:
  - **NOT always takes parentheses around its operand:** `NOT(B)`, `NOT(A OR B)`. This is the owner's requested style.
  - **Mixed AND/OR is always parenthesized:** a binary operand of a different binary operator gets parentheses. The cabin becomes `(A AND NOT(B)) OR C`, and the rocket becomes `(A OR B) AND NOT(C)`.
  - A chain of the same operator needs no extra parentheses: `A AND B AND C` stays as it is.
- The key's worked steps follow the same grouping, e.g. `(F AND NOT(F)) OR F`.
- The words must still round-trip to the same AST as the symbol expression.
- The symbol form (`A && !B || C`) may stay minimal, since it's the CS bridge on the key.
- Add tests for each rule above, including the cabin and rocket strings exactly.

**R6. Half of each student page is empty, while the shading areas are small.**
- Enlarge the figure to the full content width, roughly 180 mm wide, and put the truth table below it.
- This makes the regions about 1.5× larger for pencils. The keys' worked steps already fit under the table.

**R7. Small fixes:**
- add `generatorCommit` per sheet to the manifest (the packet requires it; it's missing even for unfrozen sheets, so record it always);
- the review page's Chromium field is blank;
- the key's Output column uses `TRUE/FALSE` while the inputs use `T/F`. Use one convention, per the owner's answer (Q3).

**R8. Titles give the answer away.**
- "Space Rocket", "Crescent Moon", etc. on the student sheet tell students the picture before they do the logic.
- Student sheets use neutral titles ("Mystery Picture 1", "Mystery Picture 2", …). The picture name appears on the key only. (CourseENG review.)

**R9. Make the region ↔ row link explicit, as a stated progression.**
- Region row-number badges are on for the **first** sheet of each size (the first 2-variable sheet and the first 3-variable sheet) and off for later sheets.
- Sheets without badges get one added instruction step before shading: "For each region, write which shapes it is inside." (or an equivalent at grade-8 level).
- The progression is stated in `docs/shape-printables.md` and listed in the manifest. (CourseENG review. This replaces the earlier open question about badges on 3-variable sheets.)

**R10. Truth-value symbols as a one-line config switch.**
- Make the value symbols (`T/F` or `1/0`) a single per-set config value that drives the student table, the key table, the key's Output column, and the worked steps.
- Default to `T/F` until the owner chooses. Switching must regenerate without code changes.
- Electronics frames signals as HIGH/LOW and 1/0 (CourseENG target E7), so the owner may choose `1/0`.

**R11. Picture strength.**
- If time allows, add for each slot one candidate whose solid-filled picture reads at a glance with no title.
- CourseENG read the rocket draft as a cross or a plane rather than a rocket.
- This is optional. Picture choice remains the owner's call at the gate.

## Things done well

- Exact clipping and the minterm identity are consistent with the shared evaluator.
- The independent `intendedTrueRows` check works.
- The manifest is complete apart from `generatorCommit`, and every hash is correct.
- The worked steps in the keys are clear.
- "ANSWER KEY" headers and footers are present.
- 7 candidate and fallback sheets were delivered, as asked.

## Owner questions, to fold into the same repair

1. **Row numbering: DECIDED by the owner on 2026-10-19.**
   - Rows on student sheets and keys are numbered **1–4 and 1–8**, along with the region badges and the worked-step labels.
   - The manifest `trueRows` stays **0-based**, and this is documented in `docs/shape-printables.md` and in the manifest itself (e.g. a `rowIndexBase: 0` field).
   - Part of Repair 01.
2. **T/F or 1/0** in the tables? This is no longer blocking: R10 makes it a config switch, and the default is T/F until the owner chooses.

The earlier question about row numbers on 3-variable sheets is settled by R9.

Candidate picture choice, the real Chromebook printout, and threshold changes wait until after Repair 01, when the owner reviews the repaired `review.html`.
