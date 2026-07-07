# Plan 06: Vue App Shell And State

## Packet Metadata

- Packet id: 06
- Packet title: Vue App Shell And State
- Status: complete
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
- Define a clear app state shape for the shell, including selected problem, selected mode, visible feedback, and current step or placeholder panel state.
- Configure Vite base path for GitHub Pages and ensure asset URLs resolve through the same base path.
- Prefer a simple state-driven shell; do not add a router unless the packet cannot meet the requirements without one.
- Add basic component tests for selection and state transitions if test utilities are available.
- Ensure no hardcoded root paths remain in the shell, preview, or assets.

## Required Behavior

- The shell should render successfully from a static build.
- Catalog-derived selections should flow through state, not through direct mutation of catalog records.
- The same base-path rules should work in local preview and GitHub Pages deployment.

## Stop Conditions

- If a router becomes necessary, pause and ask for approval before adding one.
- If the shell needs learning semantics that belong to later packets, keep a placeholder and stop rather than guessing.

## Validation Checklist

- [ ] App builds with Vite.
- [ ] Catalog filtering respects mode and difficulty.
- [ ] No Google Apps Script runtime dependency remains.
- [ ] GitHub Pages base path is documented or configured.
- [ ] The shell works without mutating catalog data.
- [ ] No hardcoded `/` asset assumptions remain.
