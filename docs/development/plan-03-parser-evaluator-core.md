# Plan 03: Parser And Evaluator Core

## Packet Metadata

- Packet id: 03
- Packet title: Parser And Evaluator Core
- Status: complete
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

- Support variables, `true`, `false`, `!`, `&&`, `||`, and parentheses only.
- Ignore insignificant whitespace.
- Preserve precedence exactly as `!` before `&&` before `||`, with parentheses overriding precedence.
- Reject malformed expressions, unsupported tokens, and trailing tokens with useful errors.
- Produce stable AST formatting for subexpression display so later packets can render the same structure deterministically.
- Extract variables into a stable ordering for truth tables and Venn regions. Use one documented ordering everywhere.
- Generate truth table rows for one, two, and three variables from the shared evaluator, not a separate evaluation path.
- Keep parser, AST, and evaluator logic framework-agnostic and free of Vue or DOM dependencies.
- Include tests for precedence, parentheses, negation, boolean literals, malformed input, trailing tokens, whitespace, variable extraction, AST formatting, and truth table output.
- Include a regression test that truth-table row results match direct AST evaluation for representative assignments.

## Required Behavior

- A valid parse should consume the entire input.
- Evaluation should return booleans only.
- Formatting should be derived from the AST, not by reparsing formatted strings.
- Any future grammar extension must stop for approval before being added here.

## Stop Conditions

- If the product spec and archive disagree about grammar or boolean semantics, stop and report before coding.
- If non-boolean comparison syntax is requested, do not add it in this packet.

## Validation Checklist

- [ ] Unit tests cover parser success and failure cases.
- [ ] Truth table generation is deterministic.
- [ ] Parser and evaluator are independent of Vue.
- [ ] Variable ordering is stable and shared with later packets.
- [ ] Trailing tokens and unsupported syntax are rejected.
- [ ] `npm test` passes.
