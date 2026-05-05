# Plan 10: Robust Test Suite

## Packet Metadata

- Packet id: 10
- Packet title: Robust Test Suite
- Status: ready
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

- Expand parser/evaluator tests with invalid syntax, precedence, literals, and variable edge cases.
- Add property-style or table-driven tests comparing truth table and Venn region outputs.
- Test catalog filtering and concept progression.
- Test truth table and Venn components for common student interactions.
- Add Playwright flows for selecting a problem, completing truth table practice, completing Venn practice, keyboard operation, and mobile layout.
- Document standard validation commands in `docs/testing.md`.

## Validation Checklist

- [ ] Core logic tests cover success and failure cases.
- [ ] Three-input Venn tests exist.
- [ ] Component tests cover learning feedback.
- [ ] Playwright covers meaningful workflows.
- [ ] Testing docs list local commands and expectations.
