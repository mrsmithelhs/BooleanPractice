# Plan 33: Bootstrap Packet Status And Frontmatter Migration

## Packet Metadata

- Packet id: 33
- Packet title: Bootstrap Packet Status And Frontmatter Migration
- Status: ready
- Owner/model: stronger model recommended
- Date: 2026-07-07
- Packet type: tooling, migration, docs, tests
- Mutation level: scripts, docs
- Approval gate: before bulk-editing packet frontmatter, produce a migration map and receive orchestrator review
- Expected artifacts: `scripts/dev/plan-status.js`, packet status tests, workflow docs, frontmatter on existing packets, generated README index markers, progress report
- Progress report folder: `reports/development/plan-33-bootstrap-packet-status-frontmatter-migration/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: adopt Bootstrap's machine-checkable packet status system and migrate the existing Boolean Practice packet corpus to YAML frontmatter without losing packet history.
- Non-goals: do not adjudicate whether old statuses are "true", do not mark packets complete, do not rewrite packet bodies beyond status/frontmatter/index mechanics, and do not change app source.
- Depends on: Plan 32.
- Blocks: Plan 34 and reliable future packet handoffs.
- Why this packet exists: Boolean Practice currently has hand-maintained packet status lines and a hand-maintained README table. Bootstrap's status system makes frontmatter authoritative, computes blocked state from dependencies, renders the packet index, enforces terminal resolutions, and provides a `set` verb for orchestrator-only status transitions.

## Authority And Contracts

Required reading:

- `docs/development/README.md`
- every `docs/development/plan-*.md`
- Bootstrap:
  - `<bootstrap-repo>/docs/workflows/packet-tracking-system.md`
  - `<bootstrap-repo>/docs/development/packet-template.md`
  - `<bootstrap-repo>/docs/development/packet-creation-guidance.md`
  - `<bootstrap-repo>/scripts/dev/plan-status.js`
  - `<bootstrap-repo>/scripts/dev/plan-status.test.js`

Contracts this packet must preserve:

- Preserve existing Boolean Practice packet body content.
- Preserve existing packet order and numbering.
- Do not silently change a packet's intended status.
- Do not set any packet to `complete` unless it already has a clear, existing orchestrator-verified resolution.
- Implementers never close their own packets; status closure remains orchestrator/owner work.
- The generated README index must not erase the surrounding Boolean Practice cross-packet contract sections.

## Scope

### In Scope

- Copy Bootstrap's project-agnostic `scripts/dev/plan-status.js` and matching tests.
- Add the project-agnostic workflow doc under `docs/workflows/packet-tracking-system.md`.
- Add or reconcile `docs/development/packet-template.md`.
- Reconcile `docs/development/packet-creation-guidance.md` with Bootstrap's current guidance while preserving Boolean Practice-specific pedagogy contracts.
- Add YAML frontmatter to all existing `docs/development/plan-*.md` files.
- Replace body `- Status: ready` style lines with `- Status: (see frontmatter)`.
- Insert `<!-- plan-index:begin -->` and `<!-- plan-index:end -->` markers in `docs/development/README.md`.
- Run `node scripts/dev/plan-status.js render`.
- Run `node scripts/dev/plan-status.js lint`.
- Update `.bootstrap-adoption.json` entries for `packet-status-system` and `packet-status-set-verb` if the work validates.

### Out Of Scope

- Do not copy Bootstrap's live packet backlog.
- Do not copy Bootstrap's live `docs/development/README.md`.
- Do not modify app source, tests outside packet-status tests, GAS output, or UI.
- Do not decide that a packet's implementation is verified unless there is already an explicit project record.
- Do not delete old progress reports.

## Work Plan

### Stage 0: Migration Map And Gate

Before editing packet files, create a migration map in the progress report:

- packet filename
- proposed `id`
- proposed `title`
- current body status
- proposed frontmatter status
- proposed `depends_on`
- proposed `gate`
- proposed `resolution`
- whether the status is ambiguous

Stop at the approval gate after writing this map if any status, dependency, or resolution is ambiguous.

### Stage 1: Install Tooling

Required behavior:

- Install the Bootstrap status script and test file.
- Add the workflow doc.
- Ensure package scripts or docs explain how to run:
  - `node scripts/dev/plan-status.js list`
  - `node scripts/dev/plan-status.js check <id>`
  - `node scripts/dev/plan-status.js lint`
  - `node scripts/dev/plan-status.js render`
  - `node scripts/dev/plan-status.js set ...`

### Stage 2: Add Frontmatter

Required behavior:

- Every packet gets frontmatter with:
  - `id`
  - `title`
  - `status`
  - `depends_on`
  - `gate`
  - `superseded_by`
  - `resolution`
  - `summary`
- `id` must match the file prefix, for example `plan-31`.
- Use `ready` for existing ready packets unless the repo has stronger evidence for another status.
- Use `resolution: null` for non-terminal packets.
- Preserve packet body content aside from status-line normalization.

### Stage 3: Generated Index

Required behavior:

- Put plan index markers around the README packet table.
- Run render.
- Verify the generated index still covers all packets.
- Keep the surrounding Suggested Execution Order and Cross-Packet Contracts sections.

### Stage 4: Lint And Repair

Required behavior:

- Run the status lint command.
- Fix schema errors.
- Treat warnings about older missing reports as triage unless they block lint.
- Record every repair in the progress report.

## Testing Requirements

- Run the packet-status test suite.
- Run `node scripts/dev/plan-status.js list`.
- Run `node scripts/dev/plan-status.js lint`.
- Run `node scripts/dev/plan-status.js render`, then verify no unintended README churn.
- Run a safe `check` against at least one ready packet and one blocked packet if dependencies exist.
- Do not run app E2E tests unless source/UI files were accidentally touched.

## Validation Checklist

- [ ] `scripts/dev/plan-status.js` exists.
- [ ] Packet-status tests exist and pass.
- [ ] `docs/workflows/packet-tracking-system.md` exists.
- [ ] Every packet has valid YAML frontmatter.
- [ ] README packet index is generated between markers.
- [ ] `list`, `check`, `render`, and `lint` work.
- [ ] The `set` verb exists and is documented as orchestrator-only.
- [ ] Existing packet body content is preserved.
- [ ] `.bootstrap-adoption.json` reflects adopted packet-status capabilities after validation.

## Stop Conditions

Stop and ask for review if:

- more than a few packet statuses are ambiguous
- dependency mapping would require owner judgment
- render would remove project-specific README sections
- lint requires marking unverified packets complete
- Bootstrap's status script is incompatible with this repo's module type or test setup without nontrivial adaptation
