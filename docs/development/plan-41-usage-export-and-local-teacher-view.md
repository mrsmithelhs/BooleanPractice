---
id: plan-41
title: "Student Usage Export and Local Teacher View"
status: ready
depends_on: [plan-40]
gate: "GATE-41A: student export on the puzzle page and the local-only admin view working end to end, admin proven absent from dist/ and gas-dist/, full suites green; owner tries it with real browsers before any deploy"
summary: >-
  Let the owner verify student progress without a backend (DECISION-009). The puzzle page records each student's own
  activity in the browser and exports a JSON usage file with a typed name and class code, plus a per-browser install id,
  sequence numbers, a hash chain, and an integrity hash. A dev-server-only admin.html loads many files and shows a
  progress table with review flags for likely copying or editing. Pure format and analyzer modules are shared and
  unit-tested.
---
# Plan 41: Student Usage Export and Local Teacher View

## Packet Metadata

- Packet id: `plan-41-usage-export-and-local-teacher-view`
- Packet title: Student Usage Export and Local Teacher View
- Status: (see frontmatter)
- Owner/model: implementer (single)
- Date: 2026-10-25
- Packet type: feature
- Mutation level: source code, tests, docs. No deploy, and no workflow edits.
- Approval gate: **GATE-41A**. The owner tests it with real browsers, then deploys himself.
- Depends on: plan-40. Both packets touch `ShapePuzzleApp.vue`, so don't run them at the same time.
- Progress report: `reports/development/plan-41-usage-export-and-local-teacher-view/progress.md`

## Goal

The owner can collect one file per student and see each student's progress on the puzzle page in one local table:
- which sets and sheets are solved, how many checks it took, and active time;
- flags for files that look copied, shared between students, edited, or from outside the class.

## Non-goals

- No backend, accounts, network calls, analytics, or GAS changes. Nothing leaves the student's browser except the file the student downloads.
- No usage recording in the AP CSA app (`ui/index.html`) yet. Its UI is due for simplification, so wiring it in is a follow-up packet that reuses this packet's modules.
- No claim of tamper-proofing. See the honest limit in DECISION-009.
- No new runtime dependencies. Use Web Crypto (`crypto.subtle`, `crypto.randomUUID`).

## Authority and contracts

Required reading:
- `AGENTS.md`;
- `docs/decision-log.md`: DECISION-002, DECISION-008 with its amendment, and **DECISION-009**;
- `docs/shape-puzzle-page.md` and `ui/components/shape-puzzles/`;
- the reference design, **read it; don't copy it wholesale**: `C:\AI\BrowserBattlegorithms\docs\subsystems\usage-and-admin.md`, especially its "Common traps", plus its `src/usage/usageFormat.js` (`canonicalJsonStringify`, `buildExportPayloadWithIntegrity`, `getUsageEventFingerprint`) and `src/usage/usageAnalyzerBrowser.js`. Adapt the pure helpers; rewrite everything specific to that project.

Contracts:
- **Privacy:**
  - the student's name is typed by the student and appears only in their downloaded file and in the owner's local admin view;
  - no student files, names, or row-level data are ever committed. Real files go in `local/usage/`, which is git-ignored;
  - test fixtures are synthetic, with made-up names;
  - reports describe results without names.
- **The teacher view never records:** with `?teacher=1`, the page records no events and shows no export button.
- **Storage can fail** (private mode, quota, blocked storage). Wrap every read and write. The puzzle must work exactly as before when storage is unavailable; the export button then explains that progress can't be saved in this browser.
- **Wording:** flags say "review", never "cheating" or "copied". The admin page states the honest limit in one line.

## Scope

### In scope

