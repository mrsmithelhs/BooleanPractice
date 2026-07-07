# Plan 26: UI Tour Capture And Blind Review Workflow

## Packet Metadata

- Packet id: 26
- Packet title: UI Tour Capture And Blind Review Workflow
- Status: complete
- Owner/model: Codex mini or stronger; browser-capable model recommended
- Date: 2026-05-06
- Packet type: implementation, tooling, browser validation, UI review, docs
- Mutation level: source-code, tests, generated-local, docs
- Approval gate: before adding heavy screenshot dependencies, before writing tracked generated screenshots, before changing app behavior to satisfy the capture workflow
- Expected artifacts: Playwright-driven UI tour capture workflow, local-only timestamped review folders, screenshots, `tour.md`, `manifest.json`, blind-review starting prompt, docs, progress report
- Progress report folder: `reports/development/plan-26-ui-tour-capture-blind-review-workflow/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: create a repeatable workflow that captures coherent UI tours as screenshots and packages them for blind review by fresh agents that must not inspect the codebase.
- Non-goals: do not fix UI issues in this packet, do not make screenshot artifacts tracked source files, and do not ask the reviewing agent to read code or project docs outside the capture folder.
- Depends on: Plan 25 preferred for local dev/preview workflow awareness; Playwright test infrastructure from earlier plans.
- Blocks: Plan 27 multi-review synthesis and future UI quality review cycles.
- Why this packet exists: coding agents can understand UI choices because they know the code and project context, but users only see the interface. This workflow deliberately separates code-aware capture from code-blind review so confusing, overwhelming, mislabeled, overexplained, or incohesive UI can surface earlier.

## Core Concept

This packet must implement two intentionally separate roles:

- Capture agent:
  - May inspect the codebase and docs.
  - Starts the appropriate app target.
  - Uses Playwright automation to walk through visible UI surfaces.
  - Captures screenshots into a local-only timestamped folder.
  - Writes a human-readable tour guide and machine-readable manifest.
  - Writes a starting prompt for one or more blind review agents.
- Blind review agent:
  - Must not inspect the codebase, git history, app docs, tests, or implementation files.
  - Reviews only the screenshots, `tour.md`, `manifest.json` if useful, and the starting prompt inside the capture folder.
  - Ignores review subfolders created by other agents.
  - Behaves like a fresh UI consultant diagnosing what can and cannot be understood from the interface alone.

This separation is not incidental. It is the main integrity constraint of the workflow.

## Required Reading

- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/deployment.md`
- `docs/development/plan-25-local-dev-console.md`
- existing Playwright config and E2E tests
- package scripts for starting, previewing, and testing the app

Optional/contextual reading:

- UI component files only as needed to identify routes, states, selectors, or stable test ids for capture.
- GAS/local simulation docs if the capture includes GAS-specific stories.

## Scope

In scope:

- Add a local-only output root such as `local/ui-reviews/`.
- Ensure `local/` or the chosen output root is gitignored.
- Add a capture command, such as `npm run capture:ui-tour`, or document an equivalent command if package scripts are organized differently.
- Add Playwright-based capture tooling that creates a folder named with an ISO-like datetime.
- Capture numbered screenshots for each tour/story.
- Support multiple tours in one capture run.
- Support viewport variants, at minimum desktop/laptop and narrow/mobile. Add projector/classroom viewport if feasible.
- Generate `tour.md` explaining each numbered screenshot and grouping screenshots by coherent UI story.
- Generate `manifest.json` with structured tour and screenshot metadata.
- Generate `review-starting-prompt.md` for blind review agents and `synthesis-starting-prompt.md` for synthesis handoff.
- Document how future agents can modify or add tours without weakening the blind-review concept.

Out of scope:

- Do not commit generated screenshot folders.
- Do not perform visual regression diffing in this packet.
- Do not synthesize multiple reviews; that is Plan 27.
- Do not change app UI solely to make screenshots easier unless the change is separately justified by product/accessibility requirements.

## Output Folder Contract

Each capture run should create a new local-only folder named with a filesystem-safe ISO datetime, for example:

```text
local/ui-reviews/2026-05-06T15-42-11/
```

The folder should contain:

```text
001-static-home-desktop.png
002-static-truth-table-setup-desktop.png
003-static-truth-table-incorrect-desktop.png
...
tour.md
manifest.json
review-starting-prompt.md
synthesis-starting-prompt.md
reviews/
```

`reviews/` may be created empty or documented as the place blind review agents should create their provider/model-specific review subfolders.

Screenshot names should be numbered in the exact order a reviewer should inspect them. Names should include enough semantic detail to stay useful after renaming tours, but ordering must not depend only on filename sorting quirks.

## Tour Guidance

The workflow should support several coherent narratives rather than one giant tour. For this app, initial tour candidates include:

- Static/GitHub Pages student truth table practice.
- Static/GitHub Pages student Venn practice.
- Expression equivalence challenge.
- Simplification guess mode.
- Java predicate atom practice.
- GAS student assignment/submission flow, using local GAS simulation where possible.
- GAS latency/error state flow, using configurable simulated `google.script.run` delays and failures.
- Local dev console flow if it has a visible browser surface worth reviewing.

The implementing agent does not need to capture every possible tour if app state or routes make that too broad for one packet. It must, however, make the workflow extensible and include representative starter tours that exercise more than a landing screen.

## Viewport Requirements

At minimum, capture:

- Desktop/laptop viewport, such as 1366x768 or 1440x900.
- Narrow/mobile viewport, such as 390x844 or 412x915.

Consider adding:

- Classroom/projector viewport, such as 1280x720, especially for teacher-visible or projected student instruction surfaces.

