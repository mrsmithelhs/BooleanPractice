---
id: plan-35
title: "Bootstrap Dev Console Hub Alignment"
status: complete
depends_on: [plan-33, plan-34]
gate: "before adding any mutating or external-state console action, require explicit confirmation UX and tests"
superseded_by: null
resolution: "Orchestrator reviewed the dev-console hub: grouped read-only packet visibility, confirmation-gated local-output actions, Windows-safe invocation, and distinct launch errors are verified. Review repair added npm's required -- separator before forwarded script arguments."
summary: "upgrade the existing local dev console toward Bootstrap's recommended `dev-console-hub` pattern."
---
# Plan 35: Bootstrap Dev Console Hub Alignment

## Packet Metadata

- Packet id: 35
- Packet title: Bootstrap Dev Console Hub Alignment
- Status: (see frontmatter)
- Owner/model: Codex mini or stronger
- Date: 2026-07-07
- Packet type: tooling, developer experience, tests
- Mutation level: scripts, tests, docs
- Approval gate: before adding any mutating or external-state console action, require explicit confirmation UX and tests
- Expected artifacts: `npm run dev:console` hub, safe package-script wrapper, packet-status menu integration, tests, docs, progress report
- Progress report folder: `reports/development/plan-35-bootstrap-dev-console-hub-alignment/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: upgrade the existing local dev console toward Bootstrap's recommended `dev-console-hub` pattern.
- Non-goals: do not build a production admin surface, do not manage cloud resources, do not deploy, and do not add auth or teacher features.
- Depends on: Plan 33; Plan 34 recommended.
- Blocks: a cleaner local maintainer workflow and current Bootstrap `dev-console-hub` adoption.
- Why this packet exists: Boolean Practice already has `npm run dev:control`, but Bootstrap's newer guidance adds a submenu-driven hub, packet-status visibility, confirmation-gated mutating commands, centralized platform-aware package-script execution, and distinct launch-error reporting. This is exactly the kind of downstream lesson Bootstrap is meant to standardize.

## Authority And Contracts

Required reading:

- `package.json`
- `scripts/dev/control-console.js`
- `docs/local-dev-console.md`
- `docs/development/plan-25-local-dev-console.md`
- Bootstrap:
  - `BOOTSTRAP-PROMPT.md` dev-console guidance
  - `bootstrap-capabilities.json` entry for `dev-console-hub`

Contracts this packet must preserve:

- The console is a local maintainer tool, not app UI.
- It must not kill unmanaged processes automatically.
- It must not trigger deployment or live Sheet/GAS mutation without explicit confirmation and a packet authorizing that behavior.
- Local state belongs under ignored `local/` paths.
- Packet-status writes, if exposed, are orchestrator-only and must require appropriate confirmation and resolution inputs.

## Scope

### In Scope

- Add `npm run dev:console` as the Bootstrap-aligned command.
- Preserve `npm run dev:control` as an alias if useful for backward compatibility.
- Organize the console into submenus:
  - local dev server lifecycle
  - tests and validation
  - builds/previews
  - packet status read commands
  - advanced scripts
- Add packet-status list/check visibility after Plan 33.
- Optionally expose status `set` only behind an orchestrator-labeled, confirmation-gated path.
- Centralize package-script execution behind a shared wrapper helper.
- On Windows, avoid raw `npm.cmd` spawn pitfalls by using a tested platform-aware command wrapper.
- Ensure confirmation screens show the exact command object that will be executed.
- Report spawn/launch failures distinctly from child process nonzero exits.
- Add regression tests for wrapper behavior and console command wiring.
- Update docs.
- Update `.bootstrap-adoption.json` for `dev-console-hub` after validation.

### Out Of Scope

- Do not add deployment commands unless another packet explicitly authorizes them.
- Do not add GAS or Sheets write actions.
- Do not add teacher assignment editing.
- Do not replace package scripts with the console; scripts remain directly runnable.
- Do not require global installs or a process manager.

## Implementation Requirements

### Command Hub Shape

Required behavior:

- `npm run dev:console` starts the maintained console.
- Menu labels should be plain and human-facing.
- Read-only commands such as packet list/status should be easy to find.
- Mutating commands should be confirmation-gated.
- Dangerous commands should be absent unless explicitly authorized by another packet.

### Package Script Wrapper

Required behavior:

- All console-triggered package scripts run through one shared wrapper.
- The displayed command and executed command are the same structured command.
- Launch errors, spawn errors, and child exit statuses are reported differently.
- Tests cover command construction on the current platform.

### Packet Status Integration

Required behavior:

- The console can show packet status list after Plan 33.
- The console can check a packet by id.
- If set-status is exposed, label it as orchestrator-only and require confirmation.
- Terminal status changes must require a resolution.

## Testing Requirements

- Unit tests for the package-script wrapper.
- Unit tests for launch-error versus nonzero-exit reporting.
- Console menu wiring tests where practical.
- Manual smoke test of `npm run dev:console`.
- `node scripts/dev/plan-status.js list` from inside the console or via direct command if Plan 33 has landed.
- `npm test` or targeted script tests.

## Validation Checklist

- [ ] `npm run dev:console` exists.
- [ ] `npm run dev:control` remains supported or is documented as replaced.
- [ ] Console has grouped submenus.
- [ ] Package-script execution is centralized.
- [ ] Launch failures and nonzero child exits are distinct.
- [ ] Packet status list/check commands are reachable.
- [ ] Mutating commands require confirmation.
- [ ] Tests cover wrapper behavior.
- [ ] Docs describe the hub and safety model.
- [ ] `.bootstrap-adoption.json` reflects `dev-console-hub` adoption after validation.

## Stop Conditions

Stop and ask for review if:

- integrating packet status would require weakening orchestrator-only status rules
- console commands would mutate external GAS/Sheets/GitHub state without an explicit packet
- wrapper behavior cannot be tested reliably on Windows
- the existing console has unreported safety assumptions that conflict with Bootstrap guidance