1. **Format module** (pure), `src/usage/format.js`:
   - `canonicalJsonStringify` (sorted keys);
   - `sha256Hex` (an injected hash function, Web Crypto in the browser, `node:crypto` in tests);
   - `buildExportPayload`, `withIntegrity`, `verifyIntegrity`, `createExportFilename`;
   - `eventFingerprint`.
   
   Schema:
   - top level: `schemaVersion: 1`, `app: 'boolean-practice'`, `appVersion` (from `package.json`), `exportedAt`;
   - `student: { name, classCode }`, `installId`;
   - `sessions[]`, each with `sessionId`, `startedAt`, `lastActivityAt`, and the URL params with `teacher` excluded;
   - `events[]`, each with `seq`, `t`, `sessionId`, `type`, `data`, `prevHash`;
   - `summary`: per set/sheet `{ solved, solvedAt, mode, outputChecks, shadingChecks, activeMs }`;
   - `integrity: { algorithm: 'SHA-256', sha256 }`.
   
   Filename: `bp-usage-<name-slug>-<installId first 8>-<YYYYMMDD>.json`.
2. **Recorder** (`src/usage/recorder.js`, with injected storage and clock):
   - `installId`: `crypto.randomUUID()`, created once per browser and kept;
   - a new `sessionId` per page load;
   - `seq` is monotonic per install, never reset, so it survives sessions;
   - `prevHash` is the SHA-256 of the previous event's canonical JSON. The first event uses a fixed genesis value;
   - events are persisted under one versioned key, `bp-usage-v1`;
   - **retention:** the last 60 days or 5000 events, whichever is smaller. Record truncation in the summary (`eventsTruncated: true`, and the first retained `seq`), so the analyzer can tell a truncated chain from an edited one;
   - **active time:** the sum of gaps between consecutive events on the same sheet, with each gap capped at 5 minutes (BBA's trap: don't report wall-clock time).
3. **Event taxonomy** (puzzle page only; keep it small and meaningful):
   - `session_started`;
   - `sheet_opened {set, sheet, mode}`;
   - `notation_toggled`;
   - `outputs_checked {set, sheet, correct, attempt, blankCount, wrongCount}`;
   - `shading_checked {set, sheet, correct, attempt, missedCount, extraCount}`;
   - `sheet_solved {set, sheet, mode, attempts, activeMs}`;
   - `breakdown_opened`;
   - `export_requested`.
   
   Don't record individual cell or region clicks (too noisy, BBA's trap). Count them on the next check event instead: `cellEdits` and `regionToggles`.
4. **Student export UI on the puzzle page:**
   - a small "Download my progress" button in the header, hidden with `?teacher=1`;
   - it opens an accessible inline dialog, not `window.prompt`, asking for the student's name (required) and class code (optional);
   - both are remembered in storage and pre-filled next time;
   - `?class=CODE` in the URL pre-fills the class code, so the owner can share one link per class;
   - downloads via Blob and `<a download>`;
   - after the download, a one-line confirmation tells the student to turn the file in where their teacher asks.
