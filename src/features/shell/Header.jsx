// The one signed-in Header (AD-17, FR-51–FR-54), Figma instance 6227:63670 of
// master 6194:35398 (variants 6229:37003 Equipment, 6223:34415 Alerts).
//
// Props are exactly `{ activeTab, badge, onBellClick }`: the page passes the
// active tab and the `bellBadge` reading from its state document. The Header
// holds no data and never fetches. Labels come from copy.js only.
//
// Not rendered (FR-51): the hidden "Farm Test" switcher. The divider keeps its
// slot; its Figma path is exported at opacity 0, so it stays invisible.
// <img> width/height attributes are whole-pixel hints; the exact sizes
// (176.895 × 14, the 0-high divider line) live in Header.module.css.
import { copy } from '../../lib/copy.js';
import { FID } from '../../lib/fid.js';
import AvatarButton from './AvatarButton.jsx';
import BellButton from './BellButton.jsx';
import NavTabs from './NavTabs.jsx';
import logoSvg from '../../assets/icons/logo.svg';
import navlineSvg from '../../assets/icons/navline.svg';
import styles from './Header.module.css';

const HEADER_FID = {
  dashboard: FID.shell.header,
  equipment: FID.shell.headerVariantEquipment,
  alerts: FID.shell.headerVariantAlerts,
};

/**
 * @param {{ activeTab: 'dashboard' | 'equipment' | 'alerts', badge?: string | number | null, onBellClick?: () => void }} props
 */
export default function Header({ activeTab, badge, onBellClick }) {
  return (
    <header className={styles.header} data-fid={HEADER_FID[activeTab] ?? FID.shell.header}>
      <div className={styles.left} data-fid={FID.shell.leftBlock}>
        <img
          className={styles.logo}
          src={logoSvg}
          alt={copy.brand.logoAlt}
          width="177"
          height="14"
          data-fid={FID.shell.logo}
        />
        <div className={styles.divider} aria-hidden="true" data-fid={FID.shell.headerDivider}>
          <img className={styles.dividerLine} src={navlineSvg} alt="" width="24" />
        </div>
      </div>
      <NavTabs activeTab={activeTab} />
      <div className={styles.actions} data-fid={FID.shell.iconActions}>
        <BellButton badge={badge} onClick={onBellClick} />
        <AvatarButton />
      </div>
    </header>
  );
}
