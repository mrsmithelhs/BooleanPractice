# Plan 06: Vue App Shell And State

## Packet Metadata

- Packet id: 06
- Packet title: Vue App Shell And State
- Status: ready
- Owner/model: Codex mini or stronger
- Date: 2026-05-05
- Packet type: implementation, frontend, integration
- Mutation level: source-code, tests
- Approval gate: before adding a router if a simple state-driven shell is sufficient
- Expected artifacts: Vue app shell, practice state model, mode/difficulty selection, static base-path handling
- Progress report folder: `reports/development/plan-06-vue-app-shell-state/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: create the usable first-screen app structure that hosts practice modes.
- Non-goals: do not fully implement truth table or Venn interactions.
- Depends on: Plans 03 and 04.
- Blocks: visual UI packets and E2E tests.
- Why this packet exists: the archive is one large HTML file; Vue components need a clean state boundary before features move in.

## Implementation Requirements

- Build a first screen with problem controls, current expression, mode selection, and placeholder practice panels.
- Use catalog filtering without mutating catalog data.
- Keep state local and static-app friendly.
- Configure Vite base path for GitHub Pages.
- Add basic component tests for selection and state transitions if test utilities are available.

## Validation Checklist

- [ ] App builds with Vite.
- [ ] Catalog filtering respects mode and difficulty.
- [ ] No Google Apps Script runtime dependency remains.
- [ ] GitHub Pages base path is documented or configured.
