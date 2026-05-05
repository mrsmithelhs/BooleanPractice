# Plan 01: Repository Bootstrap

## Packet Metadata

- Packet id: 01
- Packet title: Repository Bootstrap
- Status: ready
- Owner/model: Codex mini or stronger
- Date: 2026-05-05
- Packet type: implementation, tooling, integration
- Mutation level: source-code, tests, GitHub config
- Approval gate: ask before adding major dependencies beyond Vue, Vite, Vitest, Playwright, ESLint, and formatter tooling
- Expected artifacts: package manifests, Vite/Vue app skeleton, test config, lint/build scripts, ignored local folders, CI skeleton
- Progress report folder: `reports/development/plan-01-repository-bootstrap/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: create the modern local development foundation for a compiled static Vue app.
- Non-goals: do not migrate app behavior or redesign UI yet.
- Depends on: existing repository and `archive/`.
- Blocks: all implementation packets.
- Why this packet exists: lower-cost agents need reliable commands and project structure before moving learning logic out of the archive.

## Scope

In scope:

- Create root package scripts for install, test, lint, build, and E2E.
- Create a Vite + Vue application structure.
- Configure Vitest for unit tests and Playwright for later E2E tests.
- Add GitHub Actions skeleton for install, lint, tests, and build.
- Add placeholders for `src/`, `ui/`, `tests/`, and deployment docs.

Out of scope:

- Do not implement parser, truth table, or Venn behavior.
- Do not deploy to GitHub Pages.
- Do not delete or rewrite `archive/`.

## Validation Checklist

- [ ] `npm install` succeeds.
- [ ] `npm test` runs a placeholder or initial test.
- [ ] `npm run build` builds the Vue app.
- [ ] CI workflow references current scripts.
- [ ] No archive files were changed.
