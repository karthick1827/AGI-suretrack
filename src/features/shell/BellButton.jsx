// Bell and badge (FR-53). The bell only calls `onClick` (the Notifications
// panel attaches in Epic 3). The badge shows the `bellBadge` reading verbatim
// and is hidden while there is none (loading, or the data failed).
import { copy } from '../../lib/copy.js';
import { FID } from '../../lib/fid.js';
import bellSvg from '../../assets/icons/bell.svg';
import styles from './BellButton.module.css';

export default function BellButton({ badge, onClick }) {
  const hasBadge = badge !== undefined && badge !== null && badge !== '';
  return (
    <>
      <button
        type="button"
        className={styles.bell}
        aria-label={copy.shell.bellLabel}
        onClick={() => onClick?.()}
        data-fid={FID.shell.bell}
      >
        <img className={styles.icon} src={bellSvg} alt="" width="20" height="20" />
      </button>
      {hasBadge && (
        <span className={styles.badge} aria-hidden="true" data-fid={FID.shell.badge}>
          <span className={styles.badgeText} data-fid={FID.shell.badgeText}>
            {String(badge)}
          </span>
        </span>
      )}
    </>
  );
}
