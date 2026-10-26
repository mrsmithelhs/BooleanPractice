---
id: plan-40
title: "Camouflaged Shape Sets and Constellation Reveal Overlays"
status: complete
resolution: "Final shapes-2 set (cat, cactus, train, submarine, satellite, falcon), giveaway metric, and reveal overlays accepted at GATE-40B (orchestrator review 706eee1); owner signed off 2026-10-26. The owner's Pages deploy is still pending."
depends_on: [plan-39]
gate: "GATE-40A: candidate pictures for shapes-2 (review page with leakage views and overlay previews) plus live shapes-1 reveal overlays; owner picks candidates and approves the overlay style before the set is finalized. GATE-40B: final shapes-2 set (printables + page) reviewed; owner deploys."
summary: >-
  Author a second shape-puzzle set (shapes-2) whose pictures are hidden by the outlines: work backwards from a target
  picture, split its silhouette across several shapes, and add decoy lobes only in the later, harder sheets. Add an
  online-only "constellation" reveal layer: after a sheet is solved, extra SVG detail is drawn over the student's shaded
  regions to complete the picture. Retrofit the layer to shapes-1. The set ships as printables and on the puzzle page.
---
# Plan 40: Camouflaged Shape Sets and Constellation Reveal Overlays

## Packet Metadata

- Packet id: `plan-40-camouflaged-shape-sets-and-reveal-overlays`
- Packet title: Camouflaged Shape Sets and Constellation Reveal Overlays
- Status: (see frontmatter)
- Owner/model: implementer (single)
- Date: 2026-10-24
- Packet type: feature (content + page feature)
- Mutation level: source-code, set data, tests, docs. Printables go to the git-ignored export folder only. No deploy.
- Approval gates:
  - **GATE-40A**: candidates and overlay style. Owner picks.
  - **GATE-40B**: the final set. The owner deploys.
- Depends on: plan-39. **Start only after plan-39 Repair 02 is accepted**, because the overlay is drawn by the same canvas component that Repair 02 changes.
- Progress report: `reports/development/plan-40-camouflaged-shape-sets-and-reveal-overlays/progress.md`

## Why this packet exists

The owner reviewed the shapes-1 sheets at the plan-39 GATE-39A preview (2026-10-24) and raised two problems:

1. **The outlines give the picture away.** The cabin's outlines already look like a cabin, so shading reveals nothing. New sets should hide the picture in the outlines, so it only shows up once the right regions are filled.
2. **Shading a few regions rarely makes a convincing picture,** so students may not believe their shapes "are" a rocket. The owner's idea is to treat the solved regions like a **constellation**. People see a figure in a few stars and imagine the details on top. After a sheet is solved, the page draws a layer of extra SVG details over the student's shaded regions to finish the picture. Students then see that their own work became part of something real.

   The layer only exists online. Paper can't do it, and that payoff justifies the extra class time the online version takes.

Both changes apply to new sets. The reveal layer is also retrofitted to shapes-1.

## Goal

1. **A new set, `shapes-2`, of 6 sheets** (4 core sheets and 2 extension sheets), designed with the work-backwards method below. Decoys are introduced in stages. The set ships as printables (the plan-37 pipeline) and on the puzzle page (the plan-39 page with the Repair 02 modes).
2. **A reveal-overlay layer** for the puzzle page. It is per-sheet SVG detail drawn over the solved regions, and it exists only after success. It covers all shapes-1 and shapes-2 sheets.

## Non-goals

- No change to the shapes-1 sheet definitions (`src/shape-puzzles/sets/shapes-1.js`). Those sheets are in classroom use (M43, Oct 27) and will be frozen.
- No overlay on printables or keys.
- No parser, grammar, or evaluator change. Still no XOR operator; express it with AND/OR/NOT if a sheet needs it.
- No changes to the AP CSA app, the workflows, or deployment. No new runtime dependencies.
- No P2 (build-the-target) or P4 (circuits).

## Authority and contracts

Required reading:
- `AGENTS.md`;
- `docs/decision-log.md`: DECISION-007 and DECISION-008, **including the 2026-10-24 amendment** (alternating table and shade modes);
- `docs/development/plan-37-hidden-picture-shape-printables.md`: the validator thresholds, print rules, review page, and manifest. **All of it still applies to shapes-2;**
- `docs/shape-printables.md` and `docs/shape-puzzle-page.md`;
- `src/shape-puzzles/` (`shapes.js` helpers, `geometry.js`, `validator.js`, `distractors.js`, `render/layout.js`) and `sets/shapes-1.js` as the format example;
- `ui/components/shape-puzzles/`, the page as it stands after Repair 02.

