import {
  createCircle,
  createEllipse,
  createPolygon,
  createRoundedRectangle,
} from '../shapes.js';

// Instruction progressions (R9: badges on first sheet of each size, off on later sheets)
const INTRO_INSTRUCTIONS_WITH_BADGES = [
  'Complete the truth table for the given expression.',
  'Shade every region whose row is TRUE to reveal the hidden picture.',
];

const ADVANCED_INSTRUCTIONS_WITHOUT_BADGES = [
  'Complete the truth table for the given expression.',
  'For each region, write which shapes it is inside.',
  'Shade every region whose row is TRUE to reveal the hidden picture.',
];

// --- SLOT 1: 2-VARIABLE CANDIDATES ---

// Candidate 1A: Crescent Moon (candidate retained in source; not in exported set)
const moonA = createCircle({ cx: 85, cy: 48, r: 28, segments: 64 });
const moonB = createCircle({ cx: 98, cy: 46, r: 24, segments: 64 });
export const sheetSlot1CandAMoon = {
  id: 'shapes-1-slot1-cand-a-moon',
  slot: 1,
  slotCandidate: 'A',
  title: 'Mystery Picture 1A',
  pictureName: 'Crescent Moon in Night Sky',
  variables: ['A', 'B'],
  shapes: { A: moonA, B: moonB },
  expression: 'a && !b',
  intendedTrueRows: [2],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 1B: Gem in Setting (Mystery Picture 2)
const gemA = createRoundedRectangle({ x: 70, y: 18, width: 40, height: 60, radius: 10, segments: 16 });
const bandB = createEllipse({ cx: 90, cy: 48, rx: 38, ry: 16, segments: 64 });
export const sheetSlot1CandBGem = {
  id: 'shapes-1-slot1-cand-b-gem',
  slot: 1,
  slotCandidate: 'B',
  title: 'Mystery Picture 2',
  pictureName: 'Faceted Gem in Ring Setting',
  variables: ['A', 'B'],
  shapes: { A: gemA, B: bandB },
  shapeStyles: {
    A: { targetAngle: Math.PI * 0.65 },
  },
  expression: 'a && b',
  intendedTrueRows: [3],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 1C: Rising Sun (Mystery Picture 1)
const sunA = createCircle({ cx: 90, cy: 45, r: 28, segments: 64 });
const horizonB = createRoundedRectangle({ x: 32, y: 48, width: 116, height: 42, radius: 8, segments: 16 });
export const sheetSlot1CandCSun = {
  id: 'shapes-1-slot1-cand-c-sun',
  slot: 1,
  slotCandidate: 'C',
  title: 'Mystery Picture 1',
  pictureName: 'Sun Rising Over Horizon',
  variables: ['A', 'B'],
  shapes: { A: sunA, B: horizonB },
  expression: 'a && !b',
  intendedTrueRows: [2],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// --- SLOT 2: 3-VARIABLE CANDIDATES ---

// Candidate 2A: Space Rocket (Mystery Picture 4)
const rocketA = createPolygon([
  [90, 14],
  [108, 32],
  [108, 70],
  [72, 70],
  [72, 32],
]);
const wingsB = createPolygon([
  [50, 48],
  [130, 48],
  [130, 80],
  [50, 80],
]);
const columnC = createPolygon([
  [85, 34],
  [95, 34],
  [99, 90],
  [81, 90],
]);
export const sheetSlot2CandARocket = {
  id: 'shapes-1-slot2-cand-a-rocket',
  slot: 2,
  slotCandidate: 'A',
  title: 'Mystery Picture 4',
  pictureName: 'Rocket Ship in Flight',
  variables: ['A', 'B', 'C'],
  shapes: { A: rocketA, B: wingsB, C: columnC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 2B: Cozy Cabin (Mystery Picture 3)
const houseA = createPolygon([
  [90, 16],
  [126, 42],
  [118, 42],
  [118, 78],
  [62, 78],
  [62, 42],
  [54, 42],
]);
// B's left edge sits 8 mm inside the house wall (x = 62) so the wall strip of
// rows 5 and 6 stays wide enough to hold a row badge and to shade by pencil.
const hearthB = createPolygon([
  [70, 10],
  [90, 10],
  [90, 88],
  [70, 88],
]);
const groundC = createRoundedRectangle({
  x: 38,
  y: 58,
  width: 104,
  height: 32,
  radius: 6,
  segments: 16,
});
export const sheetSlot2CandBHouse = {
  id: 'shapes-1-slot2-cand-b-house',
  slot: 2,
  slotCandidate: 'B',
  title: 'Mystery Picture 3',
  pictureName: 'Cozy Cabin with Hearth and Yard',
  variables: ['A', 'B', 'C'],
  shapes: { A: houseA, B: hearthB, C: groundC },
  shapeStyles: {
    B: { targetAngle: Math.PI * 0.55 },
    C: { targetAngle: -Math.PI * 0.85 },
  },
  expression: 'a && !b || c',
  intendedTrueRows: [1, 3, 4, 5, 7],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 2C: Fortress Tower (candidate retained in source; not in exported set)
const castleA = createPolygon([
  [90, 20],
  [104, 34],
  [104, 46],
  [128, 46],
  [128, 76],
  [52, 76],
  [52, 46],
  [76, 46],
  [76, 34],
]);
const gateB = createPolygon([
  [78, 8],
  [102, 8],
  [102, 88],
  [78, 88],
]);
const moatC = createRoundedRectangle({
  x: 38,
  y: 60,
  width: 104,
  height: 30,
  radius: 6,
  segments: 16,
});
export const sheetSlot2CandCCastle = {
  id: 'shapes-1-slot2-cand-c-castle',
  slot: 2,
  slotCandidate: 'C',
  title: 'Mystery Picture 2C',
  pictureName: 'Fortress Tower with Gatehouse',
  variables: ['A', 'B', 'C'],
  shapes: { A: castleA, B: gateB, C: moatC },
  shapeStyles: {
    C: { targetAngle: -Math.PI * 0.85 },
  },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// --- FALLBACK SHEET (Plain 2-variable shape) ---
const lensA = createCircle({ cx: 80, cy: 48, r: 30, segments: 64 });
const lensB = createCircle({ cx: 100, cy: 48, r: 30, segments: 64 });
export const sheetFallbackLens = {
  id: 'shapes-1-fallback-lens',
  isFallback: true,
  title: 'Mystery Picture 1D',
  pictureName: 'Symmetric Optical Lens',
  variables: ['A', 'B'],
  shapes: { A: lensA, B: lensB },
  expression: 'a && b',
  intendedTrueRows: [3],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

export const SET_SHAPES_1 = {
  id: 'shapes-1',
  title: 'CourseENG Logic Block — Shape Composition Puzzles (Set 1)',
  truthTableValues: 'TF', // Configurable value symbols (R10: 'TF' or '10')
  rowIndexBase: 0,        // Manifest trueRows is 0-based; sheets/keys display 1-based (1..4, 1..8)
  slots: {
    slot1: [sheetSlot1CandAMoon, sheetSlot1CandBGem, sheetSlot1CandCSun],
    slot2: [sheetSlot2CandARocket, sheetSlot2CandBHouse, sheetSlot2CandCCastle],
    fallback: sheetFallbackLens,
  },
  sheets: [
    sheetSlot1CandCSun,
    sheetSlot1CandBGem,
    sheetSlot2CandBHouse,
    sheetSlot2CandARocket,
  ],
};