The manifest and tour guide must identify viewport for every screenshot.

## State Transition Requirements

Screenshots should tell the story of interaction, not just isolated final screens. Capture before and after important transitions:

- initial page load or app target selection
- mode/problem selection
- first editable working surface
- before checking an answer
- after incorrect feedback
- after hints appear
- after using bulk fill/copy or session memory when relevant
- after successful completion
- after summary/recommendation appears
- switching modes or returning to a previous surface
- GAS submission success and failure, if included

The tour guide should explain what interaction just happened in user-visible terms. Avoid contaminating the blind reviewer with implementation or packet history.

Good:

```markdown
Screenshot 007: The student has just submitted an incorrect Venn answer for the first time.
```

Avoid:

```markdown
Screenshot 007: This validates the Plan 12 hint ladder state from the feedback module.
```

## `tour.md` Requirements

`tour.md` should be written for a blind reviewer. It should contain:

- Project name and one-paragraph app context.
- Capture datetime and app target or targets.
- Instructions to inspect screenshots in order.
- Clear section headings for each tour/story.
- Viewport grouping where applicable.
- For each screenshot:
  - number
  - filename
  - viewport
  - what the user has done so far
  - what the screenshot is intended to represent in the story
  - no implementation details, code references, or justifications for design decisions

The tour guide may mention that the app is for practicing boolean expressions, truth tables, Venn diagrams, equivalence, simplification, Java-style predicates, and optional GAS classroom workflows. It should not tell the reviewer what the UI is supposed to be proving internally.

## `manifest.json` Requirements

Create a machine-readable manifest with enough structure for later synthesis. It should include:

- project name
- capture datetime
- app version or commit SHA if available
- capture command
- app target, such as static preview, dev server, GAS simulation, or console
- viewport definitions
- tour list
- screenshot list for each tour
- for each screenshot:
  - id/number
  - filename
  - tour id
  - viewport id
  - short description
  - interaction state
  - optional route/url

Do not include secrets, student emails, live Sheet ids, or personally identifying student data.

## Blind Review Starting Prompt Requirements

Generate `review-starting-prompt.md` and `synthesis-starting-prompt.md` inside the capture folder. The blind-review prompt should instruct a fresh agent to:

- Act as a UI expert and first-time consultant.
- Review only files in the screenshot capture folder.
- Read `tour.md` and inspect screenshots in order.
- Ignore all review subfolders left by other agents.
- Not inspect source code, project docs outside the folder, tests, package files, git history, or implementation notes.
- Create a unique review subfolder under `reviews/`, such as `reviews/openai-gpt-5/` or `reviews/<provider-model-datetime>/`.
- Write per-screenshot notes before writing a summary.
- Re-read per-screenshot notes before writing final patterns and recommendations.
- Identify issues such as:
  - confusing UI
  - overwhelming UI
  - missing but expected UI elements
  - poor transitions between states
  - mislabeled controls or surfaces
  - over-explanatory text
  - opportunities to show instead of tell
  - color and contrast concerns
  - visual cohesiveness
  - iconography problems or opportunities to replace text with icons
  - weak hierarchy, spacing, density, typography, affordances, error states, empty states, loading states, responsiveness, accessibility, and trust/confidence issues
- Use severity and confidence for findings.
- Distinguish "I cannot tell" from "this is wrong."

Recommended review output files:

```text
reviews/<reviewer-id>/per-screenshot-notes.md
reviews/<reviewer-id>/summary.md
reviews/<reviewer-id>/findings.json
```

`findings.json` is optional if it adds too much implementation complexity, but useful for Plan 27.

## Tour Definition Flexibility

The workflow should make tour changes low-risk. Prefer a declarative or lightly structured tour definition rather than one large brittle script, if practical for the current app. For example:

- a `tests/ui-tours/` folder
- shared helpers for starting app targets, waiting for stable UI, and taking screenshots
- per-tour files for truth table, Venn, equivalence, simplification, Java predicates, GAS submission, and console
- stable naming conventions

Future agents should be able to:

- add a new tour without editing unrelated tours
- disable a tour temporarily with a clear reason
- add a viewport variant without duplicating all logic
- update selectors when UI changes without rewriting the capture folder format
- preserve blind-review constraints even as tours evolve

## Validation Requirements

- Run the capture workflow locally.
- Confirm a new timestamped folder is created.
- Confirm screenshots are non-empty and openable.
- Confirm `tour.md`, `manifest.json`, `review-starting-prompt.md`, and `synthesis-starting-prompt.md` exist.
- Confirm generated output is under local-only ignored paths.
- Confirm the workflow can be rerun without overwriting a prior capture.
- Confirm at least one desktop and one mobile/narrow screenshot are captured.
- Confirm the blind-review prompt forbids codebase inspection and other review folder contamination.

## Commands

Use actual project commands after implementation. Expected examples:

```powershell
npm run capture:ui-tour
npm test
npm run build
npx playwright test
```

If the capture command starts a dev server or preview server, it must clean up after itself or document how the process is managed.

## Required Output

Final response from the implementing agent must include:

- workflow command added
- local output folder created during validation
- tours captured
- viewport variants captured
- files changed
- generated artifacts
- commands run and results
- any tours deferred and why
- whether Plan 27 can consume the resulting folder

## Stop Conditions

Stop and report if:

- app surfaces cannot be reached reliably by Playwright without product changes
- screenshot capture would require live student data, real GAS deployment, or live Sheet writes
- tour generation would need to commit generated screenshots
- the only feasible review prompt would require codebase context
- local server management is unsafe or flaky in a way that would make repeated reviews unreliable
- adding/modifying tours would require reinventing the workflow rather than extending it
