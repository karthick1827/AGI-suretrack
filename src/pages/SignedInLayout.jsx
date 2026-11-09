// The signed-in app shell (FR-50, FR-55, FR-57, AD-17): the 1366 px canvas on
// #F3F4F6, the one Header, the 68 px page-title strip and the route outlet.
// Every signed-in route renders inside it (src/app/App.jsx).
//
// Dashboard state document (AD-11, AD-17): the shell resolves the state once
// per mount (`?state`, then the Session's `dashboardState`, then `full`) and
// re-resolves only when one of those two inputs changes; an unrelated query
// change (`/equipment?type=…`) neither refetches nor resets anything. It loads
// that ONE document through the data port and
//   - hands the Header its `header.bellBadge` reading (the Header holds no
//     data); the badge is hidden while the document loads, after a state change
//     and if the load fails, and the Header stays usable;
//   - exposes the same document to the child page through the Outlet context
//     `{ state, status: 'loading' | 'ready' | 'error', doc, retry }`, so the
//     Dashboard page (Story 2.2) reads it with useOutletContext() instead of
//     fetching it a second time.
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Outlet, useLocation } from 'react-router';
import { getDashboard } from '../data/api.js';
import Header from '../features/shell/Header.jsx';
import { copy } from '../lib/copy.js';
import { resolveDashboardState } from '../lib/dashboardState.js';
import { FID } from '../lib/fid.js';
import { getSession, subscribe } from '../lib/session.js';
import styles from './SignedInLayout.module.css';

const sessionDashboardState = () => getSession()?.dashboardState ?? null;

/**
 * @param {{ activeTab: 'dashboard' | 'equipment' | 'alerts', onBellClick?: () => void }} props
 */
export default function SignedInLayout({ activeTab, onBellClick }) {
  const { search } = useLocation();
  const sessionState = useSyncExternalStore(subscribe, sessionDashboardState, () => null);
  // A string, so the effect below re-runs only when the resolved state changes.
  const state = resolveDashboardState(search, { dashboardState: sessionState });

  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ state: null, attempt: -1, status: 'loading', doc: null });

  useEffect(() => {
    const run = { live: true };
    getDashboard(state).then(
      (doc) => {
        if (run.live) setResult({ state, attempt, status: 'ready', doc });
      },
      () => {
        if (run.live) setResult({ state, attempt, status: 'error', doc: null });
      },
    );
    return () => {
      run.live = false;
    };
  }, [state, attempt]);

  // A result for another state or an earlier attempt is never shown: on a
  // real state change (or a retry) the page is back to `loading`, badge hidden.
  const current = result.state === state && result.attempt === attempt ? result : null;
  const status = current?.status ?? 'loading';
  const doc = current?.doc ?? null;
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const outletContext = useMemo(() => ({ state, status, doc, retry }), [state, status, doc, retry]);

  return (
    <div className={styles.canvas}>
      <Header activeTab={activeTab} badge={doc?.header?.bellBadge ?? null} onBellClick={onBellClick} />
      <div className={styles.titleStrip} data-fid={FID.shell.pageTitle}>
        <h1 className={styles.title}>{copy.shell.pageTitles[activeTab]}</h1>
      </div>
      <main className={styles.content}>
        <Outlet context={outletContext} />
      </main>
    </div>
  );
}
