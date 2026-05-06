# Plan 25 Progress Report

## Summary

- Added a human-facing local dev console command at `npm run dev:control`.
- Wired the repo to use a configurable local dev port with a 5177 default via repo-local `.env` / `.env.local` files.
- Added safe status helpers, managed process tracking, and preview/open/check shortcuts for routine local development.
- Documented the console in `docs/local-dev-console.md` and cross-linked it from the testing and deployment docs.

## Validation

- `npx vitest run tests/dev-control.test.js` - passed
- `npm test` - passed
- `npm run lint` - passed
- `npm run build` - passed
- `npm run test:e2e` - passed

## Notes

- The console only manages the dev server it started and recorded.
- Unmanaged port occupants are reported with PID/process details when available, but are not killed automatically.
- The preview shortcut is read-only and points the maintainer to the built preview workflow rather than managing a second long-lived process.
