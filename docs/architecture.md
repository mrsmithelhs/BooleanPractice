# Boolean Practice Architecture

## Overview

Boolean Practice is a static web application built with Vue 3 and Vite. It is designed to be fully portable and deployable to GitHub Pages.

## Core Module Boundaries

### 1. Shared Logic (`src/`)

This directory contains pure JavaScript logic that is independent of the UI framework. It is the single source of truth for boolean semantics.

- **`parser/`**: Tokenizes and parses boolean expressions into an Abstract Syntax Tree (AST).
- **`evaluator/`**: Evaluates an AST against a set of variable assignments.
- **`truth-table/`**: Generates full truth tables (assignments and subexpression results) from an expression.
- **`venn/`**: Maps boolean assignments to abstract region bitmasks for 1, 2, and 3 variables.
- **`catalog/`**: The curated collection of problems and their metadata.

### 2. UI App Shell (`ui/`)

Built with Vue 3, this layer handles student interaction, state management, and rendering.

- **State Management**: Reactive shell state for selected difficulty, selected mode, selected problem, visible feedback, and current placeholder step.
- **Components**: Vue components for problem selection, truth-table practice, Venn practice, expression display, and inline feedback.
- **Browser Services**: Only browser-facing concerns such as events, focus handling, and rendering should live here.

### 3. Testing Structure (`tests/`)

- **Unit Tests (`tests/*.test.js`)**: Focus on `src/` logic (parser correctness, precedence, truth table generation).
- **E2E Tests (`tests/e2e/*.spec.js`)**: Focus on student workflows (solving a problem, switching modes) using Playwright.

## Key Technical Decisions

### Boolean Source of Truth

There must be only ONE parser and evaluator used by both Truth Table and Venn modes. This ensures that the two views are always synchronized and correct.

### Static Deployment

The app has NO runtime dependencies on a backend. All problem data and logic are bundled into the static assets. GitHub Pages is the primary deployment target, so build output must remain base-path aware and portable.

### Accessibility

- Interactive elements need stable IDs or accessible names where tests and assistive tech rely on them.
- Venn diagram regions must be keyboard-accessible, either through a parallel list of buttons/checkboxes or equivalent controls.
- ARIA labels should describe the current state of truth tables and diagrams.

### Visual System

- The app should use a cohesive dark classroom theme with shared tokens for surfaces, lines, spacing, radii, and accent colors.
- Visual treatments should reinforce learning state rather than disguise it; correct, incorrect, missed, and extra states must remain legible.
- Responsive layouts must stay readable on narrow mobile screens, laptop widths, and wide projector displays without hiding controls.
- The active practice surface should be the first thing a student sees in practice mode; metadata, hints, history, and reference details should move behind compact or collapsed disclosure by default.

### Testing And Validation

- Shared logic should be covered by unit tests before UI-specific wrappers are added.
- Truth-table and Venn tests should compare against the same evaluator output to catch drift.
- Browser checks should confirm the static build, the base path, and the primary learning flows.

### Data Model

- **Expression**: Represented as a string and parsed into an AST.
- **Truth Table Row**: Object mapping variables and subexpression IDs to boolean values.
- **Venn Region**: Abstracted as an integer ID or bitmask representing the state of variables (e.g., `a && !b && c` -> `101` or `5`).
- **Problem Catalog Entry**: Immutable metadata record with stable `id`, `sequence`, `difficulty`, `conceptTags`, `supportedModes`, `variables`, `variableCount`, `lawFamily`, `estimatedComplexity`, `equivalenceReady`, `simplificationReady`, `hints`, and `expression`.
- **Predicate Atom Record**: Immutable metadata record with stable `variable`, `alias`, `predicate`, `label`, `accessibleLabel`, and optional `description`. The atom record is a presentation layer for pre-authored AP CSA-style predicates and does not change boolean evaluation semantics.
- **Equivalence Challenge Record**: Immutable metadata record with stable `id`, `sequence`, `difficulty`, `conceptTags`, `supportedModes`, `supportedProofModes`, `variables`, `variableCount`, `lawFamily`, `estimatedComplexity`, `equivalenceReady`, `simplificationReady`, `leftExpression`, `rightExpression`, `equivalent`, `hints`, and `expression`.
- **Venn Region Record**: Immutable metadata record with stable `id`, `bits`, `assignment`, `label`, `accessibleLabel`, and `result`.

### Catalog And Progression

- The catalog should be authored as a single ordered source list and exposed through copy-on-read helpers.
- Mode and difficulty filters must return new arrays and not mutate the source catalog.
- Supported modes must be explicit per problem entry so unsupported mode selection is impossible from the data alone.
- Catalog entries should include enough metadata to support future equivalence, simplification, and assignment packets without needing ad hoc UI guesses.
- Predicate atoms should stay pre-authored and should surface through an alias-plus-legend presentation so the Java predicate stays visible while the boolean engine still evaluates simple internal variables.

