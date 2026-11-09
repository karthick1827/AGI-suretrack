// Equipment card body (FR-66 to FR-72), Figma Full 6215:58878, Small 6864:4514
// and All-good 6879:15603. The card shell, its header and `View All` come from
// the page's CardShell (FR-65); this component draws the row list below it.
//
// One row per usable `equipmentCard.rows[]` entry (an object with a string
// `typeKey`; the first row of a duplicate typeKey wins, like KpiStrip), in file
// order: type name and count, the 474 px Health bar, the caption and the row
// chevron. Every shown reading is rendered verbatim (FR-94, AD-7): nothing is
// computed, summed, pluralised or formatted. Only strings and finite numbers
// render; any other value renders nothing. The bar widths come only from
// `rows[].alerts / .offline / .healthy` through geometry.js `healthSegments()`
// (AD-8), never from the caption.
//
// Dividers (FR-68): every row after the first has a top divider; the first row
// has one only when it is the only row (All-good). The row list layout differs
// per Dashboard state, so the page passes its `variant` (a FRAME key with a
// list class: full | small | allgood; anything else → full); every px value
// lives in EquipmentCard.module.css. Rows beyond the frame's capacity are
// clipped to the list (never drawn over the header or outside the card).
//
// Navigation (FR-72): a row with a known `typeKey` and a complete accessible
// name (the FR-72 format from copy.js) is one link to paths.equipment({ type });
// any other row is drawn but is not a link (never an unnamed link).
import { Link } from 'react-router';
import { equipmentRowLabel } from '../../../lib/copy.js';
import { FRAME } from '../../../lib/dashboardLayout.js';
import { FID } from '../../../lib/fid.js';
import { healthSegments } from '../../../lib/geometry.js';
import { EQUIPMENT_TYPES, paths } from '../../../lib/paths.js';
import chevronRightSvg from '../../../assets/icons/chevron-right.svg';
import { equipmentRows } from './equipmentRows.js';
import styles from './EquipmentCard.module.css';

const DEFAULT_VARIANT = 'full';
/** Layout variants: the Dashboard states of FRAME that have a list class. */
const VARIANTS = Object.freeze(Object.keys(FRAME).filter((key) => typeof styles[key] === 'string'));

const cx = (...names) => names.filter(Boolean).join(' ');

/** A reading renders only if it is a string or a finite number (verbatim, never formatted). */
const shown = (value) =>
  typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)) ? value : null;

/** The shown reading as text ('' when nothing renders). */
const textOf = (value) => {
  const reading = shown(value);
  return reading === null ? '' : String(reading);
};

/** FR-72 accessible name, only when type, count and caption are all shown and non-empty. */
function rowName(row) {
  const [type, count, caption] = [textOf(row.type), textOf(row.count), textOf(row.caption)];
  return type !== '' && count !== '' && caption !== '' ? equipmentRowLabel({ type, count, caption }) : undefined;
}

/** FR-71: the caption verbatim, its digit runs in Bold #111827 (styling only). */
function Caption({ caption }) {
  const text = textOf(caption);
  return (
    <span className={styles.caption} data-row-part="caption">
      {text.split(/(\d+)/).map((part, i) =>
        part === '' ? null : i % 2 === 1 ? (
          <span key={i} className={styles.num}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}

/** FR-69: the 474×8 Health bar; segments placed from healthSegments() px. */
function HealthBar({ row }) {
  return (
    <span className={styles.bar} data-row-part="bar">
      {healthSegments({ alerts: row.alerts, offline: row.offline, healthy: row.healthy }).map((segment) => (
        <span
          key={segment.kind}
          className={cx(styles.segment, styles[segment.kind])}
          style={{ left: segment.x, width: segment.width }}
          data-health-segment={segment.kind}
        />
      ))}
    </span>
  );
}

function EquipmentRow({ row, divider }) {
  const className = cx(styles.row, divider && styles[divider]);
  const content = (
    <>
      <span className={styles.left}>
        <span className={styles.name} data-row-part="name">
          {shown(row.type)}
        </span>
        <span className={styles.count} data-row-part="count">
          {shown(row.count)}
        </span>
      </span>
      <span className={styles.right}>
        <span className={styles.barBlock}>
          <HealthBar row={row} />
          <Caption caption={row.caption} />
        </span>
        <span className={styles.chevronBox}>
          <img
            className={styles.chevron}
            src={chevronRightSvg}
            alt=""
            width={12}
            height={16}
            data-fid={FID.equipmentCard.rowChevron}
            data-row-part="chevron"
          />
        </span>
      </span>
    </>
  );
  const name = rowName(row);
  if (!EQUIPMENT_TYPES.includes(row.typeKey) || name === undefined) {
    return (
      <div className={className} data-equipment-row={row.typeKey}>
        {content}
      </div>
    );
  }
  return (
    <Link
      className={cx(className, styles.link)}
      to={paths.equipment({ type: row.typeKey })}
      aria-label={name}
      data-equipment-row={row.typeKey}
    >
      {content}
    </Link>
  );
}

/**
 * The divider class of row `index` of `count` rows (FR-68), per state:
 *   - first row: none, unless it is the only row (All-good) → `divided`;
 *   - later rows: `divided`; in Full, rows between the first and the last are
 *     Figma "Item" wrappers whose 1 px stroke takes no layout → `item`.
 */
function dividerOf(index, count, layout) {
  if (index === 0) return count === 1 ? 'divided' : null;
  if (layout === 'full' && index < count - 1) return 'item';
  return 'divided';
}

/**
 * @param {{ data: object, variant?: 'full' | 'small' | 'allgood' }} props
 */
export default function EquipmentCard({ data, variant = DEFAULT_VARIANT }) {
  const layout = VARIANTS.includes(variant) ? variant : DEFAULT_VARIANT;
  const rows = equipmentRows(data);
  return (
    <div className={cx(styles.list, styles[layout])} data-equipment-list={layout}>
      {rows.map((row, index) => (
        <EquipmentRow key={row.typeKey} row={row} divider={dividerOf(index, rows.length, layout)} />
      ))}
    </div>
  );
}
