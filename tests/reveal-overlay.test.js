import { describe, expect, it } from 'vitest';
import { SET_SHAPES_1 } from '../src/shape-puzzles/sets/shapes-1.js';
import { SET_SHAPES_2 } from '../src/shape-puzzles/sets/shapes-2.js';
import { OVERLAYS_SHAPES_1 } from '../src/shape-puzzles/reveal-overlays/shapes-1.js';
import { OVERLAYS_SHAPES_2 } from '../src/shape-puzzles/reveal-overlays/shapes-2.js';
import {
  OVERLAY_STYLE_DEFINITIONS,
  contrastRatio,
  getSheetOverlay,
} from '../src/shape-puzzles/reveal-overlays/index.js';

const ALLOWED_PRIMITIVES = new Set(['path', 'line', 'polyline', 'circle', 'ellipse', 'polygon']);
const ALLOWED_STYLES = new Set(['detail-stroke', 'detail-fill', 'accent', 'highlight', 'star']);

function extractPoints(pointsStr) {
  if (!pointsStr) return [];
  return pointsStr
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number));
}

function checkPrimitiveBounds(prim, vbWidth, vbHeight) {
  switch (prim.type) {
    case 'line':
      expect(prim.x1).toBeGreaterThanOrEqual(-1);
      expect(prim.x1).toBeLessThanOrEqual(vbWidth + 1);
      expect(prim.y1).toBeGreaterThanOrEqual(-1);
      expect(prim.y1).toBeLessThanOrEqual(vbHeight + 1);
      expect(prim.x2).toBeGreaterThanOrEqual(-1);
      expect(prim.x2).toBeLessThanOrEqual(vbWidth + 1);
      expect(prim.y2).toBeGreaterThanOrEqual(-1);
      expect(prim.y2).toBeLessThanOrEqual(vbHeight + 1);
      break;
    case 'circle':
      expect(prim.cx).toBeGreaterThanOrEqual(0);
      expect(prim.cx).toBeLessThanOrEqual(vbWidth);
      expect(prim.cy).toBeGreaterThanOrEqual(0);
      expect(prim.cy).toBeLessThanOrEqual(vbHeight);
      expect(prim.r).toBeGreaterThan(0);
      break;
    case 'ellipse':
      expect(prim.cx).toBeGreaterThanOrEqual(0);
      expect(prim.cx).toBeLessThanOrEqual(vbWidth);
      expect(prim.cy).toBeGreaterThanOrEqual(0);
      expect(prim.cy).toBeLessThanOrEqual(vbHeight);
      expect(prim.rx).toBeGreaterThan(0);
      expect(prim.ry).toBeGreaterThan(0);
      break;
    case 'polygon':
    case 'polyline': {
      const pts = extractPoints(prim.points);
      expect(pts.length).toBeGreaterThanOrEqual(2);
      for (const [x, y] of pts) {
        expect(x).toBeGreaterThanOrEqual(-1);
        expect(x).toBeLessThanOrEqual(vbWidth + 1);
        expect(y).toBeGreaterThanOrEqual(-1);
        expect(y).toBeLessThanOrEqual(vbHeight + 1);
      }
      break;
    }
    case 'path':
      expect(prim.d).toBeDefined();
      expect(typeof prim.d).toBe('string');
      break;
    default:
      throw new Error(`Unknown primitive type: ${prim.type}`);
  }
}

