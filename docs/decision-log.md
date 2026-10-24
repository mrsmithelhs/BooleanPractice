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

### DECISION-007 — Shape-composition puzzles for the CourseENG Engineering Tech course

**Date:** 2026-10-18

**Decision:** Boolean Practice will add shape-composition Boolean puzzles for the owner's Engineering Tech course (CourseENG). Irregular 2D shapes act as sets, combined according to a stated AND/OR/NOT expression. The work is built here and consumed by CourseENG.

- **Sequence:**
  - P1, hidden-picture printables (plan-37), is first and is targeted at the M42–M44 block (Oct 26–28, 2026).
  - P3, an online "shade the expression" page, is next and is investigate-first (plan-38).
  - P2 (build-the-target) and P4 (circuit ↔ picture) stay on the roadmap for later.
- **Notation:**
  - These puzzles show AND / OR / NOT words, with a toggle that shows the Java symbols.
  - This is a display layer only. The parser grammar is unchanged.
  - Any later student expression input uses tap-to-build tokens, not free typing.
  - The AP CSA practice surfaces keep Java symbols.
- **Content constraints:**
  - grade-8 reading level, 2 or 3 variables;
  - every truth-table row on a printable has a region (validator-enforced);
  - keys show the revealed picture plus the TRUE rows;
  - letter-size, black-and-white printing, with shapes distinguished without colour;
  - no PLTW material, no student data.
- **Consumption contract:**
  - the online sets get stable GitHub Pages URLs;
  - a per-set manifest lists the set id, sheet ids, expressions in words and symbols, the BP source commit, and a SHA-256 hash per file;
  - CourseENG copies the files and records the commit and hashes. Pages deploys stay the owner's manual action.
- **Answer keys** are never committed or published.
- **Printable distribution:** all printable output, student sheets and keys alike, goes only to the git-ignored `local/exports/printables/<set-id>/`, and CourseENG copies it from there. The owner decided this directly on 2026-10-18. Publishing student PDFs on Pages may be revisited later (`docs/open-questions.md`).

**Rationale:** The owner wants the visual, experiment-and-see appeal of shape-combining games, but with the abstraction made explicit (region ↔ truth-table row ↔ expression), for students who are not AP CSA. The geometry pipeline already uses exact polygon clipping, so irregular shapes keep the region ↔ row mapping exact. Printables can land before the October block. The online page needs investigation so it doesn't inherit the main app's clutter or fork the shared semantics.

**Source:** The owner decided on 2026-10-18. The decision was relayed by the CourseENG orchestrator session, which the owner authorized for cross-project coordination.

**Supersedes / related:** DECISION-001, DECISION-002, DECISION-003; plan-37, plan-38.

### DECISION-008 — Shape puzzle page (P3) interaction design

**Date:** 2026-10-24

**Decision:** The online shape-puzzle page (plan-39) works as follows:

- It is a second Vite entry (`puzzle.html`) on the existing static build, with its own lean components and no reuse of `VennDiagram.vue`.
- **Shading:** two-state, starting clean (no hatching).
- **Shapes:** colored outlines plus plan-37 line styles, with outside labels.
- **Truth table:** full table beside the diagram on desktop, compact inspector on narrow screens. Whole expression in one step, with an optional breakdown.
- **Order of work:** students fill the truth-table output column themselves, and shading is checked only after the outputs are correct.
- **Answer keys:** none on the student surface. The teacher view is only behind `?teacher=1`.

**Rationale:** plan-38's evidence:
- greyscale ruled out color-only labels;
- the tri-state's hatched start hurt legibility;
- the full table fits at 1366×768.

The orchestrator's review found that the prototype's pre-filled output column turned the puzzle into coloring, which conflicts with the project's prediction-first contract (DECISION-006).

**Source:** The owner accepted the six GATE-38A recommendations directly on 2026-10-24.

**Supersedes / related:** DECISION-003, DECISION-006, DECISION-007; plan-38, plan-39.

## Proposed but not yet accepted

*(No new proposals were created by Plan 34. Unresolved owner decisions belong in `docs/open-questions.md`.)*
