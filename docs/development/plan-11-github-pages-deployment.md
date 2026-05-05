# Plan 11: GitHub Pages Deployment

## Packet Metadata

- Packet id: 11
- Packet title: GitHub Pages Deployment
- Status: ready
- Owner/model: Codex mini or stronger
- Date: 2026-05-05
- Packet type: deployment, docs, integration
- Mutation level: GitHub config, docs, tests
- Approval gate: required before changing repository Pages settings or performing a production deployment
- Expected artifacts: Pages workflow, deployment docs, release checklist, base-path validation
- Progress report folder: `reports/development/plan-11-github-pages-deployment/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: make the app easy to promote to GitHub Pages after it is pushed.
- Non-goals: do not deploy without approval.
- Depends on: Plans 01 through 10.
- Blocks: public classroom use.
- Why this packet exists: static deployment is the target architecture, and base-path mistakes are easy to miss locally.

## Implementation Requirements

- Add or finalize GitHub Actions workflow for build and Pages artifact upload.
- Ensure Vite base path works for repository Pages URLs.
- Document repository setting assumptions and deployment steps.
- Add a release checklist covering tests, accessibility, browser smoke checks, and rollback notes.
- Include a local preview command for the production build.

## Validation Checklist

- [ ] `npm run build` produces static assets.
- [ ] Preview works with the configured base path.
- [ ] Workflow is syntax-valid.
- [ ] Deployment docs clearly distinguish local validation from production deploy.
- [ ] No production deployment was performed without approval.
