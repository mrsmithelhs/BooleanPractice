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
// SLOT 1: 2-VARIABLE CANDIDATES (Table mode, badges: true, decoys: none)
// ===========================================================================

// Candidate 1A: Mechanic Open-End Wrench
// Work-backwards design:
// 1. Target silhouette: Classic open-end mechanic wrench (long horizontal handle, circular head with open jaw notch).
// 2. Boundary distribution:
//    - Shape A carries the upper half of the handle, upper circular head curve, and upper jaw prong.
//    - Shape B carries the lower half of the handle, lower circular head curve, and lower jaw prong.
// 3. Why no single outline traces the picture:
//    - Shape A alone is an asymmetrical L-claw bar with only a top prong (no lower jaw, no full head).
//    - Shape B alone is an asymmetrical L-claw bar with only a bottom prong (no upper jaw, no full head).
//    - Neither shape outline traces a wrench. Only their boolean intersection (A && B) forms the complete wrench.
const splitWrenchA = createPolygon([
  [30, 42],
  [94, 42],
  [112, 34],
  [128, 40],
  [118, 54],
  [106, 54],
  [98, 58],
  [30, 58],
]);

const splitWrenchB = createPolygon([
  [30, 44],
  [98, 44],
  [106, 48],
  [118, 48],
  [128, 62],
  [112, 68],
  [94, 60],
  [30, 60],
]);

