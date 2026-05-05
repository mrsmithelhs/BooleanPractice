# Boolean Practice Project Structure

This repository is migrating from an archived Google Apps Script web app into a compiled static Vue application deployable to GitHub Pages.

## Intended Durable Structure

- `archive/`
  - Read-only source snapshot of the original Apps Script app.
  - Agents may inspect it but should not treat it as the implementation target.
- `docs/`
  - Product, pedagogy, architecture, testing, deployment, and packet guidance.
- `docs/development/`
  - Numbered implementation packets for lower-cost implementation agents.
  - `00-mini-packet-agent-starting-prompt.md` is the reusable prompt for a packet thread.
  - `README.md` is the canonical packet sequence index.
- `docs/reports/`
  - Durable analysis reports that are not packet-specific.
- `reports/development/`
  - Packet-specific progress reports created by implementation agents.
- `src/`
  - Shared app logic that can be unit-tested without a browser.
  - Expected subareas after setup: parser, truth tables, Venn regions, problem catalog, and feedback rules.
- `ui/`
  - Vue/Vite app shell, pages, components, visual assets, and browser-facing services.
- `tests/`
  - Unit and integration tests for parser, evaluator, problem generation, Venn region logic, feedback, and static build behavior.
- `tests/e2e/`
  - Playwright tests for student workflows, accessibility, responsive layout, and GitHub Pages-style routing.
- `.github/workflows/`
  - CI for install, lint, unit tests, build, E2E tests when appropriate, and GitHub Pages deployment.

## Structure Rules

- Keep learning logic in testable shared modules rather than inside Vue components.
- Keep the archived Apps Script files unchanged unless a packet explicitly authorizes archival annotations.
- Do not put generated build output under version control unless the deployment strategy explicitly requires it.
- Packet reports belong in `reports/development/<packet-name>/progress.md`, not in `local/`.
- Use `local/` only for disposable scratch work and keep it ignored by git.
- GitHub Pages deployment should come from the compiled static app, preferably through a workflow artifact rather than committed `dist/`.

