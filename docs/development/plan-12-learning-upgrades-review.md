# Plan 12: Learning Upgrades Review

## Packet Metadata

- Packet id: 12
- Packet title: Learning Upgrades Review
- Status: draft
- Owner/model: Codex mini or stronger; stronger model recommended for pedagogy choices
- Date: 2026-05-05
- Packet type: pedagogy, implementation, frontend, tests
- Mutation level: source-code, tests, docs
- Approval gate: before adding persistence, scoring, or new expression syntax
- Expected artifacts: selected learning upgrades, tests, updated docs
- Progress report folder: `reports/development/plan-12-learning-upgrades-review/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: add one or more high-value learning upgrades after the migration is stable.
- Non-goals: do not destabilize MVP deployment.
- Depends on: Plans 01 through 11.
- Blocks: optional enrichment.
- Why this packet exists: once correctness and deployment are secure, the app can become more than a worksheet replacement.

## Candidate Upgrades

- Hint ladder for common mistakes.
- Expression parse tree or operator precedence visualization.
- Mode comparison: highlight truth table rows and matching Venn regions together.
- Equivalence challenges for De Morgan's laws.
- Session-only progress summary using local storage.
- AP CSA predicate translation examples, such as turning `x > 0 && y > 0` into abstract variables after the boolean core.

## Validation Checklist

- [ ] Upgrade has a clear learning goal.
- [ ] Upgrade does not confuse core boolean semantics.
- [ ] Tests cover new behavior.
- [ ] Accessibility and responsive checks pass.
- [ ] Docs explain any new concept or deferred work.
