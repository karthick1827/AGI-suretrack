// Login form column (FR-15–FR-20), Figma 6026:60124 and descendants.
//
// Static at-rest form for Story 1.2: submitting is a no-op (sign-in arrives in
// Story 1.3) and the Forgot link is a non-functional button (the modal arrives
// in Story 1.5). Legal URLs come from the runtime config (FR-20, SCRUM-31);
// until it loads, or if it fails, the links render without an href.
import { useEffect, useId, useState } from 'react';
import { getConfig } from '../../data/api.js';
import { copy } from '../../lib/copy.js';
import { FID } from '../../lib/fid.js';
import logoSvg from '../../assets/icons/e34ba.svg';
import styles from './LoginForm.module.css';

const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' };

function useLegalUrls() {
  const [legal, setLegal] = useState(null);
  useEffect(() => {
    let active = true;
    getConfig().then(
      (config) => {
        if (active) setLegal(config?.legal ?? null);
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
  const legal = useLegalUrls();
  const t = copy.login;
  // FR-20: the spaces before "|" (and "|") are Regular; the spaces after it are Medium.
  const splitAt = t.legalSeparator.indexOf('|') + 1;
  const separatorRegular = t.legalSeparator.slice(0, splitAt);
  const separatorMedium = t.legalSeparator.slice(splitAt);

  return (
    <div className={styles.column} data-fid={FID.login.formColumn}>
      <div className={styles.innerStack} data-fid={FID.login.innerStack}>
        <div className={styles.logoStack} data-fid={FID.login.logoStack}>
          <img
            className={styles.logo}
            src={logoSvg}
            width="392.4305"
            height="24"
            alt={copy.brand.logoAlt}
            data-fid={FID.login.logo}
          />
          <div className={styles.formWrapper} data-fid={FID.login.formWrapper}>
            <form
              className={styles.formStack}
              data-fid={FID.login.formStack}
              noValidate
              onSubmit={(event) => event.preventDefault()}
            >
              <h1 className={styles.title} data-fid={FID.login.title}>
                {t.title}
              </h1>

              <div className={`${styles.field} ${styles.usernameGroup}`} data-fid={FID.login.usernameGroup}>
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
                  data-fid={FID.login.usernameInput}
                />
              </div>

              <div className={`${styles.field} ${styles.passwordGroup}`} data-fid={FID.login.passwordGroup}>
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
                  data-fid={FID.login.passwordInput}
                />
              </div>

              <button className={styles.loginButton} type="submit" data-fid={FID.login.loginButton}>
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
    </div>
  );
}
