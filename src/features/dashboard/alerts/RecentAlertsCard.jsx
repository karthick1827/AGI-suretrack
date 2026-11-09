// Recent Alerts card body (FR-73 to FR-77), Figma Full 6215:58878, Small
// 6864:4514 and All-good 6879:15603. The card shell, its header and
// `View All` come from the page's CardShell (FR-65, FR-73); this component
// draws the Alert rows, or the FR-77 Empty state, below it.
//
// Rows: one per usable `recentAlerts.items[]` entry (alertItems.js: an object
// with a non-empty string `id`, the first of a duplicate id wins, at most
// four), in file order. Each row shows the severity icon, title,
// `<deviceId> | <location>` meta line, severity text, time and Action link.
// Every shown reading is rendered verbatim (FR-94, AD-7): nothing is computed,
// refreshed or formatted. Only strings and finite numbers render; any other
// value renders nothing. `severity` selects the icon and colour (`Critical`,
// `Warning`); any other severity renders no icon and uncoloured text.
//
// Separators (FR-76): every row has its bottom separator except the last row
// of a list with two or more rows (Full row 4); a single row keeps it (Small).
//
// Navigation (FR-75): the row link (to paths.equipmentDetail(deviceId)) and
// the Action link (to paths.alertAction(deviceId, actionKey)) are sibling
// <a> elements in one CSS grid: the row link spans the whole row (a subgrid
// holding the icon, the text block and the separator) and the Action link is
// laid over its second column, so a click on the Action link opens only the
// Action and a click anywhere else in the row opens the equipment. No link is
// nested in another and nothing is overlaid with pseudo-elements. A row with
// no usable deviceId, or with nothing to name it by, is drawn but is not a
// link; an Action with no usable actionKey or no label is not a link. The row
// link is named by its own texts (aria-labelledby: title, meta, severity,
// time), so no new copy is needed.
//
// Empty state (FR-77): an empty `items` array draws the `recentAlerts.empty`
// title and body (verbatim) in the #F4F5F6 block.
import { useId } from 'react';
import { Link } from 'react-router';
import { alertMetaLine } from '../../../lib/copy.js';
import { FID } from '../../../lib/fid.js';
import { paths } from '../../../lib/paths.js';
import alertCritSvg from '../../../assets/icons/alert_crit.svg';
import alertWarnSvg from '../../../assets/icons/alert_warn.svg';
import arrowRightSvg from '../../../assets/icons/arrow_right.svg';
import { alertItems, hasNoAlerts } from './alertItems.js';
import styles from './RecentAlertsCard.module.css';

const cx = (...names) => names.filter(Boolean).join(' ');
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** A reading renders only if it is a string or a finite number (verbatim, never formatted). */
const shown = (value) =>
  typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)) ? value : null;

/** The shown reading as text ('' when nothing renders). */
const textOf = (value) => {
  const reading = shown(value);
  return reading === null ? '' : String(reading);
};

/** A paths.js target, or undefined when the builder rejects the data (never throws). */
const target = (build) => {
  try {
    return build();
  } catch {
    return undefined;
  }
};

/**
 * Severity → icon and colour (FR-74, Figma glyphs 6337:54670 / 6337:54715).
 * The glyph sizes are the Figma exports' own (15 and 13.846 px, AD-5).
 */
const SEVERITIES = Object.freeze({
  Critical: Object.freeze({ tone: 'critical', src: alertCritSvg, size: 15, fid: FID.recentAlerts.criticalGlyph }),
  Warning: Object.freeze({ tone: 'warning', src: alertWarnSvg, size: 13.8462, fid: FID.recentAlerts.warningGlyph }),
});

/** FR-74 meta line: `<deviceId> | <location>` when both are shown, else whichever is. */
function metaOf(item) {
  const [deviceId, location] = [textOf(item.deviceId), textOf(item.location)];
  if (deviceId !== '' && location !== '') return alertMetaLine({ deviceId, location });
  return deviceId !== '' ? deviceId : location;
}

