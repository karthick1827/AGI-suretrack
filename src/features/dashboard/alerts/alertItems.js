// The Recent Alerts card's usable items (FR-74, FR-76): objects with a
// non-empty string `id`, first occurrence of each id only, in file order, at
// most four. RecentAlertsCard draws exactly these; the Dashboard page uses
// hasAlertContent() to show a ready slice it cannot draw as the section error.

/** FR-76: at most four Alert rows are rendered. */
export const MAX_ALERT_ROWS = 4;

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** True when `data.items` is an array with no entries: the FR-77 Empty state. */
export function hasNoAlerts(data) {
  return isObject(data) && Array.isArray(data.items) && data.items.length === 0;
}

/** @returns {object[]} the items the card draws as Alert rows (never throws). */
export function alertItems(data) {
  if (!isObject(data) || !Array.isArray(data.items)) return [];
  const seen = new Set();
  const usable = data.items.filter((item) => {
    if (!isObject(item) || typeof item.id !== 'string' || item.id === '' || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return usable.slice(0, MAX_ALERT_ROWS);
}

/**
 * Whether a ready `recentAlerts` slice has something the card can draw: an
 * empty `items` array (the Empty state) or at least one usable item. A slice
 * with no `items` array, or only unusable items, is a section load error.
 */
export function hasAlertContent(data) {
  return hasNoAlerts(data) || alertItems(data).length > 0;
}
