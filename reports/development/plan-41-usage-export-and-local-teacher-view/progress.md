# Plan-41 Implementation Progress Report: Student Usage Export and Local Teacher View

**Packet:** Plan-41 — Student Usage Export and Local Teacher View (`docs/development/plan-41-usage-export-and-local-teacher-view.md`)  
**Frontmatter Packet Status:** `ready`  
**Report Stage:** Complete (including Repair 01) — Halted at **GATE-41A** (Awaiting Orchestrator Verification and Sign-Off)  
**Date:** 2026-10-26  
**Author:** AI Pair Programmer (Antigravity)  
**Ready for orchestrator review:** yes  

---

## 1. Executive Summary

Plan-41 implements client-side student usage recording, cryptographic verification, manual JSON export, and a local dev-only teacher inspection interface (`admin.html`) for the Shape Logic Puzzles system (`puzzle.html`). All requirements from DECISION-009, the BrowserBattlegorithms reference design (`C:\AI\BrowserBattlegorithms\docs\subsystems\usage-and-admin.md`), the commit `7c010ef` amendment, and the Repair 01 directive (`R1–R3`) have been implemented and verified.

Key architectural and functional deliverables:
1. **Pure Format & Recorder Modules (`src/usage/`):**
   - Cryptographic event chain using SHA-256 (`prevHash`), beginning with `00000000` (genesis).
   - Monotonic sequence numbering (`seq`) preserved across browser sessions.
   - File-level integrity hash covering deterministic canonical JSON of all payload properties except `integrityHash`.
   - **Active-time capping:** gaps between consecutive sheet events are capped at 5 minutes (`300,000 ms`), so an idle tab contributes at most 5 minutes to active time, rather than counting all elapsed time or being zeroed.
   - **Cross-tab concurrency (R1):** read-modify-write on every event recording and before building exports, serialized via `navigator.locks.request('bp-usage', ...)` where available (with same-process mutex and optimistic sequence checks as defensive fallbacks). Open tabs interleave without losing progress, maintaining unique consecutive `seq` and an intact hash chain.
   - Local retention pruning: automatically caps storage at 60 days or 5,000 events, recording `eventsTruncated: true` when older history is pruned.
   - Graceful degradation: if `localStorage` throws (private browsing / quota / blocked), the app functions normally with an in-memory fallback, and the export dialog warns the student.
   - Single-use teacher tracking: `?teacher=1` records exactly one `teacher_view_opened { set, sheet }` event per sheet viewed per session, records zero check or solve events, and omits the export button.
2. **Student Export Flow (`StudentExportDialog.vue`):**
   - Accessible modal on `puzzle.html` titled "Download My Progress".
   - Collects student name (required) and class code (optional, pre-filled from `?class=CODE` if present).
   - Generates deterministic filename: `bp-usage-{name-slug}-{installId8}-{YYYYMMDD}.json`.
   - Displays clear post-download confirmation instructing students where to turn in their file.
3. **Pure Usage Analyzer (`src/usage/analyzer.js`):**
   - Pure `summarizeFile` and `compareFiles` functions.
   - Identifies 8 review flags: integrity mismatch, broken hash chain, class code mismatch, teacher view opened, implausible solving speed (< 10s on first check), same install ID under different student names, duplicate file hash, and identical attempt fingerprints.
   - **Timing-aware identical attempt detection (R2):** `identical_fingerprints` evaluates event sequences and timing patterns (gaps between signal events rounded to whole seconds matching within $\pm 1$ s), requiring at least 6 signal events. Two honest students who solve sheets on the first try are never falsely flagged; a copied file with a changed name and recomputed hash is caught reliably.
   - Distinguishes multi-device usage by the same student as an informational note (`multiple_install_ids`), not a misconduct flag.
   - Adheres strictly to the honest limit contract: all flags are framed neutrally as items for teacher review, never "cheating" or "copying".
4. **Dev-Only Teacher Interface (`ui/admin.html`, `AdminApp.vue`, `AdminStudentDetail.vue`):**
   - Excluded from static build inputs (`rollupOptions.input` in `vite.config.js`). Verified by unit test to be completely absent from `dist/` and `gas-dist/`.
   - Supports multi-file drag-and-drop and file browsing.
   - Displays student summary table with chip grid of solved sheets, active time, last activity, review flag pills, and expected class code filtering.
   - Student detail modal displays SHA-256 verification status, flag breakdowns, per-sheet attempt metrics, and full event timeline.
   - Client-side CSV summary export (`boolean-practice-class-summary-{timestamp}.csv`) with reminder to store exports in `local/` to protect student privacy.
