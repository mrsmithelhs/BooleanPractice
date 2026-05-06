# Plan 17 Progress Report

## Summary Of Work Completed

- Added a curated simplification challenge bank in `src/simplification/index.js` using simplification-ready catalog entries.
- Built a shared simplification checker that parses student guesses, compares them to the original with the existing truth-table/Venn proof contracts, and reports whether the guess is equivalent and simpler by AST node count.
- Added a new `SimplificationPractice.vue` component so students can type a guess, check it, switch proof modes, and inspect counterexamples or complexity results.
- Wired simplification mode into the app shell and mode picker in `ui/App.vue`.
- Extended the catalog with a dedicated simplification list helper and added validation/tests for valid guesses, longer equivalent guesses, invalid syntax, and non-equivalent guesses.
- Updated architecture and testing docs to record the simplification contract.

## Files Changed

- `src/catalog/index.js`
- `src/equivalence/index.js`
- `src/index.js`
- `src/simplification/index.js`
- `ui/App.vue`
- `ui/components/SimplificationPractice.vue`
- `ui/style.css`
- `tests/app-shell.test.js`
- `tests/e2e/smoke.spec.js`
- `tests/simplification.test.js`
- `tests/simplification-practice.test.js`
- `docs/architecture.md`
- `docs/testing.md`

## Artifacts Produced

- Shared simplification challenge and checking helper
- New simplification practice UI
- Updated browser smoke coverage for simplification mode
- This progress report

## Commands Run And Results

- `npm test` - passed
- `npm run lint` - passed
- `npm run build` - passed
- `npm run test:e2e` - passed

## Approval Gates Honored

- No canonical minimizer was added.
- No new grammar was added.
- No Java predicate equivalences were added.
- The app does not claim the “simplest possible” form.

## Stop Conditions Encountered

- None.

## Remaining Risks Or Follow-Ups

- The simplification metric is intentionally lightweight (AST node count). That keeps the packet bounded, but future work will need a more formal cost model if the product wants stronger claims about “simpler.”
- The simplification bank is curated rather than generated, which keeps the behavior predictable and testable for now.

## Ready For Integration

- yes
