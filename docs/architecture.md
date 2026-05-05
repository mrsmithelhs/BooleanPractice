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

### Testing And Validation
- Shared logic should be covered by unit tests before UI-specific wrappers are added.
- Truth-table and Venn tests should compare against the same evaluator output to catch drift.
- Browser checks should confirm the static build, the base path, and the primary learning flows.

### Data Model
- **Expression**: Represented as a string and parsed into an AST.
- **Truth Table Row**: Object mapping variables and subexpression IDs to boolean values.
- **Venn Region**: Abstracted as an integer ID or bitmask representing the state of variables (e.g., `a && !b && c` -> `101` or `5`).
- **Problem Catalog Entry**: Immutable metadata record with stable `id`, `sequence`, `difficulty`, `conceptTags`, `supportedModes`, `variables`, `hints`, and `expression`.
- **Venn Region Record**: Immutable metadata record with stable `id`, `bits`, `assignment`, `label`, `accessibleLabel`, and `result`.

### Catalog And Progression
- The catalog should be authored as a single ordered source list and exposed through copy-on-read helpers.
- Mode and difficulty filters must return new arrays and not mutate the source catalog.
- Supported modes must be explicit per problem entry so unsupported mode selection is impossible from the data alone.

### Venn Engine Contract
- Region ordering should follow the same alphabetical variable ordering used by truth tables.
- Region ids should be stable bitmasks derived from the ordered assignments.
- Selection checking should report missed and extra regions separately, using the same region definitions as the generator.

### Venn Learning Contract
- Venn practice should keep keyboard-accessible region buttons available at all times, even when the region layout is presented visually.
- The visual region grid and the accessible controls should both read from the same shared region list and selected-region state.
- Feedback should name missed and extra regions explicitly and should explain the current operator in plain language.
- Step progression should come from the shared truth-table subexpression order so the same expression teaches the same sequence in both learning modes.

### Truth Table Learning Contract
- Truth table practice should render fixed assignment columns as read-only text and reserve editing for the currently revealed subexpression column only.
- Step reveal order should come from the shared truth-table subexpression order so the same expression always teaches the same reasoning path.
- Feedback should name the current row or rows, say whether they are correct or incorrect, and include a row-specific next reasoning move instead of relying on a generic score.
- Keyboard support should work on the active answer column with button-based toggles and visible focus states.

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
