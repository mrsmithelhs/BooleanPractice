---
id: plan-36
title: "Bootstrap Tracked Consumer Verification And Sync Runbook"
status: ready
depends_on: [plan-32, plan-33, plan-34, plan-35]
gate: "only close after Bootstrap audit reports expected tracked-consumer verdicts"
superseded_by: null
resolution: null
summary: "verify Boolean Practice now behaves as a tracked Bootstrap consumer and document how future Bootstrap sync checks should be run."
---
# Plan 36: Bootstrap Tracked Consumer Verification And Sync Runbook

## Packet Metadata

- Packet id: 36
- Packet title: Bootstrap Tracked Consumer Verification And Sync Runbook
- Status: (see frontmatter)
- Owner/model: Codex mini or stronger
- Date: 2026-07-07
- Packet type: docs, verification, workflow
- Mutation level: docs-only, manifest update
- Approval gate: only close after Bootstrap audit reports expected tracked-consumer verdicts
- Expected artifacts: final tracked-mode audit result, adoption manifest updates, Bootstrap sync runbook, progress report
- Progress report folder: `reports/development/plan-36-bootstrap-tracked-consumer-verification-and-sync-runbook/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: verify Boolean Practice now behaves as a tracked Bootstrap consumer and document how future Bootstrap sync checks should be run.
- Non-goals: do not implement missing capabilities in this packet, do not vendor Bootstrap audit tooling, and do not auto-generate future upkeep packets.
- Depends on: Plans 32, 33, 34, and 35.
- Blocks: confident future Bootstrap upgrades.
- Why this packet exists: adopting Bootstrap is not finished when files are copied. The repo needs a final tracked-mode audit, an honest manifest, and a local runbook explaining how to detect future drift without committing machine-specific paths or Bootstrap's own self-maintenance artifacts.

## Authority And Contracts

Required reading:

- `.bootstrap-adoption.json`
- `AGENTS.md`
- `docs/development/README.md`
- `docs/workflows/packet-tracking-system.md`
- Bootstrap:
  - `<bootstrap-repo>/docs/bootstrap-sync.md`
  - `<bootstrap-repo>/bootstrap-capabilities.json`
  - `<bootstrap-repo>/CHANGELOG.md`

Contracts this packet must preserve:

- Bootstrap audit tooling stays in Bootstrap.
- This repo stores adoption decisions, not Bootstrap's scanner implementation.
- Committed docs use placeholder paths such as `<bootstrap-repo>` and `<consumer-repo>`, not machine-specific absolute paths.
- The manifest must be honest: adopted means the capability is actually present and passes probes.

## Scope

### In Scope

- Rerun Bootstrap audit in tracked mode.
- Resolve manifest entries so they match implemented reality.
- Document any remaining `behind`, `diverged`, `partial`, `deferred`, or `superseded-locally` verdicts.
- Create a local docs page such as `docs/bootstrap-consumer-sync.md`.
- Add a short pointer from `AGENTS.md` or `docs/development/README.md` if appropriate.
- Update `.bootstrap-adoption.json` `lastBootstrapAudit`.
- Record future upkeep guidance:
  - run audit from Bootstrap
  - read verdicts
  - create consumer-side upkeep packets for behind/diverged items
  - send ahead-of-Bootstrap distillations to Bootstrap's incoming proposal flow

### Out Of Scope

- Do not make this repo capable of auditing Bootstrap consumers by itself.
- Do not commit the audit docket if it includes machine-local paths.
- Do not run `--write-packet`; Bootstrap documents that this is not implemented.
- Do not update Bootstrap itself from this packet.
- Do not claim current if audit reports drift.

## Implementation Requirements

### Tracked Audit

Required behavior:

- Run:

```powershell
node <bootstrap-repo>/scripts/bootstrap-audit.js <consumer-repo> --report
```

- Confirm the audit sees `.bootstrap-adoption.json`.
- Capture summary verdicts in the progress report.
- If any adopted capability fails its probe, mark it for repair rather than hiding the failure.

### Sync Runbook

Required behavior:

- Add `docs/bootstrap-consumer-sync.md` or an equivalent project doc.
- Explain that paths in commands are placeholders.
- Explain that Bootstrap sync tooling is run from the Bootstrap repo.
- Explain how to interpret:
  - `current`
  - `behind`
  - `diverged`
  - `ahead`
  - `declined`
  - `partial`
  - `deferred`
  - `missing-manifest`
- Explain that future drift becomes a Boolean Practice packet, not an automatic mutation.

### Manifest Honesty

Required behavior:

- `.bootstrap-adoption.json` entries must match audit reality.
- `adopted` entries include current capability versions.
- Non-adopted entries include real rationales.
- `lastBootstrapAudit` uses the audit date.

## Validation Checklist

- [ ] Bootstrap audit runs in tracked mode.
- [ ] Adopted capabilities pass their behavioral probes or are explicitly repaired/deferred.
- [ ] `.bootstrap-adoption.json` is current and honest.
- [ ] Sync runbook exists and uses placeholder paths.
- [ ] No Bootstrap sync tooling was vendored.
- [ ] No machine-specific absolute path was committed in new docs.
- [ ] Progress report records audit verdicts and remaining risks.

## Stop Conditions

Stop and ask for review if:

- audit reports an adopted capability as diverged
- manifest and observed behavior disagree
- a future Bootstrap version changes the ledger/schema enough to alter this plan
- keeping path hygiene would require omitting essential reproduction details
- a capability appears ahead of Bootstrap and needs owner decision about whether to distill it upstream
