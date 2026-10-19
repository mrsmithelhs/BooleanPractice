import { describe, expect, it } from 'vitest';
import {
  buildShapeRegions,
  findPoleOfInaccessibility,
  isPointInMultiPolygon,
  polygonArea,
} from '../src/shape-puzzles/geometry.js';
import {
  createCircle,
  createRectangle,
} from '../src/shape-puzzles/shapes.js';

describe('shape puzzle geometry engine', () => {
  it('computes accurate polygon areas', () => {
    const rect = createRectangle({ x: 0, y: 0, width: 20, height: 10 });
    expect(polygonArea(rect)).toBeCloseTo(200, 1);

    const circle = createCircle({ cx: 50, cy: 50, r: 10, segments: 128 });
    // pi * r^2 = 314.159...
    expect(polygonArea(circle)).toBeCloseTo(Math.PI * 100, 0);
  });

  it('computes the largest inscribed circle via pole of inaccessibility', () => {
    // A 20 x 10 rectangle has an inscribed circle of diameter 10 and center (10, 5)
    const rect = createRectangle({ x: 0, y: 0, width: 20, height: 10 });
    const pole = findPoleOfInaccessibility(rect, 0.05);

    expect(pole.x).toBeCloseTo(10, 1);
    expect(pole.y).toBeCloseTo(5, 1);
    expect(pole.diameter).toBeCloseTo(10, 0.5);
  });

  it('builds regions where grid points agree with evaluate logic for 2 variables', () => {
    const frame = createRectangle({ x: 0, y: 0, width: 100, height: 100 });
    // Shape A: circle at (40, 50), r=25
    const shapeA = createCircle({ cx: 40, cy: 50, r: 25, segments: 64 });
    // Shape B: circle at (60, 50), r=25
    const shapeB = createCircle({ cx: 60, cy: 50, r: 25, segments: 64 });

    const shapes = { A: shapeA, B: shapeB };
    const variables = ['A', 'B'];

    const regions = buildShapeRegions({
      variables,
      shapes,
      framePolygon: frame,
    });

    expect(regions).toHaveLength(4);

    // Sum of all 4 region areas should equal frame area (100 * 100 = 10000)
    const totalRegionArea = regions.reduce((sum, r) => sum + r.totalAreaMm2, 0);
    expect(totalRegionArea).toBeCloseTo(10000, 0);

    // Test a grid of points
    for (let x = 5; x < 95; x += 5) {
      for (let y = 5; y < 95; y += 5) {
        const inA = isPointInMultiPolygon(x, y, shapeA);
        const inB = isPointInMultiPolygon(x, y, shapeB);
        const expectedBits = `${inA ? '1' : '0'}${inB ? '1' : '0'}`;
        const expectedRegionId = Number.parseInt(expectedBits, 2);

        // Find which region contains (x, y)
        const containingRegions = regions.filter((r) => isPointInMultiPolygon(x, y, r.geometry));

        // If point is strictly inside one region (not on exact boundary)
        if (containingRegions.length === 1) {
          expect(containingRegions[0].id).toBe(expectedRegionId);
          expect(containingRegions[0].bits).toBe(expectedBits);
        }
      }
    }
  });

  it('builds regions where grid points agree with evaluate logic for 3 variables', () => {
    const frame = createRectangle({ x: 0, y: 0, width: 120, height: 100 });
    const shapeA = createCircle({ cx: 50, cy: 45, r: 25, segments: 64 });
    const shapeB = createCircle({ cx: 70, cy: 45, r: 25, segments: 64 });
    const shapeC = createCircle({ cx: 60, cy: 65, r: 25, segments: 64 });

    const shapes = { A: shapeA, B: shapeB, C: shapeC };
    const variables = ['A', 'B', 'C'];

    const regions = buildShapeRegions({
      variables,
      shapes,
      framePolygon: frame,
    });

    expect(regions).toHaveLength(8);

    const totalRegionArea = regions.reduce((sum, r) => sum + r.totalAreaMm2, 0);
    expect(totalRegionArea).toBeCloseTo(12000, 0);

    for (let x = 10; x < 110; x += 10) {
      for (let y = 10; y < 90; y += 10) {
        const inA = isPointInMultiPolygon(x, y, shapeA);
        const inB = isPointInMultiPolygon(x, y, shapeB);
        const inC = isPointInMultiPolygon(x, y, shapeC);
        const expectedBits = `${inA ? '1' : '0'}${inB ? '1' : '0'}${inC ? '1' : '0'}`;
        const expectedRegionId = Number.parseInt(expectedBits, 2);

        const containingRegions = regions.filter((r) => isPointInMultiPolygon(x, y, r.geometry));
        if (containingRegions.length === 1) {
          expect(containingRegions[0].id).toBe(expectedRegionId);
        }
      }
    }
  });

  it('guarantees leader line anchor points end on own outline and >= 6 mm from other outlines (R2)', async () => {
    const { SET_SHAPES_1 } = await import('../src/shape-puzzles/sets/shapes-1.js');
    const { distanceToOutline, findOutlineAnchorPoint } = await import('../src/shape-puzzles/geometry.js');

    for (const sheet of SET_SHAPES_1.sheets) {
      for (const v of sheet.variables) {
        const shape = sheet.shapes[v];
        const otherVars = sheet.variables.filter((x) => x !== v);
        const otherShapes = otherVars.map((x) => sheet.shapes[x]);

        const targetAngle = v === 'A' ? Math.PI * 0.85 : v === 'B' ? Math.PI * 0.15 : Math.PI * 1.5;
        const anchor = findOutlineAnchorPoint(shape, otherShapes, {
          targetAngle,
          minClearanceMm: 6.0,
        });

        // 1. Distance to own outline must be approximately 0 (< 0.1 mm)
        const distOwn = distanceToOutline(anchor.x, anchor.y, shape);
        expect(distOwn, `${sheet.id} variable ${v} anchor distance to own outline`).toBeLessThan(0.1);

        // 2. Distance to every other shape outline must be at least 6.0 mm
        if (otherShapes.length > 0) {
          const distOthers = otherShapes.map((s) => distanceToOutline(anchor.x, anchor.y, s));
          const minDistOther = Math.min(...distOthers);
          expect(minDistOther, `${sheet.id} variable ${v} anchor clearance from other outlines`).toBeGreaterThanOrEqual(6.0);
        }
      }
    }
  });

  it('guarantees row-number badge circles lie fully inside their regions with clearance >= 1 mm (R3)', async () => {
    const { SET_SHAPES_1 } = await import('../src/shape-puzzles/sets/shapes-1.js');
    const { buildShapeRegions, pointToPolygonDistance } = await import('../src/shape-puzzles/geometry.js');
    const { createRectangle } = await import('../src/shape-puzzles/shapes.js');

    const badgeRadius = 2.6; // mm
    const minClearance = 1.0; // mm

    const numberedSheets = SET_SHAPES_1.sheets.filter((s) => s.showRegionRowNumbers);
    expect(numberedSheets.length).toBeGreaterThan(0);

    for (const sheet of numberedSheets) {
      const frame = createRectangle({ x: 0, y: 0, width: sheet.viewBox.width, height: sheet.viewBox.height });
      const regions = buildShapeRegions({
        variables: sheet.variables,
        shapes: sheet.shapes,
        framePolygon: frame,
      });

      for (const r of regions) {
        // Distance from center of badge circle to polygon boundary
        const distances = r.geometry.map((poly) => pointToPolygonDistance(r.labelPoint.x, r.labelPoint.y, poly));
        const maxDistInside = Math.max(...distances);

        // maxDistInside is distance from center point to nearest boundary.
        // For the badge circle of radius `badgeRadius` to have clearance >= minClearance:
        // maxDistInside >= badgeRadius + minClearance (2.6 + 1.0 = 3.6 mm)
        expect(
          maxDistInside,
          `Sheet "${sheet.id}" row ${r.id + 1} badge clearance at (${r.labelPoint.x.toFixed(1)}, ${r.labelPoint.y.toFixed(1)})`
        ).toBeGreaterThanOrEqual(badgeRadius + minClearance);
      }
    }
  });
});
