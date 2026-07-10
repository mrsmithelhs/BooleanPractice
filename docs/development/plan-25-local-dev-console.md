---
id: plan-25
title: "Local Dev Console And Port-Control Workflow"
status: complete
depends_on: [plan-01, plan-06, plan-10, plan-11, plan-20, plan-21]
gate: "required before adding any production-visible process control or destructive local process management"
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "create a human-facing local development console for Boolean Practice that makes the editable dev server easy to start, stop, restart, inspect, and open from one place."
---
# Plan 25: Local Dev Console And Port-Control Workflow

## Packet Metadata

- Packet id: 25
- Packet title: Local Dev Console And Port-Control Workflow
- Status: (see frontmatter)
- Owner/model: stronger model recommended
- Date: 2026-05-06
- Packet type: local developer tooling, scripts, docs, tests
- Mutation level: scripts, docs, tests, local-only runtime state
- Approval gate: required before adding any production-visible process control or destructive local process management
- Expected artifacts: local dev console command, port-aware status helpers, docs for console usage and port conventions, tests for helper logic and command wiring, optional implementation report
- Progress report folder: `reports/development/plan-25-local-dev-console/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: create a human-facing local development console for Boolean Practice that makes the editable dev server easy to start, stop, restart, inspect, and open from one place.
- Non-goals: do not add production auth, roster management, cloud deployment, GAS tooling, browser admin panels, or automatic destructive process killing.
- Depends on: Plans 01, 06, 10, 11, 20, and 21 for the existing static app, preview workflow, and optional GAS/Sheets outputs.
- Blocks: easier manual local development, faster port troubleshooting, and clearer browser/open-url workflows.
- Why this packet exists: the project already has a Vite dev server, a local preview server, browser tests, GAS output, and Sheets assignment mode. A small console can reduce friction without changing the app itself.

## Scope

### In Scope

- Add an interactive console command, for example `npm run dev:control`.
- Make the editable local dev server default to port `5177`, configurable through a repo-local `.env` file that is not tracked by git.
- Show the status of the local dev server and related local runtime helpers.
- Start, stop, and restart the local dev server through package-script-backed commands.
- Provide a few clearly labeled helper actions that make sense for this repo:
  - open the dev server in the browser
  - open the built preview server in the browser
  - run the standard validation commands
  - show the active port, host, and loaded `.env` values that matter for local development
  - display short logs or diagnostics when a runtime fails to start
- Distinguish between:
  - not running
  - running and healthy
  - port occupied by another process
  - running but unhealthy
- Keep the console clearly documented as a human-facing local developer tool rather than an agent-facing workflow.
- Add tests for any helper modules and command wiring that can be covered without launching risky long-lived processes.
- Add docs that point humans to the console from the development and testing guidance.

### Out Of Scope

- Do not add impersonation, auth, or user switching.
- Do not add cloud, Sheets, GAS, or deployment controls.
- Do not require a global process manager.
- Do not automatically kill unrelated processes using the target port.
- Do not change the GitHub Pages build or deployment contract.
- Do not treat the console as a production admin surface.

### Likely Files And Areas

- Scripts:
  - new script under `scripts/dev/`, for example `scripts/dev/control-console.js`
  - small helper modules under `scripts/lib/` if needed for ports, status, or process metadata
  - `package.json`
- Docs:
  - `docs/testing.md`
  - `docs/deployment.md`
  - `docs/development/README.md`
  - a short human-facing local console doc if needed, for example `docs/local-dev-console.md`
- Tests:
  - unit tests for any pure status/port helper functions
  - script-level tests where practical
- Local ignored state:
  - `local/dev-control/`
  - PID files, logs, and transient status files should stay untracked

## Work Plan

### Stage 0: Inspect And Confirm Port Conventions

1. Confirm the current local development scripts and preview scripts.
2. Confirm the editable dev server port convention for this packet.
3. Confirm whether any existing local helper files can be reused.
4. Write a short implementation map before editing if there is any ambiguity.

### Stage 1: Dev Console Basics

Implement the core console first.

Required capabilities:

- show status for the local dev server
- start the dev server
- stop the dev server if the console started it
- restart the dev server
- open the local app URL
- show the relevant local config values

Recommended menu options:

1. Status dashboard
2. Start dev server
3. Stop dev server
4. Restart dev server
5. Open app
6. Open preview
7. Run checks
8. Show config
9. Exit

### Stage 2: Port And Process Awareness

Add safe status helpers.

Required behavior:

- detect whether the configured dev port is free, occupied, healthy, or unhealthy
- report unmanaged port occupancy without killing the process automatically
- record only console-managed metadata under ignored local state
- avoid treating a fallback port as a silent success if the configured port is occupied

### Stage 3: Preview And Validation Shortcuts

Keep the console useful for the build/preview loop.

Required behavior:

- open the local preview server if it is already running
- offer a shortcut to build and preview locally if that flow exists
- surface common validation commands used by the repo
- keep command names aligned with `package.json`

### Stage 4: Docs And Tests

Add human-facing documentation and tests.

Required behavior:

- document what the console does and does not do
- document the port convention and the `.env` file location
- explain how to recover from occupied ports and stale local state
- test pure helper logic and any command generation that can be tested safely

## Implementation Requirements

### 1. Human-Facing Console Contract

- Required behavior:
  - the console should be obvious to a maintainer, not hidden behind agent-only conventions
  - the docs should point to it directly
  - menu labels should be plain language
- Constraints:
  - avoid jargon where simple labels work better
  - do not imply the tool is part of the app UI
- Expected artifact or code change:
  - console command and matching docs

### 2. Port And Config Contract

- Required behavior:
  - editable local dev server defaults to port `5177`
  - the port can be changed with a repo-local `.env` file that is ignored by git
  - preview remains a separate local build/serve check
- Constraints:
  - do not hardcode a hidden fallback that makes the configured port unclear
  - do not change GitHub Pages assumptions
- Expected artifact or code change:
  - port-aware helper logic and docs

### 3. Safe Process Control

- Required behavior:
  - stop and restart only processes the console started
  - report unmanaged occupants rather than killing them automatically
  - write logs and state only under ignored local paths
- Constraints:
  - no destructive process cleanup
  - no global process manager requirement
- Expected artifact or code change:
  - managed process metadata and helper tests

### 4. Useful Shortcuts

- Required behavior:
  - open the dev app
  - open the preview build
  - show validation commands
  - show config and diagnostics
- Constraints:
  - keep shortcuts aligned with the actual repo scripts
  - do not broaden into cloud or deployment actions
- Expected artifact or code change:
  - console menu wiring and docs

## Validation Checklist

- [ ] `npm run dev:control` exists.
- [ ] The console documents the dev port as `5177` and explains how to override it locally.
- [ ] Status clearly distinguishes free, healthy, unhealthy, and occupied ports.
- [ ] The console can start, stop, and restart the local dev server it manages.
- [ ] Unmanaged processes on the target port are reported but not killed automatically.
- [ ] Preview and validation shortcuts are present and clearly labeled.
- [ ] The console is documented as a human-facing local tool.
- [ ] Tests cover the helper logic and command wiring that can be safely exercised.
- [ ] No cloud, Sheets, GAS, or production-visible process control was added.

## Stop Conditions

Stop and ask for review if:

- the implementation would require killing unrelated processes automatically
- the console starts to resemble production auth or admin tooling
- the port convention conflicts with existing docs or source in a way that affects the local workflow
- the implementation would need a hidden global install or destructive cleanup step
