// KPI strip (FR-59 to FR-64), Figma 6337:55041 "Section - Operation status".
//
// One white strip with five tiles: Need attention, Equipment (with one
// sub-count block per type), Online, Offline and Fans running. Every reading
// is the `kpi` slice of the state document rendered verbatim (FR-94, AD-7):
// nothing is computed, summed, pluralised or formatted, and `7 of 24` stays a
// string. Only strings and numbers render; any other value renders nothing.
// Style switches come from the data too, read strictly: `attention.allGood`
// (=== true → tick icon, grey Regular label) and `equipment.subCountWeight`
// (400 → Regular sub-count numbers, otherwise Bold).
//
// Tile widths and x positions differ per Dashboard state (FR-61 to FR-63), so
// the page passes its `variant` (a FRAME key: full | small | allgood; anything
// else → full); every px value lives in KpiStrip.module.css.
//
// Navigation (FR-64): each tile, and each Equipment sub-count block, is its
// own link built by paths.js. Figma draws the whole strip as one <a>; per-tile
// links replace it with no visual change. In the Equipment tile, the total
// link covers its 147 px block; the tile wrapper itself is not a link. Each
// link's accessible name is its value and label joined by one space.
import { Link } from 'react-router';
import { FRAME } from '../../../lib/dashboardLayout.js';
import { FID } from '../../../lib/fid.js';
import { EQUIPMENT_TYPES, paths } from '../../../lib/paths.js';
import alertSvg from '../../../assets/icons/kpi_alert.svg';
import tickSvg from '../../../assets/icons/kpi_tick.svg';
import equipSvg from '../../../assets/icons/kpi_equip.svg';
import onlineSvg from '../../../assets/icons/kpi_online.svg';
import offlineSvg from '../../../assets/icons/kpi_offline.svg';
import fansSvg from '../../../assets/icons/kpi_fans.svg';
import styles from './KpiStrip.module.css';

/** Layout variants: the Dashboard states of FRAME (single source). */
const KPI_VARIANTS = Object.freeze(Object.keys(FRAME));
const DEFAULT_VARIANT = 'full';

const cx = (...names) => names.filter(Boolean).join(' ');
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** A reading renders only if it is a string or a finite number (verbatim, never formatted). */
const shown = (value) =>
  typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)) ? value : null;

/** Accessible name: the shown value and label joined by one space (no new copy). */
const nameOf = (value, label) => {
  const parts = [shown(value), shown(label)].filter((part) => part !== null && String(part) !== '');
  return parts.length > 0 ? parts.join(' ') : undefined;
};

/** The 44×46 icon wrapper holding the 44×44 coloured tile and the Figma SVG (FR-60). */
function KpiIcon({ tone, src, iconClass, fid }) {
  // AD-5 / project convention: explicit width and height on every <img>; CSS sets the same size.
  const size = iconClass === styles.iconSmall ? 20 : 22;
  return (
    <span className={styles.iconWrap}>
      <span className={cx(styles.iconTile, styles[tone])}>
        <img className={iconClass} src={src} alt="" width={size} height={size} data-fid={fid} />
      </span>
    </span>
  );
}

/** Number over label (FR-60): both verbatim from the document. */
function KpiText({ value, label, labelClass, valueClass }) {
  return (
    <span className={styles.text}>
      <span className={cx(styles.value, valueClass)} data-kpi-value="">
        {shown(value)}
      </span>
      <span className={cx(styles.label, labelClass)} data-kpi-label="">
        {shown(label)}
      </span>
    </span>
  );
}

/** A plain KPI tile: the whole tile is one link (FR-64). */
function KpiTile({ id, to, tone, icon, iconClass = styles.icon, iconFid, reading, labelClass, className }) {
  return (
    <Link
      className={cx(styles.tile, styles.link, className)}
      to={to}
      aria-label={nameOf(reading.value, reading.label)}
      data-kpi-tile={id}
    >
      <KpiIcon tone={tone} src={icon} iconClass={iconClass} fid={iconFid} />
      <KpiText value={reading.value} label={reading.label} labelClass={labelClass} />
    </Link>
  );
}

