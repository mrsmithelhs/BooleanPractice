---
id: plan-11
title: "GitHub Pages Deployment"
status: complete
depends_on: [plan-01, plan-02, plan-03, plan-04, plan-05, plan-06, plan-07, plan-08, plan-09, plan-10]
gate: "required before changing repository Pages settings or performing a production deployment"
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "make the app easy to promote to GitHub Pages after it is pushed."
---
# Plan 11: GitHub Pages Deployment

## Packet Metadata

- Packet id: 11
- Packet title: GitHub Pages Deployment
- Status: (see frontmatter)
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

- Add or finalize a GitHub Actions workflow that installs dependencies, runs tests, builds the app, uploads the Pages artifact, and deploys with GitHub Pages actions.
- Ensure Vite base path works for repository Pages URLs and matches the configured repository name or base route.
- Document repository setting assumptions and deployment steps.
- Add a release checklist covering tests, accessibility, browser smoke checks, and rollback notes.
- Include a local preview command for the production build and note that local preview is not the same as production deploy.
- Keep production deployment approval-gated and separate from local validation.

## Required Behavior

- The workflow should be syntax-valid and use the same build output the app ships publicly.
- The docs should describe the difference between local preview, artifact upload, and production deployment.
- The packet should not assume repository settings are already configured.

## Stop Conditions

- If repository settings or permissions must change, stop and ask for approval before touching them.
- If the base-path contract is not settled by earlier packets, do not invent a deployment workaround here.

## Validation Checklist

- [ ] `npm run build` produces static assets.
- [ ] Preview works with the configured base path.
- [ ] Workflow is syntax-valid.
- [ ] Deployment docs clearly distinguish local validation from production deploy.
- [ ] No production deployment was performed without approval.
- [ ] The workflow uses reproducible install and build steps.
- [ ] Release notes or checklist mention rollback considerations.