### Predicate Atom Contract

- Predicate atoms are a presentation mapping for pre-authored numeric conditions such as `score > 10`, `count == 0`, or `index < limit`.
- The underlying boolean engine still evaluates simple variables like `p`, `q`, and `r`; the alias/legend pairing is what preserves the AP CSA meaning on screen.
- When a catalog entry defines predicate atoms, every variable in the expression should have a matching atom so the legend and the working surface stay synchronized.
- Truth-table headers should use compact aliases with the full predicate visible nearby, and Venn mode should show the same alias legend alongside the diagram.
- The implementation must not accept freeform Java syntax, dot notation, object fields, method calls, arrays, or collections, and it must not infer relational semantics from the atom labels alone.

### Numeric Relational Equivalence Contract

- Numeric relational equivalence is a separate authored knowledge graph for comparisons of the form `x > 10`, `x <= 10`, `x == y`, and `x != y`.
- Supported shapes are identifier-vs-integer-literal for all six comparison operators, and identifier-vs-identifier only for `==` and `!=`.
- The graph should surface a student-facing explanation that a numeric variable stands in for an unknown number, without exposing app internals or implying arbitrary Java support.
- The supported inverse pairs are finite and explicit, so feedback may only claim confidence when a comparison matches one of the authored operator pairs.
- Unsupported shapes such as dot notation, object fields, method calls, arrays, or collections should fail safely and remain out of scope until a later packet explicitly expands the model.

### Venn Engine Contract

- Region ordering should follow the same alphabetical variable ordering used by truth tables.
- Region ids should be stable bitmasks derived from the ordered assignments.
- Selection checking should report missed and extra regions separately, using the same region definitions as the generator.

### Venn Learning Contract

- Venn practice should present an actual overlapping-circle diagram as the primary interaction surface, while keeping a compact exact-region list or other fallback available for accessibility and precision.
- Venn practice should keep keyboard-accessible region buttons available at all times, even when the region layout is presented visually.
- The visual diagram, fallback region list, and accessible controls should all read from the same shared region list and selected-region state.
- Feedback should name missed and extra regions explicitly and should explain the current operator in plain language.
- Step progression should come from the shared truth-table subexpression order so the same expression teaches the same sequence in both learning modes.
- Bulk edit helpers may shade all, clear, or copy the current step, but they are edit-only actions and must never count as a check attempt or auto-complete a step.
- Equivalence and simplification proof views should reuse the same visual diagram contract so left/right or original/guess comparisons remain spatial instead of falling back to the old region grid.

### Truth Table Learning Contract

- Truth table practice should render fixed assignment columns as read-only text and reserve editing for the currently revealed subexpression column only.
- Step reveal order should come from the shared truth-table subexpression order so the same expression always teaches the same reasoning path.
- Feedback should name the current row or rows, say whether they are correct or incorrect, and include a row-specific next reasoning move instead of relying on a generic score.
- Primary row feedback should stay focused on the rows that still need attention; complete row dumps belong behind an explicit disclosure control or auxiliary details surface.
- Keyboard support should work on the active answer column with button-based toggles and visible focus states.
- Bulk edit helpers may fill, clear, or copy the current step, but they are edit-only actions and must never count as a check attempt or auto-complete a step.

### Hint Ladder Contract

- Hint progression should be attempt-aware within the current step, starting with a neutral mismatch notice and becoming more specific only after repeated failed checks.
- First-attempt feedback should identify the mismatch without revealing the answer, while later attempts may name the operator, row, region, or operand that needs another look.
- Hint state is local to the current session step and must reset when the problem resets or the step is completed.
- Truth-table and Venn modes should both use the same attempt ladder concept so students get predictable recovery feedback across representations.

### Session Memory Contract

- Session memory should use `sessionStorage` only and should never persist across browser sessions.
- Memory keys should be derived from the mode, normalized expression, and variable set so structurally different expressions stay separate.
- A remembered answer may be restored automatically or manually only after the configured automation threshold is met.
- Remembered payloads should store the successful answer shape for the current step and must be validated before reuse so stale or malformed storage is ignored.
- Truth-table and Venn memory should remain session-local and should not merge logically equivalent but structurally different expressions.

### Adaptive Assignment Design Contract

- Adaptive assignment design should use normalized feature vectors rather than raw string distance or token overlap.
- Feature vectors should capture concept tags, difficulty, variable count, operator counts, AST depth, truth density, mode suitability, and a misconception target so the selector can reason about pedagogical similarity.
- A similar retry should be chosen first from the same concept family when possible, but repeated failures should shift to a contrast item to avoid trapping the student in one law family.
- Coverage should be tracked by concept-tag counts, with under-covered tags receiving priority before over-covered tags.
- All adaptive choices must remain deterministic so teachers and tests can reproduce the same next item from the same session state.
- The adaptive design should remain a prototype until a later packet explicitly wires it into classroom mode.

