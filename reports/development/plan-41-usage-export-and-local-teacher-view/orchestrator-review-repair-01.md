# Plan 41: Orchestrator Review of Repair 01 (GATE-41A)

- Reviewer: BP orchestrator
- Date: 2026-10-26
- Commit reviewed: `658f791`
- Verdict: **Accepted, with one small inline fix by the orchestrator (below). Ready for the owner's real-browser test.**

## Verified

| Item | How checked | Result |
|---|---|---|
| Suites | Re-ran them myself | 198/198 unit, 59/59 e2e, lint at the 2 old warnings, `build` and `build:gas` OK. `admin.html` still absent from `dist/` and `gas-dist/` |
| R1 multi-tab | Read `recorder.js`. The new e2e test interleaves two real tabs on different sheets | Read-modify-write under `navigator.locks`, and the export re-reads storage. Both exports contain every event, `seq` is consecutive, and the chain verifies |
| R1, same sheet | My own run on the built site: two tabs on **one** sheet, checks alternating 3 s apart | Every event is present and the chain verifies. **Active time was wrong** (see I1) |
| R2 fingerprint | My own run: two honest students on the same path at different speeds, plus a copy of student 1 with a new name and a recomputed hash | Honest students: no identical-attempts flag. Copy: flagged. Correct |
| R2 minimum | Same run before I added a sixth check event (5 signal events) | No identical-attempts flag. The copy was still caught by the same-install-ID flag |
| R3 | `progress.md` | It now says gaps are capped at 5 minutes. Correct |

## Inline fix by the orchestrator

**I1. Active time counted twice across tabs.** In two tabs on one sheet, checks spanning 6.3 s recorded 9.6 s of active time.
- *Cause:* each tab cached its own "last event time" per sheet, so a tab measured its gap from its own last event and missed the other tab's.
- *Fix:* `recorder.js` now always takes the last event time for the sheet from the shared stored log; the per-tab cache is removed.
- *Test:* `usage-format-recorder.test.js`, "does not double-count active time when two tabs work on the same sheet". It fails without the fix (9000 vs 6000) and passes with it.
- *Suites after the fix:* 199/199 unit, 59/59 e2e, lint at the 2 old warnings.

## Noted, no action

- If storage keeps changing during all 5 write retries, the event is dropped silently. This only applies where `navigator.locks` is missing, which means old browsers; all current ones support it. Acceptable.
- Two real students whose 6 or more checks all match within about a second would be flagged. That is unlikely, and a teacher reviews every flag anyway.

## Next: owner test

The steps from `orchestrator-review-gate-41a.md` are unchanged. After that, the owner signs off and the packet closes.
