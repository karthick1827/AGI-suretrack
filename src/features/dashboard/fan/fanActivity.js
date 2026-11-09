// The Fan activity card's usable content (FR-79 to FR-82). FanActivityCard
// draws exactly these; the Dashboard page uses hasFanContent() to show a
// ready slice it cannot draw as the section error (FR-96).
import { runtimeBars } from '../../../lib/geometry.js';

/** FR-79: the frame draws three Stat tiles. */
export const MAX_FAN_TILES = 3;

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** A reading renders only if it is a string or a finite number (verbatim, never formatted); else null. */
export const shownText = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' ? value : null;
};

/** A shown reading with visible text, else null. */
const visibleText = (value) => {
  const text = shownText(value);
  return text !== null && text.trim() !== '' ? text : null;
};

/**
 * FR-79 Stat tiles: objects of `fanActivity.tiles` with a visible value or
 * label, in file order, at most three (the frame's slots).
 *
 * @returns {{ value: string | null, label: string | null }[]}
 */
export function fanTiles(data) {
  if (!isObject(data) || !Array.isArray(data.tiles)) return [];
  return data.tiles
    .filter((tile) => isObject(tile) && (visibleText(tile.value) !== null || visibleText(tile.label) !== null))
    .slice(0, MAX_FAN_TILES)
    .map((tile) => ({ value: shownText(tile.value), label: shownText(tile.label) }));
}

/** FR-80 Runtime bars from `fanActivity.chart` (geometry.runtimeBars, AD-8). */
export function fanBars(data) {
  return isObject(data) ? runtimeBars(data.chart) : [];
}

/** FR-80: the chart's accessible name (`fanActivity.chartLabel`), or null when it has no visible text. */
export function chartLabel(data) {
  return isObject(data) && typeof data.chartLabel === 'string' && data.chartLabel.trim() !== '' ? data.chartLabel : null;
}

/** FR-82: the caption (verbatim), or null when it has no visible text. */
export function fanCaption(data) {
  return isObject(data) ? visibleText(data.caption) : null;
}

/**
 * Whether a ready `fanActivity` slice has something the card can draw: at
 * least one Stat tile or one Runtime bar. Anything else (no tiles and no
 * usable chart entries, whatever the caption) is a section load error.
 */
export function hasFanContent(data) {
  return fanTiles(data).length > 0 || fanBars(data).length > 0;
}
