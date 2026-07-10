# Development Packet Sequence

This sequence migrates Boolean Practice from the archived Google Apps Script format into a modern compiled static Vue app deployable on GitHub Pages.

## Packet Index

<!-- plan-index:begin -->
| id | title | status | summary |
|---|---|---|---|
| `plan-01` | Repository Bootstrap | complete | create the modern local development foundation for a compiled static Vue app. |
| `plan-02` | Archive Inventory And Product Spec | complete | turn archive observations into durable product, pedagogy, and architecture contracts. |
| `plan-03` | Parser And Evaluator Core | complete | create the tested boolean semantics engine used by every practice mode. |
| `plan-04` | Problem Catalog And Progression | complete | replace the flat archive problem list with a sequenced catalog aligned to AP CSA boolean reasoning. |
| `plan-05` | Venn Region Engine With Three Inputs | complete | make Venn mode a tested representation of boolean assignments for one, two, and three variables. |
| `plan-06` | Vue App Shell And State | complete | create the usable first-screen app structure that hosts practice modes. |
| `plan-07` | Truth Table Learning UI | complete | rebuild truth table practice with better feedback and accessible interaction. |
| `plan-08` | Venn Learning UI | complete | rebuild Venn practice on top of the tested region engine, including three-input expressions. |
| `plan-09` | Visual Upgrade And Accessibility Polish | complete | give the migrated app a significant visual upgrade while preserving classroom clarity. |
| `plan-10` | Robust Test Suite | complete | turn the test suite into a real safety net, not just smoke coverage. |
| `plan-11` | GitHub Pages Deployment | complete | make the app easy to promote to GitHub Pages after it is pushed. |
| `plan-12` | Hint Ladder And Attempt Feedback | complete | help students recover from mistakes with targeted hints that appear after attempts instead of immediately giving away answers. |
| `plan-13` | Problem Review Summary | complete | give students a short, useful summary after completing a problem. |
| `plan-14` | Cross-Representation Comparison | complete | let students see that truth table rows and Venn regions are the same assignments represented differently. |
| `plan-15` | Expanded Catalog And Variety | complete | make practice feel varied while preserving a clear progression of boolean concepts. |
| `plan-16` | Expression Equivalence Mode | complete | ask students whether two expressions are logically equivalent, then let them prove it by comparing truth tables or Venn diagrams. |
| `plan-17` | Simplification Guess Mode | complete | ask students to propose a simpler expression, then prove whether the guess is equivalent to the original. |
| `plan-18` | Bulk Fill And Copy Controls | complete | reduce tedious repeated clicking without hiding the reasoning task. |
| `plan-19` | Session Memory For Known Subexpressions | complete | remember subexpressions a student has solved correctly in the current session and optionally auto-fill them after enough repetitions. |
| `plan-20` | GAS Web App Submission Output | complete | add an optional GAS web app output that serves a GAS-friendly build and records submissions to a Google Sheet. |
| `plan-21` | Sheets Assignment Mode | complete | let teachers define assignment sequences in Sheets and let students complete assigned expression challenges through the GAS output. |
| `plan-22` | Adaptive Assignment Algorithm Design | complete | sharply define and test an adaptive assignment algorithm before implementing it in classroom mode. |
| `plan-23` | Java Predicate Atoms | complete | let catalog problems use boolean-valued numeric predicates, such as `x > 10` or `count == 0`, as meaningful atoms in larger boolean expressions. |
| `plan-24` | Numeric Relational Equivalence Knowledge Graph | complete | teach and recognize equivalences involving negated numeric comparisons, such as `!(x > 10)` and `x <= 10`. |
| `plan-25` | Local Dev Console And Port-Control Workflow | complete | create a human-facing local development console for Boolean Practice that makes the editable dev server easy to start, stop, restart, inspect, and open from one place. |
| `plan-26` | UI Tour Capture And Blind Review Workflow | complete | create a repeatable workflow that captures coherent UI tours as screenshots and packages them for blind review by fresh agents that must not inspect the codebase. |
| `plan-27` | UI Review Synthesis Workflow | complete | synthesize multiple blind UI reviews from a Plan 26 capture folder into a prioritized triage report. |
| `plan-28` | Practice-First Information Architecture And Density Reduction | complete | reduce the app's opening information density so the student sees a learning workspace first, not a dashboard of metadata. |
| `plan-29` | Interactive Visual Venn Diagrams | complete | make Venn mode use actual visual Venn diagrams with clickable shaded regions while preserving the tested region engine. |
| `plan-30` | Student-Facing Copy, Feedback, Progress, And Submission Polish | complete | fix the smaller but repeated UI issues from blind review that make the app feel implementation-facing, ambiguous, or unfinished. |
| `plan-31` | SVG-First Interactive Venn Regions With Optional Detailed Labels | complete | make the Venn experience feel like a real interactive diagram where the regions themselves are the controls, while keeping the canonical region engine and accessibility intact. |
| `plan-32` | Bootstrap Consumer Baseline And Adoption Manifest | complete | make Boolean Practice explicitly tracked as a Bootstrap consumer by auditing current capability presence and recording intended adoption decisions. |
| `plan-33` | Bootstrap Packet Status And Frontmatter Migration | complete | adopt Bootstrap's machine-checkable packet status system and migrate the existing Boolean Practice packet corpus to YAML frontmatter without losing packet history. |
| `plan-34` | Bootstrap Agent Guides, Starting Prompts, And Decision Records | complete | adopt Bootstrap's canonical agent entry points and role-specific starting prompts, customized for Boolean Practice. |
| `plan-35` | Bootstrap Dev Console Hub Alignment | complete | upgrade the existing local dev console toward Bootstrap's recommended `dev-console-hub` pattern. |
| `plan-36` | Bootstrap Tracked Consumer Verification And Sync Runbook | complete | verify Boolean Practice now behaves as a tracked Bootstrap consumer and document how future Bootstrap sync checks should be run. |
<!-- plan-index:end -->

