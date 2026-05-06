# Testing Guide

Use these commands from the repository root:

- `npm test` - run the Vitest unit and component suite in non-watch mode.
- `npm run lint` - run ESLint across the repo.
- `npm run build` - produce the static Vite build in `dist/`.
- `npm run build:gas` - produce the static build and assemble the GAS-friendly output in `gas-dist/`.
- `npm run test:e2e` - run the Playwright browser checks against the local app.
- `npm run dev` - start the Vite dev server for manual browser inspection.
- `npm run dev:control` - open the local console for starting/stopping the dev server, checking ports, opening the app or preview, and launching UI tour captures.
- `npm run preview` - serve the production build locally after `npm run build`.
- `npm run capture:ui-tour` - capture local-only UI tour screenshots and write a blind-review packet under `local/ui-reviews/`.

Recommended validation order:

1. `npm test`
2. `npm run lint`
3. `npm run build`
4. `npm run test:e2e`

Notes:

- Browser coverage should confirm the shell loads, truth-table and Venn practice are reachable, and the layout remains readable on mobile widths.
- UI tour capture packets should be rerunnable, local-only, and documented in [`docs/ui-tour-capture.md`](./ui-tour-capture.md).
- Base-path checks should stay relative so the app remains deployable to GitHub Pages without hardcoded root paths.
- The local dev server defaults to port `5177` and can be overridden with a repo-local `.env` or `.env.local` file.
- Review-summary coverage should confirm the end-of-problem panel appears after completion, reports attempts and hints, and offers a deterministic next-practice suggestion.
- Equivalence coverage should confirm curated pairs validate across truth-table and Venn proof modes, and that near-miss pairs surface the first differing row or region.
- Simplification coverage should confirm valid guesses parse, equivalent guesses are compared against the original, longer equivalent guesses are not marked simpler, and invalid syntax surfaces parser feedback.
- Predicate-atom coverage should confirm aliases and full predicate labels appear together, the legend matches the catalog metadata, and evaluation still runs through the shared boolean engine.
- Numeric relational coverage should confirm the knowledge graph exposes the six authored inverse pairs, supported shapes reject dot notation and other unsupported forms, and the shell copy explains that numeric variables stand in for unknown numbers.
- Bulk-control coverage should confirm the truth-table and Venn edit helpers only change the current step, never increment attempt counts, and still require an explicit check before feedback advances.
- Session-memory coverage should confirm remembered answers are keyed by mode, normalized expression, and variable set; ignored when storage is malformed or stale; and restored only after the automation threshold is reached.
- Submission coverage should confirm payloads include the problem id, expression text, mode, concept tags, attempts, hints, bulk-action/autofill counts, and build metadata; the simulator should cover success, failure, and delay; and the static build should report that `google.script.run` is unavailable.
- Run `npm run build:gas` whenever the GAS bridge, server wrappers, or submission payload shape changes so the generated `gas-dist/` output stays in sync.
- Assignment coverage should confirm workbook validation, roster lookup, assignment hydration, and fail-safe handling for invalid sheet rows.
- Adaptive assignment coverage should confirm feature-vector generation, similarity scoring, retry-threshold behavior, coverage tracking, and deterministic contrast selection without relying on raw string distance.
- If a browser test needs extra provisioning, record that explicitly rather than lowering the coverage claim.
