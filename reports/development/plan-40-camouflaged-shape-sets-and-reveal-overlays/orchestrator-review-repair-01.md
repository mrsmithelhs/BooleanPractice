# Plan 40: Orchestrator Review of Repair 01

- Reviewer: BP orchestrator
- Date: 2026-10-25
- Commit reviewed: `1f6c7b9`
- Verdict: **Ready for the owner's pick, with conditions.**
  - Real progress: 10 distinct pictures, and real, declared decoys on sheets 4–6. The overlays are bold once settled.
  - Two set-level problems remain. They don't block the pick, but they must be fixed in the finalize step (work plan step 7): the expressions barely vary, and union outlines trace the picture.

The orchestrator's 4-up contact sheets (outlines only | plain key | overlay | decoy view) are in the git-ignored folder: `local/exports/printables/shapes-2/orchestrator-r1-contact-{1..3}.png`.

## Verified

| Item | How checked | Result |
|---|---|---|
| Suites | Re-ran them myself | 170/170 unit, 51/51 e2e, lint at the 2 old warnings, `build` and `build:gas` OK |
| Distinct geometry | Hashed every candidate's shapes | 10 distinct geometries; no shared shapes. R3 met |
| Decoys | `decoyRows` plus the decoy views | Real on submarine (middle of hull), satellite (middle of bus), falcon (body), and turtle (shell band). R2 met |
| Footer set id | `layout.js` | Explicit `options.setId`, with no prefix guessing. R4 met |
| Bold overlays | My own capture after the animation settled (sun, gem, cabin) | Dark strokes, orange accents, clearly visible. R5 met in the code |
| Screenshots | Opened 01 | **Captured mid-fade.** The capture script grabs the image as soon as the overlay layer appears, about 0.1 s into the 1.2 s fade-in, so screenshot 01 still looks pale. The report described it as bold without noticing |

## Candidate assessment (opened every preview)

| Slot | Candidate | Plain key reads as the object? | Outlines-only leakage | Orchestrator rating |
|---|---|---|---|---|
| 1 | A wrench | No. A long bar with a small tip, no jaws | A and B run nearly parallel about 1 mm apart, which leaves thin bands nobody can shade on paper | Drop |
| 1 | **B cat** | Yes, with the overlay (ears, eyes, whiskers) | Abstract polygons | **Pick** |
| 2 | **A cactus** | Yes | A ∪ B outline traces the cactus | **Pick, but rework (F2)** |
| 2 | B boat | No. Reads as a tent or mountain, because the hull is cut away | Moderate | Weak |
| 3 | **A train** | Yes | A ∪ B outline traces the locomotive | **Pick, but rework (F2)** |
| 3 | B guitar | Mostly | A ∪ B traces the guitar | Second choice |
| 4 | **B submarine** | Yes. The gap in the hull is the decoy | Shape A's outline is a submarine with fins | **Pick, but rework (F2)** |
| 4 | A turtle | Odd, with a hollow shell | Shape A's outline is a turtle-ish head plus shell | Second choice |
| 5 | **A satellite** | Yes | Moderate | **Pick** |
| 6 | **A falcon** | Moderately | Moderate | **Pick** |

## Set-level problems for the finalize step (after the owner's picks)

**F1. Expression variety (packet rule).**
- 7 of 10 candidates use `(A OR B) AND NOT(C)`, and the two slot-1 candidates both use `A AND B`.
- The recommended picks would show students the same expression on sheets 2–5 in a row, and there is no `NOT(...)` around a group anywhere. The packet requires one.
- When finalizing, rework the geometry so that:
  - no two consecutive sheets share an expression structure;
  - at least one sheet uses `NOT(...)` around a group, e.g. the submarine as `A AND NOT(B OR C)`;
  - at least one other structure appears, e.g. `(A AND B) OR C`, or `A OR (B AND NOT(C))`.

**F2. Union-outline leakage.**
- With the `(A OR B) AND NOT(C)` pattern, the outline of A ∪ B *is* the picture's silhouette (cactus, train, guitar, submarine). The R1 claim of "no outline traces the picture" only checked single shapes.
- Extend the giveaway metric: compute the picture's IoU against every single shape, every pairwise union, and every pairwise intersection, and flag any value ≥ 0.75.
- Rework the flagged picks until the outlines-only view no longer shows the object. For example, extend A and B with abstract lobes that C removes. These are mild decoys, so keep them small on the core non-decoy sheets.

**F3. Overlay over student shading.**
- On the sun, the "highlight" arc is a filled white shape covering about a third of the shaded disc.
- Over shaded regions, overlays may use strokes and small accents only, never opaque fills larger than a small accent.
- On badged sheets (the cabin), keep overlay strokes off the row badges.

**F4. Screenshot timing.** Wait for the overlay animation to finish (at least 1.5 s, or wait on `animationend`) before capturing. Re-capture all overlay screenshots.

**F5. Report accuracy, again.** Two R1 claims were not true of the artifacts: "every silhouette immediately recognizable" (the wrench and the boat aren't), and the screenshot descriptions (they show mid-fade). Describe what the image shows.

## Owner decisions

- **Extension label:** "Challenge" is approved (owner, 2026-10-25).
- **Picks:** pending. Recommended: 1B cat, 2A cactus, 3A train, 4B submarine, 5A satellite, 6A falcon. Each is subject to F1–F2 rework in the finalize step.
