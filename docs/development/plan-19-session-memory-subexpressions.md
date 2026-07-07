# Plan 19: Session Memory For Known Subexpressions

## Packet Metadata

- Packet id: 19
- Packet title: Session Memory For Known Subexpressions
- Status: complete
- Owner/model: Codex mini or stronger
- Date: 2026-05-06
- Packet type: implementation, pedagogy, frontend, tests
- Mutation level: source-code, tests, docs
- Approval gate: before using localStorage, server persistence, or logical-equivalence keys
- Expected artifacts: sessionStorage memory, automation threshold config, UI state, tests, progress report
- Progress report folder: `reports/development/plan-19-session-memory-subexpressions/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: remember subexpressions a student has solved correctly in the current session and optionally auto-fill them after enough repetitions.
- Non-goals: do not persist across browser sessions and do not key by logical equivalence.
- Depends on: Plans 13, 15, and 18 preferred.
- Blocks: later assignment and adaptive practice analytics.
- Why this packet exists: after a student demonstrates fluency with a subexpression, repeated rebuilding can become friction rather than learning.

## Scope

In scope:

- Use `sessionStorage`.
- Key memory by normalized expression, mode, and variable set, not by logical equivalence.
- Store successful solve count and answer payload.
- Add an easily changed automation threshold, such as `AUTOMATION_THRESHOLD`.
- Auto-fill or offer autofill only after the threshold is met.
- Show that a value was remembered and allow manual retry/reset.

Out of scope:

- Do not use localStorage.
- Do not sync across devices.
- Do not recognize `a && b` and `b && a` as the same unless the normalized expression already does so structurally.

## Implementation Requirements

- Default threshold should favor learning over minimum friction; use 2 or 3 unless docs specify otherwise.
- Store only educational state, not student identity.
- Support truth table and Venn outputs.
- Add tests for threshold behavior, key construction, stale/malformed storage, and manual override.

## Validation Checklist

- [ ] Memory uses sessionStorage only.
- [ ] Normalized expression keys are deterministic.
- [ ] Logical-equivalent but structurally different expressions are not merged.
- [ ] Autofill threshold is configurable.
- [ ] UI indicates remembered/autofilled state.

## Stop Conditions

Stop if useful memory behavior requires equivalence-class matching; defer that to a later packet.

