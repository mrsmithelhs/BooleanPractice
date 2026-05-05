# Plan 02: Archive Inventory And Product Spec

## Packet Metadata

- Packet id: 02
- Packet title: Archive Inventory And Product Spec
- Status: ready
- Owner/model: Codex mini or stronger
- Date: 2026-05-05
- Packet type: scan-only, docs, pedagogy
- Mutation level: docs-only
- Approval gate: none
- Expected artifacts: `docs/product-spec.md`, `docs/architecture.md`, updated archive review notes if needed
- Progress report folder: `reports/development/plan-02-archive-inventory-product-spec/`
- Progress report file: `progress.md`

## Packet Summary

- Goal: turn archive observations into durable product, pedagogy, and architecture contracts.
- Non-goals: do not edit source behavior.
- Depends on: Plan 01 preferred, `docs/reports/archive-app-review.md`.
- Blocks: parser, catalog, and UI packets.
- Why this packet exists: the project needs a shared target before implementation agents start making design decisions.

## Scope

In scope:

- Inventory current features, problems, and behavior from `archive/Index.html` and `archive/Code.js`.
- Define MVP user flows for truth table and Venn practice.
- Define AP CSA-relevant expression grammar.
- Define initial architecture boundaries between `src/` logic and `ui/` components.
- Document deferred enhancements.

Out of scope:

- Do not write code.
- Do not choose final visual styling beyond principles.

## Validation Checklist

- [ ] Product spec defines learning goals and MVP flows.
- [ ] Architecture doc defines source boundaries and deployment assumptions.
- [ ] Technical debts from the archive are captured.
- [ ] Stop points or unresolved decisions are listed.
