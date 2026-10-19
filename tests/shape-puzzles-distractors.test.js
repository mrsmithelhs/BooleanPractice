import { describe, expect, it } from 'vitest';
import { generateDistractors } from '../src/shape-puzzles/distractors.js';
import { buildShapeRegions } from '../src/shape-puzzles/geometry.js';
import { createCircle, createRectangle } from '../src/shape-puzzles/shapes.js';

describe('distractor & wrong-answer generator', () => {
  it('generates deduplicated distractors excluding equivalent expressions', () => {
    const frame = createRectangle({ x: 0, y: 0, width: 100, height: 100 });
    const shapeA = createCircle({ cx: 40, cy: 50, r: 25, segments: 64 });
    const shapeB = createCircle({ cx: 60, cy: 50, r: 25, segments: 64 });
    const shapes = { A: shapeA, B: shapeB };
    const variables = ['A', 'B'];

    const regions = buildShapeRegions({ variables, shapes, framePolygon: frame });

    // Correct expression: a && !b (moon crescent)
    const result = generateDistractors({
      expression: 'a && !b',
      variables,
      regions,
    });

    expect(result.correctExpressionWords).toBe('A AND NOT(B)');
    expect(result.distractors.length).toBeGreaterThan(0);

    // No distractor should have the exact same true rows as the correct expression
    for (const d of result.distractors) {
      expect(d.trueRows).not.toEqual(result.correctTrueRows);
      // All IoU values should be between 0 and 1
      expect(d.iou).toBeGreaterThanOrEqual(0);
      expect(d.iou).toBeLessThanOrEqual(1);
    }

    // Must detect single complete shape when mutant is 'A' (e.g. from replace-with-left)
    const shapeADistractor = result.distractors.find((d) => d.singleCompleteShape === 'A');
    expect(shapeADistractor).toBeDefined();
    expect(shapeADistractor.flags).toContain('single complete shape: A');
  });
});
