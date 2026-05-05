# Testing Guide

Use these commands from the repository root:

- `npm test` - run the Vitest unit and component suite in non-watch mode.
- `npm run lint` - run ESLint across the repo.
- `npm run build` - produce the static Vite build in `dist/`.
- `npm run test:e2e` - run the Playwright browser checks against the local app.
- `npm run dev` - start the Vite dev server for manual browser inspection.
- `npm run preview` - serve the production build locally after `npm run build`.

Recommended validation order:

1. `npm test`
2. `npm run lint`
3. `npm run build`
4. `npm run test:e2e`

Notes:

- Browser coverage should confirm the shell loads, truth-table and Venn practice are reachable, and the layout remains readable on mobile widths.
- Base-path checks should stay relative so the app remains deployable to GitHub Pages without hardcoded root paths.
- If a browser test needs extra provisioning, record that explicitly rather than lowering the coverage claim.