describe('reveal overlays', () => {
  it('covers all shapes-1 sheets with valid overlays', () => {
    const sheetIds = SET_SHAPES_1.sheets.map((s) => s.id);
    expect(sheetIds.length).toBe(4);

    for (const sheetId of sheetIds) {
      const overlay = OVERLAYS_SHAPES_1[sheetId];
      expect(overlay, `Missing overlay for sheet ${sheetId}`).toBeDefined();
      expect(Array.isArray(overlay)).toBe(true);
      expect(overlay.length).toBeGreaterThan(0);
      expect(overlay.length).toBeLessThanOrEqual(60);

      const sheet = SET_SHAPES_1.sheets.find((s) => s.id === sheetId);
      const vbW = sheet.viewBox?.width ?? 180;
      const vbH = sheet.viewBox?.height ?? 95;

      for (const prim of overlay) {
        expect(ALLOWED_PRIMITIVES.has(prim.type), `Invalid primitive type ${prim.type}`).toBe(true);
        expect(ALLOWED_STYLES.has(prim.style), `Invalid style token ${prim.style}`).toBe(true);
        expect(prim.color).toBeUndefined(); // No raw colors allowed
        expect(prim.stroke).toBeUndefined();
        expect(prim.fill).toBeUndefined();
        checkPrimitiveBounds(prim, vbW, vbH);
      }
    }
  });

  it('covers all shapes-2 sheets and candidates with valid overlays', () => {
    const allCandidates = Object.values(SET_SHAPES_2.slots).flat();
    expect(allCandidates.length).toBe(10);

    for (const cand of allCandidates) {
      const overlay = OVERLAYS_SHAPES_2[cand.id];
      expect(overlay, `Missing overlay for candidate ${cand.id}`).toBeDefined();
      expect(Array.isArray(overlay)).toBe(true);
      expect(overlay.length).toBeGreaterThan(0);
      expect(overlay.length).toBeLessThanOrEqual(60);

      const vbW = cand.viewBox?.width ?? 180;
      const vbH = cand.viewBox?.height ?? 95;

      for (const prim of overlay) {
        expect(ALLOWED_PRIMITIVES.has(prim.type), `Invalid primitive type ${prim.type}`).toBe(true);
        expect(ALLOWED_STYLES.has(prim.style), `Invalid style token ${prim.style}`).toBe(true);
        expect(prim.color).toBeUndefined(); // No raw colors allowed
        expect(prim.stroke).toBeUndefined();
        expect(prim.fill).toBeUndefined();
        checkPrimitiveBounds(prim, vbW, vbH);
      }
    }
  });

  it('retrieves overlays correctly via getSheetOverlay helper', () => {
    const sunOverlay = getSheetOverlay('shapes-1-slot1-cand-c-sun', 'shapes-1');
    expect(sunOverlay.length).toBeGreaterThan(0);

    const nonExistent = getSheetOverlay('non-existent-sheet');
    expect(nonExistent).toEqual([]);
  });

  it('validates overlay style tokens for contrast (>= 3:1) and bold stroke width (R5)', () => {
    const SOLVED_FILL = '#059669';
    const BACKGROUND = '#ffffff';
    const GREYSCALE_SOLVED = '#666666';

    const BASELINE_STROKE_WIDTHS = {
      'detail-stroke': 0.45,
      'detail-fill': 0.35,
      'accent': 0.40,
      'highlight': 0.30,
      'star': 0.35,
    };

    for (const [token, def] of Object.entries(OVERLAY_STYLE_DEFINITIONS)) {
      // 1. Stroke width must be at least 1.5x baseline
      const baseline = BASELINE_STROKE_WIDTHS[token];
      expect(
        def.strokeWidth,
        `Token ${token} stroke width ${def.strokeWidth} must be >= 1.5x baseline ${baseline}`
      ).toBeGreaterThanOrEqual(baseline * 1.5 - 0.001);

      // 2. Stroke color contrast against solved green fill (>= 3:1)
      const contrastGreen = contrastRatio(def.stroke, SOLVED_FILL);
      expect(
        contrastGreen,
        `Token ${token} stroke ${def.stroke} contrast against solved fill ${SOLVED_FILL} must be >= 3:1 (got ${contrastGreen.toFixed(2)})`
      ).toBeGreaterThanOrEqual(3.0);

      // 3. Stroke color contrast against white background (>= 3:1)
      const contrastBg = contrastRatio(def.stroke, BACKGROUND);
      expect(
        contrastBg,
        `Token ${token} stroke ${def.stroke} contrast against background ${BACKGROUND} must be >= 3:1 (got ${contrastBg.toFixed(2)})`
      ).toBeGreaterThanOrEqual(3.0);

      // 4. Stroke color contrast against greyscale solved fill (>= 3:1)
      const contrastGrey = contrastRatio(def.stroke, GREYSCALE_SOLVED);
      expect(
        contrastGrey,
        `Token ${token} stroke ${def.stroke} contrast against greyscale solved fill ${GREYSCALE_SOLVED} must be >= 3:1 (got ${contrastGrey.toFixed(2)})`
      ).toBeGreaterThanOrEqual(3.0);
    }
  });
});
