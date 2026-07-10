# Bootstrap Consumer Sync Runbook

Boolean Practice is a tracked Bootstrap consumer. The adoption manifest at the repository root records which Bootstrap capabilities this project has adopted and the capability version used here. Bootstrap's audit tool remains in the Bootstrap repository; this project does not vendor or maintain a second scanner.

## Run The Audit

Run the read-only audit from a checkout of Bootstrap, passing this repository as an argument:

```powershell
cd <bootstrap-repo>
node scripts/bootstrap-audit.js <consumer-repo> --report
```

`<bootstrap-repo>` and `<consumer-repo>` are placeholders. Do not replace them with machine-specific paths in committed documentation, reports, or packet files. The audit reads the consumer and prints a Markdown docket; it does not modify either repository.

The audit should say `Mode: tracked (manifest found)`. The consumer manifest is [`.bootstrap-adoption.json`](../.bootstrap-adoption.json), and its `lastBootstrapAudit` date should match the date of the most recent accepted audit run. Update that field only after reviewing the docket and reconciling any adopted-capability failures.

Do not use `--write-packet`. Bootstrap documents that packet generation is not implemented. When an audit identifies work, create a normal Boolean Practice packet under `docs/development/` and let this repository's packet-status workflow track it.

## Interpret Verdicts

| Verdict | Meaning | Consumer action |
|---|---|---|
| `current` | The manifest version matches Bootstrap and the behavioral probe passes. | No upkeep packet is needed; retain the evidence date. |
| `behind` | The capability is present but the manifest version is older than Bootstrap. | Read the Bootstrap changelog entry, then create one bounded consumer upkeep packet for the delta. |
| `diverged` | The manifest claims adoption but the probe fails, or the manifest and observed implementation disagree. | Treat as a repair, not a version bump. Investigate the mechanism, repair or defer honestly, then re-audit. |
| `ahead` | The consumer has a newer capability version or explicitly marks itself ahead of Bootstrap. | Distill the generic lesson and send a dated proposal to Bootstrap's `docs/bootstrap-dev/incoming/` flow; do not silently redefine the local manifest as current. |
| `declined` | The consumer intentionally does not adopt the capability and records a rationale. | Leave it unchanged unless the owner revisits the decision. |
| `superseded-locally` | A local mechanism deliberately replaces the Bootstrap capability and records why. | Confirm the local replacement remains documented and tested; do not treat it as accidental drift. |
| `partial` | Only part of the capability is present, with an explicit rationale. | Create a bounded follow-up packet if the missing portion is wanted; otherwise preserve the rationale. |
| `deferred` | Adoption is intentionally postponed, with a real rationale. | Leave it deferred until a later packet or owner decision changes the plan. |
| `missing-manifest` | The consumer has no entry for a Bootstrap capability. | Decide whether it should be adopted, deferred, declined, or superseded locally; update the manifest through a reviewed packet. |

Also inspect the docket's `Manifest-honesty failures`, `Behind items`, and `Ahead / distill-back items` sections. A clean run has no adopted-capability probe failures and no unexplained drift. A `deferred`, `declined`, `partial`, or `superseded-locally` entry is not a failure when its rationale is explicit and truthful.

## Consumer Upkeep Loop

1. Run the audit from Bootstrap in tracked mode.
2. Read the capability verdicts and the matching Bootstrap changelog entry when a version changed.
3. For each `behind` or `diverged` capability, create one Boolean Practice packet with a bounded scope, validation plan, and owner gate where needed.
4. Implement and verify the packet in this repository. Do not mutate Bootstrap from the consumer task.
5. Update `.bootstrap-adoption.json` only when the implemented state and audit probe support the new claim.
6. Re-run the audit from Bootstrap and record the final verdicts in the packet progress report.
7. For an `ahead` result, extract only the project-agnostic improvement and submit it as a dated proposal to Bootstrap's incoming flow. Keep consumer-specific implementation details in this repository.

The audit is detection, not adaptation. It never resolves dependencies, writes packet status, commits files, or automatically applies Bootstrap changes. The orchestrator/owner decides whether a docket item becomes a packet, and the normal packet lifecycle governs that work.

## Path And Artifact Hygiene

- Keep Bootstrap's scanner, live Bootstrap packets, reports, and `docs/bootstrap-dev/` out of this repository.
- Keep machine-specific paths out of committed docs and progress reports. CLI paths are arguments, not project configuration.
- Do not commit the printed audit docket when it contains local paths or usernames. Record the date, mode, capability verdict summary, and remaining risks in the relevant progress report instead.
- Keep `.bootstrap-adoption.json` capability-keyed and path-free.
- Use the existing [packet-status workflow](workflows/packet-tracking-system.md) for any consumer-side upkeep packet.
