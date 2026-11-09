// Bell and badge (FR-53). The bell only calls `onClick` (the Notifications
// panel attaches in Epic 3); without a handler it is marked aria-disabled.
// The badge shows the `bellBadge` reading verbatim when it is a positive count
// (a finite number > 0, or a non-empty numeric string > 0); anything else —
// none yet (loading, failed), 0, NaN, Infinity, negative — hides it. The
// badge describes the bell (aria-describedby). The wrapper is the badge's
// positioning box (left 9, top 18), so the component is self-contained.
import { useId } from 'react';
import { copy } from '../../lib/copy.js';
import { FID } from '../../lib/fid.js';
import bellSvg from '../../assets/icons/bell.svg';
import styles from './BellButton.module.css';

const NUMERIC = /^\d+(?:\.\d+)?$/;

/** The badge text to show, or null when the reading is not a positive count. */
function badgeLabel(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? String(value) : null;
  if (typeof value === 'string') return NUMERIC.test(value) && Number(value) > 0 ? value : null;
  return null;
}

export default function BellButton({ badge, onClick }) {
  const badgeId = useId();
  const label = badgeLabel(badge);
  const enabled = typeof onClick === 'function';
  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        className={styles.bell}
        aria-label={copy.shell.bellLabel}
        aria-describedby={label === null ? undefined : badgeId}
        aria-disabled={enabled ? undefined : 'true'}
        onClick={() => {
          if (enabled) onClick();
        }}
        data-fid={FID.shell.bell}
      >
        <img className={styles.icon} src={bellSvg} alt="" width="20" height="20" />
      </button>
      {label !== null && (
        <span id={badgeId} className={styles.badge} data-fid={FID.shell.badge}>
          <span className={styles.badgeText} data-fid={FID.shell.badgeText}>
            {label}
          </span>
        </span>
      )}
    </span>
  );
}
