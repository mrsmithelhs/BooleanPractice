# Plan 09: Visual Upgrade And Accessibility Polish

## Packet Metadata

- Packet id: 09
- Packet title: Visual Upgrade And Accessibility Polish
- Status: ready
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
- Improve mobile, laptop, and projector readability.
- Ensure text does not overlap controls at narrow widths.
- Provide visible focus states, sufficient contrast, and accessible names.
- Use icons where helpful for controls, but do not rely on decorative clutter.
- Add or update Playwright/accessibility checks where practical.

## Validation Checklist

- [ ] Main flows are readable at desktop and mobile sizes.
- [ ] Focus states are visible.
- [ ] Color is not the only feedback channel.
- [ ] The UI looks substantially upgraded from plain Bootstrap.
- [ ] Build and relevant browser checks pass.
