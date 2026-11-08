// "Coming soon" placeholder for app routes that are not built (AD-10, FR-57).
// It renders inside the signed-in shell (SignedInLayout), which supplies the
// Header with the matching Nav tab active and the page-title strip.
import { copy } from '../../lib/copy.js';
import styles from './Placeholder.module.css';

export default function Placeholder() {
  return (
    <div className={styles.block}>
      <p className={styles.message}>{copy.placeholder.comingSoon}</p>
    </div>
  );
}
