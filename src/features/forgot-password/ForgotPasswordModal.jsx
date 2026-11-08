// Forgot Password modal (FR-36–FR-49), Figma frame 6026:62907 (600×374).
//
// Rendered by the overlay owner (src/ui/overlay, AD-12) as a `modal`: the
// backdrop, Esc, focus trap, focus return and unmount-on-close live there.
// This component draws the frame exactly as in Figma (FR-37–FR-44) and owns
// the form behaviour:
// - FR-45: the email is validated on blur (never before the field has been
//   left once); the message hides as soon as the value is valid.
// - FR-46: Submit is aria-disabled (still focusable, drawn unchanged, cursor
//   not-allowed) until the email is valid; Enter in a valid field submits.
// - FR-47: loading (spinner, repeat submits ignored), then the identical
//   confirmation for any email. requestPasswordReset() sends nothing; if it
//   ever rejects, the form comes back (never stuck loading).
// - FR-42: the help tooltip shows while the icon is hovered or focused; the
//   pointer can move onto it; Esc first dismisses it (WCAG 1.4.13), a second
//   Esc closes the modal.
// Undesigned states live in the CSS Module's states block (AD-13).
import { useEffect, useId, useRef, useState } from 'react';
import { requestPasswordReset } from '../../data/api.js';
import { useConfig } from '../../data/useConfig.js';
import { copy, fill } from '../../lib/copy.js';
import { isValidEmail } from '../../lib/email.js';
import { FID } from '../../lib/fid.js';
import closeSvg from '../../assets/icons/0d4fd.svg';
import helpSvg from '../../assets/icons/16936.svg';
import styles from './ForgotPasswordModal.module.css';

const STATUS = Object.freeze({ form: 'form', loading: 'loading', sent: 'sent' });

/**
 * FR-43: the SureTrack Coach number and, when it is a `tel:` URL, its link.
 * null when the config has no number (the line is then left out).
 */
function selectCoach(config) {
  const phone = config?.coach?.phone;
  const tel = config?.coach?.tel;
  if (typeof phone !== 'string' || phone.trim() === '') return null;
  return { phone, tel: typeof tel === 'string' && /^tel:\+?[0-9]/i.test(tel) ? tel : undefined };
}

