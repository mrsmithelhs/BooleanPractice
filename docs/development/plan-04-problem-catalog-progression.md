# Plan 04: Problem Catalog And Progression

## Packet Metadata

- Packet id: 04
- Packet title: Problem Catalog And Progression
- Status: complete
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

- Organize problems by concept in a visible progression: literals, single operator, precedence, parentheses, De Morgan, equivalence patterns, and three-variable reasoning.
- Mark supported modes per problem instead of mutating problem type at runtime.
- Include metadata for variables, difficulty, concept tags, hints, expected modes, and a stable problem identifier.
- Validate every expression against the parser from Plan 03 before the catalog is accepted.
- Include both truth table and Venn-compatible problems, including three-variable Venn examples.
- Keep problem text, hints, and mode support aligned so a problem cannot be selected into an unsupported mode.
- Ensure the catalog can be filtered without mutating the underlying problem records.

## Required Behavior

- Every catalog entry must explicitly declare supported modes.
- The catalog must have a predictable sort order so the UI and tests do not infer a hidden progression.
- If a problem has multiple modes, the supported modes should be declared once in the catalog entry rather than derived later.
- Mode or difficulty filtering should return new lists and leave catalog records unchanged.

## Stop Conditions

- If the existing archive problem list cannot support a concept bucket without adding new semantics, stop and report instead of inventing a workaround.
- If a new problem would require non-boolean comparison syntax, defer it to a later packet.

## Validation Checklist

- [ ] Every catalog expression parses.
- [ ] Supported modes are explicit.
- [ ] Three-variable problems exist.
- [ ] Tests protect catalog validity and filtering behavior.
- [ ] Filtering leaves source catalog records unchanged.
- [ ] Unsupported mode selection is impossible from catalog data alone.
