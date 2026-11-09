// The Grain On Hand card's usable content (FR-84 to FR-87). GrainCard draws
// exactly these; the Dashboard page uses hasGrainContent() to show a ready
// slice it cannot draw as the section error (FR-96).
import { grainCommodity, grainSegments } from '../../../lib/geometry.js';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * The one "visible text" rule (summary, fill label, Legend names and
 * sub-labels): a string with non-whitespace text, or a finite number (as its
 * String()), returned verbatim (never trimmed or formatted); anything else is
 * null.
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

/**
 * The Corn Legend item is a scaled copy in the Full frame (Figma 6337:54860,
 * Q-G2) and is kept as drawn; Canola's is 42 px high where the others are 45
 * (see GrainCard.module.css). Every other name, mapped or not, is 'regular'.
 */
const LEGEND_LAYOUTS = Object.freeze({ Corn: 'corn', Canola: 'canola' });
export const legendLayout = (name) => (typeof name === 'string' && Object.hasOwn(LEGEND_LAYOUTS, name) ? LEGEND_LAYOUTS[name] : 'regular');

/**
 * FR-87 Legend items: objects of `grain.items` with a visible name or
 * sub-label, in file order (row-major in two columns). The swatch colour is
 * the Commodity map colour (geometry.js grainCommodity), or null.
 *
 * @returns {{ name: string | null, subLabel: string | null, token: string | null, layout: 'regular' | 'corn' | 'canola' }[]}
 */
export function grainLegend(data) {
  if (!isObject(data) || !Array.isArray(data.items)) return [];
  return data.items
    .filter((item) => isObject(item) && (visibleText(item.name) !== null || visibleText(item.subLabel) !== null))
    .map((item) => ({
      name: visibleText(item.name),
      subLabel: visibleText(item.subLabel),
      token: grainCommodity(item.name, item.color)?.token ?? null,
      layout: legendLayout(item.name),
    }));
}

/** FR-85 Fill bar segments and track (geometry.grainSegments, AD-8). */
export function grainBar(data) {
  return grainSegments(isObject(data) ? data.items : null);
}

/**
 * Whether a ready `grain` slice has something the card can draw: a visible
 * summary part or fill label, a Legend item, or a coloured Fill bar segment.
 * Anything else (no usable items and no summary) is a section load error.
 */
export function hasGrainContent(data) {
  return (
    summaryIsVisible(grainSummary(data)) ||
    grainLegend(data).length > 0 ||
    grainBar(data).segments.some((segment) => segment.token !== null)
  );
}
