// Chart geometry (AD-8). Pure: no imports, React, DOM or storage.
//
// healthSegments() gives the Equipment card's Health bar segment px (FR-69);
// the card renders them as plain DOM and never re-derives a width.

/** Health bar (FR-69): 474 px wide, 2 px gaps between non-zero segments. */
export const HEALTH_BAR_PX = 474;
export const HEALTH_GAP_PX = 2;

/** Health segment order, left to right (FR-69): alert, offline (hatch), healthy. */
export const HEALTH_KINDS = Object.freeze(['alerts', 'offline', 'healthy']);

/** A count usable for geometry: a non-negative integer; anything else counts as 0. */
const countOf = (value) => (Number.isInteger(value) && value > 0 ? value : 0);

/**
 * FR-69 Health segments: `segment_px = (474 − 2·(k − 1)) × count / total`,
 * where `total = alerts + offline + healthy` and `k` is the number of non-zero
 * segments. Zero-count segments are omitted (no gap is reserved for them); a
 * single segment spans the full 474 px. A count that is not a non-negative
 * integer counts as 0. A total of 0, or one too large to be finite, gives no
 * segments.
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

// runtimeBars() gives the Fan activity card's Runtime chart bars (FR-80,
// AD-14); the card renders them as plain DOM and never re-derives a height or
// an offset.

/** Runtime chart (FR-80): 386 px wide, 7 columns of 386 / 7 = 55.14 px. */
export const RUNTIME_CHART_PX = 386;
export const RUNTIME_SLOTS = 7;
export const RUNTIME_COLUMN_PX = RUNTIME_CHART_PX / RUNTIME_SLOTS;
/** Bar width (FR-80): 24 px, centred in its column. */
export const RUNTIME_BAR_WIDTH_PX = 24;
/** Fallback formula scale (FR-80): the largest `hours` gives a 79 px bar. */
export const RUNTIME_SCALE_PX = 79;
/**
 * The room a bar has in its 103 px column above the day label (padding 5 +
 * 14 px of Roboto 12): 84 px. A `barPx` beyond it is drawn at 84, so a bar
 * never leaves its column (no state document comes near: the tallest is 79).
 */
export const RUNTIME_BAR_SPACE_PX = 84;

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
/** An explicit `barPx` usable as a height: a finite number ≥ 0. */
const usableBarPx = (value) => finite(value) && value >= 0;

/**
 * FR-80 Runtime bars, oldest to newest. A chart entry is usable when it is an
 * object with a finite `hours` or a usable `barPx`; anything else is skipped.
 * Only the last 7 usable entries are drawn (the chart is "the last 7 days",
 * ending with today); fewer give fewer bars, in slots from the left.
 *
 *   - `x`: the bar's left edge in the chart, centred in slot i:
 *     (55.14 − 24) / 2 + i × 55.14 → 15.57, 70.71, 125.86, 181.00, 236.14,
 *     291.29, 346.43.
 *   - `height`: `barPx` exactly when it is given (AD-8, AD-14: 0 px
 *     tolerance; capped at the 84 px column space); otherwise the fallback
 *     `round(hours / max(hours) × 79)` over the drawn bars' finite hours. A
 *     max of 0 or below, or a non-finite or negative `hours`, gives 0.
 *   - `day`, `hours`, `isToday`: passed through as given (`isToday` is true
 *     only for the boolean true); the card decides what may be shown.
 *
 * Never throws and never returns NaN.
 *
 * @param {unknown} chart  `fanActivity.chart`
 * @returns {{ day: unknown, hours: unknown, isToday: boolean, x: number, height: number }[]}
 */
export function runtimeBars(chart) {
  if (!Array.isArray(chart)) return [];
  const entries = chart
    .filter((entry) => isPlainObject(entry) && (finite(entry.hours) || usableBarPx(entry.barPx)))
    .slice(-RUNTIME_SLOTS);
  const max = entries.reduce((top, entry) => (finite(entry.hours) && entry.hours > top ? entry.hours : top), 0);
  const inset = (RUNTIME_COLUMN_PX - RUNTIME_BAR_WIDTH_PX) / 2;
  return entries.map((entry, i) => {
    let height = 0;
    if (usableBarPx(entry.barPx)) height = Math.min(entry.barPx, RUNTIME_BAR_SPACE_PX);
    else if (finite(entry.hours) && entry.hours > 0 && max > 0) height = Math.round((entry.hours / max) * RUNTIME_SCALE_PX);
    return {
      day: entry.day,
      hours: entry.hours,
      isToday: entry.isToday === true,
      x: inset + i * RUNTIME_COLUMN_PX,
      height,
    };
  });
}
