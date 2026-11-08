// Nav tabs (FR-52): Dashboard, Equipment, Alerts — 154×64 links, no gap.
// The active tab gets the Figma active style and aria-current="page".
// Icons are the Figma SVGs, unmodified (AD-5): garage.svg already carries its
// own 0.7 opacity, so only the other icons are dimmed when inactive.
import { Link, useLocation } from 'react-router';
import { copy } from '../../lib/copy.js';
import { FID } from '../../lib/fid.js';
import { DASHBOARD_STATES, SHELL_TABS, tabHref } from '../../lib/paths.js';
import widget5Svg from '../../assets/icons/widget5.svg';
import garageSvg from '../../assets/icons/garage.svg';
import dangerSvg from '../../assets/icons/nav_danger.svg';
import styles from './NavTabs.module.css';

const TAB = {
  dashboard: {
    icon: widget5Svg,
    iconOwnOpacity: false,
    fid: FID.shell.navTabDashboard,
    iconFid: FID.shell.navIconDashboard,
    labelFid: FID.shell.navLabelDashboard,
  },
  equipment: {
    icon: garageSvg,
    iconOwnOpacity: true,
    fid: FID.shell.navTabEquipment,
    iconFid: FID.shell.navIconEquipment,
    labelFid: FID.shell.navLabelEquipment,
  },
  alerts: {
    icon: dangerSvg,
    iconOwnOpacity: false,
    fid: FID.shell.navTabAlerts,
    iconFid: FID.shell.navIconAlerts,
    labelFid: FID.shell.navLabelAlerts,
  },
};

export default function NavTabs({ activeTab }) {
  const { search } = useLocation();
  // AD-10: `?state=` is kept only on the link back to /dashboard, and only
  // when this URL carries a valid one.
  const urlState = new URLSearchParams(search).get('state');
  const dashboardState = DASHBOARD_STATES.includes(urlState) ? urlState : undefined;

  return (
    <nav className={styles.tabs} data-fid={FID.shell.navTabs}>
      {SHELL_TABS.map((tab) => {
        const meta = TAB[tab];
        const active = tab === activeTab;
        const dimIcon = !active && !meta.iconOwnOpacity;
        return (
          <Link
            key={tab}
            to={tabHref(tab, dashboardState)}
            className={active ? `${styles.tab} ${styles.active}` : styles.tab}
            aria-current={active ? 'page' : undefined}
            data-fid={meta.fid}
          >
            <img
              className={dimIcon ? `${styles.icon} ${styles.dim}` : styles.icon}
              src={meta.icon}
              alt=""
              width="24"
              height="24"
              data-fid={meta.iconFid}
            />
            <span className={styles.label} data-fid={meta.labelFid}>
              {copy.shell.tabs[tab]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
