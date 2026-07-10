---
id: plan-13
title: "Problem Review Summary"
status: complete
depends_on: [plan-01, plan-02, plan-03, plan-04, plan-05, plan-06, plan-07, plan-08, plan-09, plan-10, plan-11, plan-12]
gate: "before adding persisted progress or teacher reporting"
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "give students a short, useful summary after completing a problem."
---
# Plan 13: Problem Review Summary

## Packet Metadata

- Packet id: 13
- Packet title: Problem Review Summary
- Status: (see frontmatter)
- Owner/model: Codex mini or stronger
- Date: 2026-05-06
- Packet type: implementation, pedagogy, frontend, tests
- Mutation level: source-code, tests, docs
- Approval gate: before adding persisted progress or teacher reporting
- Expected artifacts: end-of-problem summary, next-practice suggestion, tests, progress report
- Progress report folder: `reports/development/plan-13-problem-review-summary/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: give students a short, useful summary after completing a problem.
- Non-goals: do not add accounts, grades, GAS submissions, or adaptive assignment.
- Depends on: Plan 12 preferred; Plans 01-11 required.
- Blocks: Plan 19 session memory and later assignment analytics.
- Why this packet exists: students benefit from knowing what pattern they practiced and what to practice next, not just that a problem is over.

## Scope

In scope:

- Show concept tags practiced by the problem.
- Summarize attempts, hints used, and final correctness.
- Identify missed rows/regions once the problem is complete.
- Suggest one next practice target based on concept metadata and mistakes.
- Add tests for summary generation.

Out of scope:

- Do not persist summaries across browser sessions.
- Do not send data to Sheets.
- Do not build adaptive assignment yet.

## Implementation Requirements

- Summary must work for truth table and Venn modes.
- Summary should include one concise next step, such as "Practice another compound negation" or "Try a three-variable OR problem."
- If no meaningful mistake data exists, show a neutral completion summary.
- Use concept tags from the catalog when available.

## Validation Checklist

- [ ] Summary appears after completion.
- [ ] Summary uses catalog concept tags.
- [ ] Summary reflects hints/attempts without overexplaining.
- [ ] Tests cover correct-first-try and corrected-after-errors paths.

## Stop Conditions

Stop if next-practice suggestions require a real adaptive algorithm; record the need for Plan 22 instead.

