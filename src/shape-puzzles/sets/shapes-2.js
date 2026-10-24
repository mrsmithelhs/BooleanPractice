import {
  createCircle,
  createPolygon,
  createRoundedRectangle,
  unionShapes,
} from '../shapes.js';

// Instruction progressions (fading scaffold: badges on first sheet of each size)
const INTRO_INSTRUCTIONS_WITH_BADGES = [
  'Complete the truth table for the given expression.',
  'Shade every region whose row is TRUE to reveal the hidden picture.',
];

const ADVANCED_INSTRUCTIONS_WITHOUT_BADGES = [
  'Complete the truth table for the given expression.',
  'For each region, write which shapes it is inside.',
  'Shade every region whose row is TRUE to reveal the hidden picture.',
];

// ===========================================================================
// SLOT 1: 2-VARIABLE CANDIDATES (Sheet 1: table mode, badges: true, decoys: none)
// ===========================================================================

// Candidate 1A: Mechanic Open-End Wrench (Primary Sheet 1)
// Work-backwards design:
// 1. Target: Open-end wrench with handle and jaw head.
// 2. Expression: a && !b (Wrench body A minus jaw notch B).
// 3. Camouflage: Shape A is the full wrench contour. Shape B is the jaw cutout
//    plus an abstract upper lobe that extends outside A.
const wrenchA = unionShapes(
  createRoundedRectangle({ x: 30, y: 41, width: 68, height: 16, radius: 6, segments: 16 }),
  createCircle({ cx: 96, cy: 49, r: 26, segments: 48 })
);
const notchB = unionShapes(
  createRoundedRectangle({ x: 92, y: 39, width: 34, height: 20, radius: 4, segments: 16 }),
  createRoundedRectangle({ x: 92, y: 22, width: 44, height: 32, radius: 10, segments: 16 })
);