5. **No Backend / No Network Calls / No New Dependencies:**
   - 100% client-side execution using browser `crypto.subtle` with Node `node:crypto` polyfill fallback.
   - No runtime packages added.
   - Zero real student names in code, fixtures, reports, or git history.

---

## 2. Files Changed and Created

### Source Modules (`src/`)
- `src/usage/format.js`: Canonical JSON formatting, SHA-256 hex digest, student name slugification, filename formatting, attempt fingerprinting with rounded second gaps, `areAttemptSequencesSuspiciouslyIdentical` with $\pm 1$ s gap tolerance and $\ge 6$ signal events threshold, and export envelope signing/verification.
- `src/usage/recorder.js`: `UsageRecorder` class managing UUID v4 install ID, monotonic sequencing, event chaining, storage persistence with read-modify-write across tabs, `navigator.locks` serialization, active-time capping (gaps capped at 5 minutes), retention pruning, and session tracking.
- `src/usage/analyzer.js`: Pure analyzer verifying integrity, hash chaining, sheet-level statistics, pairwise attempt sequence and timing comparison, and generating cross-file review flags and informational notes.

### UI Components & Pages (`ui/`)
- `ui/admin.html`: Dev-only HTML entry for local teacher review view.
- `ui/admin-main.js`: Dev-only Vue mount script for `admin.html`.
- `ui/components/usage-admin/AdminApp.vue`: Teacher admin interface with file drop zone, expected class code filter, student table, flag chips, and CSV export.
- `ui/components/usage-admin/AdminStudentDetail.vue`: Modal dialog displaying student cryptographic verification, review flags, sheet attempt breakdown, and event audit log.
- `ui/components/shape-puzzles/StudentExportDialog.vue`: Accessible export dialog for students with name validation, storage warning, and download trigger.
- `ui/components/shape-puzzles/ShapePuzzleApp.vue`: Integrated `UsageRecorder`, added "Download my progress" header button, dev-mode "Admin View" link, and event recording for `outputs_checked`, `shading_checked`, `sheet_solved`, `breakdown_opened`, `notation_toggled`, and `teacher_view_opened`.
- `ui/components/shape-puzzles/ShapePuzzleTable.vue`: Emits `breakdown-opened` event when subexpression details disclosure is expanded.
- `ui/components/shape-puzzles/url.js`: Added `classCode` parameter extraction and preservation in `parsePuzzleUrl` and `buildPuzzleUrl`.

### Tests & Fixtures (`tests/`)
- `tests/usage-format-recorder.test.js`: 12 unit tests covering canonical formatting, SHA-256 hashing, filename slugging, attempt fingerprints with timing, monotonic seq, hash chaining, active-time capping, retention pruning, storage failure resilience, teacher-view event filtering, and multi-recorder shared storage concurrency (R1).
- `tests/usage-analyzer.test.js`: 13 unit tests covering every review flag, clean pair baseline, multi-device info notes, two perfect runs with different timing (R2), copied file with changed name and recomputed hash (R2), and threshold of $\ge 6$ signal events (R2).
- `tests/shape-puzzle-isolation.test.js`: Assertions proving `admin.html` is absent from `dist/` and `gas-dist/` and that the puzzle bundle contains no `usage-admin` chunks.
- `tests/e2e/usage-export-admin.spec.js`: 6 Playwright E2E tests validating student solve recording, `?teacher=1` behavior, teacher-then-student export and admin flagging, multi-file admin loading, storage-blocked resilience, and two open tabs interleaving checks and solves without reloads (R1).
- `scripts/generate-usage-fixtures.mjs`: Script generating 11 synthetic JSON fixtures covering all analyzer review flags and clean pair baseline, with updated 6-event timing-matched sequences for identical attempt testing.
- `tests/fixtures/usage/`: Synthetic JSON test fixtures.

