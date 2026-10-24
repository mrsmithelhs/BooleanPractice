import { SET_SHAPES_1 } from '@shared/shape-puzzles/sets/shapes-1.js';
import { SET_SHAPES_2 } from '@shared/shape-puzzles/sets/shapes-2.js';
import { getSheetMode } from './modes.js';

export const AVAILABLE_SETS = {
  [SET_SHAPES_1.id]: SET_SHAPES_1,
  [SET_SHAPES_2.id]: SET_SHAPES_2,
};

export function parsePuzzleUrl(searchString = '') {
  const params = new URLSearchParams(searchString);
  const setId = params.get('set') || 'shapes-1';
  const sheetParam = params.get('sheet') || '1';
  const teacherParam = params.get('teacher');
  const isTeacher = teacherParam === '1' || teacherParam === 'true';
  const modeParam = params.get('mode');

  let modeOverride = null;
  let modeWarning = null;
  if (modeParam !== null) {
    const normalizedMode = modeParam.toLowerCase();
    if (normalizedMode === 'table' || normalizedMode === 'shade') {
      modeOverride = normalizedMode;
    } else {
      modeWarning = `Unknown mode "${modeParam}". Using default mode for this sheet.`;
    }
  }

  const set = AVAILABLE_SETS[setId];
  if (!set) {
    return {
      isValid: false,
      error: `Unknown puzzle set "${setId}". Available sets: ${Object.keys(AVAILABLE_SETS).join(', ')}.`,
      setId,
      sheetIndex: 0,
      sheet: null,
      isTeacher,
      mode: 'table',
      modeOverride,
      modeWarning,
    };
  }

  const sheetNum = Number.parseInt(sheetParam, 10);
  if (!Number.isInteger(sheetNum) || sheetNum < 1 || sheetNum > set.sheets.length) {
    return {
      isValid: false,
      error: `Sheet "${sheetParam}" not found in set "${setId}". Available sheets: 1 to ${set.sheets.length}.`,
      setId,
      sheetIndex: 0,
      sheet: null,
      isTeacher,
      mode: 'table',
      modeOverride,
      modeWarning,
    };
  }

  const sheetIndex = sheetNum - 1;
  const mode = getSheetMode(sheetIndex, modeOverride);

  return {
    isValid: true,
    error: null,
    setId,
    sheetIndex,
    sheetNumber: sheetNum,
    sheet: { ...set.sheets[sheetIndex], setId: set.id },
    isTeacher,
    mode,
    modeOverride,
    modeWarning,
  };
}

export function buildPuzzleUrl({
  setId = 'shapes-1',
  sheetNumber = 1,
  isTeacher = false,
  mode = null,
}) {
  const params = new URLSearchParams();
  params.set('set', setId);
  params.set('sheet', String(sheetNumber));
  if (isTeacher) {
    params.set('teacher', '1');
  }
  if (mode === 'table' || mode === 'shade') {
    params.set('mode', mode);
  }
  return `?${params.toString()}`;
}
