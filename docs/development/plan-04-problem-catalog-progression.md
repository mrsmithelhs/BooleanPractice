# Plan 04: Problem Catalog And Progression

## Packet Metadata

- Packet id: 04
- Packet title: Problem Catalog And Progression
- Status: ready
- Owner/model: Codex mini or stronger
- Date: 2026-05-05
- Packet type: implementation, pedagogy, tests
- Mutation level: source-code, tests, docs
- Approval gate: before adding non-boolean Java comparison syntax
- Expected artifacts: problem catalog module, progression metadata, catalog validation tests
- Progress report folder: `reports/development/plan-04-problem-catalog-progression/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: replace the flat archive problem list with a sequenced catalog aligned to AP CSA boolean reasoning.
- Non-goals: do not add accounts, persistence, or adaptive scoring.
- Depends on: Plan 03.
- Blocks: app shell and practice UIs.
- Why this packet exists: difficulty should reflect cognitive demand, not just expression length.

## Implementation Requirements

- Organize problems by concept: literals, single operator, precedence, parentheses, De Morgan, equivalence patterns, and three-variable reasoning.
- Mark supported modes per problem instead of mutating problem type at runtime.
- Include metadata for variables, difficulty, concept tags, hints, and expected modes.
- Validate every expression against the parser.
- Include both truth table and Venn-compatible problems, including three-variable Venn examples.

## Validation Checklist

- [ ] Every catalog expression parses.
- [ ] Supported modes are explicit.
- [ ] Three-variable problems exist.
- [ ] Tests protect catalog validity and filtering behavior.