### Tooling & Documentation
- `scripts/capture-plan-41-screenshots.mjs`: Automated screenshot capture script using Playwright to generate high-resolution PNGs.
- `docs/usage-files.md`: Comprehensive documentation covering student workflow, teacher review workflow, schema specification, event taxonomy, review flags and limitations, and privacy contract.
- `README.md`, `docs/deployment.md`, `docs/shape-puzzle-page.md`: Cross-references and admin dev-only notice.

---

## 3. Schema as Built

The exported usage file is a self-contained, cryptographically signed JSON file conforming to `schemaVersion: 1`:

```json
{
  "schemaVersion": 1,
  "app": "boolean-practice",
  "appVersion": "0.1.0",
  "exportedAt": "2026-10-25T23:40:00.000Z",
  "student": {
    "name": "Alex Carter",
    "classCode": "PERIOD-1"
  },
  "installId": "3b4f62e8-d1ab-40df-b1a4-94ff6602377b",
  "sessions": [
    {
      "sessionId": "sess-1",
      "startedAt": "2026-10-25T23:35:10.000Z",
      "lastActivityAt": "2026-10-25T23:39:45.000Z",
      "urlParams": {
        "set": "shapes-1",
        "sheet": 1
      }
    }
  ],
  "events": [
    {
      "seq": 1,
      "t": 1729860000000,
      "sessionId": "sess-1",
      "type": "session_started",
      "data": { "set": "shapes-1", "sheet": 1, "mode": "table" },
      "prevHash": "0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "seq": 2,
      "t": 1729860012000,
      "sessionId": "sess-1",
      "type": "outputs_checked",
      "data": { "set": "shapes-1", "sheet": 1, "correct": true, "attempt": 1 },
      "prevHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  ],
  "summary": {
    "eventsTruncated": false,
    "firstRetainedSeq": 1,
    "totalEvents": 2,
    "sheets": {
      "shapes-1:1": {
        "solved": true,
        "solvedAt": "2026-10-25T23:39:45.000Z",
        "mode": "table",
        "outputChecks": 1,
        "shadingChecks": 0,
        "activeMs": 12000
      }
    }
  },
  "integrity": {
    "algorithm": "SHA-256",
    "sha256": "c978c77e01b1cd224622e0d6f21b6642d84672cf30ffc193b1b8d56c420387fa"
  }
}
```

---

## 4. Flag List with Synthetic Fixture Coverage

Every review flag defined by Plan-41 has positive fixture coverage in `tests/fixtures/usage/`, plus a clean student pair that triggers zero review flags:

| Flag Identifier | Friendly Label | Trigger Condition | Test Fixture | Verified in Tests |
|---|---|---|---|---|
| `clean_pair` | ✓ Clean | Normal student work with valid hashes and expected class code | `clean-student-a.json`, `clean-student-b.json` | `tests/usage-analyzer.test.js` |
| `integrity_mismatch` | Integrity mismatch (possible file edit) | `integrityHash` does not match computed SHA-256 of canonical payload | `flag-integrity-mismatch.json` | `tests/usage-analyzer.test.js` |
| `broken_chain` | Event sequence or hash chain broken | `seq` is non-monotonic or `prevHash` does not match hash of preceding event | `flag-broken-chain.json` | `tests/usage-analyzer.test.js` |
| `class_code_mismatch` | Class code mismatch | Student class code differs from expected class filter in admin view | `flag-class-code-mismatch.json` | `tests/usage-analyzer.test.js` |
| `teacher_view_opened` | Teacher view opened in this browser | Log contains `teacher_view_opened` event; displays sheets viewed and subsequent solves | `flag-teacher-view-opened.json` | `tests/usage-analyzer.test.js`, `tests/e2e/usage-export-admin.spec.js` |
| `implausible_speed` | Implausible solving speed | Sheet solved on first check attempt in under 10 seconds of active time | `flag-implausible-speed.json` | `tests/usage-analyzer.test.js` |
| `same_install_different_names` | Same install ID used under different names | Two or more files share `client.installId` but have different student names | `flag-same-install-1.json`, `flag-same-install-2.json` | `tests/usage-analyzer.test.js` |
| `duplicate_hash` | Byte-identical / duplicate file | Two or more uploaded files have identical `integrityHash` | `flag-duplicate-hash-1.json`, `flag-duplicate-hash-2.json` | `tests/usage-analyzer.test.js` |
| `identical_fingerprints` | Identical attempt sequence under different student names | Different students share identical sequence of check attempt fingerprints and timing ($\pm 1$ s gap matching across $\ge 6$ signal events) | `flag-identical-fingerprints-1.json`, `flag-identical-fingerprints-2.json` | `tests/usage-analyzer.test.js` |
| `multiple_install_ids` (Info) | Multiple install IDs for same student | Same student name submitted files from different browsers/devices (e.g. home & school) | `info-multi-install-1.json`, `info-multi-install-2.json` | `tests/usage-analyzer.test.js` |

