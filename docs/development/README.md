# Development Packet Sequence

This sequence migrates Boolean Practice from the archived Google Apps Script format into a modern compiled static Vue app deployable on GitHub Pages.

## Packet Index

| Packet | Status | Purpose |
| --- | --- | --- |
| [Plan 01](plan-01-repository-bootstrap.md) | ready | Initialize package, Vite/Vue, testing, linting, CI skeleton, and Pages-aware build plumbing. |
| [Plan 02](plan-02-archive-inventory-product-spec.md) | ready | Convert archive findings into a concise product, pedagogy, and technical spec. |
| [Plan 03](plan-03-parser-evaluator-core.md) | ready | Build tested parser, AST formatter, evaluator, truth table generation, and expression validation. |
| [Plan 04](plan-04-problem-catalog-progression.md) | ready | Create a pedagogically sequenced problem catalog with AP CSA-friendly progression. |
| [Plan 05](plan-05-venn-region-engine-three-input.md) | ready | Implement one-, two-, and three-variable Venn/set region logic independent of rendering. |
| [Plan 06](plan-06-vue-app-shell-state.md) | ready | Create the Vue app shell, state model, mode flow, and static routing/base-path behavior. |
| [Plan 07](plan-07-truth-table-learning-ui.md) | ready | Build the truth table practice UI with step reveal, feedback, and accessibility. |
| [Plan 08](plan-08-venn-learning-ui.md) | ready | Build the Venn practice UI, including three-input support and keyboard-accessible region selection. |
| [Plan 09](plan-09-visual-upgrade-accessibility.md) | ready | Apply a cohesive visual design upgrade and responsive accessibility polish. |
| [Plan 10](plan-10-robust-test-suite.md) | ready | Expand unit, integration, accessibility, and E2E coverage beyond smoke tests. |
| [Plan 11](plan-11-github-pages-deployment.md) | ready | Add GitHub Pages workflow, deployment docs, and final release confidence checks. |
| [Plan 12](plan-12-learning-upgrades-review.md) | draft | Add optional learning enhancements after the migration base is stable. |

## Suggested Execution Order

Run Plans 01 through 11 in order. Plan 12 should wait until the migrated app is locally stable and visually coherent.

Plans 03, 05, 07, 08, and 10 are the highest correctness-risk packets. Use a stronger model or closer integration-owner review if those packets expose ambiguity in boolean semantics, Venn representation, or feedback behavior.

## Cross-Packet Contracts

- The archive remains a reference, not the implementation target.
- `src/` owns boolean semantics; Vue components consume it.
- Truth table and Venn modes must agree for the same expression and assignments.
- Venn mode must support one, two, and three variables.
- Tests should protect parser behavior, expression evaluation, problem progression, UI workflows, accessibility, and GitHub Pages deployment assumptions.
- The app must work as static assets with no Google Apps Script runtime.

