/**
 * Reveal Overlays for Set: shapes-2 (10 candidates)
 *
 * Each overlay adds visual details (constellation lines, windows, rivets, etc.)
 * that render over the solved student shape puzzle.
 *
 * All coordinates fit within viewBox: 180x95.
 * Only allowed styles: detail-stroke, detail-fill, accent, highlight, star.
 */

export const OVERLAYS_SHAPES_2 = {
  // Slot 1A: Mechanic Open-End Wrench
  'shapes-2-slot1-cand-a-wrench': [
    { type: 'line', x1: 38, y1: 50, x2: 88, y2: 50, style: 'detail-stroke' },
    { type: 'circle', cx: 60, cy: 50, r: 2.5, style: 'accent' },
    { type: 'line', x1: 106, y1: 48, x2: 116, y2: 44, style: 'accent' },
    { type: 'line', x1: 106, y1: 54, x2: 116, y2: 58, style: 'accent' },
    { type: 'line', x1: 106, y1: 48, x2: 106, y2: 54, style: 'accent' },
    { type: 'line', x1: 96, y1: 38, x2: 118, y2: 36, style: 'highlight' },
  ],

  // Slot 1B: Stylized Cat Silhouette
  'shapes-2-slot1-cand-b-cat': [
    { type: 'polyline', points: '74,32 78,40 70,38', style: 'accent' },
    { type: 'polyline', points: '106,32 102,40 110,38', style: 'accent' },
    { type: 'circle', cx: 78, cy: 46, r: 2.2, style: 'accent' },
    { type: 'circle', cx: 102, cy: 46, r: 2.2, style: 'accent' },
    { type: 'circle', cx: 79, cy: 45.5, r: 0.8, style: 'highlight' },
    { type: 'circle', cx: 103, cy: 45.5, r: 0.8, style: 'highlight' },
    { type: 'polygon', points: '88,54 92,54 90,57', style: 'accent' },
    { type: 'line', x1: 66, y1: 52, x2: 52, y2: 50, style: 'detail-stroke' },
    { type: 'line', x1: 66, y1: 55, x2: 50, y2: 56, style: 'detail-stroke' },
    { type: 'line', x1: 114, y1: 52, x2: 128, y2: 50, style: 'detail-stroke' },
    { type: 'line', x1: 114, y1: 55, x2: 130, y2: 56, style: 'detail-stroke' },
  ],

  // Slot 2A: Desert Saguaro Cactus
  'shapes-2-slot2-cand-a-cactus': [
    { type: 'circle', cx: 90, cy: 20, r: 3, style: 'accent' },
    { type: 'circle', cx: 90, cy: 20, r: 1.5, style: 'star' },
    { type: 'line', x1: 90, y1: 26, x2: 90, y2: 66, style: 'detail-stroke' },
    { type: 'line', x1: 58, y1: 40, x2: 58, y2: 56, style: 'detail-stroke' },
    { type: 'line', x1: 122, y1: 42, x2: 122, y2: 58, style: 'detail-stroke' },
    { type: 'line', x1: 87, y1: 34, x2: 93, y2: 34, style: 'accent' },
    { type: 'line', x1: 87, y1: 48, x2: 93, y2: 48, style: 'accent' },
    { type: 'line', x1: 55, y1: 46, x2: 61, y2: 46, style: 'accent' },
    { type: 'line', x1: 119, y1: 48, x2: 125, y2: 48, style: 'accent' },
  ],

  // Slot 2B: Classic Sailing Sloop
  'shapes-2-slot2-cand-b-boat': [
    { type: 'line', x1: 87, y1: 22, x2: 87, y2: 68, style: 'accent' },
    { type: 'line', x1: 87, y1: 64, x2: 126, y2: 64, style: 'accent' },
    { type: 'line', x1: 87, y1: 24, x2: 54, y2: 64, style: 'detail-stroke' },
    { type: 'line', x1: 87, y1: 36, x2: 110, y2: 64, style: 'detail-stroke' },
    { type: 'line', x1: 87, y1: 50, x2: 120, y2: 64, style: 'detail-stroke' },
    { type: 'line', x1: 52, y1: 68, x2: 128, y2: 68, style: 'highlight' },
  ],

  // Slot 3A: Classic Steam Locomotive
  'shapes-2-slot3-cand-a-train': [
    { type: 'polygon', points: '58,36 74,36 74,48 58,48', style: 'highlight' },
    { type: 'line', x1: 66, y1: 36, x2: 66, y2: 48, style: 'accent' },
    { type: 'ellipse', cx: 115, cy: 24, rx: 6, ry: 2, style: 'accent' },
    { type: 'circle', cx: 112, cy: 16, r: 4, style: 'highlight' },
    { type: 'circle', cx: 104, cy: 10, r: 5.5, style: 'highlight' },
    { type: 'circle', cx: 94, cy: 6, r: 4.5, style: 'detail-stroke' },
    { type: 'line', x1: 88, y1: 42, x2: 88, y2: 70, style: 'accent' },
    { type: 'line', x1: 102, y1: 42, x2: 102, y2: 70, style: 'accent' },
    { type: 'line', x1: 124, y1: 72, x2: 134, y2: 72, style: 'detail-stroke' },
    { type: 'line', x1: 122, y1: 60, x2: 130, y2: 70, style: 'detail-stroke' },
  ],

  // Slot 3B: Solid-Body Electric Guitar
  'shapes-2-slot3-cand-b-guitar': [
    { type: 'line', x1: 88, y1: 26, x2: 96, y2: 26, style: 'detail-stroke' },
    { type: 'line', x1: 88, y1: 34, x2: 96, y2: 34, style: 'detail-stroke' },
    { type: 'line', x1: 88, y1: 42, x2: 96, y2: 42, style: 'detail-stroke' },
    { type: 'polyline', points: '86,56 96,56 96,60 86,60 86,56', style: 'accent' },
    { type: 'polyline', points: '86,64 96,64 96,68 86,68 86,64', style: 'accent' },
    { type: 'line', x1: 86, y1: 74, x2: 96, y2: 74, style: 'highlight' },
    { type: 'circle', cx: 74, cy: 74, r: 2.5, style: 'accent' },
    { type: 'circle', cx: 78, cy: 80, r: 2.5, style: 'accent' },
  ],

  // Slot 4A: Gliding Oceanic Sea Turtle
  'shapes-2-slot4-cand-a-turtle': [
    { type: 'circle', cx: 86, cy: 22, r: 1.2, style: 'accent' },
    { type: 'circle', cx: 94, cy: 22, r: 1.2, style: 'accent' },
    { type: 'polygon', points: '90,34 98,40 98,50 90,56 82,50 82,40', style: 'accent' },
    { type: 'polygon', points: '90,56 97,62 97,70 90,74 83,70 83,62', style: 'accent' },
    { type: 'line', x1: 68, y1: 44, x2: 48, y2: 52, style: 'detail-stroke' },
    { type: 'line', x1: 112, y1: 44, x2: 132, y2: 52, style: 'detail-stroke' },
  ],

  // Slot 4B: Deep-Sea Research Submarine
  'shapes-2-slot4-cand-b-submarine': [
    { type: 'line', x1: 90, y1: 24, x2: 90, y2: 14, style: 'accent' },
    { type: 'line', x1: 90, y1: 14, x2: 96, y2: 14, style: 'accent' },
    { type: 'circle', cx: 58, cy: 56, r: 3, style: 'highlight' },
    { type: 'circle', cx: 68, cy: 56, r: 3, style: 'highlight' },
    { type: 'circle', cx: 78, cy: 56, r: 3, style: 'highlight' },
    { type: 'line', x1: 48, y1: 62, x2: 124, y2: 62, style: 'detail-stroke' },
    { type: 'line', x1: 136, y1: 48, x2: 142, y2: 42, style: 'accent' },
    { type: 'line', x1: 136, y1: 66, x2: 142, y2: 72, style: 'accent' },
  ],

  // Slot 5A: Orbital Research Satellite
  'shapes-2-slot5-cand-a-satellite': [
    { type: 'circle', cx: 90, cy: 22, r: 2.5, style: 'accent' },
    { type: 'line', x1: 90, y1: 22, x2: 90, y2: 30, style: 'accent' },
    { type: 'line', x1: 44, y1: 55, x2: 76, y2: 55, style: 'highlight' },
    { type: 'line', x1: 54, y1: 44, x2: 54, y2: 66, style: 'detail-stroke' },
    { type: 'line', x1: 66, y1: 44, x2: 66, y2: 66, style: 'detail-stroke' },
    { type: 'line', x1: 104, y1: 55, x2: 136, y2: 55, style: 'highlight' },
    { type: 'line', x1: 114, y1: 44, x2: 114, y2: 66, style: 'detail-stroke' },
    { type: 'line', x1: 126, y1: 44, x2: 126, y2: 66, style: 'detail-stroke' },
  ],

  // Slot 6A: Raptor Falcon in Flight
  'shapes-2-slot6-cand-a-falcon': [
    { type: 'circle', cx: 92, cy: 22, r: 1.4, style: 'accent' },
    { type: 'line', x1: 90, y1: 18, x2: 86, y2: 22, style: 'accent' },
    { type: 'line', x1: 80, y1: 36, x2: 44, y2: 38, style: 'detail-stroke' },
    { type: 'line', x1: 76, y1: 44, x2: 48, y2: 42, style: 'detail-stroke' },
    { type: 'line', x1: 100, y1: 36, x2: 136, y2: 38, style: 'detail-stroke' },
    { type: 'line', x1: 104, y1: 44, x2: 132, y2: 42, style: 'detail-stroke' },
    { type: 'line', x1: 90, y1: 68, x2: 84, y2: 86, style: 'detail-stroke' },
    { type: 'line', x1: 90, y1: 68, x2: 90, y2: 86, style: 'detail-stroke' },
    { type: 'line', x1: 90, y1: 68, x2: 96, y2: 86, style: 'detail-stroke' },
  ],
};
