// Chart geometry (AD-8). Pure: no React, DOM or storage.
//
// Every chart px value comes from these functions; components render the
// result as plain DOM and never re-derive a width. Explicit px in the data
// (`barPx`, `segmentPx`, `segmentTopPx`) always wins over a formula (Stories
// 2.6–2.8 add those charts here).

/** Health bar (FR-69): 474 px wide, 2 px gaps between non-zero segments. */
export const HEALTH_BAR_PX = 474;
export const HEALTH_GAP_PX = 2;

/** Health segment order, left to right (FR-69): alert, offline (hatch), healthy. */
export const HEALTH_KINDS = Object.freeze(['alerts', 'offline', 'healthy']);

/** A count usable for geometry: a finite number ≥ 0; anything else counts as 0. */
const countOf = (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);

/**
 * FR-69 Health segments: `segment_px = (474 − 2·(k − 1)) × count / total`,
 * where `total = alerts + offline + healthy` and `k` is the number of non-zero
 * segments. Zero-count segments are omitted (no gap is reserved for them); a
 * single segment spans the full 474 px. A total of 0 (or no usable counts)
 * gives no segments.
 *
 * @param {{ alerts?: number, offline?: number, healthy?: number }} counts
 * @returns {{ kind: 'alerts' | 'offline' | 'healthy', x: number, width: number }[]}
 */
export function healthSegments(counts) {
  const source = counts !== null && typeof counts === 'object' ? counts : {};
  const present = HEALTH_KINDS.map((kind) => ({ kind, count: countOf(source[kind]) })).filter(({ count }) => count > 0);
  const total = present.reduce((sum, { count }) => sum + count, 0);
  if (present.length === 0 || !Number.isFinite(total) || total <= 0) return [];
  const available = HEALTH_BAR_PX - HEALTH_GAP_PX * (present.length - 1);
  let x = 0;
  return present.map(({ kind, count }) => {
    const width = (available * count) / total;
    const segment = { kind, x, width };
    x += width + HEALTH_GAP_PX;
    return segment;
  });
}
