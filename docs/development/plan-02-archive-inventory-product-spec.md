---
id: plan-02
title: "Archive Inventory And Product Spec"
status: complete
depends_on: [plan-01]
gate: ""
superseded_by: null
resolution: "Existing packet status was already complete before this migration; see the packet progress report for historical evidence."
summary: "turn archive observations into durable product, pedagogy, and architecture contracts."
---
# Plan 02: Archive Inventory And Product Spec

## Packet Metadata

- Packet id: 02
- Packet title: Archive Inventory And Product Spec
- Status: (see frontmatter)
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
- Depends on: Plan 01 preferred, `docs/reports/archive-app-review.md`, `archive/Index.html`, `archive/Code.js`.
- Blocks: parser, catalog, and UI packets.
- Why this packet exists: the project needs a shared target before implementation agents start making design decisions.

## Scope

In scope:

- Inventory current features, problems, and behavior from `archive/Index.html` and `archive/Code.js`.
- Write or update `docs/product-spec.md` with MVP learning goals, target users, core workflows, and explicit non-goals.
- Write or update `docs/architecture.md` with module boundaries, ownership of boolean semantics, and static deployment assumptions.
- Define the supported boolean expression contract at a product level: `!`, `&&`, `||`, parentheses, variables, and boolean literals.
- Define MVP user flows for truth table and Venn practice, including how a student starts a problem, checks work, and sees feedback.
- Document deferred enhancements and unresolved product questions separately from MVP decisions.

Out of scope:

- Do not write code.
- Do not choose final visual styling beyond principles.
- Do not expand into later packet implementation details such as UI component structure, parser internals, or rendering mechanics.

## Authority And Contracts

Use these as sources of truth while writing the docs:

- `docs/reports/archive-app-review.md`
- `docs/project-structure.md`
- `docs/development/README.md`
- `archive/Index.html`
- `archive/Code.js`

The packet must not redefine:

- truth table and Venn modes share one boolean source of truth
- Venn mode supports one, two, and three variables
- the app is static and deployable to GitHub Pages
- AP CSA-style boolean operators and precedence are required
- the archive remains reference-only

## Validation Checklist

- [ ] Product spec defines learning goals and MVP flows.
- [ ] Architecture doc defines source boundaries and deployment assumptions.
- [ ] Supported boolean syntax is documented once, with no competing grammar description.
- [ ] Deferred decisions and open questions are called out explicitly.
- [ ] Technical debts from the archive are captured.
- [ ] Stop points or unresolved decisions are listed.