export default function ForgotPasswordModal({ onClose }) {
  const t = copy.forgotPassword;
  const titleId = useId();
  const emailId = useId();
  const errorId = useId();
  const tooltipId = useId();
  const coach = useConfig(selectCoach);
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState(STATUS.form);
  const [tooltipHover, setTooltipHover] = useState(false);
  const [tooltipFocus, setTooltipFocus] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const cancelRef = useRef(null);
  const mounted = useRef(true);
  // The dismiss control (Cancel / close X) a pointer is pressing, and whether
  // the Email blur was skipped because of it.
  const dismissPress = useRef(null);
  const skippedBlur = useRef(false);
  const tooltip = (tooltipHover || tooltipFocus) && !tooltipDismissed;

  const valid = isValidEmail(email);
  const sent = status === STATUS.sent;
  const loading = status === STATUS.loading;
  const showError = !sent && touched && !valid;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // A press on Cancel / the close X released somewhere else (dragged off) is
  // not a dismissal: the skipped blur validation runs after all.
  useEffect(() => {
    const onRelease = (event) => {
      const control = dismissPress.current;
      if (!control) return;
      dismissPress.current = null;
      const dismissed = event.type === 'pointerup' && control.contains(event.target);
      if (!dismissed && skippedBlur.current) {
        skippedBlur.current = false;
        setTouched(true);
      }
    };
    document.addEventListener('pointerup', onRelease, true);
    document.addEventListener('pointercancel', onRelease, true);
    return () => {
      document.removeEventListener('pointerup', onRelease, true);
      document.removeEventListener('pointercancel', onRelease, true);
    };
  }, []);

  // FR-49: in the confirmation state focus moves to Cancel.
  useEffect(() => {
    if (sent) cancelRef.current?.focus();
  }, [sent]);

  const onBlur = (event) => {
    // A pointer pressing Cancel or the close X is about to close the modal: no
    // message, so the footer never moves under the pointer between press and
    // click. Keyboard focus moving there validates as usual.
    const control = dismissPress.current;
    if (control && event.relatedTarget && control.contains(event.relatedTarget)) {
      skippedBlur.current = true;
      return;
    }
    setTouched(true);
  };

  const onDismissPointerDown = (event) => {
    dismissPress.current = event.currentTarget;
  };

  const onKeyDown = (event) => {
    // WCAG 1.4.13: Esc hides a visible tooltip first; the modal stays open.
    if (event.key === 'Escape' && tooltip && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.stopPropagation();
      setTooltipDismissed(true);
    }
  };

  const showTooltip = (setter) => {
    setter(true);
    setTooltipDismissed(false);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!valid || status !== STATUS.form) return;
    setStatus(STATUS.loading);
    let next = STATUS.sent;
    try {
      await requestPasswordReset(email.trim());
    } catch {
      next = STATUS.form; // back to the form, the email kept; nothing is logged
    }
    if (mounted.current) setStatus(next);
  };

  // One polite live region announces the error and the confirmation (FR-45, FR-47, NFR-36).
  const announcement = sent ? t.confirmation : showError ? t.invalidEmail : '';

  return (
    <div
      className={styles.modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      data-fid={FID.frames.forgotPassword}
    >
      <div className={styles.header} data-fid={FID.forgotPassword.header}>
        <h2 id={titleId} className={styles.title} data-fid={FID.forgotPassword.title}>
          {t.title}
        </h2>
        <button
          className={styles.close}
          type="button"
          aria-label={t.close}
          data-dismiss=""
          onPointerDown={onDismissPointerDown}
          onClick={onClose}
          data-fid={FID.forgotPassword.closeButton}
        >
          <img className={styles.closeGlyph} src={closeSvg} width={32} height={32} alt="" />
        </button>
      </div>
      <div className={styles.divider} data-fid={FID.forgotPassword.headerDivider} />

      <form className={styles.form} noValidate onSubmit={onSubmit}>
        <div className={styles.body} data-fid={FID.forgotPassword.body}>
          {sent ? (
            <p className={styles.confirmation}>{t.confirmation}</p>
          ) : (
            <>
              <p className={styles.intro} data-fid={FID.forgotPassword.intro}>
                {t.intro}
              </p>
              <div
                className={showError ? `${styles.inputGroup} ${styles.inputGroupInvalid}` : styles.inputGroup}
                data-fid={FID.forgotPassword.emailInput}
              >
                <div className={styles.labelRow} data-fid={FID.forgotPassword.emailLabelRow}>
                  <label className={styles.label} htmlFor={emailId} data-fid={FID.forgotPassword.emailLabel}>
                    {t.emailLabel}
                    <span className={styles.required} aria-hidden="true">
                      {t.requiredMark}
                    </span>
                  </label>
                  <span
                    className={styles.helpSlot}
                    onMouseEnter={() => showTooltip(setTooltipHover)}
                    onMouseLeave={() => setTooltipHover(false)}
                  >
                    <button
                      className={styles.helpIcon}
                      type="button"
                      aria-label={t.helpIconLabel}
                      aria-describedby={tooltipId}
                      onFocus={() => showTooltip(setTooltipFocus)}
                      onBlur={() => setTooltipFocus(false)}
                      data-fid={FID.forgotPassword.helpIconSlot}
                    >
                      <img
                        className={styles.helpGlyph}
                        src={helpSvg}
                        width={35.0012}
                        height={35.0012}
                        alt=""
                        data-fid={FID.forgotPassword.helpIcon}
                      />
                    </button>
                    <span id={tooltipId} className={styles.tooltip} role="tooltip" hidden={!tooltip}>
                      {t.helpTooltip}
                    </span>
                  </span>
                </div>
                <input
                  id={emailId}
                  className={styles.input}
                  type="email"
                  name="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  placeholder={t.emailPlaceholder}
                  value={email}
                  readOnly={loading}
                  aria-invalid={showError || undefined}
                  aria-describedby={showError ? errorId : undefined}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={onBlur}
                  data-overlay-autofocus=""
                  data-fid={FID.forgotPassword.emailField}
                />
                {showError && (
                  <p id={errorId} className={styles.error}>
                    {t.invalidEmail}
                  </p>
                )}
              </div>
            </>
          )}

          <p className={styles.helpText} data-fid={FID.forgotPassword.helpText}>
            {t.helpLead}
            <br />
            {coach?.tel && (
              <a className={styles.coach} href={coach.tel}>
                {fill(t.coachLine, { coachPhone: coach.phone })}
              </a>
            )}
            {coach && !coach.tel && (
              <span className={styles.coach}>{fill(t.coachLine, { coachPhone: coach.phone })}</span>
            )}
          </p>
        </div>

        <div className={styles.divider} data-fid={FID.forgotPassword.footerDivider} />
        <div className={styles.footer} data-fid={FID.forgotPassword.footer}>
          <button
            ref={cancelRef}
            className={styles.cancel}
            type="button"
            data-dismiss=""
            onPointerDown={onDismissPointerDown}
            onClick={onClose}
            data-fid={FID.forgotPassword.cancel}
          >
            {t.cancel}
          </button>
          {!sent && (
            <button
              className={styles.submit}
              type="submit"
              aria-disabled={!valid || loading || undefined}
              aria-busy={loading || undefined}
              data-fid={FID.forgotPassword.submit}
            >
              {loading && <span className={styles.spinner} aria-hidden="true" />}
              {t.submit}
            </button>
          )}
        </div>
      </form>

      <p className={styles.liveRegion} aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
