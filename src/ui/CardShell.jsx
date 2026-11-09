// Shared Dashboard card shell and card header slot (FR-65, design spec Part B §4).
//
// The shell is the white, bordered, rounded "alerts-activity-card" every
// Dashboard card is drawn in. Its size is set by the caller (the page places
// it from FRAME[state], AD-18), never by its content.
//
// The header ("Margin") is optional: loading and error states hide it
// (FR-95). Text comes from the state document verbatim (FR-94); the shell
// never formats it.
//   - `headerSize`: 'regular' (Equipment, Recent Alerts, Fan activity: 56 px)
//     or 'compact' (Grain and Liquid On Hand: 33 px nominal, text overflows).
//   - `subtitleTone`: 'dark' (rgba(0,0,0,0.8): Equipment, Recent Alerts) or
//     'muted' (#4B5563: Fan activity, Grain, Liquid).
//   - `link`: `{ to, label }` draws the "View All" link with the 12×16
//     chevron (Equipment and Recent Alerts only).
import { Link } from 'react-router';
import chevronRightSvg from '../assets/icons/chevron-right.svg';
import styles from './CardShell.module.css';

/**
 * @param {{
 *   header?: { title: string, subtitle: string, headerSize?: 'regular' | 'compact', subtitleTone?: 'dark' | 'muted', link?: { to: string, label: string } } | null,
 *   children?: import('react').ReactNode,
 *   className?: string,
 * } & import('react').HTMLAttributes<HTMLElement>} props
 */
export default function CardShell({ header = null, children, className, ...rest }) {
  return (
    <section className={className ? `${styles.card} ${className}` : styles.card} {...rest}>
      {header ? <CardHeader {...header} /> : null}
      {children}
    </section>
  );
}

function CardHeader({ title, subtitle, headerSize = 'regular', subtitleTone = 'dark', link }) {
  return (
    <div className={headerSize === 'compact' ? `${styles.header} ${styles.compact}` : styles.header}>
      <div className={styles.text}>
        <h2 className={styles.title}>{title}</h2>
        <p className={subtitleTone === 'muted' ? `${styles.subtitle} ${styles.muted}` : styles.subtitle}>{subtitle}</p>
      </div>
      {link ? (
        <Link className={styles.link} to={link.to}>
          <span className={styles.linkLabel}>{link.label}</span>
          <img className={styles.chevron} src={chevronRightSvg} alt="" width="12" height="16" />
        </Link>
      ) : null}
    </div>
  );
}
