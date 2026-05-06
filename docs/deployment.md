# GitHub Pages Deployment

Boolean Practice is designed to ship as static files to GitHub Pages. The app already uses a relative Vite base path, so the same build can work locally, in preview, and when published from a repository Pages URL.

## Repository Assumptions

- GitHub Pages must be configured to use `GitHub Actions` as the publishing source.
- The workflow runs from the repository default branch, but deployment is manual through `workflow_dispatch`.
- The build is static only. No backend, serverless runtime, or CDN-specific behavior is required.
- If the repository name changes, the relative asset strategy should still work because the app does not hardcode a root base path.

## Local Validation

Use local preview to verify the production build before any deployment approval:

```bash
npm run build && npm run preview -- --host 127.0.0.1 --port 4173
```

Local preview is useful for checking the compiled output, but it is not the same as a GitHub Pages deployment. The preview server does not upload artifacts or exercise repository Pages settings.

If you want a maintainer-friendly local control surface for the editable dev server, use [`docs/local-dev-console.md`](./local-dev-console.md) and `npm run dev:control`. That console keeps the dev port convention visible and avoids hand-editing command lines for routine start/stop/restart workflows.

## Deployment Workflow

The Pages workflow lives in `.github/workflows/pages.yml`.

It:

1. Installs dependencies with `npm ci`.
2. Runs `npm test`, `npm run lint`, `npm run build`, and browser smoke checks.
3. Uploads the `dist/` directory as the Pages artifact.
4. Deploys that artifact with the GitHub Pages actions.

## GAS Output

Plan 20 adds an optional GAS-friendly build for classroom submission tracking. That output is generated locally with:

```bash
npm run build:gas
```

The command keeps the static `dist/` build intact, then assembles a separate `gas-dist/` directory with the Apps Script server wrappers, a manifest, and an inlined `Index.html` based on the same app bundle.

GAS-specific assumptions:

- The GAS deployment is optional and remains separate from GitHub Pages.
- The GAS web app should be deployed to a domain-visible classroom account, not as a public anonymous endpoint.
- Submission writes require a configured spreadsheet id in script properties.
- Student email should only be captured on the GAS side through Apps Script identity APIs, not stored locally in the static build.
- Local testing should use the submission simulator helpers instead of a live Apps Script project when verifying latency or failure paths.

## Sheets Assignments

Plan 21 adds optional Sheets-authored assignment mode on top of the GAS output.

Deployment assumptions:

- The workbook should contain `Assignments`, `Assignment Items`, and optionally `Roster` tabs.
- Teachers should keep `assignmentId`, `assignmentItemId`, and `challengeId` stable.
- The GAS bootstrap can use an `assignmentId` query parameter to direct a student to a specific assignment sequence.
- Invalid assignment rows fail safely and keep the assignment view blocked until the workbook is corrected.

For the full tab layout and column names, see [`docs/sheets-assignments.md`](./sheets-assignments.md).

## Release Checklist

Before triggering the Pages workflow, confirm:

- Unit tests pass.
- Lint passes.
- The static build completes successfully.
- Browser smoke checks pass on the current commit.
- Truth-table and Venn flows still work after the latest change.
- The app renders correctly with the relative Pages base path.
- Accessibility and focus states remain intact on mobile and desktop widths.
- A rollback plan is clear, usually by re-running the last known-good commit or reverting the deployment commit.
- If you are testing the GAS output locally, confirm the generated `gas-dist/` files look correct, but do not push or publish them without the approval gate.

## Rollback Notes

If a deployment needs to be backed out:

- Revert the commit that introduced the bad build, then re-run the Pages workflow.
- If the issue is in workflow configuration, fix the workflow first and redeploy from a known-good commit.
- Keep the previous production URL in mind as the fallback until the replacement deployment succeeds.

## Approval Gate

Production deployment is approval-gated. Do not trigger the Pages workflow until the release has been reviewed and approved for publication.
