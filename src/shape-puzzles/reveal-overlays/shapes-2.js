/**
 * Reveal Overlays for Set 2 (shapes-2).
 *
 * Constellation-style SVG detail layer rendered only after success online.
 * Uses semantic style tokens: 'detail-stroke', 'detail-fill', 'accent', 'highlight', 'star'.
 * Coordinates are in sheet viewBox units (180 x 95).
 */

export const OVERLAYS_SHAPES_2 = {
  // --- SLOT 1 ---
  // Candidate 1A: Mechanic Open-End Wrench
  'shapes-2-slot1-cand-a-wrench': [
    // Handle grip texture and size stamp line
    { type: 'line', x1: 40, y1: 45, x2: 78, y2: 45, style: 'detail-stroke' },
    { type: 'line', x1: 40, y1: 53, x2: 78, y2: 53, style: 'detail-stroke' },
    // Handle hang hole
    { type: 'circle', cx: 36, cy: 49, r: 3.5, style: 'detail-fill' },
    { type: 'circle', cx: 36, cy: 49, r: 3.5, style: 'detail-stroke' },
    // Hex bolt head nestled inside the open jaws
    {
      type: 'polygon',
      points: '106,44 114,44 118,49 114,54 106,54 102,49',
      style: 'accent',
    },
    // Jaw rim bevel highlights
    { type: 'line', x1: 96, y1: 39, x2: 110, y2: 39, style: 'highlight' },
    { type: 'line', x1: 96, y1: 59, x2: 110, y2: 59, style: 'highlight' },
    // Metallic reflection sparkle
    { type: 'line', x1: 65, y1: 41, x2: 65, y2: 45, style: 'star' },
    { type: 'line', x1: 63, y1: 43, x2: 67, y2: 43, style: 'star' },
  ],

  // Candidate 1B: Stylized Cat Silhouette
  'shapes-2-slot1-cand-b-cat': [
    // Whisker lines
    { type: 'line', x1: 60, y1: 52, x2: 76, y2: 54, style: 'detail-stroke' },
    { type: 'line', x1: 58, y1: 58, x2: 76, y2: 56, style: 'detail-stroke' },
    { type: 'line', x1: 120, y1: 52, x2: 104, y2: 54, style: 'detail-stroke' },
    { type: 'line', x1: 122, y1: 58, x2: 104, y2: 56, style: 'detail-stroke' },
    // Cute triangle nose
    {
      type: 'polygon',
      points: '88,52 92,52 90,55',
      style: 'accent',
    },
    // Mouth curve
    { type: 'path', d: 'M 86 57 Q 90 60 94 57', style: 'detail-stroke' },
    // Inner ear accents
    {
      type: 'polygon',
      points: '72,26 80,30 76,38',
      style: 'detail-fill',
    },
    {
      type: 'polygon',
      points: '108,26 100,30 104,38',
      style: 'detail-fill',
    },
    // Eyes
    { type: 'ellipse', cx: 80, cy: 46, rx: 2.2, ry: 3.0, style: 'detail-stroke' },
    { type: 'ellipse', cx: 100, cy: 46, rx: 2.2, ry: 3.0, style: 'detail-stroke' },
    { type: 'circle', cx: 81, cy: 45, r: 0.8, style: 'highlight' },
    { type: 'circle', cx: 101, cy: 45, r: 0.8, style: 'highlight' },
  ],

  // Candidate 1C: Sailboat on Harbor Water
  'shapes-2-slot1-cand-c-boat': [
    // Mast
    { type: 'line', x1: 89, y1: 14, x2: 89, y2: 54, style: 'detail-stroke' },
    // Pennant flag on mast top
    {
      type: 'polygon',
      points: '89,14 78,18 89,22',
      style: 'accent',
    },
    // Sail seam lines
    { type: 'line', x1: 89, y1: 26, x2: 102, y2: 54, style: 'detail-stroke' },
    { type: 'line', x1: 89, y1: 38, x2: 110, y2: 54, style: 'detail-stroke' },
    // Hull portholes
    { type: 'circle', cx: 80, cy: 64, r: 1.5, style: 'detail-fill' },
    { type: 'circle', cx: 92, cy: 64, r: 1.5, style: 'detail-fill' },
    { type: 'circle', cx: 104, cy: 64, r: 1.5, style: 'detail-fill' },
    // Ocean ripples
    { type: 'line', x1: 45, y1: 76, x2: 75, y2: 76, style: 'detail-stroke' },
    { type: 'line', x1: 105, y1: 76, x2: 135, y2: 76, style: 'detail-stroke' },
  ],

  // --- SLOT 2 ---
  // Candidate 2A: Vintage Biplane Aircraft
  'shapes-2-slot2-cand-a-biplane': [
    // Propeller hub and spinning blades blur
    { type: 'ellipse', cx: 42, cy: 49, rx: 1.5, ry: 12.0, style: 'accent' },
    { type: 'circle', cx: 42, cy: 49, r: 2.2, style: 'detail-stroke' },
    // Cockpit windscreen
    { type: 'path', d: 'M 74 38 Q 80 34 84 38', style: 'detail-stroke' },
    { type: 'circle', cx: 78, cy: 42, r: 2.0, style: 'detail-fill' },
    // Wing rigging cross-wires
    { type: 'line', x1: 74, y1: 22, x2: 104, y2: 44, style: 'detail-stroke' },
    { type: 'line', x1: 74, y1: 44, x2: 104, y2: 22, style: 'detail-stroke' },
    // Wheels landing gear
    { type: 'line', x1: 64, y1: 60, x2: 60, y2: 74, style: 'detail-stroke' },
    { type: 'circle', cx: 60, cy: 74, r: 3.5, style: 'detail-stroke' },
    { type: 'circle', cx: 60, cy: 74, r: 1.5, style: 'detail-fill' },
  ],

  // Candidate 2B: Articulated Desk Lamp
  'shapes-2-slot2-cand-b-lamp': [
    // Lamp shade bulb glow cone
    { type: 'line', x1: 45, y1: 40, x2: 30, y2: 60, style: 'star' },
    { type: 'line', x1: 55, y1: 52, x2: 38, y2: 72, style: 'star' },
    // Arm spring coils
    { type: 'line', x1: 74, y1: 28, x2: 82, y2: 34, style: 'detail-stroke' },
    { type: 'line', x1: 82, y1: 34, x2: 76, y2: 40, style: 'detail-stroke' },
    { type: 'line', x1: 76, y1: 40, x2: 84, y2: 46, style: 'detail-stroke' },
    // Base switch button
    { type: 'circle', cx: 105, cy: 74, r: 2.0, style: 'accent' },
  ],

  // Candidate 2C: Robotic Planetary Rover
  'shapes-2-slot2-cand-c-rover': [
    // Mast sensor / camera lens
    { type: 'circle', cx: 72, cy: 22, r: 3.2, style: 'accent' },
    { type: 'circle', cx: 72, cy: 22, r: 1.2, style: 'highlight' },
    // Solar deck panel grid lines
    { type: 'line', x1: 54, y1: 44, x2: 84, y2: 44, style: 'detail-stroke' },
    { type: 'line', x1: 64, y1: 38, x2: 64, y2: 50, style: 'detail-stroke' },
    { type: 'line', x1: 74, y1: 38, x2: 74, y2: 50, style: 'detail-stroke' },
    // Rocker-bogie wheel axles
    { type: 'circle', cx: 56, cy: 68, r: 3.0, style: 'detail-stroke' },
    { type: 'circle', cx: 90, cy: 68, r: 3.0, style: 'detail-stroke' },
    { type: 'circle', cx: 120, cy: 68, r: 3.0, style: 'detail-stroke' },
  ],

  // --- SLOT 3 ---
  // Candidate 3A: Classic Steam Locomotive
  'shapes-2-slot3-cand-a-train': [
    // Boiler smokestack and steam cloud
    { type: 'line', x1: 56, y1: 26, x2: 56, y2: 16, style: 'detail-stroke' },
    { type: 'line', x1: 62, y1: 26, x2: 62, y2: 16, style: 'detail-stroke' },
    { type: 'line', x1: 54, y1: 16, x2: 64, y2: 16, style: 'detail-stroke' },
    { type: 'path', d: 'M 60 14 Q 54 8 62 4 Q 70 8 66 14', style: 'detail-fill' },
    // Cab window
    {
      type: 'polygon',
      points: '112,28 126,28 126,42 112,42',
      style: 'detail-fill',
    },
    // Driving wheels & connecting side rod
    { type: 'circle', cx: 60, cy: 72, r: 6.0, style: 'detail-stroke' },
    { type: 'circle', cx: 82, cy: 72, r: 6.0, style: 'detail-stroke' },
    { type: 'circle', cx: 104, cy: 72, r: 6.0, style: 'detail-stroke' },
    { type: 'line', x1: 60, y1: 72, x2: 104, y2: 72, style: 'accent' },
    // Cowcatcher grill wedge
    { type: 'line', x1: 42, y1: 74, x2: 34, y2: 82, style: 'detail-stroke' },
    { type: 'line', x1: 46, y1: 74, x2: 38, y2: 82, style: 'detail-stroke' },
  ],

  // Candidate 3B: Laboratory Compound Microscope
  'shapes-2-slot3-cand-b-microscope': [
    // Eyepiece lens tube
    { type: 'line', x1: 58, y1: 24, x2: 52, y2: 14, style: 'detail-stroke' },
    { type: 'line', x1: 66, y1: 24, x2: 60, y2: 14, style: 'detail-stroke' },
    // Coarse adjustment knob
    { type: 'circle', cx: 96, cy: 44, r: 4.5, style: 'accent' },
    { type: 'circle', cx: 96, cy: 44, r: 2.0, style: 'detail-stroke' },
    // Specimen glass slide on stage
    { type: 'line', x1: 62, y1: 56, x2: 88, y2: 56, style: 'highlight' },
    // Objective revolving nosepiece
    { type: 'circle', cx: 75, cy: 46, r: 2.5, style: 'detail-stroke' },
  ],

  // Candidate 3C: Solid-Body Electric Guitar
  'shapes-2-slot3-cand-c-guitar': [
    // Guitar neck frets and strings
    { type: 'line', x1: 96, y1: 18, x2: 96, y2: 60, style: 'highlight' },
    { type: 'line', x1: 100, y1: 18, x2: 100, y2: 60, style: 'highlight' },
    { type: 'line', x1: 104, y1: 18, x2: 104, y2: 60, style: 'highlight' },
    // Dual pickup coils
    {
      type: 'polygon',
      points: '78,44 90,44 90,48 78,48',
      style: 'detail-stroke',
    },
    {
      type: 'polygon',
      points: '78,54 90,54 90,58 78,58',
      style: 'detail-stroke',
    },
    // Volume/tone knobs
    { type: 'circle', cx: 62, cy: 58, r: 2.2, style: 'accent' },
    { type: 'circle', cx: 68, cy: 66, r: 2.2, style: 'accent' },
  ],

  // --- SLOT 4 (DECOYS) ---
  // Candidate 4A: Gliding Oceanic Sea Turtle
  'shapes-2-slot4-cand-a-turtle': [
    // Scute pattern on carapace shell
    {
      type: 'polygon',
      points: '58,40 68,34 78,40 74,48 62,48',
      style: 'detail-stroke',
    },
    {
      type: 'polygon',
      points: '62,48 74,48 70,58 58,58',
      style: 'detail-stroke',
    },
    // Eye dot
    { type: 'circle', cx: 48, cy: 38, r: 1.0, style: 'accent' },
    // Flipper streamline contours
    { type: 'path', d: 'M 54 30 Q 64 26 74 28', style: 'detail-stroke' },
    { type: 'path', d: 'M 54 66 Q 64 70 74 68', style: 'detail-stroke' },
    // Ambient ocean bubbles
    { type: 'circle', cx: 40, cy: 26, r: 1.2, style: 'highlight' },
    { type: 'circle', cx: 36, cy: 32, r: 0.8, style: 'highlight' },
    { type: 'circle', cx: 42, cy: 64, r: 1.0, style: 'highlight' },
  ],

  // Candidate 4B: Deep-Sea Research Submarine
  'shapes-2-slot4-cand-b-submarine': [
    // Conning tower periscope optics
    { type: 'line', x1: 64, y1: 22, x2: 64, y2: 14, style: 'detail-stroke' },
    { type: 'line', x1: 64, y1: 14, x2: 68, y2: 14, style: 'detail-stroke' },
    // Observation front dome viewport
    { type: 'circle', cx: 50, cy: 44, r: 3.5, style: 'highlight' },
    { type: 'circle', cx: 50, cy: 44, r: 3.5, style: 'detail-stroke' },
    // Propeller blades on stern
    { type: 'ellipse', cx: 128, cy: 46, rx: 1.5, ry: 7.0, style: 'accent' },
    // Sonar ping sound waves
    { type: 'path', d: 'M 36 38 A 12 12 0 0 0 36 50', style: 'star' },
    { type: 'path', d: 'M 32 34 A 18 18 0 0 0 32 54', style: 'star' },
  ],

  // Candidate 4C: Rescue Transport Helicopter
  'shapes-2-slot4-cand-c-helicopter': [
    // Main rotor blade span
    { type: 'line', x1: 40, y1: 18, x2: 120, y2: 18, style: 'accent' },
    { type: 'circle', cx: 80, cy: 18, r: 1.8, style: 'detail-stroke' },
    // Cockpit windshield
    { type: 'path', d: 'M 48 38 Q 54 32 62 34 L 60 46 Z', style: 'detail-fill' },
    // Landing skids
    { type: 'line', x1: 52, y1: 66, x2: 98, y2: 66, style: 'detail-stroke' },
    { type: 'line', x1: 62, y1: 56, x2: 62, y2: 66, style: 'detail-stroke' },
    { type: 'line', x1: 88, y1: 56, x2: 88, y2: 66, style: 'detail-stroke' },
  ],

  // --- SLOT 5 (EXTENSION / DECOYS) ---
  // Candidate 5A: Orbital Research Satellite
  'shapes-2-slot5-cand-a-satellite': [
    // Solar panel cell grid lines
    { type: 'line', x1: 44, y1: 44, x2: 68, y2: 44, style: 'highlight' },
    { type: 'line', x1: 52, y1: 38, x2: 52, y2: 50, style: 'highlight' },
    { type: 'line', x1: 60, y1: 38, x2: 60, y2: 50, style: 'highlight' },
    // High-gain dish antenna
    { type: 'circle', cx: 88, cy: 48, r: 6.0, style: 'accent' },
    { type: 'circle', cx: 88, cy: 48, r: 2.0, style: 'detail-stroke' },
    // Attitude control thruster plumes
    { type: 'line', x1: 70, y1: 20, x2: 70, y2: 14, style: 'star' },
    { type: 'line', x1: 106, y1: 20, x2: 106, y2: 14, style: 'star' },
  ],

  // Candidate 5B: Forging Anvil on Block
  'shapes-2-slot5-cand-b-anvil': [
    // Hardy hole square on anvil face
    {
      type: 'polygon',
      points: '56,42 62,42 62,48 56,48',
      style: 'detail-fill',
    },
    // Horn highlight bevel
    { type: 'line', x1: 110, y1: 40, x2: 126, y2: 44, style: 'highlight' },
    // Base wood stump grain rings
    { type: 'ellipse', cx: 88, cy: 68, rx: 12, ry: 4, style: 'detail-stroke' },
    { type: 'ellipse', cx: 88, cy: 68, rx: 6, ry: 2, style: 'detail-stroke' },
  ],

  // --- SLOT 6 (EXTENSION / DECOYS) ---
  // Candidate 6A: Raptor Falcon in Flight
  'shapes-2-slot6-cand-a-falcon': [
    // Wing pinion feather lines
    { type: 'line', x1: 46, y1: 32, x2: 62, y2: 42, style: 'detail-stroke' },
    { type: 'line', x1: 50, y1: 28, x2: 68, y2: 38, style: 'detail-stroke' },
    { type: 'line', x1: 110, y1: 26, x2: 96, y2: 38, style: 'detail-stroke' },
    { type: 'line', x1: 116, y1: 32, x2: 102, y2: 44, style: 'detail-stroke' },
    // Raptor curved beak and eye
    {
      type: 'polygon',
      points: '88,22 94,24 88,28',
      style: 'accent',
    },
    { type: 'circle', cx: 84, cy: 26, r: 1.0, style: 'highlight' },
    // Tail feather fan
    { type: 'line', x1: 76, y1: 58, x2: 70, y2: 74, style: 'detail-stroke' },
    { type: 'line', x1: 82, y1: 58, x2: 82, y2: 76, style: 'detail-stroke' },
    { type: 'line', x1: 88, y1: 58, x2: 94, y2: 74, style: 'detail-stroke' },
  ],

  // Candidate 6B: Multi-Masted Sailing Galleon
  'shapes-2-slot6-cand-b-galleon': [
    // Mainmast and foremast
    { type: 'line', x1: 72, y1: 16, x2: 72, y2: 54, style: 'detail-stroke' },
    { type: 'line', x1: 96, y1: 18, x2: 96, y2: 54, style: 'detail-stroke' },
    // Crow's nest platform
    { type: 'line', x1: 68, y1: 24, x2: 76, y2: 24, style: 'accent' },
    { type: 'line', x1: 92, y1: 26, x2: 100, y2: 26, style: 'accent' },
    // Shrouds and rigging lines
    { type: 'line', x1: 72, y1: 24, x2: 56, y2: 50, style: 'detail-stroke' },
    { type: 'line', x1: 96, y1: 26, x2: 112, y2: 50, style: 'detail-stroke' },
    // Bowsprit spar extending forward
    { type: 'line', x1: 52, y1: 44, x2: 36, y2: 36, style: 'detail-stroke' },
  ],
};
