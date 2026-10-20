# Plan 37: Orchestrator Review of the Final Set

- Reviewer: BP orchestrator
- Date: 2026-10-19
- Commits reviewed: `b8dd0a0`, `1267632`
- Orchestrator fixes: `fab179e`, `4183328`
- Verdict: **Final 4-sheet set accepted on the orchestrator side.** Packet status stays `in-progress` until the owner's Chromebook printout and his view of the gem are in.

## Verified

- Scope: only shape-puzzles, scripts, tests, and the report changed.
- e2e 46 → 31 is explained by the set shrinking from 7 sheets to 4 (5 per-sheet tests each). No tests were filtered.
- Manifest: 56 files, 0 hash mismatches, `sourceDirty: false`.
- Every student and key PDF is 1 page. The booklets are 4 pages each.
- Opened the gem and cabin student pages and the cabin key. Badges are on the sun and cabin only. The gem and rocket have the "write which shapes" step. The cabin's C leader is clean.

## Defects found and fixed inline by the orchestrator (to avoid another loop)

1. **Stale exports.** The export folder still held moon, castle, and lens PDFs, keys, and previews from the 7-candidate run, none of them in the manifest. A full-set build now empties the folder first; a partial `--sheets` run doesn't. (`fab179e`)
2. **Picture names leaked in student footers.** The footer printed the sheet id (`…cand-b-gem`). Student footers now show the neutral title. Checked by extracting text from all student PDFs: no picture names appear. Key footers keep the id. (`fab179e`)
3. **Split rows had only one badge.** On the cabin, rows 5 and 6 are each split by B into a 5 mm wall strip plus a main piece, and only one piece was badged. Changes:
   - badges are now drawn in every piece, and generation fails if a piece can't hold one;
   - the cabin's B moved 3 mm right (x 70–90), so the strip is 8 mm wide;
   - B's leader is pinned to its top edge;
   - new test file `tests/shape-puzzles-badges.test.js`. (`4183328`)

After the fixes: 139/139 unit, 31/31 e2e, lint 0 errors, build OK. Regenerated at `4183328`.

## Still open

- The owner's Chromebook printout of sheets 1 and 3.
- Gem (sheet 2): `A AND B` of a rounded rectangle and an ellipse reveals a plain barrel shape. The orchestrator recommended the gem without having looked at it. The owner should confirm it from `previews/shapes-1-slot1-cand-b-gem-key.png`, or swap in the moon (`A AND NOT(B)`, which repeats sheet 1's expression).
- Per-sheet PDF **filenames** still contain the picture names (e.g. `…cand-b-gem.pdf`). That's harmless for paper, but CourseENG should hand out the booklet, or rename the files, if students ever get the PDFs digitally.

## Owner decision (2026-10-19)

- **The gem stays as sheet 2.** The only remaining open item is the owner's Chromebook printout of sheets 1 and 3.
