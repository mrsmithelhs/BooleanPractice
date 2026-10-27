# Plan 41: Orchestrator Review at GATE-41A

- Reviewer: BP orchestrator
- Date: 2026-10-26
- Commit reviewed: `ff55180`
- Verdict: **Not yet ready for the owner's real-browser test.** The design and most of the build are sound. Two defects would hurt honest students: progress lost across tabs, and false "identical attempts" flags. One batched repair is needed (Repair 01).

## Verified

| Item | How checked | Result |
|---|---|---|
| Suites | Re-ran them myself | 194/194 unit, 58/58 e2e, lint at the 2 old warnings, `build` and `build:gas` OK |
| Admin isolation | `ls dist gas-dist`, plus a grep of the built bundle | No `admin.html` and no admin chunk. The puzzle bundle contains the dev-link template text, but `v-if="isDev"` is a build-time `false`, so the link never renders. Harmless |
| Real exports | My own Playwright run against the built site: 3 browser contexts, real clicks, real downloads | Files download with sensible names. Integrity verifies, and hash chains are intact |
| Teacher view | Student 2 opened `?teacher=1`, then solved in student mode | Its file contains only the `teacher_view_opened` event for the teacher view, and the analyzer flags it. Correct |
| Renamed copy | Copied student 1's file under a new name | Flagged as duplicate hash and identical attempts. Correct |
| Active time | `recorder.js` around line 217 | Gaps are **capped** at 5 minutes (correct). The report says gaps over 5 minutes count as 0 ms; that is a report error, and the code is right |
| Screenshots | Opened 01 (export dialog) and 03 (admin table) | They match their descriptions. Synthetic names only |

## Defects (Repair 01, batch all)

**R1. Two open tabs lose each other's progress (blocking).**
- *Reproduced:* one browser, two tabs open at once. Tab A checks sheet 1 twice; tab B shades and solves sheet 2. Then both export.
- *Result:* tab A's file has no trace of the sheet-2 solve, and tab B's file has no trace of tab A's checks. Both chains still verify, so nothing warns anyone.
- *Cause:* the recorder loads storage once, at page load, keeps state in memory, and the last writer wins. Students routinely open several tabs, so their recorded progress silently shrinks.
- *Fix:*
  - in `_recordEventInternal`, re-read the latest state from storage, then append and write back (read-modify-write), so `seq` and `prevHash` always continue the stored log;
  - serialize writes across tabs with `navigator.locks.request('bp-usage', …)` where it is available;
  - where it isn't, read immediately before writing and verify `seq` before the write;
  - re-read storage before building an export.
- *Tests:*
  - an e2e test with two tabs interleaving checks and solves without reloading. Both exports contain **all** events from both tabs, `seq` values are unique and consecutive, and the chain is intact;
  - a unit test with two recorder instances sharing one storage.

**R2. "Identical attempts" flags honest students (blocking).**
- *Reproduced:* two separate students whose runs happen to follow the same path (one wrong check on sheet 1, then sheet 2 right the first time) were both flagged "identical attempt sequence".
- *Cause:* `getUsageEventFingerprint` uses only type, sheet, correctness, and attempt number, with no timing. The packet asked for "near-identical timing". In a real class, every student who solves each sheet on the first try shares the same fingerprint.
- *Fix:*
  - include the timing pattern: the gaps between consecutive signal events, rounded to whole seconds;
  - flag only when both the sequence and every gap match within ±1 s;
  - flag only when there are at least 6 signal events, so short runs can't collide.
  
  A copied file whose name was changed and whose hash was recomputed keeps its timing exactly, so it is still caught.
- *Tests:*
  - two "perfect runs" with different timing are **not** flagged;
  - a copied file with a changed name, a recomputed integrity hash, and the same events **is** flagged;
  - fewer than 6 signal events never triggers the flag;
  - keep the existing positive fixture, regenerating it with matching timing if needed.

**R3. Report accuracy.** Correct the active-time description in `progress.md` (gaps are capped, not zeroed).

Stop at GATE-41A again, with the suite counts.

## Owner test after Repair 01 (relay at the gate)

1. Run `npm run dev`. Open `http://127.0.0.1:5177/puzzle.html?set=shapes-1&class=TEST` in a normal window, and do a couple of sheets with one wrong check.
2. In a private window, open the same link and solve differently. Also open `&teacher=1` once in that window.
3. Export from both windows with different names. Copy one file and give the copy a new name.
4. Open `http://127.0.0.1:5177/admin.html`, enter `TEST` as the class code, and drop in all three files. Expect:
   - progress for both students;
   - the copy flagged as a duplicate;
   - the private-window student flagged for opening the teacher view;
   - nothing else flagged.

Keep real student files in `local/usage/` only.
