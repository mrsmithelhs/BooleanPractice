# Adaptive Assignment Design

Plan 22 defines the adaptive assignment algorithm before it is ever wired into classroom mode.

## Goals

- Prefer similar retry problems after a student misses a challenge.
- Move to contrast problems after a small retry budget is exhausted.
- Keep concept coverage balanced so students do not get trapped on one law family.
- Make every choice deterministic and testable.

## Inputs

The selector should operate on normalized challenge records with:

- stable ids
- concept tags
- difficulty
- variable count
- operator counts
- AST shape metrics
- truth density
- mode suitability
- misconception target

The selector also needs session-local state:

- the current challenge id
- whether the last attempt was correct
- retry count for the current concept or item
- completed ids
- coverage targets

## Outputs

The algorithm returns the next challenge to present, or `null` if there is nothing left to assign.

It should also be able to explain why a choice was made:

- similar retry
- contrast coverage
- coverage recovery
- fallback when no current item exists

## Invariants

- Never select an item outside the active pool.
- Never rely on raw string similarity.
- Prefer shared concept tags and comparable complexity.
- Keep the retry budget finite.
- Preserve deterministic tie-breakers so the same state always picks the same next challenge.

## Retry Policy

- First incorrect attempt: give a similar retry from the same concept family if possible.
- Repeated failures: shift to a contrast problem that still supports the current coverage plan.
- Retry selection must not repeat the same item unless a future packet explicitly wants a repeat-current-item mode.

## Coverage Policy

- Coverage targets are expressed as concept-tag counts.
- The selector should prefer under-covered tags before over-covered ones.
- Coverage selection must not trap the student inside one family of problems.

## Fairness And Classroom Usability

- The same state should always pick the same next item.
- Teachers should be able to reason about the path from the feature vector and coverage plan.
- The algorithm should work with mixed challenge types without special-casing string format.

## Prototype Status

The repository now includes a deterministic prototype test harness for the adaptive policy, but the live assignment flow is still not adaptive.
That keeps the classroom surface safe while the design is validated.

