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
// Sections: each takes exactly `{ status, data, onRetry }` (AD-18) with
// `data` = its slice of the document. Until Stories 2.3–2.8 add their
// contents, a `ready` section shows only its shell and card header; `loading`
// and `error` show the FR-95 / FR-96 blocks.
import { useRef } from 'react';
import { useOutletContext } from 'react-router';
import { FID } from '../../lib/fid.js';
import { CONTENT_TOP, FRAME, SECTION_KEYS, pageHeight } from '../../lib/dashboardLayout.js';
import { paths } from '../../lib/paths.js';
import CardShell from '../../ui/CardShell.jsx';
import SectionState from '../../ui/SectionState.jsx';
import styles from './DashboardPage.module.css';

const STATUSES = ['loading', 'ready', 'error'];
const DEFAULT_STATE = 'full';

const isText = (value) => typeof value === 'string' && value.trim() !== '';

/** KPI strip slot (FR-59 shell). Its contents (from `data`) come in Story 2.3. */
function KpiSection({ status, data: _data, onRetry }) {
  return (
    <div className={styles.kpiShell} data-fid={FID.kpi.strip}>
      {status === 'ready' ? null : <SectionState status={status} onRetry={onRetry} />}
    </div>
  );
}

/** A card section with the FR-65 shell and header; card contents come in Stories 2.4–2.8. */
function cardSection({ headerSize, subtitleTone, linkTo }) {
  return function CardSection({ status, data, onRetry }) {
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
        {ready ? null : <SectionState status={status} onRetry={onRetry} />}
      </CardShell>
    );
  };
}

/** The section component for each key of SECTION_KEYS (FR-65 header variants). */
const SECTIONS = Object.freeze({
  kpi: KpiSection,
  equipmentCard: cardSection({ headerSize: 'regular', subtitleTone: 'dark', linkTo: () => paths.equipment() }),
  recentAlerts: cardSection({ headerSize: 'regular', subtitleTone: 'dark', linkTo: () => paths.alerts() }),
  fanActivity: cardSection({ headerSize: 'regular', subtitleTone: 'muted' }),
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
        // A ready document without this section's slice is a load error for that section.
        const sectionStatus = status === 'ready' && data === null ? 'error' : status;
        return (
          <div
            key={key}
            className={styles.slot}
            style={{ left: x, top: y - CONTENT_TOP, width: w, height: h }}
            data-section={key}
            data-status={sectionStatus}
            aria-busy={sectionStatus === 'loading' ? true : undefined}
          >
            <Section status={sectionStatus} data={data} onRetry={onRetry} />
          </div>
        );
      })}
    </div>
  );
}
