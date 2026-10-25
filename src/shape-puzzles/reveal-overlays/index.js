import { OVERLAYS_SHAPES_1 } from './shapes-1.js';
import { OVERLAYS_SHAPES_2 } from './shapes-2.js';

export const REVEAL_OVERLAYS_BY_SET = {
  'shapes-1': OVERLAYS_SHAPES_1,
  'shapes-2': OVERLAYS_SHAPES_2,
};

/**
 * Standard overlay style token definitions with contrast-validated colors and bold stroke widths.
 * R5 requirement: stroke widths >= 1.5x baseline, contrast >= 3:1 against both solved fill and background.
 */
export const OVERLAY_STYLE_DEFINITIONS = {
  'detail-stroke': {
    stroke: '#0f172a',
    strokeWidth: 0.75, // Baseline was 0.45 (1.67x)
    fill: 'none',
  },
  'detail-fill': {
    stroke: '#0f172a',
    strokeWidth: 0.60, // Baseline was 0.35 (1.71x)
    fill: '#ffffff',
  },
  'accent': {
    stroke: '#271406',
    strokeWidth: 0.70, // Baseline was 0.40 (1.75x)
    fill: '#f59e0b',
  },
  'highlight': {
    stroke: '#0f172a',
    strokeWidth: 0.60, // Baseline was 0.30 (2.0x)
    fill: '#ffffff',
  },
  'star': {
    stroke: '#271406',
    strokeWidth: 0.65, // Baseline was 0.35 (1.85x)
    fill: '#fbbf24',
  },
};

/**
 * Calculate relative luminance per WCAG 2.1 specs.
 * @param {string} hex Hex color string (e.g. '#0f172a')
 * @returns {number} Relative luminance [0..1]
 */
export function relativeLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/**
 * Calculate contrast ratio between two hex colors per WCAG 2.1 specs.
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number} Contrast ratio [1..21]
 */
export function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

/**
 * Register an overlay map for a set id.
 * @param {string} setId
 * @param {Object} overlays
 */
export function registerSetOverlays(setId, overlays) {
  REVEAL_OVERLAYS_BY_SET[setId] = overlays;
}

/**
 * Retrieve overlay primitives for a sheet.
 * @param {string} sheetId
 * @param {string} [setId]
 * @returns {Array} Array of overlay primitives, or empty array if none
 */
export function getSheetOverlay(sheetId, setId) {
  if (setId && REVEAL_OVERLAYS_BY_SET[setId]) {
    return REVEAL_OVERLAYS_BY_SET[setId][sheetId] || [];
  }

  for (const setMap of Object.values(REVEAL_OVERLAYS_BY_SET)) {
    if (setMap[sheetId]) {
      return setMap[sheetId];
    }
  }

  return [];
}
