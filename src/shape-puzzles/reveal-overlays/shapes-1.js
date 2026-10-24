/**
 * Reveal Overlays for Set 1 (shapes-1).
 *
 * Constellation-style SVG detail layer rendered only after success online.
 * Uses semantic style tokens: 'detail-stroke', 'detail-fill', 'accent', 'highlight', 'star'.
 * Coordinates are in sheet viewBox units (180 x 95).
 */

export const OVERLAYS_SHAPES_1 = {
  // Mystery Picture 1: Sun Rising Over Horizon
  'shapes-1-slot1-cand-c-sun': [
    // Sunburst rays radiating from the sun disk perimeter into the morning sky
    { type: 'line', x1: 90, y1: 14, x2: 90, y2: 6, style: 'accent' },
    { type: 'line', x1: 76, y1: 21, x2: 69, y2: 13, style: 'accent' },
    { type: 'line', x1: 104, y1: 21, x2: 111, y2: 13, style: 'accent' },
    { type: 'line', x1: 65, y1: 31, x2: 54, y2: 26, style: 'accent' },
    { type: 'line', x1: 115, y1: 31, x2: 126, y2: 26, style: 'accent' },

    // Intermediate shorter rays
    { type: 'line', x1: 83, y1: 16, x2: 80, y2: 10, style: 'star' },
    { type: 'line', x1: 97, y1: 16, x2: 100, y2: 10, style: 'star' },
    { type: 'line', x1: 70, y1: 25, x2: 63, y2: 21, style: 'star' },
    { type: 'line', x1: 110, y1: 25, x2: 117, y2: 21, style: 'star' },

    // Sun rim highlight arc
    { type: 'path', d: 'M 72 32 A 24 24 0 0 1 108 32', style: 'highlight' },

    // Water surface ripple lines below the horizon
    { type: 'line', x1: 45, y1: 56, x2: 75, y2: 56, style: 'detail-stroke' },
    { type: 'line', x1: 82, y1: 60, x2: 110, y2: 60, style: 'detail-stroke' },
    { type: 'line', x1: 55, y1: 66, x2: 95, y2: 66, style: 'detail-stroke' },
    { type: 'line', x1: 70, y1: 72, x2: 125, y2: 72, style: 'detail-stroke' },
    { type: 'line', x1: 40, y1: 78, x2: 80, y2: 78, style: 'detail-stroke' },
    { type: 'line', x1: 90, y1: 82, x2: 130, y2: 82, style: 'detail-stroke' },

    // Water reflection sparkles
    { type: 'circle', cx: 85, cy: 56, r: 0.8, style: 'highlight' },
    { type: 'circle', cx: 95, cy: 60, r: 0.9, style: 'highlight' },
    { type: 'circle', cx: 88, cy: 66, r: 1.0, style: 'highlight' },
    { type: 'circle', cx: 92, cy: 72, r: 0.8, style: 'highlight' },

    // Distant seabirds in flight
    { type: 'path', d: 'M 38 24 Q 42 20 46 24 Q 50 20 54 24', style: 'detail-stroke' },
    { type: 'path', d: 'M 126 18 Q 130 15 134 18 Q 138 15 142 18', style: 'detail-stroke' },
  ],

  // Mystery Picture 2: Faceted Gem in Ring Setting
  'shapes-1-slot1-cand-b-gem': [
    // Table facet octagon on gem crown
    {
      type: 'polygon',
      points: '82,38 98,38 104,44 104,52 98,58 82,58 76,52 76,44',
      style: 'detail-stroke',
    },

    // Star facet lines connecting octagon corners to outer gem perimeter
    { type: 'line', x1: 82, y1: 38, x2: 74, y2: 34, style: 'detail-stroke' },
    { type: 'line', x1: 98, y1: 38, x2: 106, y2: 34, style: 'detail-stroke' },
    { type: 'line', x1: 104, y1: 44, x2: 110, y2: 48, style: 'detail-stroke' },
    { type: 'line', x1: 104, y1: 52, x2: 110, y2: 48, style: 'detail-stroke' },
    { type: 'line', x1: 98, y1: 58, x2: 106, y2: 62, style: 'detail-stroke' },
    { type: 'line', x1: 82, y1: 58, x2: 74, y2: 62, style: 'detail-stroke' },
    { type: 'line', x1: 76, y1: 52, x2: 70, y2: 48, style: 'detail-stroke' },
    { type: 'line', x1: 76, y1: 44, x2: 70, y2: 48, style: 'detail-stroke' },

    // Ring band contour curves flanking setting
    { type: 'path', d: 'M 52 48 Q 70 36 76 44', style: 'detail-stroke' },
    { type: 'path', d: 'M 52 48 Q 70 60 76 52', style: 'detail-stroke' },
    { type: 'path', d: 'M 128 48 Q 110 36 104 44', style: 'detail-stroke' },
    { type: 'path', d: 'M 128 48 Q 110 60 104 52', style: 'detail-stroke' },

    // Setting prongs holding the stone at the 4 corners
    { type: 'circle', cx: 74, cy: 34, r: 1.2, style: 'accent' },
    { type: 'circle', cx: 106, cy: 34, r: 1.2, style: 'accent' },
    { type: 'circle', cx: 106, cy: 62, r: 1.2, style: 'accent' },
    { type: 'circle', cx: 74, cy: 62, r: 1.2, style: 'accent' },

    // Gem sparkles / light glints
    { type: 'line', x1: 106, y1: 26, x2: 106, y2: 34, style: 'star' },
    { type: 'line', x1: 102, y1: 30, x2: 110, y2: 30, style: 'star' },
    { type: 'circle', cx: 106, cy: 30, r: 0.8, style: 'highlight' },
    { type: 'line', x1: 74, y1: 66, x2: 74, y2: 72, style: 'star' },
    { type: 'line', x1: 71, y1: 69, x2: 77, y2: 69, style: 'star' },
  ],

  // Mystery Picture 3: Cozy Cabin with Hearth and Yard
  'shapes-1-slot2-cand-b-house': [
    // Chimney flue cap
    { type: 'line', x1: 68, y1: 10, x2: 92, y2: 10, style: 'detail-stroke' },
    { type: 'line', x1: 70, y1: 7, x2: 90, y2: 7, style: 'detail-stroke' },

    // Smoke wisps curling into sky
    { type: 'path', d: 'M 80 7 C 82 4, 78 2, 82 0', style: 'detail-stroke' },
    { type: 'path', d: 'M 84 5 Q 88 1 85 0', style: 'detail-stroke' },

    // Attic round louvre in gable
    { type: 'circle', cx: 90, cy: 28, r: 3.5, style: 'detail-stroke' },
    { type: 'line', x1: 86.5, y1: 28, x2: 93.5, y2: 28, style: 'detail-stroke' },
    { type: 'line', x1: 90, y1: 24.5, x2: 90, y2: 31.5, style: 'detail-stroke' },

    // Front door with doorknob
    { type: 'path', d: 'M 84 78 L 84 58 L 96 58 L 96 78', style: 'detail-stroke' },
    { type: 'circle', cx: 94, cy: 69, r: 0.8, style: 'accent' },

    // Window panes on left wall
    {
      type: 'polygon',
      points: '66,48 76,48 76,58 66,58',
      style: 'detail-fill',
    },
    { type: 'line', x1: 66, y1: 53, x2: 76, y2: 53, style: 'detail-stroke' },
    { type: 'line', x1: 71, y1: 48, x2: 71, y2: 58, style: 'detail-stroke' },

    // Window panes on right wall
    {
      type: 'polygon',
      points: '104,48 114,48 114,58 104,58',
      style: 'detail-fill',
    },
    { type: 'line', x1: 104, y1: 53, x2: 114, y2: 53, style: 'detail-stroke' },
    { type: 'line', x1: 109, y1: 48, x2: 109, y2: 58, style: 'detail-stroke' },

    // Roof shingle lines
    { type: 'line', x1: 62, y1: 38, x2: 118, y2: 38, style: 'detail-stroke' },
    { type: 'line', x1: 70, y1: 32, x2: 110, y2: 32, style: 'detail-stroke' },

    // Picket fence in yard
    { type: 'line', x1: 42, y1: 70, x2: 58, y2: 70, style: 'detail-stroke' },
    { type: 'line', x1: 46, y1: 66, x2: 46, y2: 75, style: 'detail-stroke' },
    { type: 'line', x1: 50, y1: 66, x2: 50, y2: 75, style: 'detail-stroke' },
    { type: 'line', x1: 54, y1: 66, x2: 54, y2: 75, style: 'detail-stroke' },
    { type: 'line', x1: 122, y1: 70, x2: 138, y2: 70, style: 'detail-stroke' },
    { type: 'line', x1: 126, y1: 66, x2: 126, y2: 75, style: 'detail-stroke' },
    { type: 'line', x1: 130, y1: 66, x2: 130, y2: 75, style: 'detail-stroke' },
    { type: 'line', x1: 134, y1: 66, x2: 134, y2: 75, style: 'detail-stroke' },

    // Stepping stones
    { type: 'ellipse', cx: 90, cy: 82, rx: 3, ry: 1.2, style: 'detail-stroke' },
    { type: 'ellipse', cx: 90, cy: 87, rx: 3.5, ry: 1.4, style: 'detail-stroke' },
  ],

  // Mystery Picture 4: Rocket Ship in Flight
  'shapes-1-slot2-cand-a-rocket': [
    // Nose cone seam and tip gleam
    { type: 'line', x1: 81, y1: 23, x2: 99, y2: 23, style: 'detail-stroke' },
    { type: 'circle', cx: 90, cy: 18, r: 1.0, style: 'highlight' },

    // Circular cockpit porthole / window
    { type: 'circle', cx: 90, cy: 32, r: 5.0, style: 'detail-fill' },
    { type: 'circle', cx: 90, cy: 32, r: 5.0, style: 'detail-stroke' },
    { type: 'circle', cx: 90, cy: 32, r: 3.2, style: 'accent' },
    { type: 'circle', cx: 88.5, cy: 30.5, r: 1.0, style: 'highlight' },

    // Fuselage panel seam lines
    { type: 'line', x1: 73, y1: 44, x2: 107, y2: 44, style: 'detail-stroke' },
    { type: 'line', x1: 73, y1: 58, x2: 107, y2: 58, style: 'detail-stroke' },

    // Wing panel seam lines
    { type: 'line', x1: 50, y1: 48, x2: 72, y2: 55, style: 'detail-stroke' },
    { type: 'line', x1: 130, y1: 48, x2: 108, y2: 55, style: 'detail-stroke' },
    { type: 'line', x1: 50, y1: 80, x2: 60, y2: 68, style: 'detail-stroke' },
    { type: 'line', x1: 130, y1: 80, x2: 120, y2: 68, style: 'detail-stroke' },

    // Engine nozzle and thruster flame
    {
      type: 'polygon',
      points: '82,70 98,70 95,75 85,75',
      style: 'detail-stroke',
    },
    { type: 'path', d: 'M 86 75 Q 90 92 90 92 Q 90 92 94 75 Z', style: 'accent' },
    { type: 'path', d: 'M 88 75 Q 90 85 90 85 Q 90 85 92 75 Z', style: 'highlight' },

    // Deep space background stars
    { type: 'line', x1: 32, y1: 22, x2: 32, y2: 28, style: 'star' },
    { type: 'line', x1: 29, y1: 25, x2: 35, y2: 25, style: 'star' },
    { type: 'line', x1: 148, y1: 26, x2: 148, y2: 32, style: 'star' },
    { type: 'line', x1: 145, y1: 29, x2: 151, y2: 29, style: 'star' },
    { type: 'line', x1: 42, y1: 62, x2: 42, y2: 66, style: 'star' },
    { type: 'line', x1: 40, y1: 64, x2: 44, y2: 64, style: 'star' },
    { type: 'line', x1: 140, y1: 68, x2: 140, y2: 72, style: 'star' },
    { type: 'line', x1: 138, y1: 70, x2: 142, y2: 70, style: 'star' },
    { type: 'circle', cx: 25, cy: 45, r: 0.7, style: 'highlight' },
    { type: 'circle', cx: 155, cy: 48, r: 0.7, style: 'highlight' },
  ],
};