## Suggested Execution Order

Plans 01 through 11 establish the migrated static app. Plans 12 through 19 deepen standalone learning and interaction. Plans 20 and 21 add the optional GAS/Sheets classroom surface. Plan 22 should design and prove adaptive assignment before implementation. Plans 23 and 24 connect the app to AP CSA numeric predicate and comparison reasoning. Plan 25 adds a human-facing local development console for the editable dev server and preview workflow. Plans 26 and 27 add a reusable blind UI review workflow: first capturing coherent UI tours as local-only screenshot packets, then synthesizing reviews from multiple model providers. Plans 28 through 31 are follow-up UI quality packets derived from the first blind review batch: reduce density, make Venn diagrams genuinely visual, polish student-facing copy/states, and make Venn labels optional while preserving interactive SVG regions. Plans 32 through 36 upgrade this repo into a tracked consumer of the Bootstrap project without copying Bootstrap's own self-maintenance backlog.

Plans 02 through 11 now carry explicit required-behavior, stop-condition, and validation language to reduce drift. Treat those sections as part of the contract, not optional guidance.

Plans 03, 05, 07, 08, 10, 11, 16, 17, 20, 21, 22, 23, 24, 26, 27, 28, 29, 31, 32, 33, 34, and 36 are the highest correctness-risk packets. Use a stronger model or closer integration-owner review if those packets expose ambiguity in boolean semantics, Venn representation, feedback behavior, deployment assumptions, GAS identity, assignment data, AP CSA predicate presentation, numeric relational equivalence rules, blind-review workflow integrity, practice-first information architecture, visual Venn region mapping, Bootstrap capability adoption, packet status migration, agent operating contracts, or Bootstrap sync verification.

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
- Bootstrap consumer adoption must be tracked through `.bootstrap-adoption.json`; Bootstrap's own audit tooling remains in the Bootstrap repo and is run against this repo, not vendored here.
- Bootstrap's own live packets, reports, sync tooling, and `docs/bootstrap-dev/` content must not be copied into this repo.
- Once Bootstrap packet-status tooling is adopted, packet frontmatter becomes the status source of truth and the README index should be generated rather than hand-maintained.
