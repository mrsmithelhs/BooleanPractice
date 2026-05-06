# Local Dev Console

The local dev console is a human-facing helper for working on Boolean Practice without memorizing the full command set.

## Start It

```bash
npm run dev:control
```

The console is meant for local development only.

## What It Does

- Shows whether the editable Vite dev server is running.
- Starts, stops, and restarts the dev server it manages.
- Opens the app in the browser.
- Shows the built preview URL and local preview status.
- Runs the common validation commands used in this repo.
- Launches the UI tour capture workflow and writes local-only review folders.
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

The console uses plain-language menu choices:

1. Status dashboard
2. Start dev server
3. Stop dev server
4. Restart dev server
5. Open app
6. Open preview
7. Run checks
8. Capture UI tours
9. Show config
10. Exit

The UI tour capture option is a convenience wrapper around `npm run capture:ui-tour` and keeps the resulting screenshot packets under `local/ui-reviews/`.

## Recovery Notes

- If the dev port is occupied by another process, the console will report the PID and process name rather than killing it automatically.
- If the console-managed dev server was stopped outside the console, restart it from the menu or delete the stale local state under `local/dev-control/`.
- If the browser still shows an old page after switching local files, refresh the tab.
- If preview is not running yet, build the app and start preview in another terminal before using the preview shortcut.
- If you want a screenshot packet for blind review, use the capture option instead of running the workflow by hand.

## Related Docs

- [`docs/testing.md`](./testing.md)
- [`docs/deployment.md`](./deployment.md)
- [`docs/project-structure.md`](./project-structure.md)
