# Open Questions

This file lists questions that are **genuinely unresolved** — pending investigation, prototype, or owner decision. Resolved questions move to `docs/decision-log.md`.

## General / architecture

1. **Future student-data policy**
   - Needs: owner decision on any future GAS/Sheets retention period, access roles, deletion process, or teacher-facing export beyond the currently documented submission boundary.
   - Current constraint: do not add identity collection, persistence, or access behavior until that decision is recorded.

2. **Numeric predicate expansion**
   - Needs: owner-approved packet and tests before expanding beyond authored numeric comparison shapes or introducing any freeform Java/object notation.
   - Current constraint: preserve the finite authored knowledge graph and student-facing numeric-variable explanation.

## Process / workflow

3. **Adaptive assignment productionization**
   - Needs: evidence and an owner-approved implementation packet before wiring the Plan 22 adaptive design into classroom assignment mode.
   - Current constraint: the adaptive selector remains a deterministic design/prototype, not an implicit production feature.

4. **Bootstrap capability sync policy**
   - Needs: a future owner choice about how aggressively this consumer should pick up Bootstrap version changes and whether local adaptations should be mirrored upstream.
   - Current constraint: use the adoption manifest and tracked audit; do not copy Bootstrap self-maintenance backlog into this repository.
