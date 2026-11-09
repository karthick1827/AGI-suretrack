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
import { useOutletContext } from 'react-router';
import { FID } from '../../lib/fid.js';
import { CONTENT_TOP, FRAME, SECTION_KEYS, pageHeight } from '../../lib/dashboardLayout.js';
import { paths } from '../../lib/paths.js';
import CardShell from '../../ui/CardShell.jsx';
import SectionState from '../../ui/SectionState.jsx';
import styles from './DashboardPage.module.css';

/** KPI strip slot (FR-59 shell). Its contents come in Story 2.3. */
function KpiSection({ status, onRetry }) {
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
    const header =
      ready && data
        ? {
            title: data.title,
            subtitle: data.subtitle,
            headerSize,
            subtitleTone,
            link: linkTo && data.link ? { to: linkTo(), label: data.link } : undefined,
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
const SECTIONS = {
  kpi: KpiSection,
  equipmentCard: cardSection({ headerSize: 'regular', subtitleTone: 'dark', linkTo: () => paths.equipment() }),
  recentAlerts: cardSection({ headerSize: 'regular', subtitleTone: 'dark', linkTo: () => paths.alerts() }),
  fanActivity: cardSection({ headerSize: 'regular', subtitleTone: 'muted' }),
  grain: cardSection({ headerSize: 'compact', subtitleTone: 'muted' }),
  liquid: cardSection({ headerSize: 'compact', subtitleTone: 'muted' }),
};

export default function DashboardPage() {
  const { state, status, doc, retry } = useOutletContext();
  const frame = FRAME[state] ?? FRAME.full;

  return (
    <div className={styles.page} style={{ height: pageHeight(frame) - CONTENT_TOP }} data-state={state}>
      {SECTION_KEYS.map((key) => {
        const Section = SECTIONS[key];
        const { x, y, w, h } = frame.sections[key];
        return (
          <div
            key={key}
            className={styles.slot}
            style={{ left: x, top: y - CONTENT_TOP, width: w, height: h }}
            data-section={key}
            data-status={status}
            aria-busy={status === 'loading' ? true : undefined}
          >
            <Section status={status} data={doc?.[key] ?? null} onRetry={retry} />
          </div>
        );
      })}
    </div>
  );
}
