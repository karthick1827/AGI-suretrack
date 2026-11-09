// Dashboard page (FR-50, FR-93–FR-96, AD-11, AD-18).
//
// It renders inside SignedInLayout, which resolves the Dashboard state and
// loads its ONE document; this page reads it from the Outlet context
// `{ state, status, doc, retry }` and never fetches (AD-7, AD-11).
//
// Layout: six section slots, absolutely placed from FRAME[state]
// (src/lib/dashboardLayout.js) in every status, so nothing moves when data
// arrives (CLS 0). The page is exactly as tall as the Figma frame: the last
// card row plus `pageBottomSpacePx` (1052 / 860 / 856).
//
// Sections: each takes `{ status, data, onRetry }` (AD-18) with `data` = its
// slice of the document, plus the page's `variant` (the Dashboard state), which
// the KPI strip and the Equipment card use because their layout differs per
// state. A ready slice that is missing, or has no content its section can
// draw (the Equipment card with no usable rows; Recent Alerts with no usable
// items, or an empty `items` array without Empty-state copy; Fan activity with
// no usable Stat tile or Runtime bar), shows that section's error. The KPI
// section draws the KPI strip (Story 2.3), the Equipment card its rows (Story
// 2.4), Recent Alerts its Alert rows or Empty state (Story 2.5) and Fan
// activity its Stat tiles, Runtime chart and caption (Story 2.6) when ready;
// until Stories 2.7–2.8 add their contents, the other `ready` cards show only
// their shell and card header. `loading` and `error` show the FR-95 / FR-96
// blocks at the section's final size.
import { useRef } from 'react';
import { useOutletContext } from 'react-router';
import { CONTENT_TOP, FRAME, SECTION_KEYS, pageHeight } from '../../lib/dashboardLayout.js';
import { paths } from '../../lib/paths.js';
import EquipmentCard from '../../features/dashboard/equipment/EquipmentCard.jsx';
import { equipmentRows } from '../../features/dashboard/equipment/equipmentRows.js';
import RecentAlertsCard from '../../features/dashboard/alerts/RecentAlertsCard.jsx';
import { hasAlertContent } from '../../features/dashboard/alerts/alertItems.js';
import FanActivityCard from '../../features/dashboard/fan/FanActivityCard.jsx';
import { hasFanContent } from '../../features/dashboard/fan/fanActivity.js';
import KpiStrip from '../../features/dashboard/kpi/KpiStrip.jsx';
import CardShell from '../../ui/CardShell.jsx';
import SectionState from '../../ui/SectionState.jsx';
import styles from './DashboardPage.module.css';

const STATUSES = ['loading', 'ready', 'error'];
const DEFAULT_STATE = 'full';

const isText = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * The KPI section (FR-59 to FR-64). It takes the AD-18 `{ status, data,
 * onRetry }` (`data` = `doc.kpi`) plus the page's resolved `variant` (the
 * Dashboard state), because tile widths differ per state. One stable component
 * for every state, so a state change never remounts it. Loading and error keep
 * the strip's white shell at 1318×90 (no layout shift).
 */
function KpiSection({ status, data, onRetry, variant }) {
  if (status === 'ready') return <KpiStrip kpi={data} variant={variant} />;
  return (
    <div className={styles.kpiShell}>
      <SectionState status={status} onRetry={onRetry} />
    </div>
  );
}

/**
 * A card section with the FR-65 shell and header. `Body` (when given) draws
 * the card contents below the header when ready, with the section's `data`
 * and the page's `variant`; card contents for Stories 2.7–2.8 come later.
 * One stable component per section for every state, so a state change never
 * remounts it.
 */
function cardSection({ headerSize, subtitleTone, linkTo, Body }) {
  return function CardSection({ status, data, onRetry, variant }) {
    const ready = status === 'ready';
    // No header block unless the document gives both strings (FR-94: verbatim, never invented).
    const header =
      ready && isText(data?.title) && isText(data?.subtitle)
        ? {
            title: data.title,
            subtitle: data.subtitle,
            headerSize,
            subtitleTone,
            link: linkTo && isText(data.link) ? { to: linkTo(), label: data.link } : undefined,
          }
        : null;
    return (
      <CardShell className={styles.fill} header={header}>
        {ready && Body ? <Body data={data} variant={variant} /> : null}
        {ready ? null : <SectionState status={status} onRetry={onRetry} />}
      </CardShell>
    );
  };
}

/** Slices that need content to be drawn: ready with none → the section error (FR-96). */
const HAS_CONTENT = Object.freeze({
  equipmentCard: (data) => equipmentRows(data).length > 0,
  recentAlerts: hasAlertContent,
  fanActivity: hasFanContent,
});

/** The section component for each key of SECTION_KEYS (FR-65 header variants). */
const SECTIONS = Object.freeze({
  kpi: KpiSection,
  equipmentCard: cardSection({
    headerSize: 'regular',
    subtitleTone: 'dark',
    linkTo: () => paths.equipment(),
    Body: EquipmentCard,
  }),
  recentAlerts: cardSection({
    headerSize: 'regular',
    subtitleTone: 'dark',
    linkTo: () => paths.alerts(),
    Body: RecentAlertsCard,
  }),
  fanActivity: cardSection({ headerSize: 'regular', subtitleTone: 'muted', Body: FanActivityCard }),
  grain: cardSection({ headerSize: 'compact', subtitleTone: 'muted' }),
  liquid: cardSection({ headerSize: 'compact', subtitleTone: 'muted' }),
});

export default function DashboardPage() {
  const context = useOutletContext();
  const pageRef = useRef(null);
  // Without the layout's context there is no document and nothing to retry.
  const state = Object.hasOwn(FRAME, context?.state ?? '') ? context.state : DEFAULT_STATE;
  const frame = FRAME[state];
  const status = STATUSES.includes(context?.status) ? context.status : 'error';
  const doc = context?.doc ?? null;
  const retry = typeof context?.retry === 'function' ? context.retry : undefined;

  // Retry unmounts the focused button (the sections go back to `loading`):
  // keep a keyboard user's place by moving focus to the page region first.
  const onRetry = retry
    ? () => {
        const pageEl = pageRef.current;
        if (pageEl && pageEl.contains(document.activeElement)) {
          // tabindex -1 only while it holds focus: at rest the page is not
          // focusable, so a pointer press on it still counts as an outside
          // press for overlays and never moves focus.
          pageEl.setAttribute('tabindex', '-1');
          pageEl.addEventListener('blur', () => pageEl.removeAttribute('tabindex'), { once: true });
          pageEl.focus({ preventScroll: true });
        }
        retry();
      }
    : undefined;

  return (
    <div
      ref={pageRef}
      className={styles.page}
      style={{ height: pageHeight(frame) - CONTENT_TOP }}
      data-state={state}
    >
      {SECTION_KEYS.map((key) => {
        const Section = SECTIONS[key];
        const { x, y, w, h } = frame.sections[key];
        const data = doc?.[key] ?? null;
        // A ready document without this section's slice, or with a slice its
        // section cannot draw, is a load error for that section.
        const usable = data !== null && (HAS_CONTENT[key]?.(data) ?? true);
        const sectionStatus = status === 'ready' && !usable ? 'error' : status;
        return (
          <div
            key={key}
            className={styles.slot}
            style={{ left: x, top: y - CONTENT_TOP, width: w, height: h }}
            data-section={key}
            data-status={sectionStatus}
            aria-busy={sectionStatus === 'loading' ? true : undefined}
          >
            <Section status={sectionStatus} data={data} onRetry={onRetry} variant={state} />
          </div>
        );
      })}
    </div>
  );
}