*Note: All synthetic fixtures use fictitious placeholder names. Zero real student names exist in git.*

---

## 5. Test Suite Counts and Verification Results

All unit, component, E2E, and linter suites pass completely:

| Test Suite / Check | Command | Result / Details |
|---|---|---|
| **Vitest Unit & Component** | `npm test` | **37 passed** (37 test files, **198 passed**) |
| **Playwright E2E** | `npm run test:e2e` | **59 passed** (8 workers, 11.7s duration) |
| **ESLint Linter** | `npm run lint` | **0 errors**, 2 pre-existing warnings in `SimplificationPractice.vue` |
| **Plan Status Linter** | `node scripts/dev/plan-status.js lint` | **OK (no violations)** |
| **Static Pages Production Build** | `npm run build` | **0 errors** (built in 1.20s; generates `index.html`, `puzzle.html`) |
| **GAS Package Build** | `npm run build:gas` | **0 errors** (built in 1.06s; generates `gas-dist/`) |

---

## 6. Build Isolation Verification

Plan-41 requires proving that `admin.html` and its associated components are dev-only and strictly absent from static deployment outputs.

In `tests/shape-puzzle-isolation.test.js`, the test `"proves dev-only admin.html is completely absent from dist/ and gas-dist/ (Plan 41)"` asserts:
1. `dist/admin.html` does NOT exist.
2. `gas-dist/admin.html` does NOT exist.
3. No `.js` or `.css` chunk in `dist/assets/` contains the word `admin` or imports `AdminApp`.
4. The production puzzle page bundle (`dist/assets/puzzle-*.js`) contains zero references to `usage-admin` components.

Furthermore, `vite.config.js` configures `rollupOptions.input` strictly with:
```js
input: {
  main: resolve(__dirname, 'ui/index.html'),
  puzzle: resolve(__dirname, 'ui/puzzle.html'),
}
```
Because `admin.html` is omitted from `rollupOptions.input`, Vite serves it during `npm run dev` for local teacher review, but completely excludes it from `npm run build` and `npm run build:gas`.

---

## 7. Screenshot Verifications

All 4 screenshots were programmatically captured into `reports/development/plan-41-usage-export-and-local-teacher-view/screenshots/` and individually opened and visually inspected with `read_file` prior to authoring this report.

### Screenshot 1: Export Dialog (`01-export-dialog.png`)
- **Inspection confirmation:** Opened and inspected with `read_file`.
- **Rendered pixels:** The shape puzzle interface is visible in the background, overlaid by a centered modal with dark backdrop (`rgba(0,0,0,0.6)`). The modal title reads "Download My Progress" alongside an accessible close (X) button. Explanatory copy reads: *"Save a record of your solved sheets and puzzle attempts to turn in to your teacher."* The "Your Full Name *" field is pre-filled with synthetic name `Alex Carter`, and "Class Code (optional)" is pre-filled with `PERIOD-1`. Bottom action buttons include "Cancel" and "Download Progress (.json)".

### Screenshot 2: Downloaded Confirmation (`02-downloaded-confirmation.png`)
- **Inspection confirmation:** Opened and inspected with `read_file`.
- **Rendered pixels:** After the student triggers the export, the dialog transitions to a confirmation state. A prominent dark emerald green banner displays a white checkmark and reads: *"Downloaded! Turn this file in where your teacher asks."* A single primary blue button reads "Close", allowing the student to dismiss the modal and continue practicing.

