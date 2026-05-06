# Development Packet Sequence

This sequence migrates Boolean Practice from the archived Google Apps Script format into a modern compiled static Vue app deployable on GitHub Pages.

## Packet Index

| Packet                                               | Status | Purpose                                                                                             |
| ---------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| [Plan 01](plan-01-repository-bootstrap.md)           | ready  | Initialize package, Vite/Vue, testing, linting, CI skeleton, and Pages-aware build plumbing.        |
| [Plan 02](plan-02-archive-inventory-product-spec.md) | ready  | Convert archive findings into a concise product, pedagogy, and technical spec.                      |
| [Plan 03](plan-03-parser-evaluator-core.md)          | ready  | Build tested parser, AST formatter, evaluator, truth table generation, and expression validation.   |
| [Plan 04](plan-04-problem-catalog-progression.md)    | ready  | Create a pedagogically sequenced problem catalog with AP CSA-friendly progression.                  |
| [Plan 05](plan-05-venn-region-engine-three-input.md) | ready  | Implement one-, two-, and three-variable Venn/set region logic independent of rendering.            |
| [Plan 06](plan-06-vue-app-shell-state.md)            | ready  | Create the Vue app shell, state model, mode flow, and static routing/base-path behavior.            |
| [Plan 07](plan-07-truth-table-learning-ui.md)        | ready  | Build the truth table practice UI with step reveal, feedback, and accessibility.                    |
| [Plan 08](plan-08-venn-learning-ui.md)               | ready  | Build the Venn practice UI, including three-input support and keyboard-accessible region selection. |
| [Plan 09](plan-09-visual-upgrade-accessibility.md)   | ready  | Apply a cohesive visual design upgrade and responsive accessibility polish.                         |
| [Plan 10](plan-10-robust-test-suite.md)              | ready  | Expand unit, integration, accessibility, and E2E coverage beyond smoke tests.                       |
| [Plan 11](plan-11-github-pages-deployment.md)        | ready  | Add GitHub Pages workflow, deployment docs, and final release confidence checks.                    |
| [Plan 12](plan-12-hint-ladder-attempt-feedback.md) | ready | Add attempt-aware hints that help students recover from mistakes. |
| [Plan 13](plan-13-problem-review-summary.md) | ready | Add end-of-problem summaries and suggested next practice. |
| [Plan 14](plan-14-cross-representation-comparison.md) | ready | Compare truth table rows and matching Venn regions. |
| [Plan 15](plan-15-expanded-catalog-variety.md) | ready | Expand the catalog with richer boolean expressions and metadata. |
| [Plan 16](plan-16-expression-equivalence-mode.md) | ready | Add expression equivalence challenges proved by tables or diagrams. |
| [Plan 17](plan-17-simplification-guess-mode.md) | ready | Add simplification guess mode with equivalence checking. |
| [Plan 18](plan-18-bulk-fill-copy-controls.md) | ready | Add all-true/all-false/clear/copy controls for tables and diagrams. |
| [Plan 19](plan-19-session-memory-subexpressions.md) | ready | Use sessionStorage to remember mastered normalized subexpressions. |
| [Plan 20](plan-20-gas-web-app-submission-output.md) | ready | Add a shared-source GAS web app output and Sheets submissions. |
| [Plan 21](plan-21-sheets-assignment-mode.md) | ready | Add Sheets-authored assignment mode for the GAS output. |
| [Plan 22](plan-22-adaptive-assignment-algorithm-design.md) | ready | Define and prove an adaptive assignment algorithm before implementation. |
| [Plan 23](plan-23-java-predicate-atoms.md) | ready | Add pre-authored Java-style predicate atoms while preserving readable UI. |
| [Plan 24](plan-24-relational-equivalence-knowledge-graph.md) | draft | Scope relational predicate equivalences such as `!(x > 10)` and `x <= 10`. |

## Suggested Execution Order

Plans 01 through 11 establish the migrated static app. Plans 12 through 19 deepen standalone learning and interaction. Plans 20 and 21 add the optional GAS/Sheets classroom surface. Plan 22 should design and prove adaptive assignment before implementation. Plans 23 and 24 connect the app to Java-style AP CSA predicates.

Plans 02 through 11 now carry explicit required-behavior, stop-condition, and validation language to reduce drift. Treat those sections as part of the contract, not optional guidance.

Plans 03, 05, 07, 08, 10, 11, 16, 17, 20, 21, 22, and 24 are the highest correctness-risk packets. Use a stronger model or closer integration-owner review if those packets expose ambiguity in boolean semantics, Venn representation, feedback behavior, deployment assumptions, GAS identity, assignment data, or relational equivalence rules.

## Cross-Packet Contracts

- The archive remains a reference, not the implementation target.
- `src/` owns boolean semantics; Vue components consume it.
- Truth table and Venn modes must agree for the same expression and assignments.
- Venn mode must support one, two, and three variables.
- Tests should protect parser behavior, expression evaluation, problem progression, UI workflows, accessibility, and GitHub Pages deployment assumptions.
- The app must work as static assets with no Google Apps Script runtime.
- Optional GAS output should be built from shared source as much as practical, not maintained as a separate app by hand.
- GAS behavior must be locally simulatable, including `google.script.run` delay and failure behavior.
- Java predicate atoms must preserve the pedagogical connection to real AP CSA conditions while keeping tables and diagrams readable.
