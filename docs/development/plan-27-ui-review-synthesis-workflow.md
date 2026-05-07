# Plan 27: UI Review Synthesis Workflow

## Packet Metadata

- Packet id: 27
- Packet title: UI Review Synthesis Workflow
- Status: ready
- Owner/model: Codex mini or stronger; stronger model recommended for synthesis quality
- Date: 2026-05-06
- Packet type: implementation, tooling, UI review, docs
- Mutation level: source-code, tests, generated-local, docs
- Approval gate: before changing review folder contracts from Plan 26 or creating implementation fix packets automatically
- Expected artifacts: synthesis workflow for multiple blind reviews, local synthesis output, docs, progress report
- Progress report folder: `reports/development/plan-27-ui-review-synthesis-workflow/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: synthesize multiple blind UI reviews from a Plan 26 capture folder into a prioritized triage report.
- Non-goals: do not fix UI issues, do not ask synthesis to inspect app source code, and do not erase disagreement between reviewers.
- Depends on: Plan 26.
- Blocks: future UI-fix packet creation and repeatable multi-provider UI review cycles.
- Why this packet exists: the best signal from blind review comes from patterns across reviewers. Synthesis should identify repeated findings, contradictions, high-confidence issues, and candidate fix packets without losing the raw review evidence.

## Core Concept

Plan 26 captures the UI story and asks one or more fresh agents to review it blindly. Plan 27 consumes those completed review subfolders and produces a synthesis for the integration owner.

The synthesis agent may read:

- `tour.md`
- `manifest.json`
- screenshots in the capture folder
- `review-starting-prompt.md`
- `synthesis-starting-prompt.md`
- review subfolders under `reviews/`

The synthesis agent should not need to read app source code. The point is to synthesize what blind reviewers experienced, not to explain UI choices from implementation context.

## Required Reading

- `docs/development/plan-26-ui-tour-capture-blind-review-workflow.md`
- generated capture folder contract from Plan 26
- any docs created by Plan 26 for running captures and reviews
- existing package scripts if adding a synthesis command

## Scope

In scope:

- Add a command or documented workflow to synthesize review folders from a chosen capture folder.
- Read multiple review outputs from `reviews/<reviewer-id>/`.
- Support both Markdown notes and optional structured `findings.json`.
- Tolerate additional review-relevant markdown or JSON filenames inside each reviewer folder.
- Produce a synthesis folder under the same capture folder, such as:
  - `synthesis/summary.md`
  - `synthesis/prioritized-findings.md`
  - `synthesis/finding-index.json`
  - optionally `synthesis/proposed-fix-packets.md`
- Group repeated findings across reviewers.
- Preserve reviewer disagreement and uncertainty.
- Map findings back to screenshot numbers and tours.

Out of scope:

- Do not modify app source.
- Do not create GitHub issues unless a later packet explicitly asks for that.
- Do not overwrite raw reviewer notes.
- Do not treat any one reviewer as automatically correct.
- Do not require all reviewers to use the same model/provider or exact output format.

## Synthesis Requirements

The synthesized report should include:

- capture folder path and datetime
- list of reviewers included
- tours/screenshots reviewed
- repeated findings across reviewers
- severe single-reviewer findings worth checking
- contradictions or disagreements
- issues by category:
  - confusion
  - overwhelm/density
  - missing expected UI
  - transitions/state changes
  - labels/copy
  - over-explanation
  - show-rather-than-tell opportunities
  - color/contrast
  - cohesiveness
  - iconography
  - accessibility/responsiveness
  - trust, confidence, error recovery, loading/empty states
- recommended priorities
- candidate follow-up packets or small fix tasks
- open questions for the integration owner

The report should distinguish:

- consensus issue: multiple reviewers independently saw the same problem
- isolated issue: one reviewer saw it
- contradiction: reviewers disagree
- uncertainty: reviewers could not tell from screenshots
- missing evidence: the tour did not capture enough state to judge

## Severity And Confidence

Normalize findings into:

- Severity:
  - blocker: prevents understanding or completion of a core flow
  - high: likely causes mistakes, abandonment, or serious confusion
  - medium: friction, ambiguity, or visual quality issue
  - low: polish, preference, or minor inconsistency
- Confidence:
  - high: clearly visible in screenshots or repeated by reviewers
  - medium: plausible but needs interactive confirmation
  - low: speculative or based on limited screenshot evidence

The synthesis should not inflate severity just because a reviewer used strong language. It should look for user impact and repeated evidence.

## Review Folder Handling

The workflow must:

- Ignore `synthesis/` when reading reviews.
- Ignore hidden/system files.
- Tolerate incomplete review folders if they include useful notes.
- Clearly list skipped review folders and why.
- Avoid mixing one reviewer’s notes into another reviewer’s folder.
- Preserve all raw review subfolders unchanged.

## Optional Machine-Readable Output

If practical, generate `synthesis/finding-index.json` with:

- finding id
- title
- category
- severity
- confidence
- affected screenshots
- affected tours
- reviewers who mentioned it
- short evidence summary
- recommended action
- needs interactive confirmation boolean

This is helpful for later automation and cross-date comparison, but Markdown output is the primary human artifact.

## Proposed Fix Packet Guidance

The synthesis may write `synthesis/proposed-fix-packets.md`, but it must not create implementation packets automatically unless explicitly authorized.

Proposed fix packets should be grouped by coherent UI problem, not by reviewer. For example:

- "Clarify mode-selection transition and current task state"
- "Reduce truth table instruction density and replace repeated text with icons/tooltips"
- "Improve GAS submission loading/error states"
- "Make Java predicate aliases more legible without hiding predicate meaning"

Each proposed packet should include:

- problem evidence
- affected screenshots/tours
- suggested scope
- non-goals
- likely files or UI areas if known from screenshot labels only
- validation idea

## Validation Requirements

- Run synthesis against a sample or freshly generated Plan 26 capture folder.
- Confirm synthesis output is written under the capture folder.
- Confirm raw review folders are not modified.
- Confirm repeated findings are grouped.
- Confirm skipped/incomplete review folders are reported.
- Confirm screenshot references remain valid.

If no real blind reviews exist yet, create a tiny local fixture under a test or temp path rather than fabricating real reviewer output in the main capture folder.

## Commands

Use actual project commands after implementation. Expected examples:

```powershell
npm run synthesize:ui-reviews -- --capture local/ui-reviews/<timestamp>
npm test
```

If the project uses a console app from Plan 25 to launch tools, document how synthesis can be triggered from there too, without making the console the only path.

## Required Output

Final response from the implementing agent must include:

- synthesis command added
- input capture folder or fixture used for validation
- synthesis artifacts created
- review folders included/skipped
- files changed
- commands run and results
- limitations of the synthesis
- whether the workflow is ready for repeated multi-provider reviews

## Stop Conditions

Stop and report if:

- Plan 26 output contract is missing or incompatible
- review folders do not contain enough information to synthesize without inventing findings
- synthesis would require reading source code to explain issues
- generated synthesis would overwrite raw reviews
- the workflow cannot distinguish reviewer consensus from one-off opinions
- proposed fix packets would require product decisions outside the evidence