### GAS Submission Contract

- The optional GAS output should reuse the same completed-problem summary data as the static app, then add a submission payload that includes the problem id, expression text, mode, concept tags, attempts, hints used, autofill uses, bulk-action uses, and a timestamp.
- The client should not store student email locally. The GAS server wrapper is responsible for reading `Session.getActiveUser()?.getEmail() || Session.getEffectiveUser()?.getEmail()` and writing it only to the configured Sheet target.
- Static GitHub Pages builds should keep submission controls disabled and explain that `google.script.run` is unavailable there.
- A local simulator should be able to mimic `google.script.run` success/failure and configurable latency so submission behavior can be tested without any live GAS deployment.
- GAS packaging should stay separate from the static Pages output, but both should be generated from the same shared source and version metadata when possible.

### Sheets Assignment Contract

- The optional Sheets assignment mode should read workbook context from the GAS bootstrap, then hydrate the assignment sequence in shared client code instead of inventing a separate teaching parser.
- Assignment rows must include stable `assignmentId` values, and assignment items must include stable `assignmentItemId` and `challengeId` values so the student queue can be validated before it is shown.
- Assignment items should be ordered by their `sequence` field, not by sheet row position, so teachers can keep the workbook readable without changing app behavior.
- Workbook validation should fail safely on missing ids, unknown challenge ids, unsupported modes, or empty assignments, and the UI should show a blocked assignment state instead of guessing.
- Student identity and optional roster fields should flow from the GAS bootstrap into the client assignment context so completion submissions can be associated with the workbook-defined roster when present.

### Problem Review Summary Contract

- When the final step is completed, truth-table and Venn practice should show an end-of-problem summary that stays local to the current session.
- The summary should surface the problem's concept tags, total attempts, total hints used, and a short note about the final correctness state.
- Step summaries should preserve the last meaningful row or region mistake so students can review what changed before they solved the step.
- Next-practice suggestions should be deterministic and catalog-driven, using concept metadata and the most challenging step as the primary heuristic rather than a persisted adaptive model.
- Detailed step review, cross-representation comparison, next-practice rationale, and submission metrics should be progressively disclosed so the completion state stays short at first glance.
- The summary should work for both truth-table and Venn modes through the same shared helper so the wording stays consistent across representations.

### Cross-Representation Comparison Contract

- For problems that support both truth-table and Venn modes, the completion summary should include a comparison surface that maps each truth-table row to the matching Venn region.
- The comparison must use the shared assignment/region bitmask ids so the row and region pair are synchronized without a separate mapping table.
- The UI should keep the row and region pair together with accessible labels, and the selection mechanism should remain keyboard-operable.
- The comparison surface should support 1-, 2-, and 3-variable assignments and should preserve the same variable ordering used everywhere else in the app.
- Comparison data should come from the shared generator helpers rather than re-deriving boolean semantics in the component layer.

### Equivalence Mode Contract

- Equivalence mode should use curated challenge pairs verified by evaluator-driven truth-table comparison before they are exposed to the UI.
- Challenges should include both equivalent pairs and plausible near-miss non-equivalent pairs, with the first differing row or region exposed when the pair is not equivalent.
- The proof surface should support both truth-table and Venn views for 1-, 2-, and 3-variable challenges, using the same assignment/region ids as the rest of the app.
- The student-facing term should remain "equivalent" unless a future packet changes the product language.
- The UI should keep the challenge prompt, yes/no decision, and proof surface synchronized from the same shared record.

### Simplification Mode Contract

- Simplification mode should ask students to propose a smaller equivalent form for a curated original expression and then verify the guess against the original.
- The app may report a simple cost metric such as AST node count, but it must not claim a globally minimal simplification without a formal minimizer.
- Invalid guesses should surface parser feedback directly, and valid guesses should use the same proof contracts as equivalence mode so counterexamples stay synchronized across representations.
- A guess that is equivalent but longer by the chosen metric should still be marked equivalent, but not simpler.

## Migration from Archive

- Replace the duplicated `BooleanParser` with a single robust implementation in `src/`.
- Migrate away from `alert()` based feedback to a reactive UI component.
- Expand Venn support to 1, 2, and 3 variables consistently across logic and rendering.
- Eliminate dependency on external CDNs; all libraries should be managed via `package.json`.

## Archive Debt Notes

The archive review surfaced the following issues that future packets should keep in view:

- duplicated parser logic between `Code.js` and `Index.html`
- parser behavior that does not fully verify token consumption
- difficulty-based problem selection that can change modality unsafely
- truth-table variable cells that can be mutated accidentally
- p5 cleanup and DOM manipulation that are tightly coupled to UI state
- `alert()`-driven feedback that is hard to test and weak for accessibility
- Venn logic that is inconsistently limited to two variables in parts of the archive
