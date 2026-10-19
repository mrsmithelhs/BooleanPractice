---
id: plan-38
title: "Shape Puzzle Page Investigation (P3)"
status: ready
depends_on: [plan-37]
gate: "GATE-38A: investigation report and proposed implementation packet outline go to the owner; no production source changes in this packet"
superseded_by: null
resolution: null
summary: >-
  Investigate-first packet for P3: a separate, stripped-down online "shade the expression" page that uses irregular shapes
  from plan-37, shows AND/OR/NOT words with a toggle to Java symbols, and keeps every region linked to its truth-table row.
  Answers the hosting, component-reuse, notation, labeling, accessibility, and Chromebook-layout questions with prototype
  evidence, then proposes a bounded implementation packet for owner approval.
---
# Plan 38: Shape Puzzle Page Investigation (P3)

## Packet Metadata

- Packet id: `plan-38-shape-puzzle-page-investigation`
- Packet title: Shape Puzzle Page Investigation (P3)
- Status: (see frontmatter)
- Owner/model: investigator (single)
- Date: 2026-10-18
- Packet type: investigation + throwaway prototype
- Mutation level: generated-local. Prototypes go under `local/` only. Production source does not change. The only tracked output is the report.
- Approval gate: GATE-38A. The owner reviews the findings and the proposed implementation packet before any implementation.
- Depends on: plan-37, for the shape-set geometry module and at least one validated shape set.
- Expected artifacts: `reports/development/plan-38-shape-puzzle-page-investigation/progress.md`, plus screenshots under `reports/development/plan-38-shape-puzzle-page-investigation/screens/`.

## Goal

Find out how to build P3. P3 is a simple online page at a stable URL (e.g. `puzzle.html?set=shapes-1`) where students shade the regions for an AND/OR/NOT expression over irregular shapes, step by step. The page has a live panel linking each region to its truth-table row, and a notation toggle (words ↔ Java symbols). The page must not inherit the existing app's clutter, and it must not fork the shared semantics. The deliverable is evidence and a proposed implementation packet, not the feature.

## Non-goals

- Shipping the page or editing `ui/` or `src/` production code.
- P2 (build-the-target, with a tap-to-build token palette) or P4 (circuits). Note anything relevant to them, but don't design them.
- Redesigning the existing app. Record observations that apply to it, but leave it alone.

## Why this packet exists

The owner chose P3 as the second step after P1 (DECISION-007), and asked for it to be investigate-first. The current Venn UI has known problems:
- too much chrome around the task;
- set labels sitting on circle crossing points (the "C" label at the A∩B crossing);
- an all-hatched starting canvas that is hard to read as "nothing decided yet".

Reusing it without investigation would carry those problems over. Rebuilding it naively would risk drifting from the shared semantics.

## Authority and contracts

Required reading:

- `AGENTS.md`, `docs/decision-log.md` (DECISION-001, -002, -003, -006, -007), `docs/architecture.md`
- `ui/components/VennDiagram.vue`, `ui/components/VennPractice.vue`, `src/venn/diagram.js`, `vite.config.*`, `.github/workflows/pages.yml`
- plan-37's packet, its progress report, and its `src/shape-puzzles/` module
- Current screenshots: `local/ui-reviews/2026-10-18T20-11-35/` (012–017 Venn, 024 equivalence Venn)

Contracts to preserve in any proposal:

- Shared parser, evaluator, and region semantics (DECISION-001). The page must not reimplement them.
- Static Pages and no student data (DECISION-002). No GAS on this page.
- Keyboard and screen-reader access, plus an exact accessible fallback for the regions (DECISION-003).
- The notation is a display layer, the parser stays unchanged, and any future input uses tap-to-build tokens (DECISION-007).
- The truth-table row order matches `generateTruthTable`.

## Questions and hypotheses

For each question, the report must give the competing options, **the observation that would rule each one out**, the prototype or experiment that tested it, and the result. A winner may be declared only if the rivals were actually ruled out by something observed. Otherwise write "consistent with both", and name the next experiment that would decide between them.

| # | Question | Rival options | Example falsifying observation |
|---|---|---|---|
| Q1 | Hosting | (a) Vite multi-page entry `ui/puzzle.html` in the same build; (b) a separate Vite config/build | (a) is ruled out if the second entry breaks relative `base: './'` asset paths on a Pages-style subpath, or drags the main app's bundle in |
| Q2 | Rendering reuse | (a) reuse `VennDiagram.vue` with polygon-region input; (b) a new lean component that uses only `src/` | (a) is ruled out if irregular-shape regions need props or behavior that leak puzzle concerns into the AP app, or if label placement can't move outside the shapes without forking |
| Q3 | Region interaction | (a) keep tri-state neutral/selected/available; (b) two-state shade/unshade with an explicit "done" | Decide with screenshots of both, judged against the "nothing decided yet" legibility problem. If both read equally well, defer to the owner |
| Q4 | Labels | (a) labels outside the shapes with leader lines; (b) colour-coded outline plus legend; (c) both | Ruled out if the result is unreadable at Chromebook width (about 1366×768) or in greyscale |
| Q5 | Region ↔ row panel | (a) a full truth table with the hovered or focused row highlighted; (b) only the current row | Ruled out if it doesn't fit next to the diagram at 1366×768 without scrolling |
| Q6 | Stepwise flow | (a) the existing subexpression-by-subexpression steps; (b) the whole expression in one step, with an optional "break it down" | Pedagogy call for the owner. Provide screenshots of both on one 3-variable set |

Sweep what reality varies:
- viewports: 1366×768 Chromebook, 1280×720 projector, 390×844 phone;
- greyscale rendering;
- keyboard-only use;
- 2- and 3-variable sets, including one with a split (disconnected) row region from plan-37.

## Scope

### In scope

- Throwaway prototypes under `local/plan-38-prototype/`. They may import `src/` modules. They may not be imported by production code.
- Screenshots via Playwright or the existing capture tooling, saved into the report folder.
- A proposed implementation packet outline (goal, scope, files, tests, gates) for owner review.
- Observations on the existing Venn mode (label placement, hatched start) for a separate BP cleanup packet.

### Out of scope

- Any tracked change outside `reports/development/plan-38-shape-puzzle-page-investigation/`.
- Dependency installs. If a prototype seems to need one, record that as a finding.
- Deploys, workflow edits, push.

## Validation Checklist

- [ ] Each of Q1–Q6 has its options, the observation that would rule each out, the experiment run, the result, and a conclusion (or "consistent with both" plus the next experiment).
- [ ] Screenshots cover the viewport, greyscale, and keyboard sweep listed above.
- [ ] The proposed implementation packet outline names its files, tests, and gates.
- [ ] `git status` shows only report-folder changes, since `local/` is ignored.
- [ ] The progress report states what was verified and how.

## Stop Conditions

Stop and report if:

- plan-37's geometry module isn't available or doesn't fit the page's needs;
- any option requires a parser change or a new runtime dependency;
- the investigation can't proceed without editing production `src/` or `ui/`.

## Progress Report

`reports/development/plan-38-shape-puzzle-page-investigation/progress.md`

Minimum contents:
- the findings per question;
- the screenshot index;
- the proposed implementation packet outline;
- owner decisions needed;
- observations on the existing Venn mode;
- commands run;
- ready for orchestrator review: yes/no.

Implementers do not set packet status.
