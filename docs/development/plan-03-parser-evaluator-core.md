# Plan 03: Parser And Evaluator Core

## Packet Metadata

- Packet id: 03
- Packet title: Parser And Evaluator Core
- Status: ready
- Owner/model: Codex mini or stronger
- Date: 2026-05-05
- Packet type: implementation, core logic, tests
- Mutation level: source-code, tests
- Approval gate: before changing the documented grammar
- Expected artifacts: parser/evaluator modules, AST formatting, truth table generation, rigorous unit tests
- Progress report folder: `reports/development/plan-03-parser-evaluator-core/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: create the tested boolean semantics engine used by every practice mode.
- Non-goals: do not build Vue UI or Venn rendering.
- Depends on: Plans 01 and 02.
- Blocks: problem catalog, truth table UI, Venn engine, and E2E confidence.
- Why this packet exists: the archive mixes duplicated parser logic into the UI, which makes correctness fragile.

## Implementation Requirements

- Support variables, `true`, `false`, `!`, `&&`, `||`, and parentheses.
- Preserve precedence: `!` before `&&` before `||`.
- Reject malformed expressions and trailing tokens with useful errors.
- Produce stable AST formatting for subexpression display.
- Generate truth table rows for one, two, and three variables.
- Include tests for precedence, parentheses, negation, boolean literals, malformed input, variable extraction, and truth table output.

## Validation Checklist

- [ ] Unit tests cover parser success and failure cases.
- [ ] Truth table generation is deterministic.
- [ ] Parser and evaluator are independent of Vue.
- [ ] `npm test` passes.
