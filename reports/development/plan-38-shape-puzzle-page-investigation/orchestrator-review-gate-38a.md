# Plan 38: Orchestrator Review at GATE-38A

- Reviewer: BP orchestrator
- Date: 2026-10-24
- Commit reviewed: `3fb8070`
- Verdict: **The investigation is accepted, with three corrections to carry into plan-39.** It is good evidence work: Q4(b) was ruled out by an actual greyscale observation, and Q3, Q5, and Q6 are honestly left as "consistent with both". The owner decides those.

## Verified

| Claim | How checked | Result |
|---|---|---|
| No production changes | `git diff --stat d85018b 3fb8070` | OK: only the report and screenshots. The implementer also set the packet to `in-progress` (uncommitted). That breaks the "don't change status" rule, but the status is correct, so the orchestrator adopts it |
| Q1 multi-page isolation | Read `local/plan-38-prototype/dist-multi/` | `puzzle.html` loads only `puzzle-*.js` plus `polygon-clipping`, with relative paths. **Caveat:** the puzzle entry was a 2.56 kB stub with no Vue and no puzzle rendering, so the isolation was shown for a trivial entry only |
| Screenshot set | SHA-256 of all 22 | 02, 05, 11, and 16 are **the same image** (the default view), filed as evidence for Q3, Q4, Q5, and Q6. That's acceptable, since the default view is two-state, outside labels, full table, and whole expression, but the index presents them as separate captures |
| Prototype behavior | Opened 02, 04, 19 | Clean two-state start. The check turns correct regions green. Hovering row 5 highlights both split pieces, and both are badged |

## Corrections for plan-39 (not found by the investigation)

**C1. The truth table gives the answer away (blocking for plan-39 design).**
- In every prototype screenshot, the "Truth Table Reference" shows the expression's T/F result for every row. A student can shade the T rows without doing any logic.
- That defeats the puzzle and the project contract that the app "teaches prediction, stepwise reasoning, and correction rather than trial-and-error clicking".
- plan-39 must have **students fill the output column** (T/F) themselves, checked like the existing truth-table mode, before or alongside shading. The printable works the same way.

**C2. The "Solve / Key" button and unlimited free checks invite trial and error.**
- plan-39 should keep the answer key out of the student surface. If a teacher key is needed, make it a separate URL parameter or a separate view.
- Feedback should name a next reasoning move, as the existing hint ladder does, not just "correct" or "incorrect".
- How much retry and hint behavior to allow is an owner call.

**C3. Re-verify Q1 with the real entry.** Once `puzzle.html` mounts real Vue plus `src/shape-puzzles/`, confirm that:
- it shares only vendor chunks (Vue, polygon-clipping) with the main app;
- it imports nothing from `ui/components/` outside `shape-puzzles/`.

This becomes a GATE-39A check.

## Owner decisions for GATE-38A

| # | Question | Investigation evidence | Orchestrator recommendation |
|---|---|---|---|
| 1 | Q3: two-state shading (clean start, shade or unshade) vs. the AP tri-state | 01 vs. 02: the tri-state starts fully hatched | **Two-state** |
| 2 | Q4: monochrome outside labels (a) vs. colored outlines plus outside labels (c). Option (b) was ruled out | 06 / 10: both survive greyscale | **(c)**. Color helps on screen, and the line styles keep it accessible and consistent with print |
| 3 | Q5: full truth table beside the diagram on desktop, compact inspector on phone | 11 / 13 fit without scrolling; 14 needs scrolling on a phone | **Full table on desktop, compact on phone** |
| 4 | Q6: whole expression in one step (with an optional "break it down") vs. mandatory stepwise | 16 vs. 17 | **Whole expression**, matching the printables |
| 5 | New, from C1: students fill the output column themselves before the shading is checked | n/a | **Yes**. Otherwise the page is a coloring exercise |
| 6 | New, from C2: show any answer key or "solve" to students? | n/a | **No**. A teacher-only key via a URL parameter, if wanted |
