import { describe, expect, it } from 'vitest';
import { validateSheet } from '../src/shape-puzzles/validator.js';
import { createCircle, createPolygon } from '../src/shape-puzzles/shapes.js';

describe('shape puzzle sheet validator', () => {
  it('passes a well-formed 2-variable sheet with sufficient area and inscribed circles', () => {
    // 140 x 100 viewBox. Two overlapping circles with ample margin.
    const shapeA = createCircle({ cx: 55, cy: 50, r: 28, segments: 64 });
    const shapeB = createCircle({ cx: 85, cy: 50, r: 28, segments: 64 });

    const sheet = {
      id: 'test-pass-01',
      title: 'Valid Crescent Moon',
      variables: ['A', 'B'],
      shapes: { A: shapeA, B: shapeB },
      expression: 'a && !b',
      intendedTrueRows: [2],
      pictureName: 'Crescent Moon',
      showRegionRowNumbers: true,
      viewBox: { width: 140, height: 100 },
    };

    const result = validateSheet(sheet);
    expect(result.valid, result.errors.join('; ')).toBe(true);
    expect(result.metrics.independentCheckPasses).toBe(true);
    expect(result.metrics.evaluatorTrueRows).toEqual([2]);
  });

  it('rejects an independentTrueRows mismatch', () => {
    const shapeA = createCircle({ cx: 55, cy: 50, r: 28, segments: 64 });
    const shapeB = createCircle({ cx: 85, cy: 50, r: 28, segments: 64 });

    const sheet = {
      id: 'test-mismatch',
      title: 'Mismatch Test',
      variables: ['A', 'B'],
      shapes: { A: shapeA, B: shapeB },
      expression: 'a && !b',
      intendedTrueRows: [3], // Wrong! Evaluator produces [2]
      pictureName: 'Crescent Moon',
      viewBox: { width: 140, height: 100 },
    };

    const result = validateSheet(sheet);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Independent picture check failed'))).toBe(true);
  });

  it('rejects an empty minterm or region below minimum area', () => {
    // Two non-overlapping shapes: intersection (row 3, A=1 B=1) is empty!
    const shapeA = createCircle({ cx: 30, cy: 50, r: 15, segments: 64 });
    const shapeB = createCircle({ cx: 110, cy: 50, r: 15, segments: 64 });

    const sheet = {
      id: 'test-empty-minterm',
      title: 'Disjoint Circles',
      variables: ['A', 'B'],
      shapes: { A: shapeA, B: shapeB },
      expression: 'a || b',
      intendedTrueRows: [1, 2],
      viewBox: { width: 140, height: 100 },
    };

    const result = validateSheet(sheet);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('has area 0.0 mm², below minimum'))).toBe(true);
  });

  it('rejects self-intersecting shapes', () => {
    // Figure-eight self-intersecting bowtie
    const bowtie = createPolygon([
      [20, 20],
      [80, 80],
      [80, 20],
      [20, 80],
    ]);
    const shapeB = createCircle({ cx: 70, cy: 50, r: 20 });

    const sheet = {
      id: 'test-self-intersect',
      title: 'Self Intersecting Bowtie',
      variables: ['A', 'B'],
      shapes: { A: bowtie, B: shapeB },
      expression: 'a && b',
      intendedTrueRows: [3],
      viewBox: { width: 140, height: 100 },
    };

    const result = validateSheet(sheet);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('self-intersecting'))).toBe(true);
  });

  it('rejects shapes with too many vertices', () => {
    // Circle with 300 segments -> 300 vertices > 250 threshold
    const shapeA = createCircle({ cx: 55, cy: 50, r: 28, segments: 300 });
    const shapeB = createCircle({ cx: 85, cy: 50, r: 28, segments: 64 });

    const sheet = {
      id: 'test-vertex-limit',
      title: 'Too Many Vertices',
      variables: ['A', 'B'],
      shapes: { A: shapeA, B: shapeB },
      expression: 'a && !b',
      intendedTrueRows: [2],
      viewBox: { width: 140, height: 100 },
    };

    const result = validateSheet(sheet);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('exceeding maximum of 250'))).toBe(true);
  });

  it('rejects expression that is always TRUE or always FALSE', () => {
    const shapeA = createCircle({ cx: 55, cy: 50, r: 28, segments: 64 });
    const shapeB = createCircle({ cx: 85, cy: 50, r: 28, segments: 64 });

    const sheet = {
      id: 'test-tautology',
      title: 'Tautology',
      variables: ['A', 'B'],
      shapes: { A: shapeA, B: shapeB },
      expression: 'a || !a',
      intendedTrueRows: [0, 1, 2, 3],
      viewBox: { width: 140, height: 100 },
    };

    const result = validateSheet(sheet);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('always TRUE') || e.includes('variables'))).toBe(true);
  });
});
