# Plan 37: Orchestrator Review of Repair 02

- Reviewer: BP orchestrator
- Date: 2026-10-19
- Commits reviewed: `a3de84f`, `7e190b1`
- Verdict: **Repair 02 accepted.** GATE-37A passes on the orchestrator side. It is waiting only on the owner's printout from a Chromebook.

## Verified

| Item | How checked | Result |
|---|---|---|
| Scope | `git diff 13be960 HEAD` | Only shape-puzzles, scripts, tests, and the report changed. Nothing in venn, ui, parser, evaluator, or workflows |
| Suites | Re-ran them myself | 133/133 unit, 46/46 e2e, lint 0 errors, build OK |
| D1 | `previews/gallery/`, plus the progress report | 56 distractor PNGs exist. The judgment text is gone from the generator and the report |
| D2, D3, D4 | Opened the 4× PNGs: rocket student, cabin student, sun key | Rocket's outside badge is clear of the labels. Label boxes are clear of outlines. Swatches show solid, long-dash, and dash-dot distinctly |
| D5 | Sun key, plus the spec | Worked steps fit on one line |
| D6, footer | Same images, plus the set file | "Mystery Picture 1D"; the footer reads "Mr. Smith's Engineering Tech" |

## Report inaccuracy (noted, not a repair)

- The report says badges are "enabled" on 1C and 2B.
- `src/shape-puzzles/sets/shapes-1.js` still has `showRegionRowNumbers: true` on 1A and 2A, and `false` on 1C and 2B. The rendered cabin has no badges.
- Moving the badges was deliberately deferred to post-gate work, so the code is as expected. Only the report's claim is wrong.

## Post-gate work order (after owner printout approval)

1. **Final set:** 4 sheets, renumbered for students as Mystery Picture 1–4, in the order the owner confirms. Proposed: sun 1C → gem 1B → cabin 2B → rocket 2A. These are four different expressions, two 2-variable then two 3-variable, and need no new picture design. The unused candidates (moon 1A, castle 2C, lens 1D) are removed from the published set but kept in source.
2. **Badges** go on the first sheet of each size in the final order: on for the sun and the cabin, off for the gem and the rocket. Sheets without badges keep the "write which shapes it is inside" step.
3. **Cabin C leader:** it currently runs almost along C's own bottom edge and crosses B's rectangle. Reroute it so it meets C's outline at a clear angle and crosses no other outline. Add a test: the leader segment crosses no other shape's outline.
4. **Regenerate without `--draft`**, set the chosen sheets to `frozen: true` after classroom use (not before), and re-run the full suites.
5. Report the final paths for CourseENG: the student booklet, the key booklet, the per-sheet PDFs, and the manifest.