export const sheetSlot1CandAWrench = {
  id: 'shapes-2-slot1-cand-a-wrench',
  setId: 'shapes-2',
  slot: 1,
  slotCandidate: 'A',
  title: 'Mystery Picture 1',
  pictureName: 'Mechanic Open-End Wrench',
  variables: ['A', 'B'],
  shapes: { A: splitWrenchA, B: splitWrenchB },
  expression: 'a && b',
  intendedTrueRows: [3],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 1B: Stylized Cat Silhouette
// Work-backwards design:
// 1. Target silhouette: Stylized cat head with two pointed ears, cheeks, and a chin.
// 2. Boundary distribution:
//    - Shape A carries the left pointed ear, left cheek, and chin.
//    - Shape B carries the right pointed ear, right cheek, and chin.
// 3. Why no single outline traces the picture:
//    - Shape A is an asymmetric polygon with only a left ear; alone it looks like an angled wedge.
//    - Shape B is an asymmetric polygon with only a right ear; alone it looks like an opposing wedge.
//    - Neither outline has two ears or resembles a cat head. Their intersection (A && B) reveals the head.
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
  setId: 'shapes-2',
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

// ===========================================================================
// SLOT 2: 3-VARIABLE CANDIDATES (Shade mode, badges: true, decoys: none)
// ===========================================================================

// Candidate 2A: Desert Saguaro Cactus
// Work-backwards design:
// 1. Target silhouette: Classic desert saguaro cactus with central vertical trunk and two upturned arms.
// 2. Boundary distribution:
//    - Shape A carries the left arm, central trunk envelope, and camouflaging outer left lobe.
//    - Shape B carries the right arm, central trunk envelope, and camouflaging outer right lobe.
//    - Shape C is a broad ground foundation polygon that trims the root zone below y=68 and removes the outer side lobes.
// 3. Why no single outline traces the picture:
//    - Shape A alone has only the left arm and a wide side wing; it lacks the right arm and normal trunk.
//    - Shape B alone has only the right arm and a wide side wing; it lacks the left arm and normal trunk.
//    - Shape C cuts away the ground root zone and lateral camouflaging lobes.
//    - Neither A nor B alone, nor their pairwise unions/intersections, traces the cactus silhouette.
const cactusA = createPolygon([
  [38, 46],
  [54, 46],
  [54, 32],
  [66, 32],
  [66, 46],
  [84, 46],
  [84, 20],
  [96, 20],
  [96, 88],
  [84, 88],
  [84, 68],
  [66, 68],
  [38, 68],
]);

const cactusB = createPolygon([
  [84, 20],
  [96, 20],
  [96, 48],
  [114, 48],
  [114, 36],
  [126, 36],
  [126, 48],
  [142, 48],
  [142, 68],
  [114, 68],
  [114, 88],
  [84, 88],
]);

const cactusGroundC = createPolygon([
  [34, 68],
  [38, 46],
  [54, 46],
  [54, 68],
  [126, 68],
  [126, 48],
  [142, 48],
  [146, 68],
  [146, 92],
  [34, 92],
]);

export const sheetSlot2CandACactus = {
  id: 'shapes-2-slot2-cand-a-cactus',
  setId: 'shapes-2',
  slot: 2,
  slotCandidate: 'A',
  title: 'Mystery Picture 2',
  pictureName: 'Desert Saguaro Cactus',
  variables: ['A', 'B', 'C'],
  shapes: { A: cactusA, B: cactusB, C: cactusGroundC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 2B: Classic Sailing Sloop
// Work-backwards design:
// 1. Target silhouette: Two-sail sloop boat with tall mainsail, triangular jib, mast, and buoyant hull.
// 2. Boundary distribution:
//    - Shape A carries the triangular jib sail and the forward left half of the hull.
//    - Shape B carries the tall triangular mainsail and the aft right half of the hull.
//    - Shape C is a sea waterline block that trims the hull bottom below y=70.
// 3. Why no single outline traces the picture:
//    - Shape A alone has only the front jib sail and bow; it has no mainsail.
//    - Shape B alone has only the mainsail and stern; it has no jib sail.
//    - Shape C is a broad rounded rectangle sea band.
//    - The sailboat appears only when the two sails and hull are united minus the sea ((A || B) && !C).
const boatA = createPolygon([
  [96, 22],
  [96, 88],
  [46, 88],
  [46, 66],
  [56, 64],
  [78, 22],
]);

const boatB = createPolygon([
  [78, 22],
  [96, 22],
  [128, 64],
  [134, 66],
  [134, 88],
  [78, 88],
]);

const waterC = createRoundedRectangle({
  x: 36,
  y: 70,
  width: 108,
  height: 22,
  radius: 6,
  segments: 16,
});

export const sheetSlot2CandBBoat = {
  id: 'shapes-2-slot2-cand-b-boat',
  setId: 'shapes-2',
  slot: 2,
  slotCandidate: 'B',
  title: 'Mystery Picture 2B',
  pictureName: 'Classic Sailing Sloop',
  variables: ['A', 'B', 'C'],
  shapes: { A: boatA, B: boatB, C: waterC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  instructions: INTRO_INSTRUCTIONS_WITH_BADGES,
  showRegionRowNumbers: true,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// ===========================================================================
// SLOT 3: 3-VARIABLE CANDIDATES (Table mode, badges: false, decoys: none)
// ===========================================================================

// Candidate 3A: Classic Steam Locomotive
// Work-backwards design:
// 1. Target silhouette: Steam locomotive train with tall engineer cab, horizontal boiler, smokestack, cowcatcher pilot, and wheels.
// 2. Boundary distribution:
//    - Shape A carries the full train body silhouette plus an extended lower track and ballast bed base (x: 8..162, y: 74..88).
//    - Shape B covers the rear engineer cab and an upper smoke plume band above the cab (x: 36..86, y: 8..74).
//    - Shape C covers the front boiler, smokestack, and cowcatcher plus sky envelope (x: 72..158, y: 8..74).
// 3. Why no single outline traces the picture:
//    - Shape A alone contains a thick lower ballast block (Region 4) which breaks the silhouette; IoU < 0.71.
//    - Shape B alone has only the rear cab and sky block; it lacks the front boiler and cowcatcher.
//    - Shape C alone has only the front boiler and sky block; it lacks the cab.
//    - The expression a && (b || c) unites the cab (Row 6) and boiler/cowcatcher (Row 5) through their junction (Row 7), while rejecting the track bed (Row 4).
const trainA = createPolygon([
  [8, 74],
  [36, 74],
  [36, 22],
  [76, 22],
  [76, 36],
  [120, 36],
  [120, 20],
  [132, 20],
  [132, 36],
  [144, 36],
  [158, 56],
  [162, 74],
  [162, 88],
  [8, 88],
]);

const trainB = createPolygon([
  [36, 8],
  [86, 8],
  [86, 74],
  [36, 74],
]);

const trainC = createPolygon([
  [72, 8],
  [158, 8],
  [158, 74],
  [72, 74],
]);

export const sheetSlot3CandATrain = {
  id: 'shapes-2-slot3-cand-a-train',
  setId: 'shapes-2',
  slot: 3,
  slotCandidate: 'A',
  title: 'Mystery Picture 3',
  pictureName: 'Classic Steam Locomotive',
  variables: ['A', 'B', 'C'],
  shapes: { A: trainA, B: trainB, C: trainC },
  expression: 'a && (b || c)',
  intendedTrueRows: [5, 6, 7],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 3B: Solid-Body Electric Guitar
// Work-backwards design:
// 1. Target silhouette: Double-cutaway electric guitar with curved lower bout, upper horns, narrow neck, and headstock.
// 2. Boundary distribution:
//    - Shape A carries the left lower bout, left waist curve, upper horn, and left half of neck.
//    - Shape B carries the right lower bout, right waist curve, lower horn, and right half of neck.
//    - Shape C is a bottom jack plate cutout trimming the lower strap edge below y=76.
// 3. Why no single outline traces the picture:
//    - Shape A has only the left body horn and left bout (asymmetrical half-guitar).
//    - Shape B has only the right body horn and right bout (opposing half-guitar).
//    - Shape C is a rectangular bridge/jack cutout.
//    - The double-cutaway electric guitar silhouette emerges only from ((A || B) && !C).
const guitarA = createPolygon([
  [82, 20],
  [98, 20],
  [98, 92],
  [60, 92],
  [56, 76],
  [66, 62],
  [58, 50],
  [68, 46],
  [82, 54],
]);

const guitarB = createPolygon([
  [84, 20],
  [100, 20],
  [100, 54],
  [112, 46],
  [122, 50],
  [114, 62],
  [124, 76],
  [120, 92],
  [84, 92],
]);

const guitarCutC = createRoundedRectangle({
  x: 52,
  y: 76,
  width: 76,
  height: 18,
  radius: 4,
  segments: 16,
});

export const sheetSlot3CandBGuitar = {
  id: 'shapes-2-slot3-cand-b-guitar',
  setId: 'shapes-2',
  slot: 3,
  slotCandidate: 'B',
  title: 'Mystery Picture 3B',
  pictureName: 'Solid-Body Electric Guitar',
  variables: ['A', 'B', 'C'],
  shapes: { A: guitarA, B: guitarB, C: guitarCutC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// ===========================================================================
// SLOT 4: 3-VARIABLE CANDIDATES (Shade mode, badges: false, DECOYS: REQUIRED)
// ===========================================================================

// Candidate 4A: Gliding Oceanic Sea Turtle with Decoy Carapace Lobe
// Work-backwards design:
// 1. Target silhouette: Gliding sea turtle with rounded head, carapace shell, and sweeping front flippers.
// 2. Boundary distribution:
//    - Shape A carries the turtle head, neck, and carapace shell.
//    - Shape B carries the sweeping left and right front flippers.
//    - Shape C carries the lower carapace and an attached decoy rear swimming tail paddle.
// 3. Why no single outline traces the picture:
//    - Shape A has no front flippers; alone it is just a plain oval torso and head.
//    - Shape B has only the horizontal flipper wings; it lacks the head and body.
// 4. Decoy justification:
//    - Row 7 (A && B && C) is shaped like an extended rear carapace plate and tail paddle attached directly to the shell.
//    - Row 7 area is > 300 mm² and shares a boundary with the true turtle body.
//    - Under (A || B) && !C, Row 7 evaluates to FALSE because C=1 (excluded by NOT(C)).
//    - A student who overlooks NOT(C) or guesses an oversized tail paddle will incorrectly shade Row 7.
const turtleA = createPolygon([
  [90, 18],
  [100, 26],
  [100, 36],
  [110, 42],
  [110, 72],
  [90, 78],
  [70, 72],
  [70, 42],
  [80, 36],
  [80, 26],
]);

const turtleFlippersB = createPolygon([
  [90, 38],
  [138, 40],
  [138, 60],
  [90, 62],
  [42, 60],
  [42, 40],
]);

const turtleDecoyC = createPolygon([
  [90, 50],
  [128, 54],
  [128, 76],
  [104, 76],
  [102, 90],
  [78, 90],
  [76, 76],
  [52, 76],
  [52, 54],
]);

export const sheetSlot4CandATurtle = {
  id: 'shapes-2-slot4-cand-a-turtle',
  setId: 'shapes-2',
  slot: 4,
  slotCandidate: 'A',
  title: 'Mystery Picture 4',
  pictureName: 'Gliding Oceanic Sea Turtle',
  variables: ['A', 'B', 'C'],
  shapes: { A: turtleA, B: turtleFlippersB, C: turtleDecoyC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  decoyRows: [7],
  decoyDescription: 'An elongated trailing fluke / rear fin that resembles an extra tail or hind limb extending from the shell.',
  decoyRemovedBy: 'NOT(C) in (A || B) && !C',
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// Candidate 4B: Deep-Sea Research Submarine with Decoy Sail Tower
// Work-backwards design:
// 1. Target silhouette: Deep-sea research submarine with rounded bow, conning tower sail, cylindrical hull, and stern taper.
// 2. Boundary distribution:
//    - Shape A carries the true submarine hull and conning tower sail, plus attached dorsal decoy mast (x: 88..106, y: 14..34), ventral ballast (x: 64..112, y: 62..82), and aft shroud.
//    - Shape B is an upper rectangular partition cutting the dorsal decoy mast and upper shroud (x: 82..174, y: 10..56).
//    - Shape C is a lower rectangular partition cutting the ventral ballast and lower shroud (x: 58..174, y: 42..90).
// 3. Why no single outline traces the picture:
//    - Shape A contains huge dorsal and ventral appendages; it looks like an irregular multi-lobed mechanical bracket; IoU < 0.21.
//    - Shape B is a wide rectangular upper block.
//    - Shape C is a wide rectangular lower block.
//    - Under a && !(b || c), only Row 4 (A alone) is true, revealing the sleek submarine without any decoy appendages.
// 4. Decoy justification:
//    - Row 6 (A && B && !C) is a dorsal decoy mast / secondary tower (area > 1000 mm²) attached to the sub deck.
//    - Row 6 evaluates to FALSE because B=1 (excluded by NOT(B || C)).
//    - Students who fail to distribute NOT across the (B || C) group will mistakenly shade the decoy mast.
const subA = createPolygon([
  [26, 50],
  [44, 34],
  [54, 34],
  [54, 22],
  [72, 22],
  [72, 34],
  [88, 34],
  [88, 14],
  [106, 14],
  [106, 34],
  [142, 34],
  [158, 22],
  [158, 74],
  [142, 62],
  [112, 62],
  [112, 82],
  [64, 82],
  [64, 62],
  [44, 62],
]);

const subB = createPolygon([
  [82, 10],
  [174, 10],
  [174, 56],
  [82, 56],
]);

const subC = createPolygon([
  [58, 42],
  [174, 42],
  [174, 90],
  [58, 90],
]);

export const sheetSlot4CandBSubmarine = {
  id: 'shapes-2-slot4-cand-b-submarine',
  setId: 'shapes-2',
  slot: 4,
  slotCandidate: 'B',
  title: 'Mystery Picture 4B',
  pictureName: 'Deep-Sea Research Submarine',
  variables: ['A', 'B', 'C'],
  shapes: { A: subA, B: subB, C: subC },
  expression: 'a && !(b || c)',
  intendedTrueRows: [4],
  decoyRows: [6],
  decoyDescription: 'A dorsal decoy mast and periscope structure attached directly to the aft deck.',
  decoyRemovedBy: 'NOT(B || C) around the group removes all B and C overlap',
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// ===========================================================================
// SLOT 5: EXTENSION CANDIDATE (Table mode, badges: false, DECOYS: REQUIRED)
// ===========================================================================

// Candidate 5A: Orbital Research Satellite with Decoy Booster Engine
// Work-backwards design:
// 1. Target silhouette: Scientific orbital satellite with central bus, parabolic antenna dish, and wide solar array wings.
// 2. Boundary distribution:
//    - Shape A carries the central instrument bus, antenna mast, and dish antenna.
//    - Shape B carries the wide horizontal solar panel arrays.
//    - Shape C carries an attached rocket booster engine / service module.
// 3. Why no single outline traces the picture:
//    - Shape A alone has no solar wings; it is only the central core.
//    - Shape B alone is just a wide horizontal bar of solar panels without a body.
// 4. Decoy justification:
//    - Row 7 (A && B && C) is shaped like an attached booster rocket engine bell at the base of the satellite.
//    - Row 7 area is > 250 mm² and shares a boundary with the true satellite bus.
//    - Under (A || B) && !C, Row 7 evaluates to FALSE because C=1 (excluded by NOT(C)).
//    - Students who miss NOT(C) will incorrectly include the booster engine on the orbital satellite.
const satelliteA = unionShapes(
  createCircle({ cx: 90, cy: 22, r: 8, segments: 24 }),
  createPolygon([ [86, 28], [94, 28], [92, 38], [88, 38] ]),
  createRoundedRectangle({ x: 76, y: 38, width: 28, height: 48, radius: 6, segments: 16 })
);

const solarWingsB = createRoundedRectangle({
  x: 38,
  y: 44,
  width: 104,
  height: 22,
  radius: 4,
  segments: 16,
});

const boosterDecoyC = createPolygon([
  [68, 56],
  [112, 56],
  [120, 88],
  [60, 88],
]);

export const sheetSlot5CandASatellite = {
  id: 'shapes-2-slot5-cand-a-satellite',
  setId: 'shapes-2',
  slot: 5,
  slotCandidate: 'A',
  title: 'Challenge Picture 5',
  pictureName: 'Orbital Research Satellite',
  tier: 'extension',
  variables: ['A', 'B', 'C'],
  shapes: { A: satelliteA, B: solarWingsB, C: boosterDecoyC },
  expression: '(a || b) && !c',
  intendedTrueRows: [2, 4, 6],
  decoyRows: [7],
  decoyDescription: 'An attached rocket booster engine / service propulsion bell at the base of the satellite.',
  decoyRemovedBy: 'NOT(C) in (A || B) && !C',
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// ===========================================================================
// SLOT 6: EXTENSION CANDIDATE (Shade mode, badges: false, DECOYS: REQUIRED)
// ===========================================================================

// Candidate 6A: Raptor Falcon in Flight with Decoy Prey Branch
// Work-backwards design:
// 1. Target silhouette: Soaring raptor falcon with sharp hooked head, swept left wing, swept right wing, and fan tail feathers.
// 2. Boundary distribution:
//    - Shape A carries the left swept wing, head, and upper torso.
//    - Shape B carries the right swept wing, lower torso, and fan tail feathers.
//    - Shape C is a crossing branch geometry across the lower body.
// 3. Why no single outline traces the picture:
//    - Shape A alone has only the left wing and upper body (asymmetric half-bird).
//    - Shape B alone has only the right wing and tail (asymmetric half-bird).
//    - Neither outline resembles a soaring falcon. The multi-term expression combines them into a full bird.
// 4. Decoy justification:
//    - Row 7 (A && B && C) is shaped like an oversized decoy talon/prey perch attached directly below the falcon body.
//    - Row 7 area is > 200 mm² and touches the true falcon body (Row 6).
//    - Under (A && !B) || (B && !C), Row 7 evaluates to FALSE because B=1 and C=1.
//    - Students who fail to apply the NOT(C) to the second term will mistakenly shade the decoy talon/branch.
const falconA = createPolygon([
  [90, 18],
  [100, 26],
  [100, 70],
  [68, 70],
  [68, 52],
  [40, 42],
  [40, 30],
  [82, 32],
]);

const falconB = createPolygon([
  [90, 18],
  [100, 26],
  [140, 30],
  [140, 42],
  [112, 52],
  [112, 88],
  [80, 88],
  [80, 52],
]);

const falconDecoyC = createPolygon([
  [60, 52],
  [120, 52],
  [130, 82],
  [50, 82],
]);

export const sheetSlot6CandAFalcon = {
  id: 'shapes-2-slot6-cand-a-falcon',
  setId: 'shapes-2',
  slot: 6,
  slotCandidate: 'A',
  title: 'Challenge Picture 6',
  pictureName: 'Raptor Falcon in Flight',
  tier: 'extension',
  variables: ['A', 'B', 'C'],
  shapes: { A: falconA, B: falconB, C: falconDecoyC },
  expression: '(a && !b) || (b && !c)',
  intendedTrueRows: [2, 4, 5, 6],
  decoyRows: [7],
  decoyDescription: 'A dorsal decoy prey perch / trailing talon branch directly below the falcon body.',
  decoyRemovedBy: 'NOT(B) in (A && !B) and NOT(C) in (B && !C)',
  instructions: ADVANCED_INSTRUCTIONS_WITHOUT_BADGES,
  showRegionRowNumbers: false,
  frozen: false,
  rowIndexBase: 0,
  viewBox: { width: 180, height: 95 },
};

// ===========================================================================
// SET EXPORT
// ===========================================================================

export const SET_SHAPES_2 = {
  id: 'shapes-2',
  title: 'CourseENG Logic Block — Camouflaged Shape Puzzles (Set 2)',
  slots: {
    slot1: [sheetSlot1CandAWrench, sheetSlot1CandBCat],
    slot2: [sheetSlot2CandACactus, sheetSlot2CandBBoat],
    slot3: [sheetSlot3CandATrain, sheetSlot3CandBGuitar],
    slot4: [sheetSlot4CandATurtle, sheetSlot4CandBSubmarine],
    slot5: [sheetSlot5CandASatellite],
    slot6: [sheetSlot6CandAFalcon],
  },
  // Canonical progression (1 sheet per slot: 1B Cat, 2A Cactus, 3A Train, 4B Submarine, 5A Satellite, 6A Falcon)
  sheets: [
    sheetSlot1CandBCat,
    sheetSlot2CandACactus,
    sheetSlot3CandATrain,
    sheetSlot4CandBSubmarine,
    sheetSlot5CandASatellite,
    sheetSlot6CandAFalcon,
  ],
};
