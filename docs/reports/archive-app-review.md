# Archived App Review

Date: 2026-05-05

Source reviewed:

- `archive/Index.html`
- `archive/Code.js`

## Product And Pedagogical Potential

The archived app has a strong core premise: students practice boolean expressions by working through intermediate subexpressions, then checking their reasoning in truth table or Venn diagram form. That maps well to AP Computer Science A because students often struggle less with individual operators than with precedence, grouping, negation, and connecting a row of variable values to a final expression result.

High-value learning opportunities to preserve and strengthen:

- Stepwise evaluation: reveal subexpressions in a meaningful order and make students reason about one operator at a time.
- Multiple representations: truth tables and Venn diagrams should become two synchronized views of the same assignments.
- Operator vocabulary: `!`, `&&`, `||`, parentheses, boolean literals, and variables should be framed in AP CSA-friendly language.
- Error feedback: instead of only saying "Incorrect", the app can point students toward a row, region, operator, or operand that needs reconsideration.
- Metacognition: prompts can ask students to predict before checking, compare an expression to an equivalent form, or explain why a region is shaded.

Recommended learning upgrades:

- Add a problem progression that starts with literals and single operators, then builds to precedence, De Morgan's laws, equivalence, and three-variable reasoning.
- Add targeted hints that are revealed after attempts, not immediately.
- Add row/region-specific feedback so students can see exactly which assignment contradicts their answer.
- Add a "compare modes" activity where a completed truth table highlights the same Venn regions.
- Add expression chips or an AST/parse tree view for operator precedence.
- Add a short review summary after each problem: correct rows/regions, missed patterns, and one next practice suggestion.
- Include AP CSA examples using Java-like predicates such as `score >= 90` later, after the boolean core is stable.
- Track session-only progress locally so students can practice without accounts or servers.

## Technical Issues In The Archive

- The durable implementation is split between `Code.js` and a duplicate parser embedded in `Index.html`; the browser uses the embedded parser, so backend logic can drift silently.
- The app depends on CDN-loaded Vue, Bootstrap, Bootstrap Icons, and p5.js, which makes it less reliable offline and less suitable for reproducible static deployment.
- Parser tokenization and matching are under-tested and fragile. For example, parsing does not verify that all tokens were consumed, and the literal-matching regular expression should be anchored as a whole alternative.
- Truth table and Venn logic do not share a clean module boundary, making unit testing difficult.
- Venn mode is effectively fixed to two variables in the embedded parser and drawing code, despite `Code.js` having a more general region-combination helper.
- Problem selection filters by difficulty only, then mutates `currentProblem.type` to the selected modality. That can turn a truth-table-only catalog item into a Venn problem without checking whether the mode is actually supported.
- Direct DOM manipulation is mixed into Vue component methods, which creates lifecycle hazards and makes state harder to reason about.
- p5 sketch cleanup is manual and broad; operand diagrams and main diagrams can interfere with each other because cleanup clears shared sketch state.
- Feedback is mostly `alert()` based, which interrupts flow, is hard to test, and is weak for accessibility.
- The truth table UI lets students toggle variable cells as well as answer cells unless guarded carefully, which risks corrupting the fixed assignment columns.
- The current Venn diagram model uses three visual states, but the checking logic only looks for true-shaded regions; false/neutral distinctions are not pedagogically used consistently.
- There is no package manifest, build process, unit test framework, E2E suite, linting, CI, or GitHub Pages configuration.
- The visual style is vanilla Bootstrap with minimal domain-specific layout, and the diagram canvas does not yet feel like a polished learning tool.

## Migration Recommendations

- Establish a Vite + Vue static app with all learning logic in shared modules under `src/`.
- Build parser, AST formatting, evaluator, truth table generation, and Venn region generation as pure functions first.
- Add Vitest coverage before rebuilding the full UI, including malformed expressions and equivalence between truth table rows and Venn regions.
- Represent Venn regions abstractly as bitmask assignments for one to three variables; let the UI decide how to render them.
- Use SVG or HTML-based region controls for accessibility where feasible. If canvas is kept, add parallel keyboard-accessible controls and ARIA text.
- Replace `alert()` with inline feedback, status regions, and attempt history.
- Build the visual upgrade around expression structure, mode switching, progress, and clear feedback rather than decorative elements.
- Add Playwright E2E tests for selecting problems, completing truth table columns, toggling Venn regions, keyboard operation, mobile layout, and GitHub Pages base path.
- Add GitHub Actions for tests/build and a separate approval-conscious Pages deployment workflow.
