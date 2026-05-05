# Plan 08: Venn Learning UI

## Packet Metadata

- Packet id: 08
- Packet title: Venn Learning UI
- Status: ready
- Owner/model: Codex mini or stronger; browser-capable model recommended
- Date: 2026-05-05
- Packet type: implementation, frontend, accessibility, tests
- Mutation level: source-code, tests
- Approval gate: before choosing canvas-only rendering or dropping keyboard-accessible controls
- Expected artifacts: Venn practice component, three-input UI support, operand previews, tests
- Progress report folder: `reports/development/plan-08-venn-learning-ui/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: rebuild Venn practice on top of the tested region engine, including three-input expressions.
- Non-goals: do not hand-roll separate boolean semantics in the component.
- Depends on: Plans 03, 05, and 06.
- Blocks: visual polish and E2E tests.
- Why this packet exists: Venn diagrams can make boolean expressions spatial, but only if the interaction is accurate and accessible.

## Implementation Requirements

- Render one-, two-, and three-variable region selection using the region engine and its stable region ids.
- Include a keyboard-accessible region list or controls even if a visual diagram is present.
- Show current subexpression and operand previews for multi-step expressions.
- Provide missed/extra feedback by region label and not only by color or shape.
- Avoid `alert()` for learning feedback.
- Keep the visual diagram and accessible controls synchronized from the same source of truth.
- Add tests for region selection, checking, step advancement, keyboard operation, and three-variable expressions.
- Keep the component dependent on shared region/evaluator logic; do not create a second Venn rule engine.

## Required Behavior

- Every selectable region must be reachable without a pointer device.
- The active expression and current step should stay visible while selecting regions.
- Feedback should name the missed or extra regions so students can correct specific reasoning.

## Stop Conditions

- If the packet starts to drift toward canvas-only controls, stop and confirm before proceeding.
- If a different region-id or region-label scheme is needed, stop because the shared engine contract must stay aligned.

## Validation Checklist

- [ ] Three-variable Venn problems can be completed.
- [ ] Keyboard users can select all regions.
- [ ] Visual and accessible region controls stay in sync.
- [ ] Tests cover missed and extra region feedback.
- [ ] Region labels are readable in feedback and controls.
- [ ] No separate Venn semantics are introduced in the component.
