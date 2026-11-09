// Dashboard frame layout (AD-4, AD-18, FR-50). Pure: no React, DOM or storage.
//
// FRAME[state] is the ONLY source of every Dashboard section's position and
// size. The page lays out from this table, never from content height, so a
// section renders at its final size while loading, when ready and on error
// (CLS 0). Values are copied verbatim from PRD FR-50, FR-59, the card
// positions in PRD §4.6–§4.10 and design spec Part B §2.1 / §10:
//
//   Header 0,0 1366×64 · title strip 0,64 1366×68 · KPI strip 24,136 1318×90
//   Content 24,246 · Row 1: two 649-wide cards, gap 20, 444 (Full) / 240
//   (Small, All-good) high · Row 2 at content y 464 / 260: three 426×326
//   cards, gap 20 · bottom space 16 / 28 / 24 (`pageBottomSpacePx`, PRD
//   addendum §B) → frame heights 1052 / 860 / 856.
//
// Boxes are page coordinates `{ x, y, w, h }` in px.

const deepFreeze = (object) => {
  for (const value of Object.values(object)) {
    if (value && typeof value === 'object') deepFreeze(value);
  }
  return Object.freeze(object);
};

/** Section keys in visual (and Tab) order; each is also its key in the state JSON. */
export const SECTION_KEYS = Object.freeze(['kpi', 'equipmentCard', 'recentAlerts', 'fanActivity', 'grain', 'liquid']);

/** The canvas width (AD-4) and where the page content starts: below Header 64 + title strip 68. */
export const CANVAS_WIDTH = 1366;
export const CONTENT_TOP = 132;

export const FRAME = deepFreeze({
  // Figma 6215:58878, 1366×1052
  full: {
    figmaFrame: '6215:58878',
    height: 1052,
    pageBottomSpacePx: 16,
    sections: {
      kpi: { x: 24, y: 136, w: 1318, h: 90 },
      equipmentCard: { x: 24, y: 246, w: 649, h: 444 },
      recentAlerts: { x: 693, y: 246, w: 649, h: 444 },
      fanActivity: { x: 24, y: 710, w: 426, h: 326 },
      grain: { x: 470, y: 710, w: 426, h: 326 },
      liquid: { x: 916, y: 710, w: 426, h: 326 },
    },
  },
  // Figma 6864:4514, 1366×860
  small: {
    figmaFrame: '6864:4514',
    height: 860,
    pageBottomSpacePx: 28,
    sections: {
      kpi: { x: 24, y: 136, w: 1318, h: 90 },
      equipmentCard: { x: 24, y: 246, w: 649, h: 240 },
      recentAlerts: { x: 693, y: 246, w: 649, h: 240 },
      fanActivity: { x: 24, y: 506, w: 426, h: 326 },
      grain: { x: 470, y: 506, w: 426, h: 326 },
      liquid: { x: 916, y: 506, w: 426, h: 326 },
    },
  },
  // Figma 6879:15603, 1366×856
  allgood: {
    figmaFrame: '6879:15603',
    height: 856,
    pageBottomSpacePx: 24,
    sections: {
      kpi: { x: 24, y: 136, w: 1318, h: 90 },
      equipmentCard: { x: 24, y: 246, w: 649, h: 240 },
      recentAlerts: { x: 693, y: 246, w: 649, h: 240 },
      fanActivity: { x: 24, y: 506, w: 426, h: 326 },
      grain: { x: 470, y: 506, w: 426, h: 326 },
      liquid: { x: 916, y: 506, w: 426, h: 326 },
    },
  },
});

/** The bottom edge of the lowest section in `frame` (page y, px); 0 with no sections. */
export function lastRowBottom(frame) {
  const boxes = Object.values(frame?.sections ?? {});
  return boxes.length === 0 ? 0 : Math.max(...boxes.map(({ y, h }) => y + h));
}

/**
 * The document height of `frame`: the last card row plus `pageBottomSpacePx`
 * (FR-50, AD-4). Equals the Figma frame height: 1052 / 860 / 856. A missing
 * `pageBottomSpacePx` counts as 0.
 */
export function pageHeight(frame) {
  const bottom = frame?.pageBottomSpacePx;
  return lastRowBottom(frame) + (Number.isFinite(bottom) ? bottom : 0);
}
