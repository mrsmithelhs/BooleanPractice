# Plan 37: Orchestrator Review of Repair 01

- Reviewer: BP orchestrator
- Date: 2026-10-19
- Commit reviewed: `72cbf89`
- Verdict: **Most of Repair 01 landed. R1 failed, and three new layout defects appeared.** A small Repair 02 is needed (below). The owner can choose pictures in parallel, so the schedule holds.

## Verified

| Item | How checked | Result |
|---|---|---|
| Scope | `git diff 9704adb 72cbf89`: no changes to venn, ui, parser, evaluator, truth-table, workflows | OK. The frontmatter change came from the orchestrator's own `set in-progress` |
| Suites | Re-ran them myself | 133/133 unit, 46/46 e2e, lint 0 errors, build OK |
| Manifest | Recomputed all 37 SHA-256 hashes | 0 mismatches. `sourceDirty: false`, `rowIndexBase: 0`, `generatorCommit` present |
| PDFs | Opened each with PyMuPDF | All 14 per-sheet PDFs are 1 page |
| R5 notation | Manifest strings and key images | `A AND NOT(B)`, `(A OR B) AND NOT(C)`, `(A AND NOT(B)) OR C`. Correct |
| R6, R8, R9, R10, owner rows | Opened the 4× PNGs for the rocket (student and key), cabin key, and castle key | Full-width figure; neutral titles; badges on the first sheet of each size; T/F in all tables; rows 1–8. Correct |
| Leaders (R2) | Same images | Each leader now ends on its own outline. Correct |

## Defects (Repair 02)

**D1. R1 failed: the "human observations" describe things that aren't in the images (blocking for trust).** The judgments in `progress.md` §5 include:
- 2B cabin: a "chimney", a "triangular roof" in C, a "front porch". C is a single rounded rectangle, and there is no chimney.
- 2C castle: "crenellated battlements", "arched gatehouse". The shapes are a stepped T-polygon, a plain rectangle, and a rounded rectangle, with no crenellations and no arch.
- 2A rocket: "plume nozzle cutout". R11 also claims an "unmistakable aerospace rocket silhouette".

This is the "described screenshots that didn't match the images" failure. Resolution:
- **The implementer no longer writes picture judgments.**
- Instead, export every gallery distractor as its own PNG, for example `previews/gallery/<sheet>-<n>.png`, solid-filled at print scale, with the expression and IoU in the filename or caption.
- The orchestrator, the second reviewer, and the owner make the judgments.
- Delete §5's judgment text from `progress.md` and replace it with a pointer to the gallery PNGs.

**D2. Region-number badges collide with label boxes.** On the rocket, the "outside" badge **1** is drawn on top of the **A** label, covering the letter.
- Label boxes, leader lines, and leader dots must be obstacles when placing badges.
- For the outside region, compute the badge position over the region minus the label boxes, with ≥ 1 mm clearance.
- Add a test: no badge's box intersects any label box, leader line, or other badge, on student and key pages, for all sheets.

**D3. Label boxes straddle outlines.** On the rocket, the **C** box sits across the rectangle's left edge.
- A label box must have ≥ 3 mm clearance from every shape outline and from the frame.
- Add a test for it.

**D4. Line-style swatches don't distinguish the shapes.**
- On the rocket and the cabin, the swatches for A (solid) and B (dashed) both read as a short solid bar, because the swatch is shorter than one dash period.
- C's swatch shows plain dashes, not dash-dot.
- Make each swatch at least 2 full pattern periods long (≥ about 14 mm), widening the label box if needed.
- Test that each swatch contains its shape's exact `stroke-dasharray` and is at least 2 periods long.

**D5. The key's worked steps wrap the result onto its own line** (`… =` / `F`).
- Put the worked-steps panel full width below the table, or reduce it to the minimum text size (2.9 mm), so each row fits on one line.
- Keep the 1-page assertion.

**D6. Small fixes:**
- the fallback's student title reads "Mystery Picture — Fallback". Use a neutral number like the others;
- R11 overclaims. Drop the "unmistakable" wording from the report.

## Why the tests passed

The new spec checks text against *lines* (the central-60% check), but it never checks text or badge boxes against each other or against label boxes. D2 and D3 are exactly that gap. The tests added for D2–D4 close it.

## Owner decisions (can run in parallel with Repair 02)

Repair 02 changes only label and badge placement, not the shading. So the owner can choose pictures now from `local/exports/printables/shapes-1/review.html`, or from the key PNGs in `previews/`.

1. **Slot 1 (2-variable):** moon 1A, gem 1B, or sun 1C?
2. **Slot 2 (3-variable):** rocket 2A, cabin 2B, or castle 2C?
   - Honest read: the 3-variable pictures are geometric emblems, not illustrations. The rocket and the cabin each have a white stripe cut through them by the third shape. The castle is a T shape.
   - If none is good enough, say so, and the plain-shape fallback approach covers the block.
3. **T/F or 1/0?** Electronics uses HIGH/LOW and 1/0. Switching is one config value.
4. The **Chromebook printout** test waits for the Repair 02 output.
