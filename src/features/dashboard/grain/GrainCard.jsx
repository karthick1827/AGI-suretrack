// Grain On Hand card body (FR-83 to FR-87), Figma Full 6215:58878, Small
// 6864:4514 and All-good 6879:15603. The card shell and its compact header
// come from the page's CardShell (FR-65, FR-83); this component draws the
// summary line with the fill label, the segmented Fill bar with its
// remaining-capacity track, and the two-column Legend. Display-only: no
// links, no tooltip and no segment hover style (FR-86 deferred, AD-14).
//
// Summary (FR-84): `summaryBold` (bold, followed by one space) then
// `summaryRest`, and `fillLabel` on the right, all verbatim (grain.js; the
// Q-G3 contradictions are kept).
//
// Fill bar (FR-85): segments and track come only from geometry.js
// `grainSegments()` (AD-8). Each is a 1 px box translated to its `left` /
// `top` and scaled to its `width` (so the fractional px are painted
// exactly, see the CSS); its colour is the Commodity map token, or none
// (data-grain-colour names it).
// The bar is decorative (aria-hidden): the summary and the Legend carry its
// readings, and no new copy is needed.
//
// Legend (FR-87): usable `grain.items` in file order, row-major in two
// columns; the Corn item keeps its scaled sizes (Q-G2, data-fid
// 6337:54860).
//
// Only strings and finite numbers with visible text render (grain.js
// visibleText). Keys are slot positions (the bar's segment slots and the
// Legend's item slots), so a re-render with new readings updates each slot
// in place.
import { copy } from '../../../lib/copy.js';
import { FID } from '../../../lib/fid.js';
import { grainBar, grainLegend, grainSummary } from './grain.js';
import styles from './GrainCard.module.css';

const cx = (...names) => names.filter(Boolean).join(' ');
/** A Commodity map token as a colour, or no colour. */
const fillOf = (token) => (token === null ? undefined : `var(${token})`);

/**
 * A Fill bar box (segment or track) at `left` / `top`, `width` wide: a
 * 1 px box translated and scaled to its px (see .box in the CSS), so the
 * fractional geometry.js px are painted exactly and getBoundingClientRect()
 * is the segment's box. Its paint layer carries the colour. data-grain-bleed
 * names the edges that lie on the bar's own top / bottom edge (top ≤ 0: top;
 * top ≥ 0, so the 10 px box reaches the bar's bottom: bottom), where the
 * paint reaches 1 px past the box (see .bleedTop).
 */
function BarBox({ left, top, width, paintClassName, colour, ...rest }) {
  const bleedTop = top <= 0;
  const bleedBottom = top >= 0;
  return (
    <span
      className={styles.box}
      style={{ transform: `translate(${left}px, ${top}px) scaleX(${width})` }}
      data-grain-bleed={cx(bleedTop && 'top', bleedBottom && 'bottom')}
      {...rest}
    >
      <span
        className={cx(styles.paint, paintClassName, bleedTop && styles.bleedTop, bleedBottom && styles.bleedBottom)}
        style={colour === undefined ? undefined : { backgroundColor: colour }}
      />
    </span>
  );
}

function Summary({ summary }) {
  const { bold, rest, fillLabel } = summary;
  return (
    <div className={styles.textRow} data-grain-row="">
      <p className={styles.summary} data-grain-part="summary">
        {bold === null ? null : (
          <strong className={styles.summaryBold}>
            <span data-grain-part="summaryBold">{bold}</span>
            {rest === null ? null : copy.dashboard.grainSummarySpace}
          </strong>
        )}
        {rest === null ? null : (
          <span className={styles.summaryRest} data-grain-part="summaryRest">
            {rest}
          </span>
        )}
      </p>
      {fillLabel === null ? null : (
        <p className={styles.fillLabel} data-grain-part="fillLabel">
          {fillLabel}
        </p>
      )}
    </div>
  );
}

function FillBar({ bar }) {
  const { segments, track } = bar;
  return (
    <div className={styles.bar} aria-hidden="true" data-grain-bar="">
      <BarBox left={track.left} top={0} width={track.width} paintClassName={styles.track} data-grain-track="" />
      {segments.map((segment, slot) => (
        <BarBox
          key={slot}
          left={segment.left}
          top={segment.top}
          width={segment.width}
          colour={fillOf(segment.token)}
          data-grain-segment={slot}
          data-grain-colour={segment.token ?? 'none'}
        />
      ))}
    </div>
  );
}

function Legend({ items }) {
  return (
    // role="list": WebKit drops list semantics under `list-style: none`.
    <ul className={styles.legend} role="list" data-grain-legend="">
      {items.map((item, slot) => (
        <li
          key={slot}
          className={cx(styles.item, styles[item.layout])}
          data-grain-item={slot}
          data-grain-layout={item.layout}
          data-grain-colour={item.token ?? 'none'}
          data-fid={item.layout === 'corn' ? FID.grain.cornLegendItem : undefined}
        >
          <span
            className={styles.swatch}
            style={{ backgroundColor: fillOf(item.token) }}
            aria-hidden="true"
            data-grain-part="swatch"
          />
          <span className={styles.name} data-grain-part="name">
            {item.name}
          </span>
          <span className={styles.sub} data-grain-part="sub">
            {item.subLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * @param {{ data: object }} props  `data` = the `grain` slice. The layout is
 *   the same in every Dashboard state (only the data differs), so the page's
 *   `variant` is not used.
 */
export default function GrainCard({ data }) {
  return (
    <div className={styles.body} data-grain-body="">
      <div className={styles.summaryBlock} data-grain-summary="">
        <Summary summary={grainSummary(data)} />
        <FillBar bar={grainBar(data)} />
      </div>
      <Legend items={grainLegend(data)} />
    </div>
  );
}
