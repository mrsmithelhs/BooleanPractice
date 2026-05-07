# UI Review Synthesis Workflow

Boolean Practice includes a local, human-facing workflow for synthesizing multiple blind UI reviews into a prioritized triage report.

## Command

```bash
npm run synthesize:ui-reviews
```

By default, the command uses the newest capture folder under `local/ui-reviews/` and writes synthesis artifacts into that folder's `synthesis/` subdirectory.

You can also point it at a specific capture folder:

```bash
npm run synthesize:ui-reviews -- --capture local/ui-reviews/<timestamp>
```

## Output

The synthesis workflow reads the capture folder, the raw review subfolders, and any optional structured finding files. It writes:

- `synthesis/summary.md`
- `synthesis/prioritized-findings.md`
- `synthesis/finding-index.json`
- `synthesis/proposed-fix-packets.md` when there is enough evidence for a follow-up suggestion

The synthesis output stays inside the capture folder and leaves the raw reviewer folders unchanged.

## Review Inputs

The workflow expects each reviewer folder under `reviews/<reviewer-id>/` to contain:

- Markdown notes, and/or
- an optional `findings.json`

The review folders may use additional markdown filenames and additional JSON filenames if they contain review-relevant notes or findings. The synthesizer is intentionally tolerant of that drift so reviewers do not need to match one brittle filename exactly.

The structured finding format should include:

- title
- category
- severity
- confidence
- affected screenshot numbers
- affected tours
- likely user impact
- suggested fix direction

The capture workflow also generates a `synthesis-starting-prompt.md` alongside the blind-review prompt so a fresh synthesis agent can be handed the folder directly.

## Console Menu

If you use the local development console from [`docs/local-dev-console.md`](./local-dev-console.md), the synthesis step is available as a menu option and defaults to the latest capture folder.

## Related Docs

- [`docs/ui-tour-capture.md`](./ui-tour-capture.md)
- [`docs/local-dev-console.md`](./local-dev-console.md)
- [`docs/testing.md`](./testing.md)