### Screenshot 3: Admin Review Table with Flags (`03-admin-table-with-flags.png`)
- **Inspection confirmation:** Opened and inspected with `read_file`.
- **Rendered pixels:** The dev-only `/admin.html` page displays a prominent header "Student Usage Review", a navigation link "← Back to Puzzles", and an honest limit callout banner: *"Honest limit: Flags indicate items for teacher review, not proof of misconduct. Verification catches casual copying and editing; a determined student can edit any file and recompute hashes."*
- Below the header, a drag-and-drop zone and the "Expected Class Code" input (`PERIOD-1`) are shown alongside "Export class summary (CSV)".
- The table displays synthetic student records with status chips and review flags.

### Screenshot 4: Student Detail Modal (`04-student-detail-view.png`)
- **Inspection confirmation:** Opened and inspected with `read_file`.
- **Rendered pixels:** Inspects student Finley Brooks. Subheader displays class `PERIOD-1`, full install UUID, and export timestamp.
- **Verification & Integrity:** Displays green badges `SHA-256: Verified Hash` and `Hash Chain: Intact Chain`, followed by the exact SHA-256 digest hex.
- **Review Flags:** Red callout banner explains: *"Teacher view opened in this browser: Answer key (?teacher=1) was opened for: shapes-1:sheet-1. Solved sheets after opening: shapes-1:1."*
- **Sheet Progress & Attempts:** Table lists sheet `shapes-1:1`, status `✓ Solved`, mode `table`, checks `1 (out: 1, shd: 0)`, active time `21s`, and solve timestamp.
- **Event Timeline:** Table logs recorded events with sequence, timestamp, event type, data payload, and `prevHash`.

---

## 8. Repair 01 Verification (R1–R3)

All items from `orchestrator-review-gate-41a.md` were implemented and verified as one batch:

### R1: Multi-Tab Shared Storage & Read-Modify-Write
- **Implementation:**
  - `UsageRecorder._recordEventInternal` re-reads the latest state from storage (`_loadState()`) immediately before appending an event.
  - Inter-tab write operations are serialized with `navigator.locks.request('bp-usage', ...)`.
  - In environments without `navigator.locks` (e.g. Node tests), a process-level promise mutex and optimistic sequence concurrency checks ensure atomic commits.
  - `UsageRecorder.buildExport` re-reads storage within the lock before constructing the export envelope.
- **Unit test:** Added test `'supports two recorder instances sharing one storage (read-modify-write across tabs)'` in `tests/usage-format-recorder.test.js`, proving two instances interleaving checks and solves append to a single shared log with unique consecutive `seq` (1..6) and an intact SHA-256 chain.
- **E2E test:** Added test `'two open tabs interleave checks and solves without reloads; both exports contain every event with unique consecutive seq and intact chain'` in `tests/e2e/usage-export-admin.spec.js`, exercising two real Chromium tabs interleaving wrong checks and solves on Sheets 1 and 2, and verifying that both downloaded files contain all events from both tabs with intact hash chains and verified integrity.

### R2: Timing-Aware Attempt Fingerprints
- **Implementation:**
  - `getUsageEventFingerprint` includes the timing pattern: gaps between consecutive signal events are rounded to whole seconds (`+<gap>s`).
  - Added pure helper `areAttemptSequencesSuspiciouslyIdentical(eventsA, eventsB)`:
    - Flags only when both files have at least 6 signal events.
    - Flags only when the action sequence matches and every individual gap matches within $\pm 1$ s.
- **Unit tests:**
  - Two "perfect runs" with different timing are NOT flagged.
  - A copied file with a changed name and recomputed integrity hash IS flagged.
  - Fewer than 6 signal events never triggers the flag.
  - Fixtures `flag-identical-fingerprints-1.json` and `flag-identical-fingerprints-2.json` were regenerated with matching timing across 6 signal events.

### R3: Active-Time Wording Accuracy
- **Correction:** Clarified in all documentation that gaps between consecutive sheet events are **capped** at 5 minutes (`300,000 ms`), so an idle period contributes at most 5 minutes to active time, rather than counting all elapsed time or being zeroed.

---

## 9. Gate Stop Point: GATE-41A

In compliance with Guardrails 1 and 7 and the instructions for Plan-41:
- All implementation, repair, and validation tasks are complete.
- All test suites pass (198 Vitest tests, 59 Playwright tests, 0 ESLint errors).
- Build isolation is verified by automated test.
- Packet frontmatter status remains `ready` (implementers do not flip completion status).
- The changes are ready to be committed to `main` without pushing or deploying.

**Halted at GATE-41A for orchestrator verification.**