function SeverityIcon({ severity }) {
  if (!severity) return null;
  return (
    <span className={cx(styles.circle, styles[severity.tone])} data-alert-part="icon">
      <img
        className={styles.glyph}
        src={severity.src}
        alt=""
        width={severity.size}
        height={severity.size}
        data-fid={severity.fid}
      />
    </span>
  );
}

function AlertRow({ item, last }) {
  const id = useId();
  const severity = typeof item.severity === 'string' && Object.hasOwn(SEVERITIES, item.severity) ? SEVERITIES[item.severity] : null;
  const texts = {
    title: textOf(item.title),
    meta: metaOf(item),
    severity: textOf(item.severity),
    time: textOf(item.time),
  };
  const partId = (name) => `${id}-${name}`;
  const nameIds = Object.keys(texts)
    .filter((name) => texts[name] !== '')
    .map(partId);

  const detailTo = target(() => paths.equipmentDetail(item.deviceId));
  const actionTo = detailTo === undefined ? undefined : target(() => paths.alertAction(item.deviceId, item.actionKey));
  const actionLabel = textOf(item.action);
  const rowIsLink = detailTo !== undefined && nameIds.length > 0;
  const actionIsLink = actionTo !== undefined && actionLabel.trim() !== '';

  const body = (
    <>
      <span className={styles.iconCell}>
        <SeverityIcon severity={severity} />
      </span>
      <span className={styles.top}>
        <span className={styles.left}>
          <span id={partId('title')} className={styles.title} data-alert-part="title">
            {texts.title}
          </span>
          <span id={partId('meta')} className={styles.meta} data-alert-part="meta">
            {texts.meta}
          </span>
        </span>
        <span className={styles.right}>
          <span
            id={partId('severity')}
            className={cx(styles.severity, severity && styles[`${severity.tone}Text`])}
            data-alert-part="severity"
          >
            {texts.severity}
          </span>
          <span id={partId('time')} className={styles.time} data-alert-part="time">
            {texts.time}
          </span>
        </span>
      </span>
      {last ? null : <span className={styles.separator} data-alert-part="separator" />}
    </>
  );

  const action = (
    <>
      <span className={styles.actionLabel} data-alert-part="action-label">
        {actionLabel}
      </span>
      <img
        className={styles.arrow}
        src={arrowRightSvg}
        alt=""
        width={16}
        height={16}
        data-fid={FID.recentAlerts.actionArrow}
      />
    </>
  );

  return (
    <div className={cx(styles.item, last && styles.last)} data-alert-row={item.id}>
      {rowIsLink ? (
        <Link className={cx(styles.row, styles.link)} to={detailTo} aria-labelledby={nameIds.join(' ')} data-alert-link="row">
          {body}
        </Link>
      ) : (
        <div className={styles.row}>{body}</div>
      )}
      {actionIsLink ? (
        <Link className={cx(styles.action, styles.actionLink)} to={actionTo} data-alert-link="action">
          {action}
        </Link>
      ) : (
        <span className={styles.action} data-alert-part="action">
          {action}
        </span>
      )}
    </div>
  );
}

/** FR-77: the Empty state, title and body verbatim from `recentAlerts.empty`. */
function EmptyState({ empty }) {
  const content = isObject(empty) ? empty : {};
  return (
    <div className={styles.empty} data-fid={FID.recentAlerts.empty} data-alert-empty="">
      <h3 className={styles.emptyTitle} data-alert-part="empty-title">
        {shown(content.title)}
      </h3>
      <p className={styles.emptyBody} data-alert-part="empty-body">
        {shown(content.body)}
      </p>
    </div>
  );
}

/**
 * @param {{ data: object }} props `data` = the `recentAlerts` slice. The
 *   page also passes its `variant`; the Alert rows are drawn alike in every
 *   Dashboard state, so it is not read.
 */
export default function RecentAlertsCard({ data }) {
  if (hasNoAlerts(data)) return <EmptyState empty={data.empty} />;
  const items = alertItems(data);
  return (
    <div className={styles.list} data-alert-list="">
      {items.map((item, index) => (
        <AlertRow key={item.id} item={item} last={items.length > 1 && index === items.length - 1} />
      ))}
    </div>
  );
}
