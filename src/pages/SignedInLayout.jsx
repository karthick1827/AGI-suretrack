// The signed-in app shell (FR-50, FR-55, FR-57, AD-17): the 1366 px canvas on
// #F3F4F6, the one Header, the 68 px page-title strip and the route outlet.
// Every signed-in route renders inside it (src/app/App.jsx).
//
// The page owns the Header's data: it resolves the Dashboard state once
// (AD-11: `?state`, then the Session, then `full`), loads that state document
// through the data port and passes `header.bellBadge` down verbatim. While the
// document loads, and if it fails, the badge is hidden; the Header stays usable.
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { getDashboard } from '../data/api.js';
import Header from '../features/shell/Header.jsx';
import { copy } from '../lib/copy.js';
import { resolveDashboardState } from '../lib/dashboardState.js';
import { FID } from '../lib/fid.js';
import { getSession } from '../lib/session.js';
import styles from './SignedInLayout.module.css';

/** `header.bellBadge` of a state document, or null when it has none. */
function bellBadgeOf(doc) {
  const value = doc?.header?.bellBadge;
  return typeof value === 'number' || typeof value === 'string' ? value : null;
}

/**
 * @param {{ activeTab: 'dashboard' | 'equipment' | 'alerts', onBellClick?: () => void }} props
 */
export default function SignedInLayout({ activeTab, onBellClick }) {
  const { search } = useLocation();
  const [badge, setBadge] = useState(null);

  useEffect(() => {
    let live = true;
    const state = resolveDashboardState(search, getSession());
    getDashboard(state).then(
      (doc) => {
        if (live) setBadge(bellBadgeOf(doc));
      },
      () => {
        if (live) setBadge(null);
      },
    );
    return () => {
      live = false;
    };
  }, [search]);

  return (
    <div className={styles.canvas}>
      <Header activeTab={activeTab} badge={badge} onBellClick={onBellClick} />
      <div className={styles.titleStrip} data-fid={FID.shell.pageTitle}>
        <h1 className={styles.title}>{copy.shell.pageTitles[activeTab]}</h1>
      </div>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
