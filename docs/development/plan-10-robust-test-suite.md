# Plan 10: Robust Test Suite

## Packet Metadata

- Packet id: 10
- Packet title: Robust Test Suite
- Status: complete
- Owner/model: Codex mini or stronger; browser-capable model recommended
- Date: 2026-05-05
- Packet type: testing, integration, browser validation
- Mutation level: tests, docs, source-code only for small testability improvements
- Approval gate: before broad source refactors
- Expected artifacts: expanded unit/integration/E2E tests and testing documentation
- Progress report folder: `reports/development/plan-10-robust-test-suite/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: turn the test suite into a real safety net, not just smoke coverage.
- Non-goals: do not add product features.
- Depends on: Plans 03 through 09.
- Blocks: deployment confidence.
- Why this packet exists: boolean practice software needs high trust because a wrong answer key teaches the wrong lesson.

## Implementation Requirements

- Expand parser/evaluator tests with invalid syntax, precedence, literals, whitespace, trailing tokens, and variable edge cases.
- Add property-style or table-driven tests comparing truth table and Venn region outputs against the shared evaluator.
- Test catalog filtering, supported modes, and concept progression without mutating source records.
- Test truth table and Venn components for common student interactions, including accessible feedback and fixed-cell behavior.
- Add Playwright flows for selecting a problem, completing truth table practice, completing Venn practice, keyboard operation, mobile layout, and GitHub Pages-style routing/base-path assumptions.
- Document standard validation commands in `docs/testing.md`.
- Keep the suite focused on behavior, not implementation details, so later refactors remain possible.

## Required Behavior

- The suite should detect disagreements between truth table and Venn outputs.
- The suite should cover at least one representative flow for each major user path.
- Test names should make it obvious which behavior failed.

## Stop Conditions

- If a test requires changing source behavior, stop and confirm whether the behavior should change or the test should be rewritten.
- If browser tests need additional provisioning, record that explicitly instead of silently weakening the coverage claim.

## Validation Checklist

- [ ] Core logic tests cover success and failure cases.
- [ ] Three-input Venn tests exist.
- [ ] Component tests cover learning feedback.
- [ ] Playwright covers meaningful workflows.
- [ ] Testing docs list local commands and expectations.
- [ ] Truth table and Venn equivalence is tested for representative expressions.
- [ ] Base-path behavior is covered where routing or deployment depends on it.
