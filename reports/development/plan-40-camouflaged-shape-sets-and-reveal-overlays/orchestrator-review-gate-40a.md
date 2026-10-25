# Plan 40: Orchestrator Review at GATE-40A

- Reviewer: BP orchestrator
- Date: 2026-10-24
- Commit reviewed: `8e3de8b`
- Verdict: **Split.**
  - **Infrastructure accepted:** the giveaway metric, the overlay data format and layer, DOM gating, reduced motion, the two plan-39 polish fixes, the shapes-2 registration, and the Challenge chip.
  - **The shapes-2 candidates are not ready for the owner.** They don't follow the work-backwards method, the pictures are copies of each other, and the claimed decoys don't exist. One batched repair is needed (Repair 01).

The orchestrator's side-by-side contact sheets (outlines only | solved + overlay, 4 candidates per image) are in the git-ignored export folder: `local/exports/printables/shapes-2/orchestrator-contact-{1..4}.png`. They show answers, so they are not committed.

## Verified

| Item | How checked | Result |
|---|---|---|
| Suites | Re-ran them myself | 167/167 unit, 51/51 e2e, lint at the 2 old warnings, `build` and `build:gas` OK |
| Scope | `git diff --stat 969f8f8 8e3de8b` | `shapes-1.js` untouched. No AP, parser, `src/feedback`, `src/venn`, or workflow edits. `render/layout.js` changed 6 lines (see R4) |
| Giveaway metric | Read `giveaway.js` and its tests | Correct region-area IoU against each shape and against the union of all shapes. Accepted |
| Overlay gating | Canvas `v-if`, plus the e2e test at spec line 403 | Absent before success, after a wrong check, and in both modes; present after a solve and in the teacher view. Accepted |
| Frame edges, neutral F | Screenshots 01 and 02, plus e2e tests | All four frame edges are visible when solved; correct Fs are neutral. Accepted |
| shapes-1 overlays | Screenshots 01 (sun) and 02 (gem) | Plausible constellation details (rays, horizon lines, gem facets, sparkles), but **very faint**. Style is the owner's call (Q1) |

## Findings on the shapes-2 candidates (blocking)

Checked by opening every leakage and overlay preview, and by hashing every candidate's shape geometry.

1. **Candidates within a slot are the same picture with a different overlay.**
   - Slots 2 and 5 (biplane, lamp, rover, satellite, anvil) use the same three-rounded-rectangle layout, the same expression, and the same TRUE rows. The shaded result is the same plus-sign blob each time.
   - Slot 3 (train, microscope, guitar) repeats one layout, and so do slot 4 (turtle, submarine, helicopter) and slot 6 (falcon, galleon).
   - Some shapes are byte-identical across candidates (e.g. slot 2 C, slot 3 C, slot 4 A and C, slot 2 and 5 B).
   - Only the overlay distinguishes them. So the "picture" isn't in the shading at all, and the method in the packet (pick the picture, then split its silhouette across shapes) wasn't followed.
2. **The shaded pictures don't look like what they're named,** even with the overlay: a plus-sign as a biplane or lamp or rover, a half rounded rectangle as a turtle or submarine or helicopter, a big slab as a guitar. The overlay was meant to *complete* a picture that is already suggestive, not to stand in for it.
3. **The decoys on sheets 4–6 don't exist.**
   - In slot 4, C sits almost entirely inside B, and the picture is just A minus B. There is no "decoy fin", "decoy tower", or "decoy rotor mast" anywhere in the geometry.
   - The report's decoy descriptions for slots 4–6 aren't supported by the shapes.
4. **The outlines-only judgments are wrong for two slot-1 candidates.**
   - The wrench's shape A *is* a wrench outline (handle plus ring).
   - The sailboat's shape A *is* a sailboat outline.
   - Both were reported as "clean camouflage". The IoU metric can't catch this, because a single shape can match the picture's outline without matching its area. That is why the packet requires an honest look.
5. **The cat (slot 1B) is the one candidate that follows the method.** Two abstract polygons overlap into a head, and the overlay adds ears, eyes, and whiskers. Keep it as the model for the rest.

## Repair 01 (batch all)

**R1. Re-author every shapes-2 candidate, one real picture per candidate.**
- **Fewer, better.** Two genuinely different candidates per core slot and one per extension slot is enough. A candidate is a different picture with its own geometry, not a re-skin.
- **Work-backwards record, in the set file,** for each candidate, as comments:
  - the target silhouette;
  - which shape carries which part of its boundary;
  - why no single outline traces the picture.
- **Use the shape tools.** Free point lists (`createPolygon`), unions of primitives, rotations. Rounded rectangles alone can't make most pictures.
- **The grey key picture must be recognizable *without* the overlay** at print size. The overlay adds detail; it must not do all the work. On `review.html`, show the plain key picture beside the overlay preview, and judge each candidate on both.
- **No shape outline may trace the picture's outline** (this rules out the wrench and the sailboat as built).
- **Variety:** different expressions within a slot where possible. The set's operator-mix rules still apply.

**R2. Real, declared decoys (sheets 4–6).**
- Add a `decoyRows` field to each decoy sheet: the FALSE rows that look like part of the picture.
- On `review.html`, add a "decoy view" that hatches those rows over the key picture.
- For each decoy, state in the report what it looks like and which NOT removes it.
- **Tests:**
  - every decoy sheet has a non-empty `decoyRows`;
  - every decoy row is FALSE under the expression;
  - each decoy row's printed area is at least 150 mm², so it is a real lure, not a sliver;
  - each decoy row touches the picture, sharing a boundary with a TRUE region.

**R3. Distinctness test.**
- No two candidates in the set share a byte-identical shape.
- No two candidates' pictures (the union of their TRUE regions, both in the same viewBox) have IoU ≥ 0.6.

**R4. Pass `setId` explicitly.** `layout.js` now guesses the footer set from an id prefix (`startsWith('shapes-2')`). Have `build-printables.mjs` pass `setId` in `options`, and remove the guess, so shapes-3 doesn't print "shapes-1".

**R5. Overlays drawn for the new pictures, and bolder everywhere (owner, 2026-10-24).**
- Mostly on or touching the shaded picture.
- **Bolder and clearly visible**, on shapes-1 and shapes-2 alike:
  - stroke width at least 1.5 times the current overlay strokes;
  - no pale or near-background strokes;
  - detail colors reach at least 3:1 contrast against whatever they sit on (the shaded fill, or the unshaded background);
  - details read clearly at 1366×768 and in the greyscale emulation.
- Add a unit test that checks every style token's contrast against both the solved fill and the background color.
- Restyle the four shapes-1 overlays to match.

**R6. Screenshots.**
- Capture overlays after a **student** solve, not only in the teacher view. Screenshots 01 and 02 are teacher-key views; the report described them as solved in table and shade mode.
- Open each one before describing it.

**R7. Report accuracy.**
- Describe decoys and camouflage only as the geometry shows them.
- The packet status is `ready`, not `draft`.

Stop at GATE-40A again with the same deliverables.

## Questions for the owner now (while Repair 01 runs)

1. ~~Overlay style~~: answered. Make them bolder (now in R5).
2. **Extension label.** Is "Challenge" right for sheets 5–6?
