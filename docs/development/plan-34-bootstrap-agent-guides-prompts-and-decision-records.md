# Plan 34: Bootstrap Agent Guides, Starting Prompts, And Decision Records

## Packet Metadata

- Packet id: 34
- Packet title: Bootstrap Agent Guides, Starting Prompts, And Decision Records
- Status: ready
- Owner/model: stronger model recommended
- Date: 2026-07-07
- Packet type: docs, workflow, agent contracts
- Mutation level: docs-only
- Approval gate: owner/orchestrator review required for project-specific data rules and durable contracts
- Expected artifacts: `AGENTS.md`, `CLAUDE.md`, agent starting prompts, decision/open-question logs, updated packet guidance, progress report
- Progress report folder: `reports/development/plan-34-bootstrap-agent-guides-prompts-and-decision-records/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: adopt Bootstrap's canonical agent entry points and role-specific starting prompts, customized for Boolean Practice.
- Non-goals: do not change app source, do not run implementation packets, and do not invent owner policy for privacy/data/contracts.
- Depends on: Plan 33 preferred, Plan 32 required.
- Blocks: future implementer handoffs that rely on current Bootstrap operating contracts.
- Why this packet exists: Boolean Practice has grown through many packet-driven agent threads, but it lacks a current `AGENTS.md`, `CLAUDE.md`, standardized orchestrator/implementer/design-review prompts, an append-only decision log, and the current Bootstrap falsification discipline for conclusion-bearing work.

## Authority And Contracts

Required reading:

- `README.md`
- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/deployment.md`
- `docs/local-dev-console.md`
- `docs/development/README.md`
- `docs/packet-creation-guidance.md`
- Bootstrap:
  - `<bootstrap-repo>/AGENTS.md.template`
  - `<bootstrap-repo>/CLAUDE.md.template`
  - `<bootstrap-repo>/docs/agent-starting-prompts/00-orchestrator-thread-starting-prompt.md`
  - `<bootstrap-repo>/docs/agent-starting-prompts/00-implementer-thread-starting-prompt.md`
  - `<bootstrap-repo>/docs/agent-starting-prompts/design-review-prompt.md`
  - `<bootstrap-repo>/docs/agent-starting-prompts/plan-scan-prompt.md`
  - `<bootstrap-repo>/docs/agent-starting-prompts/test-coverage-scan-prompt.md`
  - `<bootstrap-repo>/docs/decision-log.md`
  - `<bootstrap-repo>/docs/open-questions.md`
  - `<bootstrap-repo>/docs/development/packet-creation-guidance.md`

Contracts this packet must preserve:

- Do not invent project-specific privacy or data rules. If not derivable from existing docs, mark them unresolved for owner review.
- Do not invent durable contracts beyond existing project docs and packet history.
- Preserve Boolean Practice's core educational contracts: AP CSA priority, truth table/Venn agreement, one/two/three variable support, static GitHub Pages output, optional GAS output from shared source, and locally simulated GAS behavior.
- Keep Bootstrap's generic prompt guardrails intact unless they conflict with an explicit Boolean Practice decision.

## Scope

### In Scope

- Create `AGENTS.md` from Bootstrap's template, customized for this repo.
- Create `CLAUDE.md` as a pointer to `AGENTS.md`.
- Create `docs/agent-starting-prompts/` with customized:
  - orchestrator thread prompt
  - implementer thread prompt
  - design review prompt
  - plan scan prompt
  - test coverage scan prompt
- Add `docs/decision-log.md` and `docs/open-questions.md` scaffolds.
- Update `docs/packet-creation-guidance.md` to include Bootstrap's current frontmatter and implementer-boundary guidance while preserving Boolean Practice-specific packet advice.
- Add the managed falsification-check block where Bootstrap expects it if the project adopts that capability.
- Update `.bootstrap-adoption.json` for `agent-starting-prompts`, `root-agent-guide`, `decision-log`, and `falsification-check` after validation.

### Out Of Scope

- Do not rewrite all existing packets beyond references needed after Plan 33.
- Do not decide unresolved owner policy.
- Do not move existing docs into a new taxonomy.
- Do not copy Bootstrap's `docs/bootstrap-dev/` folder.
- Do not copy Bootstrap's live packet backlog.

## Implementation Requirements

### Root Agent Guide

Required behavior:

- `AGENTS.md` should include:
  - project name and one-liner
  - current stage
  - area map
  - repo structure
  - key commands
  - architecture constraints
  - routing table for key docs/source areas
  - guardrails for data, generated artifacts, packet status, and app deployment
- `CLAUDE.md` should point to `AGENTS.md`.
- No `{{PLACEHOLDER}}` tokens should remain.

### Starting Prompts

Required behavior:

- Prompts must tell implementers to run `plan-status.js check <id>` before work once Plan 33 is present.
- Prompts must preserve the no-self-complete rule: implementers report, orchestrator verifies.
- Orchestrator prompt must include project-specific contracts.
- Design-review prompt should support both greenfield and audit modes.
- Test-coverage scan prompt should preserve blind-first-then-diff discipline.

### Decision And Open Questions Logs

Required behavior:

- Add an append-only accepted-decision section with dated entries.
- Add a proposed-but-not-accepted section.
- Add an open-questions log.
- Seed only decisions that are clearly established in existing docs or packet history.
- Put uncertain items in open questions rather than pretending they are settled.

### Falsification Discipline

Required behavior:

- Insert Bootstrap's managed falsification-check block in `docs/packet-creation-guidance.md`.
- Insert the same managed block in the orchestrator starting prompt if adopting `falsification-check`.
- Do not paraphrase the managed block outside the markers.
- Preserve marker versions from Bootstrap.

## Validation Checklist

- [ ] `AGENTS.md` exists and has no placeholders.
- [ ] `CLAUDE.md` exists and references `AGENTS.md`.
- [ ] All five agent starting prompts exist.
- [ ] Starting prompts have no placeholders.
- [ ] Implementer prompt includes `plan-status.js check` and no-self-complete guidance.
- [ ] `docs/decision-log.md` exists.
- [ ] `docs/open-questions.md` exists.
- [ ] Falsification-check markers are present in the expected files if adopted.
- [ ] `.bootstrap-adoption.json` reflects adopted documentation capabilities after validation.
- [ ] No Bootstrap self-only docs were copied.

## Stop Conditions

Stop and ask for review if:

- project-specific data rules cannot be derived from existing docs
- durable contracts conflict across existing docs
- inserting Bootstrap guidance would contradict an explicit Boolean Practice decision
- placeholders remain because owner decisions are required
- the agent prompts would instruct implementers to mutate statuses before Plan 33 is available
