// Dashboard section loading placeholder and load error (FR-95, FR-96, AD-18).
// Styling is the PRD [ASSUMPTION] (Q-T1: loading and error are not designed).
//
// - `loading`: a #F4F5F6 radius-8 block that fills its parent's content box;
//   no animation. The section is already at its final size (FRAME[state]).
// - `error`: `Couldn’t load this section.` and a `Retry` button, centred.
//   Retry only calls `onRetry` (the layout's `retry`); it never fetches.
import { copy } from '../lib/copy.js';
import styles from './SectionState.module.css';

/**
 * @param {{ status: 'loading' | 'error', onRetry?: () => void }} props
 */
export default function SectionState({ status, onRetry }) {
  if (status === 'error') {
    return (
      <div className={styles.error}>
        <p className={styles.message}>{copy.dashboard.sectionError}</p>
        <button type="button" className={styles.retry} onClick={onRetry}>
          {copy.dashboard.retry}
        </button>
      </div>
    );
  }
  return <div className={styles.placeholder} aria-hidden="true" />;
}
