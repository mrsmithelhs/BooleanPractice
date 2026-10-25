import { describe, expect, it } from 'vitest';
import { validateSheet } from '../src/shape-puzzles/validator.js';
import { SET_SHAPES_2 } from '../src/shape-puzzles/sets/shapes-2.js';
import { computeSheetGiveaway } from '../src/shape-puzzles/giveaway.js';
import {
  buildShapeRegions,
  multiPolygonArea,
} from '../src/shape-puzzles/geometry.js';
import {
  createRectangle,
  intersectShapes,
  unionShapes,
} from '../src/shape-puzzles/shapes.js';

function distPtSeg(p, a, b) {
  const l2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * (b[0] - a[0])), p[1] - (a[1] + t * (b[1] - a[1])));
}

describe('shapes-2 set validator and giveaway', () => {
  it('validates every sheet and candidate in shapes-2', () => {
    const allCandidates = Object.values(SET_SHAPES_2.slots).flat();
    expect(allCandidates.length).toBe(10);

    for (const cand of allCandidates) {
      const result = validateSheet(cand);
      expect(result.valid, `Sheet ${cand.id} failed: ${result.errors.join('; ')}`).toBe(true);
      expect(result.metrics.independentCheckPasses).toBe(true);
      expect(result.metrics.evaluatorTrueRows.length).toBe(cand.intendedTrueRows.length);
    }
  });

  it('validates tier field on extension sheets 5 and 6', () => {
    for (const cand of SET_SHAPES_2.slots.slot5) {
      expect(cand.tier).toBe('extension');
    }
    for (const cand of SET_SHAPES_2.slots.slot6) {
      expect(cand.tier).toBe('extension');
    }
    // Slots 1 to 4 do not have tier: 'extension'
    for (let i = 1; i <= 4; i += 1) {
      for (const cand of SET_SHAPES_2.slots[`slot${i}`]) {
        expect(cand.tier).toBeUndefined();
      }
    }
  });

  it('computes giveaway metric for every candidate without errors', () => {
    const allCandidates = Object.values(SET_SHAPES_2.slots).flat();

    for (const cand of allCandidates) {
      const metric = computeSheetGiveaway(cand);
      expect(metric.maxIou).toBeGreaterThan(0);
      expect(metric.byShape).toBeDefined();
      expect(metric.allShapes).toBeDefined();
      expect(typeof metric.flagged).toBe('boolean');
      expect(metric.flagged, `Candidate ${cand.id} unexpectedly flagged with IoU ${metric.maxIou}`).toBe(false);
    }
  });

  // R2: Real, declared decoys on sheets 4, 5, 6
  it('validates real declared decoys on slots 4, 5, and 6 (R2)', () => {
    const decoyCandidates = [
      ...SET_SHAPES_2.slots.slot4,
      ...SET_SHAPES_2.slots.slot5,
      ...SET_SHAPES_2.slots.slot6,
    ];

    expect(decoyCandidates.length).toBe(4);

    for (const cand of decoyCandidates) {
      // 1. Every decoy sheet has non-empty decoyRows
      expect(Array.isArray(cand.decoyRows), `Candidate ${cand.id} missing decoyRows array`).toBe(true);
      expect(cand.decoyRows.length, `Candidate ${cand.id} has empty decoyRows`).toBeGreaterThan(0);

      const regions = buildShapeRegions({
        variables: cand.variables,
        shapes: cand.shapes,
        framePolygon: createRectangle({ x: 0, y: 0, width: cand.viewBox?.width ?? 180, height: cand.viewBox?.height ?? 95 }),
      });

      const trueGeoms = cand.intendedTrueRows.map((r) => regions[r].geometry);
      const pictureGeom = unionShapes(...trueGeoms);

      for (const decoyRow of cand.decoyRows) {
        // 2. Every decoy row is FALSE under the expression
        expect(
          cand.intendedTrueRows.includes(decoyRow),
          `Candidate ${cand.id} decoy row ${decoyRow} is TRUE; must be FALSE under expression`
        ).toBe(false);

        const decoyRegion = regions[decoyRow];
        expect(decoyRegion, `Decoy row ${decoyRow} not found in regions for ${cand.id}`).toBeDefined();

        // 3. Each decoy row's printed area is at least 150 mm²
        const area = multiPolygonArea(decoyRegion.geometry);
        expect(
          area,
          `Candidate ${cand.id} decoy row ${decoyRow} area (${area.toFixed(1)} mm²) must be >= 150 mm²`
        ).toBeGreaterThanOrEqual(150);

        // 4. Each decoy row touches the picture (shares a boundary with a TRUE region)
        // Check by joining decoy and picture: union area must equal sum of areas (no overlap),
        // and boundary contact means union has fewer disconnected boundaries or buffer test touches.
        const un = unionShapes(decoyRegion.geometry, pictureGeom);
        const unArea = multiPolygonArea(un);
        const picArea = multiPolygonArea(pictureGeom);
        // Union area equals sum of areas within floating precision (they don't overlap)
        expect(Math.abs(unArea - (area + picArea))).toBeLessThan(1.0);

        // Test touching by verifying boundary proximity <= 0.05mm
        let touches = false;
        const mpDecoy = decoyRegion.geometry;
        const mpPic = pictureGeom;
        for (const polyD of mpDecoy) {
          for (const ringD of polyD) {
            for (const ptD of ringD) {
              for (const polyP of mpPic) {
                for (const ringP of polyP) {
                  for (let i = 0; i < ringP.length - 1; i += 1) {
                    if (distPtSeg(ptD, ringP[i], ringP[i + 1]) < 0.05) {
                      touches = true;
                      break;
                    }
                  }
                  if (touches) break;
                }
                if (touches) break;
              }
              if (touches) break;
            }
            if (touches) break;
          }
          if (touches) break;
        }
        expect(touches, `Candidate ${cand.id} decoy row ${decoyRow} must share a boundary with the true picture`).toBe(true);
      }
    }
  });

  // R3: Distinctness test across candidates
  it('enforces distinctness: no byte-identical shapes and pairwise IoU < 0.60 (R3)', () => {
    const allCandidates = Object.values(SET_SHAPES_2.slots).flat();
    const shapeHashes = new Set();
    const pictures = {};

    for (const cand of allCandidates) {
      // 1. No two candidates share a byte-identical shape
      for (const [varName, geom] of Object.entries(cand.shapes)) {
        const hash = JSON.stringify(geom);
        expect(
          shapeHashes.has(hash),
          `Candidate ${cand.id} shape ${varName} is byte-identical to another candidate shape`
        ).toBe(false);
        shapeHashes.add(hash);
      }

      const regions = buildShapeRegions({
        variables: cand.variables,
        shapes: cand.shapes,
        framePolygon: createRectangle({ x: 0, y: 0, width: cand.viewBox?.width ?? 180, height: cand.viewBox?.height ?? 95 }),
      });
      const trueGeoms = cand.intendedTrueRows.map((r) => regions[r].geometry);
      pictures[cand.id] = unionShapes(...trueGeoms);
    }

    // 2. Pairwise picture IoU < 0.60
    const ids = allCandidates.map((c) => c.id);
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const idA = ids[i];
        const idB = ids[j];
        const geomA = pictures[idA];
        const geomB = pictures[idB];
        const inter = intersectShapes(geomA, geomB);
        const un = unionShapes(geomA, geomB);
        const aInter = multiPolygonArea(inter);
        const aUnion = multiPolygonArea(un);
        const iou = aUnion > 0 ? aInter / aUnion : 0;
        expect(
          iou,
          `High pairwise IoU between ${idA} and ${idB}: ${iou.toFixed(3)} >= 0.60`
        ).toBeLessThan(0.60);
      }
    }
  });
});
