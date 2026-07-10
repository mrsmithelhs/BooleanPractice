---
id: plan-09
title: "Visual Upgrade And Accessibility Polish"
status: complete
depends_on: [plan-06, plan-07, plan-08]
gate: "before broad redesign or adding heavy visual dependencies"
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "give the migrated app a significant visual upgrade while preserving classroom clarity."
---
# Plan 09: Visual Upgrade And Accessibility Polish

## Packet Metadata

- Packet id: 09
- Packet title: Visual Upgrade And Accessibility Polish
- Status: (see frontmatter)
- Owner/model: Codex mini or stronger; browser-capable model recommended
- Date: 2026-05-05
- Packet type: implementation, frontend, accessibility, visual QA
- Mutation level: source-code, tests
- Approval gate: before broad redesign or adding heavy visual dependencies
- Expected artifacts: cohesive visual system, responsive layouts, accessibility improvements, browser evidence
- Progress report folder: `reports/development/plan-09-visual-upgrade-accessibility/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: give the migrated app a significant visual upgrade while preserving classroom clarity.
- Non-goals: do not add new learning features or change boolean semantics.
- Depends on: Plans 06, 07, and 08.
- Blocks: final E2E and deployment confidence.
- Why this packet exists: the archive is functional but visually generic; the revised app should feel like a polished learning tool.

## Implementation Requirements

- Create a restrained, domain-specific visual language around expressions, rows, regions, feedback, and progress.
- Use a consistent token system for color, spacing, radius, and typography rather than ad hoc component styling.
- Improve mobile, laptop, and projector readability.
- Ensure text does not overlap controls at narrow widths.
- Provide visible focus states, sufficient contrast, and accessible names.
- Use icons where helpful for controls, but do not rely on decorative clutter.
- Keep the visual upgrade compatible with the classroom learning flow; style must not obscure correct/incorrect reasoning.
- Add or update Playwright/accessibility checks where practical.

## Required Behavior

- The app should feel intentionally designed, not like a default UI kit.
- Visual changes should preserve the meaning of answer states and feedback.
- Responsive behavior must work at narrow mobile widths and wide classroom/projector widths.

## Stop Conditions

- If the only path to a prettier UI would add heavy dependencies or obscure semantics, stop and report.
- If the redesign proposal would change feedback meaning, pause for approval before proceeding.

## Validation Checklist

- [ ] Main flows are readable at desktop and mobile sizes.
- [ ] Focus states are visible.
- [ ] Color is not the only feedback channel.
- [ ] The UI looks substantially upgraded from plain Bootstrap.
- [ ] Build and relevant browser checks pass.
- [ ] Typography, spacing, and color are consistent across views.
- [ ] No learning state is hidden behind decorative styling.
