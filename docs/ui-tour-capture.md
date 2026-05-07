# UI Tour Capture Workflow

Boolean Practice includes a local, human-facing workflow for capturing coherent UI tours and packaging them for blind review.

## Command

```bash
npm run capture:ui-tour
```

The command builds or reuses the local preview target, captures screenshots into a timestamped folder under `local/ui-reviews/`, and writes:

- `tour.md`
- `manifest.json`
- `review-starting-prompt.md`
- `synthesis-starting-prompt.md`
- `reviews/`

The `local/` directory is ignored by git, so these review packets stay local-only.

Useful flags:

- `--tour truth-table` or `--tours truth-table,venn` to limit the run
- `--viewports desktop,mobile` to pick the viewport set
- `--target dev` to capture from the editable dev server instead of the preview target
- `--output-root <path>` to change the local-only output root

## Default Viewports

- Desktop/Laptop: `1440x900`
- Mobile: `390x844`
- Projector/Classroom: `1280x720`

You can narrow or expand the set with `--viewports desktop,mobile,projector`.

## Starter Tours

The workflow ships with representative starter tours for:

- truth-table practice
- Venn practice
- equivalence proof mode
- simplification guess mode
- numeric predicate-atom practice
- GAS submission flow using a local simulator

The initial capture set does not include every possible classroom workflow. It is intentionally structured so future agents can add tours without rewriting the rest of the workflow.

## Adding Or Updating Tours

1. Update the declarative tour definitions in [`scripts/lib/ui-tour-capture.js`](../scripts/lib/ui-tour-capture.js).
2. Keep each screenshot self-contained so it can be re-run without relying on earlier screenshots from the same batch.
3. Use the stable `data-testid` hooks already exposed by the app instead of brittle positional selectors.
4. Add a viewport to `VIEWPORTS` before using it in a tour.
5. Keep tour and screenshot filenames descriptive, but order screenshots by the story a blind reviewer should follow.
6. Update the capture tests when you add a new tour, viewport, or review-artifact field.

## Blind Review Boundary

The generated `review-starting-prompt.md` tells a fresh reviewer to:

- read only the files in the capture folder
- ignore the codebase, tests, git history, and project docs outside the folder
- ignore review subfolders created by other agents
- create a unique subfolder under `reviews/`
- write per-screenshot notes before writing a summary
- review the UI like an expert in data-driven educational web apps
- consider confusing UI, overwhelming UI, missing UI, poor transitions, labeling issues, excessive text, show-vs-tell opportunities, color, cohesiveness, iconography, accessibility, and other expert-level concerns
- include severity, confidence, affected screenshot numbers, likely user impact, and suggested fix direction in each finding

That separation is the integrity boundary of the workflow.

The generated `synthesis-starting-prompt.md` gives a synthesis agent a separate handoff prompt that assumes full app context and asks for prioritized, implementation-ready triage output from the review folders.

## Related Docs

- [`docs/testing.md`](./testing.md)
- [`docs/development/README.md`](./development/README.md)
