---
id: plan-21
title: "Sheets Assignment Mode"
status: complete
depends_on: [plan-20]
gate: "required before live Sheet migration, GAS push, or production classroom use"
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "let teachers define assignment sequences in Sheets and let students complete assigned expression challenges through the GAS output."
---
# Plan 21: Sheets Assignment Mode

## Packet Metadata

- Packet id: 21
- Packet title: Sheets Assignment Mode
- Status: (see frontmatter)
- Owner/model: Codex mini or stronger; stronger model recommended for data model design
- Date: 2026-05-06
- Packet type: implementation, GAS, data, pedagogy, tests, docs
- Mutation level: source-code, tests, docs, generated-local
- Approval gate: required before live Sheet migration, GAS push, or production classroom use
- Expected artifacts: Sheets layout, assignment loading, completion writing, tests, docs, progress report
- Progress report folder: `reports/development/plan-21-sheets-assignment-mode/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: let teachers define assignment sequences in Sheets and let students complete assigned expression challenges through the GAS output.
- Non-goals: do not build a teacher UI and do not implement adaptive assignment yet.
- Depends on: Plan 20.
- Blocks: Plan 22 adaptive assignment algorithm.
- Why this packet exists: teachers need a classroom workflow before the system can become adaptive or assignment-aware.

## Scope

In scope:

- Design a Sheets layout for assignments, assignment items, submissions, and optional roster/class metadata.
- Load teacher-authored sequences from Sheets.
- Support truth table, Venn, and equivalence challenge assignment types if those modes exist.
- Record completion summaries and optionally attempt summaries if already supported.
- Add docs for manually authoring assignments in Sheets.

Out of scope:

- Do not build a teacher-facing app UI.
- Do not implement random/adaptive assignment selection yet.
- Do not run live Sheet migration or `clasp push`.

## Implementation Requirements

- Store student email plus optional roster fields if available.
- Keep assignment definitions readable/editable by teachers in Sheets.
- Include stable assignment ids and challenge ids.
- Validate Sheet rows before serving them to students.
- Provide tests using mock Sheets data.

## Validation Checklist

- [ ] Sheet schema is documented.
- [ ] Mock assignment loading works.
- [ ] Completion writing shape is tested.
- [ ] Invalid assignment rows fail safely.
- [ ] Future teacher UI is noted in `docs/future-development-ideas.md`.

## Stop Conditions

Stop if the assignment design requires adaptive selection; defer that to Plan 22.

