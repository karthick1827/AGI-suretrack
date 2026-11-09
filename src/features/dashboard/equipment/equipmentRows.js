// The Equipment card's usable rows (FR-67): objects with a string `typeKey`,
// first occurrence of each typeKey only (like the KPI breakdown), in file
// order. EquipmentCard draws exactly these; the Dashboard page uses the same
// rule to show a ready slice with no usable rows as the section error.

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** @returns {object[]} the rows the card draws (never throws). */
export function equipmentRows(data) {
  if (!isObject(data) || !Array.isArray(data.rows)) return [];
  const seen = new Set();
  return data.rows.filter((row) => {
    if (!isObject(row) || typeof row.typeKey !== 'string' || seen.has(row.typeKey)) return false;
    seen.add(row.typeKey);
    return true;
  });
}
