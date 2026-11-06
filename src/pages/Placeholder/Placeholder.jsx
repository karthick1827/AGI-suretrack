// Placeholder for app routes that are not built yet (AD-10). `/dashboard`
// renders it until Epic 2; the Header arrives in Story 2.1.
import { copy } from '../../lib/copy.js';
import styles from './Placeholder.module.css';

export default function Placeholder() {
  return (
    <main className={styles.page}>
      <p className={styles.message}>{copy.placeholder.comingSoon}</p>
    </main>
  );
}
