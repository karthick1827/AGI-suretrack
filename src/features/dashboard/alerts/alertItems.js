// The Recent Alerts card's usable items (FR-74, FR-76): objects with a
// non-empty string `id`, first occurrence of each id only, in file order, at
// most as many as the Dashboard state's frame draws. RecentAlertsCard draws
// exactly these; the Dashboard page uses hasAlertContent() to show a ready
// slice it cannot draw as the section error.

/** FR-76: at most four Alert rows are rendered. */
export const MAX_ALERT_ROWS = 4;

/**
 * Rows each Dashboard state's frame draws (FR-73, FR-76): Full 4 (444 px
 * card), Small 1 (240 px card: one row fits, as drawn). All-good draws the
 * Empty state; its 240 px card holds one row like Small. Rows beyond these
 * would sit outside the card body, so they are never rendered (no hidden,
 * focusable links).
 */
export const ALERT_ROWS = Object.freeze({ full: MAX_ALERT_ROWS, small: 1, allgood: 1 });

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** A display string or finite number with visible text, else null (verbatim, never formatted). */
const usableText = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim() !== '' ? value : null;
};

/** The FR-77 Empty-state copy that can be shown: `{ title, body }`, each a string or null. */
export function emptyCopy(data) {
  const empty = isObject(data) && isObject(data.empty) ? data.empty : {};
  return { title: usableText(empty.title), body: usableText(empty.body) };
}

/** True when `data.items` is an empty array: the FR-77 Empty state (if it has copy). */
export function hasNoAlerts(data) {
  return isObject(data) && Array.isArray(data.items) && data.items.length === 0;
}

/** The row count for a Dashboard state (unknown → Full). */
export function alertRowLimit(variant) {
  return typeof variant === 'string' && Object.hasOwn(ALERT_ROWS, variant) ? ALERT_ROWS[variant] : ALERT_ROWS.full;
}

/** @returns {object[]} the items the card draws as Alert rows (never throws). */
export function alertItems(data, variant) {
  if (!isObject(data) || !Array.isArray(data.items)) return [];
  const seen = new Set();
  const usable = data.items.filter((item) => {
    if (!isObject(item) || typeof item.id !== 'string' || item.id === '' || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return usable.slice(0, alertRowLimit(variant));
}

/**
 * Whether a ready `recentAlerts` slice has something the card can draw: an
 * empty `items` array with a usable Empty-state title or body, or at least one
 * usable item. Anything else (no `items` array, only unusable items, or an
 * empty array with no Empty-state copy) is a section load error.
 */
export function hasAlertContent(data) {
  if (hasNoAlerts(data)) {
    const { title, body } = emptyCopy(data);
    return title !== null || body !== null;
  }
  return alertItems(data).length > 0;
}