Contracts carried over unchanged:
- shared semantics (DECISION-001);
- the minterm validator, with every row present at a shadeable size;
- the independent picture check (`intendedTrueRows` against the evaluator);
- mm-based print legibility, 1-page PDFs, keys never committed or published;
- notation: words, `NOT(x)`, mixed AND/OR always parenthesized, rows numbered from 1, T/F;
- footer "Mr. Smith's Engineering Tech";
- no answer reveal before a correct check;
- `pictureName` and every overlay element **absent from the DOM before success**.

## Design method: work backwards from the picture

Write every sheet this way, and record the steps in the set file as comments:

1. **Pick the target picture first.** It should be a silhouette, or a few disjoint pieces, that reads clearly when grey-filled at about 130–150 mm wide.
2. **Pick the expression that will produce it.** Vary the operators across the set; not every sheet should be `A AND NOT(B)`.
3. **Split and close.** Break the picture's boundary into 2–3 arcs, and give each arc to a different shape. Each shape then closes its arc with an abstract curve that runs *outside* the picture.
   - For AND-type pictures, the picture is the overlap. Each shape is a large, plain blob that carries only part of the picture's edge, so no single outline reads as the picture.
4. **Cut details with NOT.** Eyes, windows, notches, and holes can come from a NOT-ed shape whose part *inside* the picture is the detail. The part *outside* the picture is an abstract lobe.
5. **Decoys (staged; see the set structure).** A decoy is an extra lobe that looks like it could be part of the picture but is removed by the expression. For example, shape A is the picture plus a decoy lobe, and a NOT-ed shape B covers that lobe and also sticks out elsewhere. Decoys make *visual* solving much harder, so they appear only in the later sheets.
6. **Check it.** Run the validator, the independent picture check, the distractor gallery, and the outline-giveaway metric (Scope 3). Then look at the outlines-only leakage view yourself.

