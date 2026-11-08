// Login form column (FR-15–FR-20), Figma 6026:60124 and descendants.
//
// Story 1.3 wires sign-in (useSignIn): Enter or Login submits, empty fields
// show their required message (FR-22), and the button shows a loading state
// that ignores repeat submits (FR-23). Error and loading visuals live in the
// CSS Module's states block and only appear when that state is active, so the
// at-rest render is unchanged. The Forgot link is still a non-functional
// button (the modal arrives in Story 1.5). Legal URLs come from the runtime config (FR-20, SCRUM-31);
// until it loads, if it fails, or if a URL is not http(s), a link renders
// without an href.
import { useEffect, useId, useState } from 'react';
import { getConfig } from '../../data/api.js';
import { copy } from '../../lib/copy.js';
import { FID } from '../../lib/fid.js';
import { OUTCOMES, useSignIn } from './useSignIn.js';
import logoSvg from '../../assets/icons/e34ba.svg';
import styles from './LoginForm.module.css';

const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' };

/** Only absolute http(s) URLs become an href; anything else is dropped. */
function safeUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : undefined;
}

function useLegalUrls() {
  const [legal, setLegal] = useState(null);
  useEffect(() => {
    let active = true;
    getConfig().then(
      (config) => {
        if (!active) return;
        const source = config?.legal;
        setLegal({
          privacyPolicyUrl: safeUrl(source?.privacyPolicyUrl),
          termsOfServiceUrl: safeUrl(source?.termsOfServiceUrl),
        });
      },
      () => {
        // Config failed to load: the links stay without an href; nothing is logged.
      },
    );
    return () => {
      active = false;
    };
  }, []);
  return legal;
}

export default function LoginForm() {
  const usernameId = useId();
  const passwordId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const legal = useLegalUrls();
  const { errors, loading, submit, clearError } = useSignIn();
  const t = copy.login;
  // FR-20: the space before "|" (and "|") is Regular; the space after it is
  // Medium. Without a "|", the whole separator renders Regular.
  const bar = t.legalSeparator.indexOf('|');
  const splitAt = bar === -1 ? t.legalSeparator.length : bar + 1;
  const separatorRegular = t.legalSeparator.slice(0, splitAt);
  const separatorMedium = t.legalSeparator.slice(splitAt);

  const onSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await submit({
      username: form.elements.username.value,
      password: form.elements.password.value,
    });
    // FR-22: focus moves to the first empty field.
    if (result.outcome === OUTCOMES.invalid) form.elements[result.field].focus();
  };

  const columnClass = [
    styles.column,
    errors.username && styles.usernameInvalid,
    errors.password && styles.passwordInvalid,
  ]
    .filter(Boolean)
    .join(' ');
  // FR-22 / NFR-12: one polite live region announces the required-field
  // messages once; each visible message is also its input's description.
  const announcement = [
    errors.username && t.errors.usernameRequired,
    errors.password && t.errors.passwordRequired,
  ]
    .filter(Boolean)
    .join(' ');
  const fieldClass = (group, invalid) => [styles.field, group, invalid && styles.fieldInvalid].filter(Boolean).join(' ');

  return (
    <div className={columnClass} data-fid={FID.login.formColumn}>
      <div className={styles.innerStack} data-fid={FID.login.innerStack}>
        <div className={styles.logoStack} data-fid={FID.login.logoStack}>
          <img
            className={styles.logo}
            src={logoSvg}
            width={392}
            height={24}
            alt={copy.brand.logoAlt}
            data-fid={FID.login.logo}
          />
          <div className={styles.formWrapper} data-fid={FID.login.formWrapper}>
            <form
              className={styles.formStack}
              data-fid={FID.login.formStack}
              noValidate
              onSubmit={onSubmit}
            >
              <h1 className={styles.title} data-fid={FID.login.title}>
                {t.title}
              </h1>

              <div className={fieldClass(styles.usernameGroup, errors.username)} data-fid={FID.login.usernameGroup}>
                <label
                  className={`${styles.label} ${styles.usernameLabel}`}
                  htmlFor={usernameId}
                  data-fid={FID.login.usernameLabel}
                >
                  {t.usernameLabel}
                </label>
                <input
                  id={usernameId}
                  className={styles.input}
                  type="text"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={errors.username || undefined}
                  aria-describedby={errors.username ? usernameErrorId : undefined}
                  onChange={() => clearError('username')}
                  data-fid={FID.login.usernameInput}
                />
                {errors.username && (
                  <p id={usernameErrorId} className={styles.fieldError}>
                    {t.errors.usernameRequired}
                  </p>
                )}
              </div>

              <div className={fieldClass(styles.passwordGroup, errors.password)} data-fid={FID.login.passwordGroup}>
                <label
                  className={`${styles.label} ${styles.passwordLabel}`}
                  htmlFor={passwordId}
                  data-fid={FID.login.passwordLabel}
                >
                  {t.passwordLabel}
                </label>
                <input
                  id={passwordId}
                  className={styles.input}
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  aria-invalid={errors.password || undefined}
                  aria-describedby={errors.password ? passwordErrorId : undefined}
                  onChange={() => clearError('password')}
                  data-fid={FID.login.passwordInput}
                />
                {errors.password && (
                  <p id={passwordErrorId} className={styles.fieldError}>
                    {t.errors.passwordRequired}
                  </p>
                )}
              </div>

              <button
                className={styles.loginButton}
                type="submit"
                aria-busy={loading || undefined}
                aria-disabled={loading || undefined}
                data-fid={FID.login.loginButton}
              >
                {loading && <span className={styles.spinner} aria-hidden="true" />}
                <span className={styles.loginButtonLabel} data-fid={FID.login.loginButtonLabel}>
                  {t.submit}
                </span>
              </button>

              <div className={styles.forgotBox} data-fid={FID.login.forgotLinkBox}>
                <button className={styles.forgotLink} type="button" data-fid={FID.login.forgotLink}>
                  {t.forgotLink}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <p className={styles.legal} data-fid={FID.login.legalText}>
        {t.legalLead}
        <br />
        <a className={styles.legalLink} href={legal?.privacyPolicyUrl} {...NEW_TAB}>
          {t.privacyPolicy}
        </a>
        <span className={styles.separator}>{separatorRegular}</span>
        <span className={styles.medium}>{separatorMedium}</span>
        <a className={styles.legalLink} href={legal?.termsOfServiceUrl} {...NEW_TAB}>
          {t.termsOfService}
        </a>
      </p>

      <p className={styles.liveRegion} aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
