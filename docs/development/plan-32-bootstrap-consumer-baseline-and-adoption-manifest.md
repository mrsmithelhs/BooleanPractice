# Plan 32: Bootstrap Consumer Baseline And Adoption Manifest

## Packet Metadata

- Packet id: 32
- Packet title: Bootstrap Consumer Baseline And Adoption Manifest
- Status: ready
- Owner/model: stronger model recommended
- Date: 2026-07-07
- Packet type: orchestration, docs, scan-only, migration planning
- Mutation level: docs-only, tracked manifest after owner review
- Approval gate: owner/orchestrator must approve capability decisions before any `.bootstrap-adoption.json` entry is treated as final
- Expected artifacts: Bootstrap audit notes, capability decision table, `.bootstrap-adoption.json` draft or final manifest, progress report
- Progress report folder: `reports/development/plan-32-bootstrap-consumer-baseline-and-adoption-manifest/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: make Boolean Practice explicitly tracked as a Bootstrap consumer by auditing current capability presence and recording intended adoption decisions.
- Non-goals: do not copy Bootstrap files into the repo yet, do not migrate packet frontmatter yet, do not rewrite agent prompts yet, and do not change the app.
- Depends on: none.
- Blocks: Plans 33 through 36.
- Why this packet exists: Bootstrap has become a reusable capability ledger rather than a loose folder of conventions. Boolean Practice already uses many ancestor techniques, but Bootstrap audit currently reports it as an untracked baseline with most capabilities absent. Before implementation, the repo needs an honest manifest saying what it intends to adopt, defer, decline, or supersede locally.

## Current Baseline

On 2026-07-07, running the Bootstrap audit from `C:\AI\Bootstrap` against this repo reported:

```text
Mode: untracked-baseline (no .bootstrap-adoption.json found)
packet-status-system: absent
packet-status-set-verb: absent
dev-console-hub: absent
agent-starting-prompts: absent
falsification-check: absent
reports-archive: present
root-agent-guide: absent
decision-log: absent
```

The implementer should rerun the audit rather than trusting this snapshot blindly, because local state may have changed.

## Recommended Capability Position

Proposed default decisions for this project:

| Capability | Channel | Proposed state | Rationale |
|---|---|---|---|
| `packet-status-system` | core | adopted | This repo has many packet docs and would benefit from machine-checkable dependencies, statuses, generated index rows, and linting. |
| `packet-status-set-verb` | core | adopted | Once status frontmatter exists, the atomic `set` verb reduces hand-edit/render/lint drift. |
| `agent-starting-prompts` | core | adopted | This repo depends heavily on orchestrator/implementer handoffs and needs current role contracts. |
| `reports-archive` | core | adopted | The repo already has `reports/development/`; preserve it. |
| `root-agent-guide` | core | adopted | `AGENTS.md` should become the canonical repo entry point for future coding agents. |
| `dev-console-hub` | recommended | adopted | The repo already has `npm run dev:control`; upgrade it toward Bootstrap's submenu hub pattern rather than creating a separate idea. |
| `falsification-check` | recommended | adopted | Boolean semantics, UI review, GAS behavior, adaptive assignment, and Bootstrap migration all benefit from hypothesis/falsification discipline. |
| `decision-log` | recommended | adopted | The project has many durable owner decisions currently spread across packets and chat context; a decision log will reduce rediscovery. |

There are no optional capabilities in Bootstrap ledger version `0.1.0`.

If the owner disagrees with any recommended capability, record the actual owner rationale. Do not invent a rationale.

## Authority And Contracts

Required reading:

- `docs/development/README.md`
- `docs/packet-creation-guidance.md`
- `docs/project-structure.md`
- `docs/architecture.md`
- `package.json`
- Bootstrap source:
  - `<bootstrap-repo>/README.md`
  - `<bootstrap-repo>/bootstrap-capabilities.json`
  - `<bootstrap-repo>/docs/bootstrap-sync.md`
  - `<bootstrap-repo>/docs/bootstrap-adoption-schema.md`
  - `<bootstrap-repo>/CUSTOMIZATION-CHECKLIST.md`

Contracts this packet must preserve:

- Do not copy Bootstrap's own live `docs/development/plan-*.md` packets into Boolean Practice.
- Do not copy Bootstrap's own live `docs/development/README.md` into Boolean Practice.
- Do not copy Bootstrap's `reports/development/plan-*/` folders.
- Do not vendor Bootstrap sync tooling such as `scripts/bootstrap-audit.js`; it is run from Bootstrap against this repo.
- Do not commit machine-specific absolute paths in durable docs. Use placeholders such as `<bootstrap-repo>` and `<consumer-repo>`.
- Do not delete existing Boolean Practice packet docs.

## Scope

### In Scope

- Rerun the read-only Bootstrap audit.
- Record the audit result in the progress report.
- Read the Bootstrap capability ledger and schema.
- Create or update `.bootstrap-adoption.json` with every current capability represented.
- Use the proposed decisions above unless the owner has explicitly changed them.
- Mark not-yet-implemented adopted capabilities as adopted only if the upcoming packet sequence is accepted as the implementation path, or as deferred with a clear note if the owner wants manifest honesty to mean "implemented today."
- Note any dependency conflicts.
- Note any capabilities that are already locally present, absent, or locally superseded.

### Out Of Scope

- Do not install `scripts/dev/plan-status.js`.
- Do not add frontmatter to packet files.
- Do not change the dev console.
- Do not create `AGENTS.md` or starting prompts.
- Do not change source code, tests, build, or UI.

## Implementation Requirements

### Bootstrap Audit

Required behavior:

- Run the Bootstrap audit from the Bootstrap repo against this repo in read-only mode.
- Capture the capability verdicts in the progress report.
- Do not store the generated audit docket as a committed artifact unless the owner explicitly asks; it may contain machine-local path context.

Recommended command shape:

```powershell
node <bootstrap-repo>/scripts/bootstrap-audit.js <consumer-repo> --report
```

### Adoption Manifest

Required behavior:

- Create `.bootstrap-adoption.json` at the repo root.
- Include `lastBootstrapAudit`, `bootstrapVersion`, and one entry per Bootstrap ledger capability.
- For adopted entries, include the capability's current `capabilityVersion`.
- For declined/deferred entries, include `localRationale` based on owner decisions or current implementation reality.
- Ensure the manifest parses as valid JSON.

Suggested initial strategy:

- Use `adopted` for `reports-archive`, because it is already present.
- Use `deferred` for adopted-intent capabilities that are not yet implemented if the owner wants strict manifest honesty before Plans 33 through 36 land.
- After Plans 33 through 36 are implemented, update those entries to `adopted`.

### Decision Record

Required behavior:

- Record in the progress report which capabilities are intended to be adopted in later packets.
- Record any unresolved owner questions.
- Do not silently decline or defer core capabilities.

## Validation Checklist

- [ ] Bootstrap audit was rerun from the Bootstrap repo.
- [ ] Audit results are summarized in the progress report.
- [ ] `.bootstrap-adoption.json` exists or a precise owner-gated draft is documented.
- [ ] The manifest covers every capability in the Bootstrap ledger.
- [ ] The manifest parses as valid JSON.
- [ ] Every non-adopted capability has a real rationale.
- [ ] No Bootstrap self packets, reports, or sync tooling were copied.
- [ ] No app source files changed.

## Stop Conditions

Stop and ask for review if:

- a core capability would be declined
- a dependency conflict appears in the manifest
- the Bootstrap ledger or schema has changed in a way this packet does not describe
- adopting a capability would require deleting existing Boolean Practice packet history
- the audit tool writes to this repo unexpectedly
