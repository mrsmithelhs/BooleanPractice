# Plan 40: Orchestrator Review at GATE-40B (final set)

- Reviewer: BP orchestrator
- Date: 2026-10-25
- Commits reviewed: `2029c29`, `ce58086`, `c5aea58`
- Verdict: **Accepted on the orchestrator side, with two caveats for the owner.** The final shapes-2 set is ready for the owner's look, print check, and deploy.

## Verified

| Item | How checked | Result |
|---|---|---|
| Suites | Re-ran them myself | 172/172 unit, 51/51 e2e, lint at the 2 old warnings, `build` and `build:gas` OK |
| Scope | `git diff --stat 5f13093 c5aea58` | `shapes-2.js`, overlays, `giveaway.js` and its test, the capture script, and the report. No AP, parser, `src/feedback`, `src/venn`, `shapes-1.js`, or workflow edits |
| Sheet order | `SET_SHAPES_2.sheets` | Cat, cactus, train, submarine, satellite, falcon, as the owner picked |
| F1, expressions | Read the set | `A AND B` → `(A OR B) AND NOT(C)` → `A AND (B OR C)` → `A AND NOT(B OR C)` → `(A OR B) AND NOT(C)` → `(A AND NOT(B)) OR (B AND NOT(C))`. No consecutive repeats, and sheet 4 has a NOT around a group. Met |
| F2, giveaway | Read `giveaway.js` (singles, pairwise unions, pairwise intersections) and its tests | Met as a metric. See caveat 1 |
| Decoys | Decoy views | Real on sheets 4, 5, and 6 |
| F3 | Settled screenshots 01 and 08 | Sun: the highlight is now a thin arc and the shading is fully visible. The report calls it a white stroke, but it renders dark; harmless. Cabin overlays keep clear of the row badges |
| F4 | Screenshots 01 and 08 | Captured after the fade. Bold strokes |
| Printables | `local/exports/printables/shapes-2/` | Six student PDFs plus keys and the manifest, generated without `--draft` |

## Caveats for the owner

1. **The train's shape A outline is still a locomotive.**
   - Its outline-only view shows cab, boiler, and chimney. The extra base slab keeps the IoU at 0.705, under the flag, without disguising the shape.
   - This matters less than it would elsewhere: sheet 3 is a **table** sheet, so students fill the truth table, and the page shades the picture for them.
   - On paper, students see the outlines, so the picture is guessable there.
2. **The submarine is a decoy sheet by design.**
   - Shape A outlines a whole vessel with two towers. A student who shades "the submarine" by eye gets it wrong, because only the bow section is TRUE. That is the lure working as intended.
   - The trade-off: the solved picture is a short bow with one tower. The overlay's portholes and periscope carry it.

Neither blocks shipping. A later set can do better on both now that the method and metrics exist.

## For the owner (GATE-40B)

1. **Look:** run `npm run build`, then `npm run preview`, and open `puzzle.html?set=shapes-2&sheet=1` through `sheet=6`. Sheets 5–6 show the Challenge chip. Teacher key: add `&teacher=1`.
2. **Print, optional:** the student PDFs are in `local/exports/printables/shapes-2/student/`, and the keys are in `keys/`, which is git-ignored and never published.
3. **Deploy:** push, then run the Pages workflow. One deploy covers plan-39 (the puzzle page) and plan-40 (shapes-2 and the overlays).
4. Then tell the orchestrator, who will mark plan-39 and plan-40 complete.

## Housekeeping noted

- `docs/development/plan-41-...md` shows `status: in-progress` as an uncommitted working-tree edit, made outside this review. It was left untouched.
