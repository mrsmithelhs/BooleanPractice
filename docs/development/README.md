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
| [Plan 23](plan-23-java-predicate-atoms.md) | ready | Add pre-authored numeric predicate atoms while preserving readable UI. |
| [Plan 24](plan-24-relational-equivalence-knowledge-graph.md) | ready | Scope numeric relational equivalences such as `!(x > 10)` and `x <= 10`. |
| [Plan 25](plan-25-local-dev-console.md) | ready | Add a human-facing local dev console for the editable dev server and preview workflow. |
| [Plan 26](plan-26-ui-tour-capture-blind-review-workflow.md) | ready | Capture Playwright UI tours into local-only folders for blind UI review. |
| [Plan 27](plan-27-ui-review-synthesis-workflow.md) | ready | Synthesize multiple blind UI reviews into prioritized UI triage. |
| [Plan 28](plan-28-practice-first-information-architecture.md) | ready | Reduce first-load density and make the active practice workspace primary. |
| [Plan 29](plan-29-interactive-visual-venn-diagrams.md) | ready | Replace region-grid-only Venn practice with actual interactive visual Venn diagrams. |
| [Plan 30](plan-30-student-facing-copy-feedback-and-submission-polish.md) | ready | Polish student-facing labels, progress, affordances, feedback, and submission states. |
| [Plan 31](plan-31-svg-first-interactive-venn-regions-with-optional-detailed-labels.md) | ready | Make detailed Venn labels optional while using SVG region geometry as the interaction surface. |

## Suggested Execution Order

Plans 01 through 11 establish the migrated static app. Plans 12 through 19 deepen standalone learning and interaction. Plans 20 and 21 add the optional GAS/Sheets classroom surface. Plan 22 should design and prove adaptive assignment before implementation. Plans 23 and 24 connect the app to AP CSA numeric predicate and comparison reasoning. Plan 25 adds a human-facing local development console for the editable dev server and preview workflow. Plans 26 and 27 add a reusable blind UI review workflow: first capturing coherent UI tours as local-only screenshot packets, then synthesizing reviews from multiple model providers. Plans 28 through 31 are follow-up UI quality packets derived from the first blind review batch: reduce density, make Venn diagrams genuinely visual, polish student-facing copy/states, and make Venn labels optional while preserving interactive SVG regions.

Plans 02 through 11 now carry explicit required-behavior, stop-condition, and validation language to reduce drift. Treat those sections as part of the contract, not optional guidance.

Plans 03, 05, 07, 08, 10, 11, 16, 17, 20, 21, 22, 23, 24, 26, 27, 28, 29, and 31 are the highest correctness-risk packets. Use a stronger model or closer integration-owner review if those packets expose ambiguity in boolean semantics, Venn representation, feedback behavior, deployment assumptions, GAS identity, assignment data, AP CSA predicate presentation, numeric relational equivalence rules, blind-review workflow integrity, practice-first information architecture, or visual Venn region mapping.

## Cross-Packet Contracts

- The archive remains a reference, not the implementation target.
- `src/` owns boolean semantics; Vue components consume it.
- Truth table and Venn modes must agree for the same expression and assignments.
- Venn mode must support one, two, and three variables.
- Tests should protect parser behavior, expression evaluation, problem progression, UI workflows, accessibility, and GitHub Pages deployment assumptions.
- The app must work as static assets with no Google Apps Script runtime.
- Optional GAS output should be built from shared source as much as practical, not maintained as a separate app by hand.
- GAS behavior must be locally simulatable, including `google.script.run` delay and failure behavior.
- Numeric predicate atoms must preserve the pedagogical connection to real AP CSA conditions while keeping tables and diagrams readable.
- The local dev console, when implemented, should be documented as a human-facing maintainer tool with explicit local port conventions rather than as an agent-only workflow.
- UI tour capture artifacts belong in local-only ignored folders, not tracked source.
- The reusable capture workflow is documented in [`docs/ui-tour-capture.md`](../ui-tour-capture.md) and should be extended there rather than pointing future review batches back at the packet document.
- UI review synthesis artifacts belong in the same capture folder under `synthesis/`, and the reusable synthesis workflow is documented in [`docs/ui-review-synthesis.md`](../ui-review-synthesis.md).
- Blind UI review agents must be constrained to screenshots and tour metadata, not source code or project docs outside the capture folder.
- UI review synthesis should preserve reviewer disagreement and raw notes while identifying repeated patterns and prioritized follow-up work.
- First-load and in-practice UI should prioritize the active student workspace over metadata, hints, history, and implementation detail.
- Venn mode should be spatially visual, with region-grid/textual representations treated as support or fallback rather than the only diagram.
- Detailed Venn region labels should be optional by default, while the basic circle identifiers remain visible and the regions stay accessible.
- Student-facing submission states must not expose raw GAS implementation errors; diagnostics should stay in developer surfaces.
