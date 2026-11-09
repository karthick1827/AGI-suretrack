// The Grain On Hand card's usable content (FR-84 to FR-87). GrainCard draws
// exactly these; the Dashboard page uses hasGrainContent() to show a ready
// slice it cannot draw as the section error (FR-96).
import { GRAIN_TRACK, grainItems } from '../../../lib/geometry.js';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * The one "visible text" rule (summary, fill label, Legend sub-labels): a
 * string with non-whitespace text, or a finite number (as its String()),
 * returned verbatim (never trimmed or formatted); anything else is null.
 * (Legend names are always mapped Commodity names: see geometry.grainItems.)
 */
export const visibleText = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim() !== '' ? value : null;
};

/**
 * FR-84 summary line and fill label, verbatim (Q-G3 contradictions kept).
 *
 * @returns {{ bold: string | null, rest: string | null, fillLabel: string | null }}
 */
export function grainSummary(data) {
  if (!isObject(data)) return { bold: null, rest: null, fillLabel: null };
  return { bold: visibleText(data.summaryBold), rest: visibleText(data.summaryRest), fillLabel: visibleText(data.fillLabel) };
}

/** Whether the summary row shows anything. */
export const summaryIsVisible = ({ bold, rest, fillLabel }) => bold !== null || rest !== null || fillLabel !== null;

/** Layout variants: the Dashboard states; anything else → Full (as FanActivityCard). */
const VARIANTS = Object.freeze(['full', 'small', 'allgood']);
export const grainVariant = (variant) => (VARIANTS.includes(variant) ? variant : 'full');

/**
 * The Legend item layout drawn at `slot` (FR-87), by the Full frame's
 * positions: in the Full layout the first item is the 42 px first-row item
 * ('fullFirst') and the second, when it is Corn, keeps the scaled Corn copy
 * (Figma 6337:54860, Q-G2: 'corn'). Every other slot, name or state is
 * 'regular'.
 *
 * @returns {'regular' | 'fullFirst' | 'corn'}
 */
export function legendLayout(slot, name, variant) {
  if (grainVariant(variant) !== 'full') return 'regular';
  if (slot === 0) return 'fullFirst';
  if (slot === 1 && name === 'Corn') return 'corn';
  return 'regular';
}

/**
 * The drawn Commodities (geometry.grainItems, AD-8): each with its Legend
 * text (name, verbatim sub-label or null), layout and colour token, and its
 * Fill bar segment. The Legend and the bar are drawn from this one list.
 *
 * @returns {{ name: string, subLabel: string | null, token: string, layout: 'regular' | 'fullFirst' | 'corn', left: number, width: number, top: number }[]}
 */
export function grainCommodities(data, variant) {
  if (!isObject(data)) return [];
  return grainItems(data.items).map(({ item, name, token, left, width, top }, slot) => ({
    name,
    subLabel: visibleText(item.subLabel),
    token,
    layout: legendLayout(slot, name, variant),
    left,
    width,
    top,
  }));
}

/** The remaining-capacity track (FR-85): drawn only beside at least one segment. */
export const grainTrack = (commodities) => (commodities.length > 0 ? GRAIN_TRACK : null);

/**
 * Whether a ready `grain` slice has something the card can draw: a visible
 * summary part or fill label, or a drawn Commodity. Anything else (no usable
 * items and no summary) is a section load error.
 */
export function hasGrainContent(data) {
  return summaryIsVisible(grainSummary(data)) || grainCommodities(data).length > 0;
}