Starter ideas (the orchestrator's; use, adapt, or replace them):
- **Face:** the picture is `A AND NOT(B OR C)`.
  - A is a head blob.
  - B's part inside the head is the eyes, and C's part inside the head is the mouth.
  - Outside the head, B and C continue as abstract lobes, so their outlines don't look like eyes or a mouth.
  - If a shape can't be two separate pieces, check what the validator allows. Otherwise make B a single blob that dips into the head twice.
- **Figure–ground vase:** the picture is the region outside the shapes.
  - Two profile-ish blobs face each other, and the gap between them, closed by the frame and a third shape, is a goblet.
  - Example expression: `NOT(A OR B) AND C`.
  - This is the Rubin's-vase idea (Wikipedia, "Negative space").
- **Cat head:** `A AND B`.
  - Two large offset blobs whose overlap is a head with two ears.
  - Each blob carries one side of the silhouette.
- **Fish:** `(A OR B) AND NOT(C)`.
  - A is the body and B is the tail.
  - C cuts the mouth notch and the eye, and is a plain lobe elsewhere.

You are expected to invent other pictures from your own knowledge: icons, animals, vehicles, tools, and everyday objects that suit an engineering class. Prefer pictures that make sense to grade 8–10 students.

## Set structure: shapes-2

| Sheet | Size | Default page mode (Repair 02) | Row badges | Decoys |
|---|---|---|---|---|
| 1 | 2 shapes | table | yes | none |
| 2 | 3 shapes | shade | yes | none |
| 3 | 3 shapes | table | no | none |
| 4 | 3 shapes | shade | no | **required** (the one core decoy sheet) |
| 5 (extension) | 3 shapes | table | no | yes |
| 6 (extension) | 3 shapes | shade | no | yes |

- **Fading scaffold:** badges appear only on the first sheet of each size, the convention the owner liked in shapes-1.
- **Extension sheets:** mark them with a new optional field, `tier: 'extension'`. The page shows a small "Challenge" chip, and the printable title says "Challenge Picture 5". The student-facing word is an owner question at GATE-40A.
- **Sheet 1:** a 2-shape camouflaged picture is hard to make with only 4 regions. If it still gives the picture away, report that honestly; an easy first sheet is acceptable.
- **Operator mix across sheets 1–6:** at least one `OR` outside parentheses, at least one `NOT(...)` around a group, and at least two mixed AND/OR expressions.
- **Titles:** neutral ("Mystery Picture N" / "Challenge Picture N"). Never reveal the picture in a title, footer, file name, or page `<title>`.

## Scope

### In scope

1. **Set data** in `src/shape-puzzles/sets/shapes-2.js`, in the shapes-1 format: slots, candidates, `sheets`, and `frozen: false`. Add the optional `tier` field. Register the set in:
   - `scripts/build-printables.mjs` `SETS`;
   - `ui/components/shape-puzzles/url.js` `AVAILABLE_SETS`.
   
   The page's set navigation must handle more than one set and more than 4 sheets. Check that the sheet buttons and the prev/next controls still fit at 390 px.
2. **Validator:** shapes-2 must pass unchanged thresholds. You may add rules; don't relax any. If the validator rejects a multi-piece shape and a picture truly needs one, stop and report it (see Stop conditions).
3. **Outline-giveaway metric** in `src/shape-puzzles/` (pure, unit-tested). For each sheet, compute:
   - the IoU between the picture (the union of the TRUE regions) and each single shape;
   - the IoU between the picture and the union of all shapes.
   
   Flag any value ≥ 0.75. Show the values and flags on `review.html` next to the leakage view, and write them to the manifest. This is a screen, not a gate rule: flagged sheets get a one-line judgment, and the owner decides.
4. **Printables for shapes-2:** student pages, keys, booklets, review page, and manifest, exactly as for shapes-1, in `local/exports/printables/shapes-2/`.
5. **Reveal overlays (online only).**
   - **Data** in `src/shape-puzzles/reveal-overlays/<set-id>.js`, keyed by sheet id.
     - Each overlay is a short list of SVG primitives: `path`, `line`, `polyline`, `circle`, `ellipse`, `polygon`. Coordinates are in that sheet's viewBox units, and each primitive takes a style token: `detail-stroke`, `detail-fill`, `accent`, `highlight`, or `star`. No raw colors.
     - Overlays may use the `shapes.js` helpers.
     - About 60 primitives per sheet at most. No `<text>`, no images, no external assets.
     - A unit test checks that every overlay element lies within the viewBox and that every sheet id it uses exists in its set.
   - **Coverage:** an overlay for all 4 shapes-1 sheets, which adds a new file only and leaves `shapes-1.js` untouched, and for every shapes-2 sheet.
   - **Art direction:**
     - The student's shaded regions stay clearly visible and remain the core of the picture. The overlay adds what makes the picture convincing: rays, windows, flames, an eye, fins, whiskers, texture, a ground line, stars.
     - It may extend into unshaded regions and the background.
     - It must never fully cover a shaded region, or recolor it so that the student's fill disappears.
     - Think constellation lines over stars: thin strokes, small accents, a few fills.
   - **Rendering** in `ShapePuzzleCanvas.vue`:
     - a layer drawn above the solved fill and below the focus ring;
     - `aria-hidden="true"`; the success message keeps naming the picture;
     - inserted **only after success** (in both modes) and in the teacher view. Not in the DOM, and not merely hidden, before success;
     - a short draw-in animation of about 1–1.5 s, with strokes drawing and fills fading in;
     - no animation when `prefers-reduced-motion` is set;
     - colors come from CSS variables, with a light and dark variant if the page has dark mode, and it must look correct in the greyscale emulation.
   - **Success message:** keep the current celebration line that names the picture. The overlay is the new part.
6. **Tests.**
   - **Unit:**
     - the shapes-2 validator and picture check;
     - the giveaway metric on known fixtures (a sheet whose picture is one whole shape must flag);
     - overlay data bounds and sheet ids;
     - `tier` handling.
   - **E2E:**
     - for one sheet in each mode, the overlay is absent from the DOM before success and present after a correct solve;
     - the overlay never appears after a wrong check;
     - reduced motion means no running animations on the overlay;
     - set 2 loads via `?set=shapes-2&sheet=N` for every N;
     - the Challenge chip appears on sheets 5–6 only;
     - 1366×768 with no vertical scroll still holds for a 3-shape sheet in both modes;
     - the isolation test still passes.
   - The plan-37 print-legibility tests run on shapes-2.
7. **Page polish carried over from the plan-39 Repair 02 review:**
   - **Solved frame edges.** In the solved state, the diagram loses the top and bottom edges of its frame (plan-39 screenshots 02 and 05). Make the frame show all four sides in every state, and add an e2e check that the frame's rendered box matches its own bounds before and after a solve.
   - **Neutral F styling.** In the solved or verified table, F values are tinted red and T values green, so students may read a correct F as "wrong". Give F a neutral style and keep T's emphasis subtle. Never use red for a value that is correct.
8. **Docs:**
   - `docs/shape-printables.md`: the work-backwards method, decoy staging, and the giveaway metric. Make it a short "how to author a set" section that the next set can follow;
   - `docs/shape-puzzle-page.md`: reveal overlays and their data format.

### Out of scope

- Editing `shapes-1.js` or regenerating the shapes-1 printables.
- Overlays on paper.
- Any change to the AP app, `src/venn/diagram.js`, the parser, `src/feedback/`, or the workflows.

## Work Plan

1. Run `node scripts/dev/plan-status.js check plan-40`, confirm that plan-39 Repair 02 is in the tree, and summarize the job.
2. Build the giveaway metric with its tests, and add it to `review.html` and the manifest.
3. Build the overlay data format and the canvas layer with its tests. Write the 4 shapes-1 overlays.
4. Author shapes-2 **candidates**: 2–3 candidate pictures for each of sheets 1–4, and 1–2 candidates for each extension sheet. Each candidate has an overlay draft. Use `--draft` output.
5. For each candidate, render **"solved + overlay" previews** on `review.html`, next to the existing student, key, leakage, and gallery views, using the same overlay data and style tokens as the page.
6. **GATE-40A: stop here.**
   - Run the full `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`, and `npm run build:gas`. Report every suite's counts.
   - In the report, include the path of `review.html`. For each candidate, give:
     - the giveaway IoU values;
     - a one-line honest judgment of its outlines-only view: does the picture show?;
     - for decoy sheets, what the decoy is and why it is tempting.
   - Capture screenshots of the shapes-1 sheets solved with overlays on the page (`npm run preview` of the real build), plus one in greyscale and one on a phone. Open every image before describing it.
   - Report, and wait.

   The orchestrator then sends the owner one question list:
   - which candidate for each sheet;
   - the overlay style;
   - "Challenge" or another label;
   - any threshold or count changes.
7. After approval, as **one batched change**:
   - finalize the six sheets and overlays;
   - generate the set without `--draft`;
   - rerun everything;
   - update the screenshots and the report.
   
   **GATE-40B: stop.** The owner reviews, prints if he wants, and does the Pages deploy himself.

## Validation Checklist

- [ ] The full suites pass, with counts reported. The isolation test passes, and the existing shapes-1 printables and page tests are unchanged.
- [ ] Every shapes-2 sheet passes the validator and the independent picture check. The report lists the region areas and inscribed widths.
- [ ] Giveaway metric values appear for every candidate, and every flag has a judgment.
- [ ] The overlays are absent from the DOM before success and after a wrong check, and present after success (e2e, both modes).
- [ ] Reduced motion and greyscale are verified.
- [ ] `git diff` shows no edits to `shapes-1.js`, the AP app, the parser, `src/feedback/`, `src/venn/`, or the workflows.
- [ ] No PDFs, keys, or exports are tracked.
- [ ] The screenshots and previews were opened before they were described.

## Stop Conditions

Stop and report if:
- a picture needs a multi-piece shape and the validator forbids it. Don't change the validator rule;
- any candidate for a sheet misses the plan-37 region-size thresholds by more than ±25%;
- the overlay can't be kept out of the DOM before success without restructuring the Repair 02 flow;
- an existing test would need weakening, skipping, or filtered fixtures;
- anything seems to need a parser change, a new dependency, or a workflow edit.

## Progress Report

`reports/development/plan-40-camouflaged-shape-sets-and-reveal-overlays/progress.md`

Minimum contents:
- summary;
- files changed;
- the candidate table, with giveaway values and judgments;
- the overlay index;
- suite counts;
- the paths of the review page and the screenshots;
- problems and remaining risks;
- the gate stop point.

Implementers do not set packet status.