/** Breakdown items with a string typeKey, first occurrence of each typeKey only. */
function breakdownItems(breakdown) {
  if (!Array.isArray(breakdown)) return [];
  const seen = new Set();
  return breakdown.filter((item) => {
    if (!isObject(item) || typeof item.typeKey !== 'string' || seen.has(item.typeKey)) return false;
    seen.add(item.typeKey);
    return true;
  });
}

/** One Equipment sub-count block: a link for a known type, plain text otherwise. */
function SubCount({ item, valueClass }) {
  const className = cx(styles.sub, item.typeKey === 'tanks' && styles.subWide);
  const text = <KpiText value={item.value} label={item.label} valueClass={valueClass} />;
  if (!EQUIPMENT_TYPES.includes(item.typeKey)) {
    return (
      <span className={className} data-kpi-tile={`equipment:${item.typeKey}`}>
        {text}
      </span>
    );
  }
  return (
    <Link
      className={cx(className, styles.link)}
      to={paths.equipment({ type: item.typeKey })}
      aria-label={nameOf(item.value, item.label)}
      data-kpi-tile={`equipment:${item.typeKey}`}
    >
      {text}
    </Link>
  );
}

/**
 * @param {{ kpi: object, variant?: 'full' | 'small' | 'allgood' }} props
 */
export default function KpiStrip({ kpi, variant = DEFAULT_VARIANT }) {
  const layout = KPI_VARIANTS.includes(variant) ? variant : DEFAULT_VARIANT;
  const slice = (key) => (isObject(kpi) && isObject(kpi[key]) ? kpi[key] : {});
  const attention = slice('attention');
  const equipment = slice('equipment');
  const allGood = attention.allGood === true;
  const subWeight = Number(equipment.subCountWeight) === 400 ? styles.regular : undefined;

  const status = (
    <>
      <KpiTile
        id="online"
        to={paths.equipment({ status: 'online' })}
        tone="toneOnline"
        icon={onlineSvg}
        iconFid={FID.kpi.iconOnline}
        reading={slice('online')}
        className={styles.online}
      />
      <KpiTile
        id="offline"
        to={paths.equipment({ status: 'offline' })}
        tone="toneOffline"
        icon={offlineSvg}
        iconFid={FID.kpi.iconOffline}
        reading={slice('offline')}
        className={styles.offline}
      />
      {/* FR-64: Fans running → /equipment [ASSUMPTION: no Jira target given]. */}
      <KpiTile
        id="fans"
        to={paths.equipment()}
        tone="toneFans"
        icon={fansSvg}
        iconFid={FID.kpi.iconFans}
        reading={slice('fans')}
        className={styles.fans}
      />
    </>
  );

  return (
    <div className={styles.strip} data-fid={FID.kpi.strip} data-variant={layout}>
      <div className={cx(styles.container, styles[layout])}>
        <KpiTile
          id="attention"
          to={paths.alerts()}
          tone={allGood ? 'toneGood' : 'toneAlert'}
          icon={allGood ? tickSvg : alertSvg}
          iconClass={allGood ? styles.iconSmall : styles.icon}
          iconFid={allGood ? FID.kpi.iconAllGood : FID.kpi.iconAttention}
          reading={attention}
          labelClass={allGood ? undefined : styles.critical}
          className={styles.attention}
        />

        <div className={cx(styles.tile, styles.equipment)} data-kpi-tile="equipment">
          <Link
            className={cx(styles.equipmentTotal, styles.link)}
            to={paths.equipment()}
            aria-label={nameOf(equipment.value, equipment.label)}
            data-kpi-link="equipment"
          >
            <KpiIcon tone="toneEquip" src={equipSvg} iconClass={styles.icon} fid={FID.kpi.iconEquipment} />
            <KpiText value={equipment.value} label={equipment.label} />
          </Link>
          {breakdownItems(equipment.breakdown).map((item) => (
            <SubCount key={item.typeKey} item={item} valueClass={subWeight} />
          ))}
        </div>

        {layout === 'allgood' ? (
          <div className={styles.group} data-fid={FID.kpi.statusGroupAllGood}>
            {status}
          </div>
        ) : (
          status
        )}
      </div>
    </div>
  );
}
