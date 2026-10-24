import { OVERLAYS_SHAPES_1 } from './shapes-1.js';
import { OVERLAYS_SHAPES_2 } from './shapes-2.js';

export const REVEAL_OVERLAYS_BY_SET = {
  'shapes-1': OVERLAYS_SHAPES_1,
  'shapes-2': OVERLAYS_SHAPES_2,
};

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
