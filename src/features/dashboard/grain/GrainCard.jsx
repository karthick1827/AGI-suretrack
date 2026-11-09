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
// Commodities: the Fill bar and the Legend are drawn from ONE list,
// grain.js grainCommodities() (geometry.js grainItems(), AD-8): the usable
// items (mapped Commodity, matching colour, a segment that ends before the
// track), at most 6, in file order. So every segment has its Legend item and
// every Legend item its segment.
//
// Fill bar (FR-85): each segment is a 1 px box translated to its `left` /
// `top` and scaled to its `width` (so the fractional px are painted exactly,
// see the CSS), in its Commodity map colour (data-grain-colour names the
// token); the track is drawn only beside at least one segment. The bar is
// decorative (aria-hidden): the summary and the Legend carry its readings,
// and no new copy is needed.
//
// Legend (FR-87): row-major in two columns. In the Full layout the first
// item is the frame's 42 px first-row item and a Corn second item keeps its
// scaled sizes (Q-G2, data-fid 6337:54860); everywhere else the regular
// item (grain.js legendLayout).
//
// Only strings and finite numbers with visible text render (grain.js
// visibleText). Keys are slot positions (the bar's segment slots and the
// Legend's item slots), so a re-render with new readings updates each slot
// in place.
import { copy } from '../../../lib/copy.js';
import { FID } from '../../../lib/fid.js';
import { grainCommodities, grainSummary, grainTrack } from './grain.js';
import styles from './GrainCard.module.css';

const cx = (...names) => names.filter(Boolean).join(' ');

/**
 * The edges of a Fill bar box (segment or track) that lie on the bar's own
 * top or bottom edge, where the paint reaches 1 px past the box (see
 * .bleedTop in the CSS): a box nudged up (top < 0) reaches only past the
 * top, one nudged down (top > 0) only past the bottom, one at 0 both.
 */
const bleedOf = (top) => {
  if (top < 0) return 'top';
  if (top > 0) return 'bottom';
  return 'top bottom';
};

/**
 * A Fill bar box at `left` / `top`, `width` wide: a 1 px box translated and
 * scaled to its px (see .box in the CSS), so the fractional px are painted
 * exactly and getBoundingClientRect() is the segment's box. Its paint layer
 * carries the colour (a Commodity map token, or the track's CSS colour).
 */
function BarBox({ left, top, width, paintClassName, token, ...rest }) {
  const bleed = bleedOf(top);
  return (
    <span
      className={styles.box}
      style={{ transform: `translate(${left}px, ${top}px) scaleX(${width})` }}
      data-grain-bleed={bleed}
      {...rest}
    >
      <span
        className={cx(styles.paint, paintClassName, bleed !== 'bottom' && styles.bleedTop, bleed !== 'top' && styles.bleedBottom)}
        style={token === undefined ? undefined : { backgroundColor: `var(${token})` }}
        data-grain-paint=""
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
        {rest === null ? null : <span data-grain-part="summaryRest">{rest}</span>}
      </p>
      {fillLabel === null ? null : (
        <p className={styles.fillLabel} data-grain-part="fillLabel">
          {fillLabel}
        </p>
      )}
    </div>
  );
}

function FillBar({ commodities }) {
  const track = grainTrack(commodities);
  return (
    <div className={styles.bar} aria-hidden="true" data-grain-bar="">
      {track === null ? null : (
        <BarBox left={track.left} top={0} width={track.width} paintClassName={styles.track} data-grain-track="" />
      )}
      {commodities.map((commodity, slot) => (
        <BarBox
          key={slot}
          left={commodity.left}
          top={commodity.top}
          width={commodity.width}
          token={commodity.token}
          data-grain-segment={slot}
          data-grain-colour={commodity.token}
        />
      ))}
    </div>
  );
}

function Legend({ commodities }) {
  return (
    // role="list": WebKit drops list semantics under `list-style: none`.
    <ul className={styles.legend} role="list" data-grain-legend="">
      {commodities.map((commodity, slot) => (
        <li
          key={slot}
          className={cx(styles.item, commodity.layout !== 'regular' && styles[commodity.layout])}
          data-grain-item={slot}
          data-grain-layout={commodity.layout}
          data-grain-colour={commodity.token}
          data-fid={commodity.layout === 'corn' ? FID.grain.cornLegendItem : undefined}
        >
          <span
            className={styles.swatch}
            style={{ backgroundColor: `var(${commodity.token})` }}
            aria-hidden="true"
            data-grain-part="swatch"
          />
          <span className={styles.name} data-grain-part="name">
            {commodity.name}
          </span>
          <span className={styles.sub} data-grain-part="sub">
            {commodity.subLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * @param {{ data: object, variant?: 'full' | 'small' | 'allgood' }} props
 *   `data` = the `grain` slice; `variant` = the Dashboard state, which places
 *   the Full frame's special Legend items (anything else → Full).
 */
export default function GrainCard({ data, variant }) {
  const commodities = grainCommodities(data, variant);
  return (
    <div className={styles.body} data-grain-body="">
      <div className={styles.summaryBlock} data-grain-summary="">
        <Summary summary={grainSummary(data)} />
        <FillBar commodities={commodities} />
      </div>
      <Legend commodities={commodities} />
    </div>
  );
}
