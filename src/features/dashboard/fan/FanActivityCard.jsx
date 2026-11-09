// Fan activity card body (FR-78 to FR-82), Figma Full 6215:58878, Small
// 6864:4514 and All-good 6879:15603. The card shell and its header come from
// the page's CardShell (FR-65, FR-78); this component draws the three Stat
// tiles, the 7-day Runtime chart and the caption below it. Display-only: no
// links, no tooltips or hover values (AD-14).
//
// Stat tiles (FR-79): up to three usable `fanActivity.tiles` entries
// (fanActivity.js), value over label, verbatim (Q-N1 contradictions kept).
//
// Runtime chart (FR-80, FR-81): the bars come only from geometry.js
// `runtimeBars()` (AD-8): each column is translated to the bar's `x` (a
// translation keeps the fractional x unsnapped, see the CSS) and each bar is
// exactly its `height` (`barPx`, 0 px tolerance, AD-14). The value label is
// `String(hours) + "h"` (copy.js runtimeValueLabel, PRD addendum §B), the one
// display string derived from a chart number; it is drawn only for a finite
// `hours`. The day label is the `day` reading verbatim; `isToday` styles the
// bar and the label.
//
// Accessibility: the chart is one image named by `fanActivity.chartLabel`
// (role="img" + aria-label), as the Figma frame itself is ("Img - Fan runtime
// hours for the last 7 days, from 62 to 90 hours"). Its 14 drawn labels are
// hidden from assistive technology (aria-hidden), so the chart is announced
// once, by the name the design wrote for it, rather than as 14 loose
// fragments ("62h", "Wed", …) with no relation between them. Without a usable
// chartLabel the chart is not an image: its labels stay exposed as text.
//
// Only strings and finite numbers render; anything else renders nothing. Keys
// are slot positions: the tiles are the frame's three fixed slots and the
// bars its seven day slots (oldest → today), so a re-render with new readings
// updates each slot in place.
import { runtimeValueLabel } from '../../../lib/copy.js';
import { chartLabel, fanBars, fanCaption, fanTiles, shownText } from './fanActivity.js';
import styles from './FanActivityCard.module.css';

const DEFAULT_VARIANT = 'full';
/** Layout variants: the Dashboard states with a chart-height class (Full 119, Small and All-good 120). */
const VARIANTS = Object.freeze(['full', 'small', 'allgood']);

const cx = (...names) => names.filter(Boolean).join(' ');

/** FR-81 value label for a finite `hours`, else null. */
const hoursLabel = (hours) => (typeof hours === 'number' && Number.isFinite(hours) ? runtimeValueLabel(hours) : null);

function StatTiles({ tiles }) {
  return (
    <div className={styles.tileRow} data-fan-tiles="">
      {tiles.length > 0 ? (
        <ul className={styles.tiles}>
          {tiles.map((tile, slot) => (
            <li key={slot} className={styles.tile} data-fan-tile={slot}>
              <span className={styles.valueBox}>
                <span className={styles.value} data-fan-part="value">
                  {tile.value}
                </span>
              </span>
              <span className={styles.labelBox}>
                <span className={styles.label} data-fan-part="label">
                  {tile.label}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function RuntimeChart({ bars, name }) {
  const image = bars.length > 0 && name !== null;
  return (
    <div
      className={styles.chart}
      role={image ? 'img' : undefined}
      aria-label={image ? name : undefined}
      data-fan-chart=""
    >
      <div className={styles.plot} aria-hidden={image ? 'true' : undefined}>
        {bars.map((bar, slot) => {
          const value = hoursLabel(bar.hours);
          return (
            <div key={slot} className={styles.column} style={{ transform: `translateX(${bar.x}px)` }} data-fan-column={slot}>
              <span
                className={cx(styles.bar, bar.isToday && styles.todayBar)}
                style={{ height: bar.height }}
                data-fan-part="bar"
              >
                {value === null ? null : (
                  <span className={styles.hours} data-fan-part="hours">
                    {value}
                  </span>
                )}
              </span>
              <span className={cx(styles.day, bar.isToday && styles.todayDay)} data-fan-part="day">
                {shownText(bar.day)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * @param {{ data: object, variant?: 'full' | 'small' | 'allgood' }} props
 *   `data` = the `fanActivity` slice; `variant` = the Dashboard state, which
 *   sets the chart height (anything else → Full).
 */
export default function FanActivityCard({ data, variant = DEFAULT_VARIANT }) {
  const layout = VARIANTS.includes(variant) ? variant : DEFAULT_VARIANT;
  const caption = fanCaption(data);
  return (
    <div className={cx(styles.body, styles[layout])} data-fan-body={layout}>
      <StatTiles tiles={fanTiles(data)} />
      <RuntimeChart bars={fanBars(data)} name={chartLabel(data)} />
      {caption === null ? null : (
        <p className={styles.caption} data-fan-part="caption">
          {caption}
        </p>
      )}
    </div>
  );
}
