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

## Deployment Workflow

The Pages workflow lives in `.github/workflows/pages.yml`.

It:

1. Installs dependencies with `npm ci`.
2. Runs `npm test`, `npm run lint`, `npm run build`, and browser smoke checks.
3. Uploads the `dist/` directory as the Pages artifact.
4. Deploys that artifact with the GitHub Pages actions.

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

## Rollback Notes

If a deployment needs to be backed out:

- Revert the commit that introduced the bad build, then re-run the Pages workflow.
- If the issue is in workflow configuration, fix the workflow first and redeploy from a known-good commit.
- Keep the previous production URL in mind as the fallback until the replacement deployment succeeds.

## Approval Gate

Production deployment is approval-gated. Do not trigger the Pages workflow until the release has been reviewed and approved for publication.
