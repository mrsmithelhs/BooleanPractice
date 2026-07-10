# Decision Log

This file records decisions that should guide future work. New entries should include a date and rationale.

**Append-only.** Do not edit or remove entries. If a decision is superseded, add a new entry that references the old one.

This file is orchestrator/owner-owned. Implementers propose but do not edit.

## Accepted decisions

### DECISION-001 — Shared boolean semantics

**Date:** 2026-07-10

**Decision:** The parser, evaluator, truth-table generator, Venn region engine, and authored catalog data in `src/` are the shared semantic source of truth for all Vue practice modes and optional classroom output.

**Rationale:** The architecture and product specification require truth-table and Venn representations to agree, and keeping semantics outside Vue prevents mode-specific drift.

**Supersedes / related:** `docs/architecture.md`, Plans 03, 05, 07, 08, 14, 16, and 17.

### DECISION-002 — Static-first deployment boundary

**Date:** 2026-07-10

**Decision:** GitHub Pages remains the primary static deployment target with no runtime backend, user accounts, or server-side persistence. GAS/Sheets is an optional separately packaged classroom surface generated from shared source.

**Rationale:** This preserves reproducible classroom deployment while allowing the optional submission and assignment workflows to retain their explicit integration boundary.

**Supersedes / related:** `docs/product-spec.md`, `docs/architecture.md`, `docs/deployment.md`, Plans 20 and 21.

### DECISION-003 — Venn representation contract

**Date:** 2026-07-10

**Decision:** Venn mode supports one, two, and three variables using stable alphabetical assignment ordering, interactive SVG region controls, keyboard access, and a precise fallback region surface. Basic set identifiers remain visible and detailed labels are optional and off by default.

**Rationale:** This combines the established Venn engine contract with the later visual/accessibility decisions recorded in Plans 29 and 31.

**Supersedes / related:** `docs/architecture.md`, Plans 05, 08, 29, and 31.

### DECISION-004 — Authored predicate boundary

**Date:** 2026-07-10

**Decision:** Numeric predicate atoms are authored AP CSA-style presentation mappings to simple boolean variables. The app does not infer arbitrary Java syntax and does not support dot notation, object fields, methods, arrays, or collections through predicate labels.

**Rationale:** The product needs realistic numeric conditions without making the student-facing model or parser an open-ended Java interpreter.

**Supersedes / related:** `docs/architecture.md`, `docs/numeric-relational-equivalence.md`, Plans 23 and 24.

### DECISION-005 — Packet status authority

**Date:** 2026-07-10

**Decision:** Packet YAML frontmatter is the hand-maintained status source of truth; the README packet index is generated between markers; `blocked` is computed from dependencies; implementers report delivery and the orchestrator/owner controls terminal status transitions.

**Rationale:** This prevents status drift and preserves a review handshake between implementation and closure.

**Supersedes / related:** `docs/workflows/packet-tracking-system.md`, Plan 33.

### DECISION-006 — Practice-first student experience

**Date:** 2026-07-10

**Decision:** The active learning surface takes priority over metadata, hints, history, and reference details. Secondary information may remain available through compact or collapsed disclosures, and feedback should support reasoning without giving away answers prematurely.

**Rationale:** The product and later UI packets identify active practice, clarity, accessibility, and recovery from mistakes as the primary student experience.

**Supersedes / related:** `docs/product-spec.md`, Plans 12, 28, 30, and 31.

## Proposed but not yet accepted

*(No new proposals were created by Plan 34. Unresolved owner decisions belong in `docs/open-questions.md`.)*
