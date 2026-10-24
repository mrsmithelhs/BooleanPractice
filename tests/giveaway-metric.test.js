import { describe, expect, it } from 'vitest';
import { computeSheetGiveaway, GIVEAWAY_FLAG_THRESHOLD } from '../src/shape-puzzles/giveaway.js';
import { createCircle, createRectangle } from '../src/shape-puzzles/shapes.js';
import {
  sheetSlot1CandBGem,
  sheetSlot1CandCSun,
  sheetSlot2CandARocket,
  sheetSlot2CandBHouse,
} from '../src/shape-puzzles/sets/shapes-1.js';

describe('giveaway metric', () => {
  it('flags when picture is one whole shape (IoU = 1.0 with shape A)', () => {
    // 2-shape sheet where expression is just 'a'
    const shapeA = createCircle({ cx: 70, cy: 48, r: 25, segments: 32 });
    const shapeB = createCircle({ cx: 110, cy: 48, r: 25, segments: 32 });

    const fixture = {
      id: 'fixture-single-shape-a',
      variables: ['A', 'B'],
      shapes: { A: shapeA, B: shapeB },
      expression: 'a',
      intendedTrueRows: [2, 3], // Row 2: A and !B, Row 3: A and B
      viewBox: { width: 180, height: 95 },
    };

    const metric = computeSheetGiveaway(fixture);

    expect(metric.byShape.A.iou).toBe(1.0);
    expect(metric.byShape.A.flagged).toBe(true);
    expect(metric.flagged).toBe(true);
    expect(metric.flags.some((f) => f.includes('shape A'))).toBe(true);
  });

  it('flags when picture is the union of all shapes (IoU = 1.0 with all shapes union)', () => {
    const shapeA = createCircle({ cx: 70, cy: 48, r: 25, segments: 32 });
    const shapeB = createCircle({ cx: 110, cy: 48, r: 25, segments: 32 });

    const fixture = {
      id: 'fixture-all-shapes-union',
      variables: ['A', 'B'],
      shapes: { A: shapeA, B: shapeB },
      expression: 'a || b',
      intendedTrueRows: [1, 2, 3], // All rows except row 0 (!A and !B)
      viewBox: { width: 180, height: 95 },
    };

    const metric = computeSheetGiveaway(fixture);

    expect(metric.allShapes.iou).toBe(1.0);
    expect(metric.allShapes.flagged).toBe(true);
    expect(metric.flagged).toBe(true);
    expect(metric.flags.some((f) => f.includes('all shapes union'))).toBe(true);
  });

  it('does not flag an expression with low IoU across all shapes', () => {
    // A small overlap between two large shapes
    const shapeA = createRectangle({ x: 10, y: 10, width: 90, height: 75 });
    const shapeB = createRectangle({ x: 80, y: 10, width: 90, height: 75 });

    // Intersection is x: 80..100, width 20, height 75
    // Shape A area: 90*75 = 6750. Overlap area: 20*75 = 1500.
    // IoU with A: 1500 / 6750 = 0.222 < 0.75
    const fixture = {
      id: 'fixture-low-overlap',
      variables: ['A', 'B'],
      shapes: { A: shapeA, B: shapeB },
      expression: 'a && b',
      intendedTrueRows: [3],
      viewBox: { width: 180, height: 95 },
    };

    const metric = computeSheetGiveaway(fixture);

    expect(metric.byShape.A.iou).toBeLessThan(GIVEAWAY_FLAG_THRESHOLD);
    expect(metric.byShape.B.iou).toBeLessThan(GIVEAWAY_FLAG_THRESHOLD);
    expect(metric.allShapes.iou).toBeLessThan(GIVEAWAY_FLAG_THRESHOLD);
    expect(metric.flagged).toBe(false);
  });

  it('computes correct giveaway metrics on shapes-1 sheets', () => {
    // Mystery Picture 1 (Sun: A && !B)
    const sunMetric = computeSheetGiveaway(sheetSlot1CandCSun);
    expect(sunMetric.byShape.A).toBeDefined();
    expect(sunMetric.byShape.B).toBeDefined();
    expect(sunMetric.allShapes).toBeDefined();
    // Sun is A (circle) minus horizon (B), so A carries the sun rim
    expect(typeof sunMetric.byShape.A.iou).toBe('number');

    // Mystery Picture 2 (Gem: A && B)
    const gemMetric = computeSheetGiveaway(sheetSlot1CandBGem);
    expect(gemMetric.byShape.A).toBeDefined();
    expect(gemMetric.byShape.B).toBeDefined();

    // Mystery Picture 3 (Cabin: A && !B || C)
    const cabinMetric = computeSheetGiveaway(sheetSlot2CandBHouse);
    expect(cabinMetric.byShape.A).toBeDefined();
    expect(cabinMetric.byShape.B).toBeDefined();
    expect(cabinMetric.byShape.C).toBeDefined();

    // Mystery Picture 4 (Rocket: (A || B) && !C)
    const rocketMetric = computeSheetGiveaway(sheetSlot2CandARocket);
    expect(rocketMetric.byShape.A).toBeDefined();
    expect(rocketMetric.byShape.B).toBeDefined();
    expect(rocketMetric.byShape.C).toBeDefined();
  });
});