5. **Analyzer** (pure), `src/usage/analyzer.js`.
   - `summarizeFile(json)` checks and reports:
     - schema;
     - integrity (verified or edited);
     - hash chain (intact, broken at seq N, or truncated);
     - progress per set and sheet, active time, and first and last activity.
   - `compareFiles(summaries, { expectedClassCode })` returns review flags:
     - **same install id under different student names** (one browser's work submitted twice);
     - **identical fingerprints**: the same ordered sequence of (type, sheet, correct) with near-identical timing in two files;
     - **byte-identical or same integrity hash** across files;
     - **class code mismatch** against the code the owner enters;
     - **integrity mismatch or broken chain**;
     - **implausible speed**: a sheet solved on the first check in under 10 s of active time. Make the threshold a named constant;
     - **info only, not a flag:** the same name across several install ids, which is normal when a student uses two computers.
6. **Local-only admin view:**
   - `ui/admin.html`, `ui/admin-main.js`, and components under `ui/components/usage-admin/`. **Not** added to `build.rollupOptions.input`, so it never reaches `dist/` or Pages, and `build-gas.mjs` never includes it;
   - in the puzzle page, a link to it renders only under `import.meta.env.DEV`;
   - features:
     - a multi-file picker plus drag and drop. Files are read locally and never uploaded;
     - an expected class code field;
     - a class table: student, class code, install id (short), solved sheets shown as a set × sheet grid with ✓ and attempt counts, active time, last activity, and flags;
     - a per-student detail view: the event timeline and per-sheet attempts;
     - "Export class summary (CSV)", downloaded locally, with a note to keep it in `local/`;
     - one line stating the honest limit.
7. **Tests:**
   - **Unit:**
     - canonical JSON and integrity round-trip;
     - the recorder: seq continuity across sessions, chain correctness, retention truncation marking, active-time capping, behavior when storage throws;
     - the analyzer, with synthetic fixtures for each flag above, and a clean pair that must **not** be flagged;
     - the edited-file case: change one event, and verification must report "edited";
     - the filename slug.
   - **E2E** (the Playwright config already runs the dev server):
     - solving a sheet records `outputs_checked` and `sheet_solved`;
     - `?teacher=1` records nothing and has no export button;
     - the export downloads a file whose integrity verifies with the format module;
     - `admin.html` loads two fixture files and shows both students and the expected flag;
     - with storage blocked, the puzzle still works and the button explains why it can't save.
   - **Build isolation** (extend the plan-39 manifest test): the built `dist/` has no `admin.html` and no admin chunk; `gas-dist/` has none either; the puzzle chunk contains no `usage-admin` module.
8. **Docs:**
   - `docs/usage-files.md`: the student steps, the teacher steps (run `npm run dev`, open `/admin.html`, drop files from `local/usage/`), the schema, the flags and their limits, and the privacy rules;
   - one line each in `README.md`, `docs/deployment.md` ("admin is dev-only"), and `docs/shape-puzzle-page.md`.

### Out of scope

- Recording usage in the AP app, the GAS build, any upload or sync, and editing the workflows.
- Any change to puzzle grading, hints, or the plan-40 sets.

## Work Plan

1. Run `node scripts/dev/plan-status.js check plan-41`, read the reference design, and summarize the job.
2. Write the format module and recorder with their unit tests.
3. Wire the recorder into the puzzle page and add the export dialog, with e2e tests.
4. Write the analyzer with synthetic fixtures, then the admin view, with e2e tests.
5. Extend the build-isolation test, and run `npm run build` and `npm run build:gas` to prove the admin page is absent from both.
6. Run the full `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`, and `npm run build:gas`, and report the counts.
7. Capture screenshots, opening each before describing it: the export dialog, the downloaded-file confirmation, the admin table with the fixture flags, and a student detail view. Use synthetic names only.
8. **GATE-41A: stop.** You may commit; don't push, deploy, or change the packet status.

## Validation Checklist

- [ ] The full suites pass, with counts reported. The existing puzzle and AP tests are unchanged.
- [ ] `admin.html` is absent from `dist/` and `gas-dist/` (asserted by a test, not by eye).
- [ ] The teacher view records nothing and has no export button.
- [ ] The puzzle works with storage blocked.
- [ ] Every analyzer flag has a positive fixture, and the clean pair has none.
- [ ] No real student data, and no names other than synthetic ones, in git.
- [ ] Screenshots were opened before they were described.

## Stop Conditions

Stop and report if:
- recording would need changes to grading or hint logic;
- the admin page can't be kept out of `dist/` without a workflow or deploy change;
- anything seems to need a backend, a network call, or a new dependency;
- an existing test would need weakening.

## Progress Report

`reports/development/plan-41-usage-export-and-local-teacher-view/progress.md`

Minimum contents:
- summary;
- files changed;
- the schema as built;
- the flag list with fixture coverage;
- suite counts;
- the isolation result;
- screenshots;
- risks;
- the gate stop point.

Implementers do not set packet status.

## Owner test at GATE-41A (for the orchestrator to relay)

1. Solve a couple of sheets in two different browsers, or one normal window and one private window, typing different names.
2. Export both files.
3. Copy one file and rename it.
4. Open `npm run dev`, go to `/admin.html`, and drop all three files in. Confirm the table shows progress and flags the copy.
