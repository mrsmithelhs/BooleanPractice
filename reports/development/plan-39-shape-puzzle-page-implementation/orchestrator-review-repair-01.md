# Plan 39: Orchestrator Review of Repair 01

- Reviewer: BP orchestrator
- Date: 2026-10-24
- Commit reviewed: `19564bd`
- Orchestrator fix: `5a85cf2`
- Verdict: **Accepted on the orchestrator side. GATE-39A is ready for the owner's local preview.** GATE-39B (the Pages deploy) remains the owner's step.

## Verified

| Item | How checked | Result |
|---|---|---|
| Scope | `git diff --stat f3357f3 19564bd` | Only shape-puzzles, puzzle tests, README/deployment lines, and screenshots. No AP, src, or workflow edits |
| Suites | Re-ran them myself | 150/150 unit, 43/43 e2e, lint back to the 2 old warnings, build OK |
| R1 | Code: rows and mobile tabs are colored only when `outputsCorrect`; bulk fill sits behind `isTeacher`. Screenshot 02 | No reveal after a wrong check |
| R2 | Code: the missed/extra classes and strokes are removed from the canvas. Screenshot 04 | No reveal after a wrong shading check |
| R3 | Screenshot 06 at 1366×768 | All 8 rows and the check button are visible, with no inner scroll |
| R4 | `README.md`, `docs/deployment.md`, lint count | Done |

## Fixed inline by the orchestrator (`5a85cf2`)

1. **Misleading first hint.**
   - The reused AP hint said "Recheck the current row", but the puzzle checks the whole column at once and has no current row.
   - A puzzle-side wrapper (`buildShapePuzzleTableHint`) now words the first stage for the whole column. Later stages reuse the shared hint unchanged, and the AP text is untouched.
   - Two unit tests were added.
2. **The R1 test could not fail.** It only asserted that the deleted class names were absent.
   - It now compares every row's computed style before and after a failed check, with hover, focus, and transitions neutralized.
   - **Mutation-checked:** re-adding per-row coloring after any check makes it fail.

After the fixes: 152/152 unit, 43/43 e2e, lint 2 old warnings. Screenshots were re-captured from the rebuilt `dist/`; 02 shows the new hint text.

## For the owner (GATE-39A preview)

- Run `npm run build`, then `npm run preview`, and open `http://127.0.0.1:4173/puzzle.html`. Try sheets 1–4, including wrong answers.
- Teacher key: `puzzle.html?sheet=3&teacher=1`.
- Known trade-off: the picture names are inside the page's JavaScript. A static site can't hide them from someone reading the source, but they never appear on screen before the puzzle is solved.
