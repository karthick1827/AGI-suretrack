// Chart geometry (AD-8). Pure: no imports, React, DOM or storage.
//
// healthSegments() gives the Equipment card's Health bar segment px (FR-69);
// the card renders them as plain DOM and never re-derives a width.
// runtimeBars() (FR-80) and grainSegments() (FR-85) follow below.

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

// grainSegments() gives the Grain On Hand card's Fill bar (FR-85, AD-8): each
// Commodity segment's px and colour, plus the remaining-capacity track. The
// card renders them as plain DOM and never re-derives a width or an offset.

/** Grain Fill bar (FR-85): 386 × 10 px. */
export const GRAIN_BAR_PX = 386;
export const GRAIN_BAR_HEIGHT_PX = 10;
/** Width formula (FR-85): 0.21386 px per k bu (298.75 px / 1397 k bu), rounded to 1.25 px. */
export const GRAIN_PX_PER_K = 0.21386;
export const GRAIN_ROUND_PX = 1.25;
/** Gaps (FR-85): 3.83 px after the first segment, 3.75 px after each later one. */
export const GRAIN_FIRST_GAP_PX = 3.83;
export const GRAIN_GAP_PX = 3.75;
/**
 * The remaining-capacity track (FR-85): `#EEF1EF` at left 321.33, width 81.25
 * (it overflows the 386 px bar by 16.58 px and is clipped). Every frame draws
 * it at this same place, whatever the segments (Full: right after Oats;
 * Small and All-good: 0.33 px after the 321 px Wheat override, Q-G1), so it
 * is the frame's fixed rectangle, not derived from the data.
 */
export const GRAIN_TRACK = Object.freeze({ left: 321.33, width: 81.25 });

/**
 * The one Commodity colour map (FR-85, SCRUM-39 AC7): segment and Legend
 * swatch colour per Commodity, the same in every state. `token` is the
 * tokens.css custom property holding that colour (AD-2).
 */
export const GRAIN_COMMODITIES = Object.freeze({
  Canola: Object.freeze({ color: '#E3C341', token: '--raw-e3c341' }),
  Corn: Object.freeze({ color: '#E07B39', token: '--raw-e07b39' }),
  Soybeans: Object.freeze({ color: '#6F8F4F', token: '--raw-6f8f4f' }),
  Wheat: Object.freeze({ color: '#C98F2E', token: '--raw-c98f2e' }),
  Barley: Object.freeze({ color: '#8FB36B', token: '--raw-8fb36b' }),
  Oats: Object.freeze({ color: '#B9A47A', token: '--raw-b9a47a' }),
});

/**
 * A Commodity's map entry, only when `name` is a mapped Commodity AND the
 * item's `color` is that Commodity's colour (hex, any letter case); anything
 * else (unknown Commodity, missing or different colour) is null: no colour.
 *
 * @returns {{ color: string, token: string } | null}
 */
export function grainCommodity(name, color) {
  if (typeof name !== 'string' || !Object.hasOwn(GRAIN_COMMODITIES, name)) return null;
  const entry = GRAIN_COMMODITIES[name];
  return typeof color === 'string' && color.toUpperCase() === entry.color ? entry : null;
}

/** FR-85 `round_to_1.25`. */
export const roundToGrainStep = (px) => Math.round(px / GRAIN_ROUND_PX) * GRAIN_ROUND_PX;

/** An explicit `segmentPx` usable as a width: a finite number > 0 and ≤ the 386 px bar. */
const usableSegmentPx = (value) => finite(value) && value > 0 && value <= GRAIN_BAR_PX;
/** An explicit `segmentTopPx` usable as a nudge: a finite number smaller in size than the 10 px bar. */
const usableSegmentTopPx = (value) => finite(value) && Math.abs(value) < GRAIN_BAR_HEIGHT_PX;
/** Usable `amountK`: a finite number ≥ 0. */
const usableAmountK = (value) => finite(value) && value >= 0;

/**
 * FR-85 Grain Fill bar, in file order (= Legend order).
 *
 * Width per item (AD-8: explicit px wins):
 *   - `segmentPx` when usable (a finite number > 0 and ≤ 386; Small and
 *     All-good Wheat 321, Q-G1). An unusable `segmentPx` (0, negative,
 *     over 386, non-finite, not a number) is never capped or rounded: the
 *     formula applies instead.
 *   - Otherwise `round_to_1.25(amountK × 0.21386)` for a usable `amountK`
 *     (finite, ≥ 0): Full Canola 72.5, Corn 67.5, Soybeans 57.5, Wheat 47.5,
 *     Barley 30, Oats 23.75.
 * An item that is not a plain object, or whose width is not > 0 (zero,
 * negative or invalid amount and no usable `segmentPx`), gets no segment and
 * no gap. Segments sit left to right with a 3.83 px gap after the first and
 * 3.75 px after each later one: Full lefts 0, 76.33, 147.58, 208.83, 260.08,
 * 293.83. A segment that would start at or beyond the bar's right edge (386)
 * is entirely clipped, so it is left out.
 *
 * `top` is a usable `segmentTopPx` (a finite number with |value| < 10; the
 * Figma nudge −0.5 in Small and All-good), else 0. `color` is the Commodity
 * map colour when the item's `name` and `color` match the map, else null (no
 * segment colour; see grainCommodity). `name` is passed through as given.
 *
 * Never throws and never returns NaN.
 *
 * @param {unknown} items  `grain.items`
 * @returns {{
 *   segments: { name: unknown, color: string | null, token: string | null, left: number, width: number, top: number }[],
 *   track: { left: number, width: number },
 * }}
 */
export function grainSegments(items) {
  const segments = [];
  let left = 0;
  for (const item of Array.isArray(items) ? items : []) {
    if (!isPlainObject(item)) continue;
    let width = 0;
    if (usableSegmentPx(item.segmentPx)) width = item.segmentPx;
    else if (usableAmountK(item.amountK)) width = roundToGrainStep(item.amountK * GRAIN_PX_PER_K);
    if (!(finite(width) && width > 0)) continue;
    if (!(left < GRAIN_BAR_PX)) break;
    const commodity = grainCommodity(item.name, item.color);
    segments.push({
      name: item.name,
      color: commodity ? commodity.color : null,
      token: commodity ? commodity.token : null,
      left,
      width,
      top: usableSegmentTopPx(item.segmentTopPx) ? item.segmentTopPx : 0,
    });
    left += width + (segments.length === 1 ? GRAIN_FIRST_GAP_PX : GRAIN_GAP_PX);
  }
  return { segments, track: { ...GRAIN_TRACK } };
}
