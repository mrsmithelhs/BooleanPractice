# Local Dev Console

The local dev console is a human-facing helper for working on Boolean Practice without memorizing the full command set.

## Start It

```bash
npm run dev:console
```

`npm run dev:control` remains a backward-compatible alias.

The console is meant for local development only.

## What It Does

- Shows whether the editable Vite dev server is running.
- Starts, stops, and restarts the dev server it manages.
- Opens the app in the browser.
- Shows the built preview URL and local preview status.
- Runs the common validation commands used in this repo.
- Launches the UI tour capture workflow and writes local-only review folders.
- Launches the UI review synthesis workflow and defaults to the latest capture folder.
- Shows the local port and config values that matter for development.

## Port Convention

- Editable dev server: `5177`
- Local preview server: `4173`

You can override the local dev settings with a repo-local `.env` or `.env.local` file. The repository ignores both files.

Recommended values:

```bash
BOOLEAN_PRACTICE_HOST=127.0.0.1
BOOLEAN_PRACTICE_DEV_PORT=5177
BOOLEAN_PRACTICE_PREVIEW_PORT=4173
```

## Menu Options

The console uses plain-language grouped menus:

1. Local dev server: status, start, stop, restart, and open the app.
2. Tests and validation: unit tests, lint, build, E2E, or the core-check bundle.
3. Builds and previews: open preview, build the static app, or build the GAS package.
4. UI review workflows: capture UI tours or synthesize the latest review folder.
5. Packet status: list packets or check whether a packet is runnable.
6. Advanced scripts and config: inspect local configuration.
7. Exit.

Packet status is read-only from the console. Status writes remain an orchestrator/owner action through the direct `plan-status.js set` command and are not exposed as a casual menu action.

Commands launched by the console display the exact platform-aware invocation they execute. On Windows, package scripts run through `cmd.exe` rather than a raw `npm.cmd` spawn. A launch/spawn failure is reported separately from a child process that starts and exits nonzero.

The UI tour capture option is a convenience wrapper around `npm run capture:ui-tour` and keeps the resulting screenshot packets under `local/ui-reviews/`. Each capture run now writes both `review-starting-prompt.md` and `synthesis-starting-prompt.md` into the dated output folder.
The UI review synthesis option is a convenience wrapper around `npm run synthesize:ui-reviews` and uses the newest capture folder unless you override it.

## Recovery Notes

- If the dev port is occupied by another process, the console will report the PID and process name rather than killing it automatically.
- If the console-managed dev server was stopped outside the console, restart it from the menu or delete the stale local state under `local/dev-control/`.
- If the browser still shows an old page after switching local files, refresh the tab.
- If preview is not running yet, build the app and start preview in another terminal before using the preview shortcut.
- If you want a screenshot packet for blind review, use the capture option instead of running the workflow by hand.
- If you already have review folders, use the synthesis option to combine them into a triage report instead of reading the raw notes one reviewer at a time.

## Related Docs

- [`docs/testing.md`](./testing.md)
- [`docs/deployment.md`](./deployment.md)
- [`docs/project-structure.md`](./project-structure.md)
