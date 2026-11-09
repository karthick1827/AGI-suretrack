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
/** Column geometry (FR-80, FR-81): 103 px columns on the chart's bottom edge. */
export const RUNTIME_COLUMN_HEIGHT_PX = 103;
/** The day label box under each bar: padding-top 5 + 14 px of Roboto 12. */
export const RUNTIME_DAY_LABEL_PX = 19;
/** The value label sits 18 px above the bar top (FR-81 `top: -18px`). */
export const RUNTIME_VALUE_LABEL_OFFSET_PX = 18;
/** The shorter chart (Full: 119 px; Small and All-good 120). */
export const RUNTIME_CHART_MIN_HEIGHT_PX = 119;
/** A bar's room in its column above the day label: 103 − 19 = 84 px. */
export const RUNTIME_BAR_SPACE_PX = RUNTIME_COLUMN_HEIGHT_PX - RUNTIME_DAY_LABEL_PX;
/**
 * The tallest bar whose value label still starts inside the chart in every
 * state: the column space plus the headroom above the column in the shorter
 * chart (119 − 103 = 16), less the label offset (18): 84 + 16 − 18 = 82 px.
 */
export const RUNTIME_MAX_BAR_PX =
  RUNTIME_BAR_SPACE_PX + (RUNTIME_CHART_MIN_HEIGHT_PX - RUNTIME_COLUMN_HEIGHT_PX) - RUNTIME_VALUE_LABEL_OFFSET_PX;

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
/** Usable hours: a finite number ≥ 0. */
const usableHours = (value) => finite(value) && value >= 0;
/** An explicit `barPx` usable as a height: an integer from 0 to RUNTIME_MAX_BAR_PX (82). */
const usableBarPx = (value) => Number.isInteger(value) && value >= 0 && value <= RUNTIME_MAX_BAR_PX;

/**
 * FR-80 Runtime bars, oldest to newest.
 *
 * Drawn entries: objects whose `hours` is not a negative number (an entry
 * with negative hours is dropped, so no "-5h" can be drawn) and that have
 * usable hours (finite, ≥ 0) or a usable `barPx`. Anything else is skipped.
 * Only the last 7 drawn entries are kept (the chart is "the last 7 days",
 * ending with today); fewer give fewer bars, in slots from the left.
 *
 * One scale per chart:
 *   - `barPx` (AD-8, AD-14: exact, 0 px tolerance) only when EVERY drawn
 *     entry has a usable `barPx`: an integer from 0 to 82 px, the tallest bar
 *     whose value label stays inside the chart (RUNTIME_MAX_BAR_PX, from the
 *     column geometry). A fractional, negative, too-large or non-numeric
 *     `barPx` is not usable; it is never capped or rounded.
 *   - Otherwise the formula for ALL drawn bars: `round(hours / max(hours) ×
 *     79)`, max over the drawn bars only (an entry outside the 7-day window
 *     never scales the chart). A max of 0, or an entry without usable hours,
 *     gives 0.
 *
 * Returned per bar:
 *   - `x`: the bar's left edge in the chart, centred in slot i:
 *     (55.14 − 24) / 2 + i × 55.14 → 15.57, 70.71, 125.86, 181.00, 236.14,
 *     291.29, 346.43.
 *   - `height`: as above; always a finite integer ≥ 0.
 *   - `hours`: the usable hours, else null.
 *   - `day`: passed through as given; the card decides what may be shown.
 *   - `isToday`: true only for the LAST drawn entry with `isToday === true`;
 *     `isToday` on any other entry is ignored.
 *
 * Never throws and never returns NaN.
 *
 * @param {unknown} chart  `fanActivity.chart`
 * @returns {{ day: unknown, hours: number | null, isToday: boolean, x: number, height: number }[]}
 */
export function runtimeBars(chart) {
  if (!Array.isArray(chart)) return [];
  const entries = chart
    .filter(
      (entry) =>
        isPlainObject(entry) &&
        !(finite(entry.hours) && entry.hours < 0) &&
        (usableHours(entry.hours) || usableBarPx(entry.barPx)),
    )
    .slice(-RUNTIME_SLOTS);
  const exact = entries.every((entry) => usableBarPx(entry.barPx));
  const max = entries.reduce((top, entry) => (usableHours(entry.hours) && entry.hours > top ? entry.hours : top), 0);
  const inset = (RUNTIME_COLUMN_PX - RUNTIME_BAR_WIDTH_PX) / 2;
  const last = entries.length - 1;
  return entries.map((entry, i) => {
    let height = 0;
    if (exact) height = entry.barPx;
    else if (usableHours(entry.hours) && max > 0) height = Math.round((entry.hours / max) * RUNTIME_SCALE_PX);
    return {
      day: entry.day,
      hours: usableHours(entry.hours) ? entry.hours : null,
      isToday: i === last && entry.isToday === true,
      x: inset + i * RUNTIME_COLUMN_PX,
      height,
    };
  });
}
