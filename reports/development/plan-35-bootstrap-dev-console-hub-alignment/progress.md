# Plan 35 Progress

## Summary

Aligned the human-facing local console with Bootstrap's `dev-console-hub` pattern. The repository now exposes `npm run dev:console` with `npm run dev:control` retained as an alias, grouped submenus for local development, validation, builds/previews, UI review workflows, packet status, and advanced configuration, plus a centralized platform-aware package-script runner with distinct launch-error reporting.

## Files Changed

- `package.json`
- `README.md`
- `AGENTS.md`
- `docs/local-dev-console.md`
- `scripts/dev/control-console.js`
- `scripts/lib/dev-control.js`
- `scripts/dev/plan-status.js` (ESM adaptation of the Plan 33 dependency-free status tool)
- `scripts/dev/plan-status.test.js`
- `scripts/dev/package.json`
- `tests/dev-control.test.js`
- `.bootstrap-adoption.json`

## Behavior

- `npm run dev:console` is the documented hub command; `npm run dev:control` remains supported.
- The console uses grouped plain-language menus.
- Packet status exposes read-only list and check actions; status mutation remains outside the casual console path and remains orchestrator-owned.
- Builds, captures, synthesis, and other local-output actions show and confirm the exact package-script invocation before execution.
- Windows package scripts run through the tested `cmd.exe /c npm ...` invocation rather than a raw `npm.cmd` spawn.
- Launch/spawn errors are reported separately from child processes that start and exit nonzero.
- The Plan 33 status tool is self-contained ESM in this repository, matching the root package type so the ESM console can start while Bootstrap's isolated audit probe can copy and execute the public `plan-status.js` file by itself.
- The console does not add deployment, GAS/Sheets write, teacher-assignment, or unmanaged-process-kill actions.

## Validation

- `npm.cmd run test -- --run tests/dev-control.test.js` — 11 passed.
- `npm.cmd run test` — 25 files, 116 tests passed.
- `node scripts/dev/plan-status.test.js` — 93 passed, 0 failed.
- `node scripts/dev/plan-status.js lint` — passed.
- `node scripts/dev/plan-status.js check plan-34` — runnable.
- `node scripts/dev/plan-status.js check plan-35` — correctly blocked until Plan 34 is closed.
- `npm.cmd run lint` — 0 errors; two pre-existing Vue formatting warnings remain in `ui/components/SimplificationPractice.vue`.
- `node --check` passed for the console, dev-control library, and packet-status wrapper.
- Manual smoke: `npm run dev:console` started, displayed the grouped hub menu, and exited cleanly.
- Bootstrap audit after manifest update — tracked mode; `dev-console-hub` v1.1.0 current with no manifest-honesty failures.

## Remaining Risks

The console's packet-status menu intentionally does not expose the orchestrator-only `set` action. If a future owner wants that surfaced, it should be a separate explicitly gated console flow with resolution prompts and tests. Existing Vue lint warnings are outside Plan 35 scope.

Ready for orchestrator review: yes.

## Orchestrator Review Repair

- Corrected `buildPackageScriptInvocation` to insert npm's `--` separator before forwarded script arguments. Without it, console-selected UI-tour and synthesis options could be interpreted as npm options instead of reaching the project script.
- Updated the Windows invocation assertion to verify the displayed and executed command is `cmd.exe /c npm run <script> -- <args>`.
- Re-ran the focused console tests, full application suite, packet-status tests, lint, packet lint, and Bootstrap audit after the repair.
