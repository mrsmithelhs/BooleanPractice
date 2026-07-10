# Packet Creation Guidance

Use this guidance when creating Boolean Practice development packets for smaller, faster, or cheaper implementation agents.

The goal is to make each packet a clear work order plus a guardrail contract. A packet should tell the implementing agent what to do, what not to decide, where project truth lives, how to validate the result, and when to stop for integration-owner review.

## Packet Location And Naming

- Put implementation packets in `docs/development/`.
- Use sequential names such as `plan-03-parser-evaluator-core.md`.
- Keep `docs/development/README.md` updated when adding or superseding a packet.
- Use `docs/development/00-mini-packet-agent-starting-prompt.md` when starting a lower-cost implementation thread.

## Packet Metadata

Every packet should start with metadata:

Before the human-readable packet body, every packet must also carry the machine-readable YAML frontmatter required by the packet-status workflow:

```yaml
---
id: plan-NN
title: Short Descriptive Title
status: draft
depends_on: []
gate: ""
superseded_by: null
resolution: null
summary: >-
  One concise purpose statement for the generated packet index.
---
```

`status` is authoritative in frontmatter. The body may retain a `- Status: (see frontmatter)` reminder for human readers, but the README index is generated and must not be hand-maintained.

Use this lifecycle vocabulary:

- `draft`: exists but needs review before assignment.
- `ready`: may be assigned when dependencies pass the status check.
- `in-progress`: actively assigned and underway.
- `delivered`: implementer reports completion; awaiting owner verification.
- `complete`: owner/orchestrator verified; requires `resolution`.
- `superseded`: replaced by another packet; requires `superseded_by` and `resolution`.
- `parked`: deliberately deferred; requires `resolution`.

`blocked` is computed from incomplete dependencies and must not be written as a hand-set status.

- Packet id:
- Packet title:
- Status: draft / ready / in-progress / complete / superseded
- Owner/model:
- Date:
- Packet type: implementation / scan-only / docs / testing / frontend / integration / deployment / other
- Mutation level: none / docs-only / source-code / tests / generated-local / GitHub config / production
- Approval gate: none / before mutation / before generated output / before dependency install / before deploy / before production action
- Expected artifacts:
- Progress report folder:
- Progress report file:

## Progress Reports

Every packet should identify a progress-report folder under `reports/development/`.

- Use a packet-specific subfolder whose name matches the packet file, such as `reports/development/plan-03-parser-evaluator-core/`.
- Prefer a single `progress.md` file unless the packet has a clear reason to split evidence from narrative.
- Capture at minimum:
  - Overall summary
  - Files changed
  - Problems encountered and how they were resolved
  - Out-of-scope issues discovered but not worked on
  - Out-of-scope work done against the packet guidance
  - Build and test status
  - What to check for proof of work completed
- If the packet is scan-only or approval-gated, record the stop point and the approval still pending.

## Packet Summary

Include:

- Goal:
- Non-goals:
- Depends on:
- Blocks:
- Why this packet exists:

Make the "why" concrete. For this project, that usually means explaining the AP CSA boolean reasoning, visual learning, accessibility, parser correctness, test confidence, or GitHub Pages deployment risk the packet resolves.

## Authority And Contracts

Name the sources of truth the implementing agent must obey.

Common Boolean Practice references:

- Product and pedagogy:
  - `docs/reports/archive-app-review.md`
  - `docs/project-structure.md`
  - `docs/development/README.md`
- Migration:
  - `archive/Index.html`
  - `archive/Code.js`
  - `docs/development/plan-01-repository-bootstrap.md`
  - `docs/development/plan-02-archive-inventory-product-spec.md`
- Architecture and testing once created:
  - `docs/architecture.md`
  - `docs/testing.md`
  - `package.json`
  - `vite.config.*`
  - `vitest.config.*`
  - `playwright.config.*`
  - `src/`
  - `ui/`
  - `tests/`

Also list decisions the packet must not redefine. Project-level decisions:

- The app teaches boolean evaluation through stepwise reasoning, truth tables, and Venn/set regions.
- AP Computer Science A is a priority audience, so Java-style boolean operators, precedence, and short expressions matter.
- Shared parser/evaluator logic should live outside Vue components and be covered by unit tests.
- Truth table and Venn modes should agree because they are two views of the same boolean semantics.
- Venn mode must support one, two, and three input variables.
- Visual polish should clarify expression structure and feedback, not add decorative clutter.
- GitHub Pages deployment should be static and reproducible from source.

If an implementing agent discovers that a contract appears wrong, the packet should stop and report rather than quietly changing product direction.

## Required Reading

Keep required reading short but sufficient.

- Required reading is for files that define the contract or will likely be edited.
- Optional/contextual reading is for supporting docs or neighboring components.
- Use `rg` instructions when filenames may have changed.

## Scope

Split scope into:

- In scope
- Out of scope
- Files and areas likely touched

Be explicit about dependency installs, generated output, GitHub workflow edits, and deployment. If a packet does not authorize production deployment, say so.

## Work Plan

Use a small numbered plan:

1. Inspect current state and confirm assumptions.
2. Implement only the bounded changes in scope.
3. Add or update focused tests.
4. Run targeted validation.
5. Run broader validation required by the packet.
6. Report results, risks, and follow-ups clearly.

For scan-only or approval-gated packets, say exactly where the implementing agent must stop.

## Implementation Requirements

Break work into narrow requirement sections. Each requirement should include:

- Required behavior
- Constraints
- Edge cases
- Expected artifact or code change

Include pedagogy checks when UI, feedback, or problem sequencing changes:

- Does this help students reason about operators, precedence, negation, and parentheses?
- Does it connect truth table rows and Venn regions as the same underlying combinations?
- Does it encourage prediction and correction rather than trial-and-error clicking?
- Is it usable on classroom projectors, student laptops, and narrow screens?
- Are keyboard, color contrast, and screen reader basics preserved?

## Model-Specific Instructions

When targeting a lower-cost model:

- Ask it to summarize the job before editing.
- Give exact files and commands.
- Keep the write scope small.
- Tell it not to broaden into redesigns or unrelated refactors.
- Tell it to stop on low-confidence pedagogy, parser grammar, accessibility, or deployment decisions.
- Prefer small patches with tests over sweeping rewrites.

## Commands

List commands from the repository root. Early packets may create these commands; later packets should expect them.

```powershell
npm install
npm test
npm run lint
npm run build
npx playwright test
```

Only include deployment commands when the packet explicitly allows them.

For packet status work, run these commands from the repository root:

```powershell
node scripts/dev/plan-status.js list
node scripts/dev/plan-status.js check plan-NN
node scripts/dev/plan-status.js lint
node scripts/dev/plan-status.js render
node scripts/dev/plan-status.js set plan-NN delivered
```

The `set` verb is orchestrator-only. Implementers report delivery in the progress report; they do not close packets themselves. Terminal transitions require an explicit resolution, and `render` owns the README index between its marker comments.

## Validation Checklist

Every packet should include a checklist. Use relevant items:

- [ ] Required files or artifacts exist.
- [ ] Targeted unit or integration tests pass.
- [ ] `npm test` passes when source or tests changed.
- [ ] `npm run build` passes when frontend changed.
- [ ] Playwright tests pass when workflows or layouts changed.
- [ ] Parser behavior matches documented operator precedence.
- [ ] Truth table and Venn results agree for shared expressions.
- [ ] Three-input Venn behavior is covered by tests.
- [ ] Accessibility expectations are covered or documented.
- [ ] GitHub Pages base-path behavior is covered before deployment.
- [ ] No unrelated files were changed.
- [ ] Final report lists commands run and any remaining risks.

## Stop Conditions

Packets should tell the implementing agent to stop and ask for review if:

- the work requires changing the canonical grammar or learning model
- docs and source disagree in a way that changes scope
- the only fix requires broad unrelated churn
- validation fails in a way that changes the packet scope
- a dependency, workflow, or deployment choice has meaningful tradeoffs not covered by the packet
- a UI change could mislead students about boolean semantics
- production deployment or repository settings changes are needed
