---
id: plan-20
title: "GAS Web App Submission Output"
status: complete
depends_on: [plan-01, plan-02, plan-03, plan-04, plan-05, plan-06, plan-07, plan-08, plan-09, plan-10, plan-11, plan-12, plan-13, plan-14, plan-15, plan-16, plan-17, plan-18, plan-19]
gate: "required before GAS push, live Sheet write, deployment setting changes, or exposing student data"
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "add an optional GAS web app output that serves a GAS-friendly build and records submissions to a Google Sheet."
---
# Plan 20: GAS Web App Submission Output

## Packet Metadata

- Packet id: 20
- Packet title: GAS Web App Submission Output
- Status: (see frontmatter)
- Owner/model: Codex mini or stronger; stronger model recommended for build tooling
- Date: 2026-05-06
- Packet type: implementation, GAS, integration, tests, docs
- Mutation level: source-code, tests, generated-local, docs
- Approval gate: required before GAS push, live Sheet write, deployment setting changes, or exposing student data
- Expected artifacts: shared-source GAS build target, submission API, local GAS simulation, tests, docs, progress report
- Progress report folder: `reports/development/plan-20-gas-web-app-submission-output/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: add an optional GAS web app output that serves a GAS-friendly build and records submissions to a Google Sheet.
- Non-goals: do not replace the static GitHub Pages target and do not rely on GitHub Pages posting to a GAS HTTPS endpoint.
- Depends on: Plans 01-19.
- Blocks: Plan 21 Sheets assignment mode.
- Why this packet exists: classroom submission tracking is valuable, but the project should preserve shared source and reproducible builds.

## Architecture Direction

- Keep shared source as much as possible.
- Use build tools to assemble a GAS-friendly version.
- Static GitHub Pages remains a valid standalone target.
- GAS web app target may use `google.script.run` for submission.
- Local testing must simulate `google.script.run` success/failure and configurable delays so bootstrap/submission performance can be investigated.
- Include room for smart server caching if performance measurements justify it.

## Scope

In scope:

- Add GAS server wrapper files and build scripts if not already present.
- Add submission function that writes to a configured Sheet.
- Use student identity from:
  - `Session.getActiveUser()?.getEmail() || Session.getEffectiveUser()?.getEmail()`
- Document expected deployment as domain-visible to recognizable student users.
- Add local mock/simulator for `google.script.run` with configurable latency and failure paths.
- Add tests for submission payload shape, local simulation, and non-GAS fallback behavior.

Out of scope:

- Do not push to GAS.
- Do not write to live Sheets.
- Do not build assignment mode yet.
- Do not treat GAS as a generic public HTTPS API endpoint for the static app.

## Implementation Requirements

- Submission payloads should include expression id/text, mode, concept tags, attempts, correctness, hint/autofill/bulk-control usage when available, timestamp, and app version/build target when available.
- Store email only in the GAS/Sheets target, not in standalone static local state.
- Sanitize or validate payloads before writing rows.
- Local simulation should make delay tuning easy through a config variable.

## Validation Checklist

- [ ] Static build still works.
- [ ] GAS-friendly build is generated locally.
- [ ] Local `google.script.run` simulator can emulate delay and failure.
- [ ] Submission payload is tested.
- [ ] No real GAS push or Sheet write occurred.
- [ ] Docs explain privacy/deployment assumptions.

## Stop Conditions

Stop if build tooling cannot share source without major architectural churn, or if student identity behavior is unavailable in the intended deployment mode.

