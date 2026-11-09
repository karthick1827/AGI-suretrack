// KPI strip (FR-59 to FR-64), Figma 6337:55041 "Section - Operation status".
//
// One white strip with five tiles: Need attention, Equipment (with one
// sub-count block per type), Online, Offline and Fans running. Every reading
// is the `kpi` slice of the state document rendered verbatim (FR-94, AD-7):
// nothing is computed, summed, pluralised or formatted, and `7 of 24` stays a
// string. Style switches come from the data too: `attention.allGood` (tick
// icon, grey Regular label) and `equipment.subCountWeight` (400 / 700).
//
// Tile widths and x positions differ per Dashboard state (FR-61 to FR-63), so
// the page passes its `variant` (full | small | allgood); every px value lives
// in KpiStrip.module.css.
//
// Navigation (FR-64): each tile, and each Equipment sub-count block, is its
// own link built by paths.js. Figma draws the whole strip as one <a>; per-tile
// links replace it with no visual change. The Equipment total link is
// stretched over its whole tile, under the sub-count links.
import { Link } from 'react-router';
import { FID } from '../../../lib/fid.js';
import { EQUIPMENT_TYPES, paths } from '../../../lib/paths.js';
import alertSvg from '../../../assets/icons/kpi_alert.svg';
import tickSvg from '../../../assets/icons/kpi_tick.svg';
import equipSvg from '../../../assets/icons/kpi_equip.svg';
import onlineSvg from '../../../assets/icons/kpi_online.svg';
import offlineSvg from '../../../assets/icons/kpi_offline.svg';
import fansSvg from '../../../assets/icons/kpi_fans.svg';
import styles from './KpiStrip.module.css';

const KPI_VARIANTS = Object.freeze(['full', 'small', 'allgood']);

const cx = (...names) => names.filter(Boolean).join(' ');

/** The 44×46 icon wrapper holding the 44×44 coloured tile and the Figma SVG (FR-60). */
function KpiIcon({ tone, src, size = 22, fid }) {
  return (
    <span className={styles.iconWrap}>
      <span className={cx(styles.iconTile, styles[tone])}>
        <img src={src} alt="" width={size} height={size} data-fid={fid} />
      </span>
    </span>
  );
}

/** Number over label (FR-60): both verbatim from the document. */
function KpiText({ value, label, labelClass, valueClass }) {
  return (
    <span className={styles.text}>
      <span className={cx(styles.value, valueClass)} data-kpi-value="">
        {value}
      </span>
      <span className={cx(styles.label, labelClass)} data-kpi-label="">
        {label}
      </span>
    </span>
  );
}

/** A plain KPI tile: the whole tile is one link (FR-64). */
function KpiTile({ id, to, tone, icon, iconSize, iconFid, value, label, labelClass, className }) {
  return (
    <Link className={cx(styles.tile, className)} to={to} data-kpi-tile={id}>
      <KpiIcon tone={tone} src={icon} size={iconSize} fid={iconFid} />
      <KpiText value={value} label={label} labelClass={labelClass} />
    </Link>
  );
}

const typeHref = (typeKey) =>
  EQUIPMENT_TYPES.includes(typeKey) ? paths.equipment({ type: typeKey }) : paths.equipment();

/**
 * @param {{ kpi: object, variant?: 'full' | 'small' | 'allgood' }} props
 */
export default function KpiStrip({ kpi, variant = 'full' }) {
  const layout = KPI_VARIANTS.includes(variant) ? variant : 'full';
  const attention = kpi?.attention ?? {};
  const equipment = kpi?.equipment ?? {};
  const online = kpi?.online ?? {};
  const offline = kpi?.offline ?? {};
  const fans = kpi?.fans ?? {};
  const allGood = attention.allGood === true;
  const breakdown = Array.isArray(equipment.breakdown) ? equipment.breakdown : [];
  const subWeight = equipment.subCountWeight === 400 ? styles.regular : undefined;

  const status = (
    <>
      <KpiTile
        id="online"
        to={paths.equipment({ status: 'online' })}
        tone="toneOnline"
        icon={onlineSvg}
        iconFid={FID.kpi.iconOnline}
        value={online.value}
        label={online.label}
        className={styles.online}
      />
      <KpiTile
        id="offline"
        to={paths.equipment({ status: 'offline' })}
        tone="toneOffline"
        icon={offlineSvg}
        iconFid={FID.kpi.iconOffline}
        value={offline.value}
        label={offline.label}
        className={styles.offline}
      />
      <KpiTile
        id="fans"
        to={paths.equipment()}
        tone="toneFans"
        icon={fansSvg}
        iconFid={FID.kpi.iconFans}
        value={fans.value}
        label={fans.label}
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
          iconSize={allGood ? 20 : 22}
          iconFid={allGood ? FID.kpi.iconAllGood : FID.kpi.iconAttention}
          value={attention.value}
          label={attention.label}
          labelClass={allGood ? undefined : styles.critical}
          className={styles.attention}
        />

        <div className={cx(styles.tile, styles.equipment)} data-kpi-tile="equipment">
          <Link className={styles.equipmentTotal} to={paths.equipment()} data-kpi-link="equipment">
            <KpiIcon tone="toneEquip" src={equipSvg} fid={FID.kpi.iconEquipment} />
            <KpiText value={equipment.value} label={equipment.label} />
          </Link>
          {breakdown.map((item, index) => (
            <Link
              key={`${item?.typeKey}-${index}`}
              className={cx(styles.sub, item?.typeKey === 'tanks' && styles.subWide)}
              to={typeHref(item?.typeKey)}
              data-kpi-tile={`equipment:${item?.typeKey}`}
            >
              <KpiText value={item?.value} label={item?.label} valueClass={subWeight} />
            </Link>
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