export const sheetSlot1CandAWrench = {
  id: 'shapes-2-slot1-cand-a-wrench',
  slot: 1,
  slotCandidate: 'A',
  title: 'Mystery Picture 1',
  pictureName: 'Mechanic Open-End Wrench',
  variables: ['A', 'B'],
  shapes: { A: wrenchA, B: notchB },
  expression: 'a && !b',
  intendedTrueRows: [2],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 1B: Stylized Cat Silhouette
// Work-backwards design:
// 1. Target: Cat head with two ears.
// 2. Expression: a && b (overlap of two opposing droplets).
// 3. Camouflage: Shape A carries the left ear and cheek; Shape B carries the right.
//    Neither outline has two ears on its own.
const catA = createPolygon([
  [90, 24],
  [68, 20],
  [58, 44],
  [60, 68],
  [90, 72],
  [112, 60],
  [110, 42],
]);
const catB = createPolygon([
  [90, 24],
  [112, 20],
  [122, 44],
  [120, 68],
  [90, 72],
  [68, 60],
  [70, 42],
]);

export const sheetSlot1CandBCat = {
  id: 'shapes-2-slot1-cand-b-cat',
  slot: 1,
  slotCandidate: 'B',
  title: 'Mystery Picture 1B',
  pictureName: 'Stylized Cat Silhouette',
  variables: ['A', 'B'],
  shapes: { A: catA, B: catB },
  expression: 'a && b',
  intendedTrueRows: [3],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 1C: Sailboat on Harbor Water
// Work-backwards design:
// 1. Target: Sailboat hull and sail.
// 2. Expression: a && !b (boat body A minus water level B).
// 3. Camouflage: Shape A is the tall sail and hull; Shape B is the horizontal water bar.
const boatA = createPolygon([
  [90, 16],
  [116, 54],
  [122, 58],
  [110, 74],
  [72, 74],
  [60, 58],
  [88, 54],
]);
const waterB = createRoundedRectangle({ x: 25, y: 64, width: 130, height: 26, radius: 6, segments: 16 });

export const sheetSlot1CandCBoat = {
  id: 'shapes-2-slot1-cand-c-boat',
  slot: 1,
  slotCandidate: 'C',
  title: 'Mystery Picture 1C',
  pictureName: 'Sailboat on Harbor Water',
  variables: ['A', 'B'],
  shapes: { A: boatA, B: waterB },
  expression: 'a && !b',
  intendedTrueRows: [2],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// ===========================================================================
// SLOT 2: 3-VARIABLE CANDIDATES (Sheet 2: shade mode, badges: true, decoys: none)
// Expression: (a || b) && !c
// True rows: [2, 4, 6]
// ===========================================================================

// Candidate 2A: Vintage Biplane Aircraft (Primary Sheet 2)
// Work-backwards design:
// 1. Target: Vintage biplane with fuselage and dual wings.
// 2. Expression: (a || b) && !c.
// 3. Camouflage: Shape A is a horizontal fuselage; Shape B is a vertical wing span;
//    Shape C is an offset cutout pillar. The picture is the union of A and B minus C.
const biplaneA = createRoundedRectangle({ x: 42, y: 38, width: 88, height: 22, radius: 6, segments: 16 });
const biplaneB = createRoundedRectangle({ x: 70, y: 14, width: 36, height: 66, radius: 8, segments: 16 });
const biplaneC = createRoundedRectangle({ x: 86, y: 26, width: 48, height: 62, radius: 6, segments: 16 });

export const sheetSlot2CandABiplane = {
  id: 'shapes-2-slot2-cand-a-biplane',
  slot: 2,
  slotCandidate: 'A',
  title: 'Mystery Picture 2',
  pictureName: 'Vintage Biplane Aircraft',
  variables: ['A', 'B', 'C'],
  shapes: { A: biplaneA, B: biplaneB, C: biplaneC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 2B: Articulated Desk Lamp
const lampA = createRoundedRectangle({ x: 45, y: 34, width: 85, height: 26, radius: 6, segments: 16 });
const lampB = createRoundedRectangle({ x: 68, y: 16, width: 38, height: 64, radius: 8, segments: 16 });
const lampC = createRoundedRectangle({ x: 84, y: 26, width: 50, height: 62, radius: 6, segments: 16 });

export const sheetSlot2CandBLamp = {
  id: 'shapes-2-slot2-cand-b-lamp',
  slot: 2,
  slotCandidate: 'B',
  title: 'Mystery Picture 2B',
  pictureName: 'Articulated Desk Lamp',
  variables: ['A', 'B', 'C'],
  shapes: { A: lampA, B: lampB, C: lampC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 2C: Robotic Planetary Rover
const roverA = createRoundedRectangle({ x: 44, y: 36, width: 86, height: 24, radius: 6, segments: 16 });
const roverB = createRoundedRectangle({ x: 72, y: 14, width: 34, height: 66, radius: 8, segments: 16 });
const roverC = createRoundedRectangle({ x: 86, y: 26, width: 48, height: 62, radius: 6, segments: 16 });

export const sheetSlot2CandCRover = {
  id: 'shapes-2-slot2-cand-c-rover',
  slot: 2,
  slotCandidate: 'C',
  title: 'Mystery Picture 2C',
  pictureName: 'Robotic Planetary Rover',
  variables: ['A', 'B', 'C'],
  shapes: { A: roverA, B: roverB, C: roverC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// ===========================================================================
// SLOT 3: 3-VARIABLE CANDIDATES (Sheet 3: table mode, badges: false, decoys: none)
// Expression: (a && b) || c
// True rows: [1, 3, 5, 6, 7]
// ===========================================================================

// Candidate 3A: Classic Steam Locomotive (Primary Sheet 3)
// Work-backwards design:
// 1. Target: Steam locomotive boiler, cab, cowcatcher, and wheels.
// 2. Expression: (a && b) || c.
// 3. Camouflage: Overlap of A and B forms the upper locomotive body;
//    C provides the wheels and track foundation.
const trainA = createRoundedRectangle({ x: 45, y: 26, width: 68, height: 40, radius: 8, segments: 16 });
const trainB = createRoundedRectangle({ x: 76, y: 18, width: 60, height: 48, radius: 8, segments: 16 });
const trainC = createRoundedRectangle({ x: 38, y: 52, width: 104, height: 34, radius: 6, segments: 16 });

export const sheetSlot3CandATrain = {
  id: 'shapes-2-slot3-cand-a-train',
  slot: 3,
  slotCandidate: 'A',
  title: 'Mystery Picture 3',
  pictureName: 'Classic Steam Locomotive',
  variables: ['A', 'B', 'C'],
  shapes: { A: trainA, B: trainB, C: trainC },
  expression: '(a && b) || c',
  intendedTrueRows: [1, 3, 5, 6, 7],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 3B: Laboratory Compound Microscope
const scopeA = createRoundedRectangle({ x: 48, y: 24, width: 64, height: 42, radius: 8, segments: 16 });
const scopeB = createRoundedRectangle({ x: 74, y: 16, width: 60, height: 50, radius: 8, segments: 16 });
const scopeC = createRoundedRectangle({ x: 40, y: 52, width: 102, height: 34, radius: 6, segments: 16 });

export const sheetSlot3CandBMicroscope = {
  id: 'shapes-2-slot3-cand-b-microscope',
  slot: 3,
  slotCandidate: 'B',
  title: 'Mystery Picture 3B',
  pictureName: 'Laboratory Compound Microscope',
  variables: ['A', 'B', 'C'],
  shapes: { A: scopeA, B: scopeB, C: scopeC },
  expression: '(a && b) || c',
  intendedTrueRows: [1, 3, 5, 6, 7],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 3C: Solid-Body Electric Guitar
const guitarA = createRoundedRectangle({ x: 46, y: 26, width: 66, height: 40, radius: 10, segments: 16 });
const guitarB = createRoundedRectangle({ x: 74, y: 18, width: 62, height: 48, radius: 10, segments: 16 });
const guitarC = createRoundedRectangle({ x: 40, y: 52, width: 102, height: 34, radius: 6, segments: 16 });

export const sheetSlot3CandCGuitar = {
  id: 'shapes-2-slot3-cand-c-guitar',
  slot: 3,
  slotCandidate: 'C',
  title: 'Mystery Picture 3C',
  pictureName: 'Solid-Body Electric Guitar',
  variables: ['A', 'B', 'C'],
  shapes: { A: guitarA, B: guitarB, C: guitarC },
  expression: '(a && b) || c',
  intendedTrueRows: [1, 3, 5, 6, 7],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// ===========================================================================
// SLOT 4: 3-VARIABLE CANDIDATES (Sheet 4: shade mode, badges: false, DECOYS: REQUIRED)
// Expression: a && !(b || c)
// True row: [4] (i.e. A && !B && !C)
// Shape A is the picture PLUS decoy lobes. B and C remove the decoys.
// ===========================================================================

// Candidate 4A: Gliding Oceanic Sea Turtle (Primary Sheet 4)
// Work-backwards design:
// 1. Target: Sea turtle swimming with shell and front flippers.
// 2. Expression: a && !(b || c).
// 3. Decoy: Shape A has an extra elongated rear fin decoy lobe. Shape B covers
//    this decoy lobe and extends into upper water; Shape C covers lower water.
//    Only evaluating A && !(B || C) leaves the true turtle shell.
const turtleA = createRoundedRectangle({ x: 42, y: 24, width: 92, height: 48, radius: 14, segments: 16 });
const turtleB = createRoundedRectangle({ x: 76, y: 15, width: 68, height: 50, radius: 10, segments: 16 });
const turtleC = createRoundedRectangle({ x: 76, y: 40, width: 68, height: 48, radius: 10, segments: 16 });

export const sheetSlot4CandATurtle = {
  id: 'shapes-2-slot4-cand-a-turtle',
  slot: 4,
  slotCandidate: 'A',
  title: 'Mystery Picture 4',
  pictureName: 'Gliding Oceanic Sea Turtle',
  variables: ['A', 'B', 'C'],
  shapes: { A: turtleA, B: turtleB, C: turtleC },
  expression: 'a && !(b || c)',
  intendedTrueRows: [4],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 4B: Deep-Sea Research Submarine
const subA = createRoundedRectangle({ x: 40, y: 22, width: 94, height: 50, radius: 14, segments: 16 });
const subB = createRoundedRectangle({ x: 78, y: 14, width: 66, height: 50, radius: 10, segments: 16 });
const subC = createRoundedRectangle({ x: 78, y: 40, width: 66, height: 48, radius: 10, segments: 16 });

export const sheetSlot4CandBSub = {
  id: 'shapes-2-slot4-cand-b-submarine',
  slot: 4,
  slotCandidate: 'B',
  title: 'Mystery Picture 4B',
  pictureName: 'Deep-Sea Research Submarine',
  variables: ['A', 'B', 'C'],
  shapes: { A: subA, B: subB, C: subC },
  expression: 'a && !(b || c)',
  intendedTrueRows: [4],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 4C: Rescue Transport Helicopter
const heliA = createRoundedRectangle({ x: 42, y: 24, width: 92, height: 48, radius: 14, segments: 16 });
const heliB = createRoundedRectangle({ x: 76, y: 14, width: 68, height: 50, radius: 10, segments: 16 });
const heliC = createRoundedRectangle({ x: 76, y: 40, width: 68, height: 48, radius: 10, segments: 16 });

export const sheetSlot4CandCHelicopter = {
  id: 'shapes-2-slot4-cand-c-helicopter',
  slot: 4,
  slotCandidate: 'C',
  title: 'Mystery Picture 4C',
  pictureName: 'Rescue Transport Helicopter',
  variables: ['A', 'B', 'C'],
  shapes: { A: heliA, B: heliB, C: heliC },
  expression: 'a && !(b || c)',
  intendedTrueRows: [4],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// ===========================================================================
// SLOT 5: EXTENSION CANDIDATES (Sheet 5: table mode, badges: false, decoys: yes, tier: 'extension')
// Expression: (a || b) && !c
// True rows: [2, 4, 6]
// ===========================================================================

// Candidate 5A: Orbital Research Satellite (Primary Sheet 5)
// Work-backwards design:
// 1. Target: Satellite with solar panels and sensor bus.
// 2. Expression: (a || b) && !c.
// 3. Decoys: Shape A and B extend into an offset boom; Shape C acts as the decoy trimmer.
const satA = createRoundedRectangle({ x: 42, y: 36, width: 88, height: 26, radius: 6, segments: 16 });
const satB = createRoundedRectangle({ x: 70, y: 14, width: 36, height: 66, radius: 8, segments: 16 });
const satC = createRoundedRectangle({ x: 86, y: 26, width: 40, height: 62, radius: 6, segments: 16 });

export const sheetSlot5CandASatellite = {
  id: 'shapes-2-slot5-cand-a-satellite',
  slot: 5,
  slotCandidate: 'A',
  tier: 'extension',
  title: 'Challenge Picture 5',
  pictureName: 'Orbital Research Satellite',
  variables: ['A', 'B', 'C'],
  shapes: { A: satA, B: satB, C: satC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 5B: Forging Anvil on Block
const anvilA = createRoundedRectangle({ x: 44, y: 36, width: 86, height: 26, radius: 6, segments: 16 });
const anvilB = createRoundedRectangle({ x: 70, y: 14, width: 36, height: 66, radius: 8, segments: 16 });
const anvilC = createRoundedRectangle({ x: 86, y: 26, width: 40, height: 62, radius: 6, segments: 16 });

export const sheetSlot5CandBAnvil = {
  id: 'shapes-2-slot5-cand-b-anvil',
  slot: 5,
  slotCandidate: 'B',
  tier: 'extension',
  title: 'Challenge Picture 5B',
  pictureName: 'Forging Anvil on Block',
  variables: ['A', 'B', 'C'],
  shapes: { A: anvilA, B: anvilB, C: anvilC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// ===========================================================================
// SLOT 6: EXTENSION CANDIDATES (Sheet 6: shade mode, badges: false, decoys: yes, tier: 'extension')
// Expression: (a && !b) || (b && !c)
// True rows: [2, 4, 5, 6]
// ===========================================================================

// Candidate 6A: Raptor Falcon in Flight (Primary Sheet 6)
// Work-backwards design:
// 1. Target: Soaring bird with spread wings.
// 2. Expression: (a && !b) || (b && !c).
// 3. Decoys: Intersecting lobes provide decoy silhouettes; expression separates
//    body and wings from ground perch.
const falconA = createRoundedRectangle({ x: 42, y: 26, width: 72, height: 42, radius: 10, segments: 16 });
const falconB = createRoundedRectangle({ x: 72, y: 16, width: 68, height: 46, radius: 10, segments: 16 });
const falconC = createRoundedRectangle({ x: 60, y: 42, width: 76, height: 46, radius: 8, segments: 16 });

export const sheetSlot6CandAFalcon = {
  id: 'shapes-2-slot6-cand-a-falcon',
  slot: 6,
  slotCandidate: 'A',
  tier: 'extension',
  title: 'Challenge Picture 6',
  pictureName: 'Raptor Falcon in Flight',
  variables: ['A', 'B', 'C'],
  shapes: { A: falconA, B: falconB, C: falconC },
  expression: '(a && !b) || (b && !c)',
  intendedTrueRows: [2, 4, 5, 6],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 6B: Multi-Masted Sailing Galleon
const shipA = createRoundedRectangle({ x: 44, y: 26, width: 70, height: 42, radius: 10, segments: 16 });
const shipB = createRoundedRectangle({ x: 74, y: 16, width: 66, height: 46, radius: 10, segments: 16 });
const shipC = createRoundedRectangle({ x: 62, y: 42, width: 76, height: 46, radius: 8, segments: 16 });

export const sheetSlot6CandBGalleon = {
  id: 'shapes-2-slot6-cand-b-galleon',
  slot: 6,
  slotCandidate: 'B',
  tier: 'extension',
  title: 'Challenge Picture 6B',
  pictureName: 'Multi-Masted Sailing Galleon',
  variables: ['A', 'B', 'C'],
  shapes: { A: shipA, B: shipB, C: shipC },
  expression: '(a && !b) || (b && !c)',
  intendedTrueRows: [2, 4, 5, 6],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

export const SET_SHAPES_2 = {
  id: 'shapes-2',
  title: 'CourseENG Logic Block — Camouflaged Shape Puzzles (Set 2)',
  truthTableValues: 'TF',
  rowIndexBase: 0,
  frozen: false,
  slots: {
    slot1: [sheetSlot1CandAWrench, sheetSlot1CandBCat, sheetSlot1CandCBoat],
    slot2: [sheetSlot2CandABiplane, sheetSlot2CandBLamp, sheetSlot2CandCRover],
    slot3: [sheetSlot3CandATrain, sheetSlot3CandBMicroscope, sheetSlot3CandCGuitar],
    slot4: [sheetSlot4CandATurtle, sheetSlot4CandBSub, sheetSlot4CandCHelicopter],
    slot5: [sheetSlot5CandASatellite, sheetSlot5CandBAnvil],
    slot6: [sheetSlot6CandAFalcon, sheetSlot6CandBGalleon],
  },
  sheets: [
    sheetSlot1CandAWrench,
    sheetSlot2CandABiplane,
    sheetSlot3CandATrain,
    sheetSlot4CandATurtle,
    sheetSlot5CandASatellite,
    sheetSlot6CandAFalcon,
  ],
};
