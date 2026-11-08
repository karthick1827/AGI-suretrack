// FR-32 alert banner [ASSUMPTION]: the one place every sign-in error and the
// session-expired notice appear. It is rendered only while there is a message,
// so the at-rest Login page is unchanged. `role="alert"` with an assertive,
// atomic live region announces the text when it appears or changes.
// `children` is an optional trailing action (the FR-29 reset link).
import styles from './AlertBanner.module.css';

export default function AlertBanner({ message, className, ref, children }) {
  return (
    <div
      ref={ref}
      className={[styles.banner, className].filter(Boolean).join(' ')}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <span className={styles.message}>{message}</span>
      {children}
    </div>
  );
}
