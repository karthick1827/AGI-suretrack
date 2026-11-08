// Login page (FR-12–FR-15): Figma frame 6026:60111, a fixed 1366×768 canvas.
//
// Layer stack, bottom to top (addendum Part A §2): the mirrored silo photo
// `…0b 1` (6026:60116), the same photo `…0b 3` (6026:60117) clipped at x = 513,
// the right overlay whose only visible part is the 9×13 triangle (6026:60119),
// then the panel group (6026:60121): the green angled panel and the form column.
// Every position and size lives in LoginPage.module.css, copied from the PRD
// (img width/height attributes are rounded integers; CSS holds the exact px).
//
// Story 1.5: the page composes the auth and forgot-password features (features
// never import each other): both Forgot triggers in LoginForm open the
// Forgot Password modal through the single overlay owner (AD-12), which also
// closes it when the page changes (e.g. a sign-in in another tab).
import LoginForm from '../../features/auth/LoginForm.jsx';
import ForgotPasswordModal from '../../features/forgot-password/ForgotPasswordModal.jsx';
import { FID } from '../../lib/fid.js';
import { OVERLAY_KINDS, useOverlayActions } from '../../ui/overlay/useOverlay.js';
import loginBgWebp from '../../assets/login-bg.webp';
import loginBgJpg from '../../assets/login-bg.jpg';
import panelSvg from '../../assets/icons/f4626.svg';
import triangleSvg from '../../assets/icons/321e0.svg';
import styles from './LoginPage.module.css';

function SiloPhoto({ className, fid }) {
  return (
    <picture>
      <source type="image/webp" srcSet={loginBgWebp} />
      <img className={className} src={loginBgJpg} alt="" data-fid={fid} />
    </picture>
  );
}

const FORGOT_PASSWORD = 'forgot-password';

export default function LoginPage() {
  const { open, close } = useOverlayActions();

  const openForgotPassword = (trigger) =>
    open({
      id: FORGOT_PASSWORD,
      kind: OVERLAY_KINDS.modal,
      trigger,
      component: ForgotPasswordModal,
      props: { onClose: () => close(FORGOT_PASSWORD) },
    });

  return (
    <main className={styles.frame} data-fid={FID.frames.login}>
      <SiloPhoto className={styles.photoRight} fid={FID.login.photoRight} />
      <div className={styles.photoLeftClip}>
        <SiloPhoto className={styles.photoLeft} fid={FID.login.photoLeft} />
      </div>
      <img
        className={styles.rightOverlay}
        src={triangleSvg}
        width={1824}
        height={823}
        alt=""
        data-fid={FID.login.rightOverlay}
      />
      <div className={styles.panelGroup} data-fid={FID.login.panelGroup}>
        <img
          className={styles.greenPanel}
          src={panelSvg}
          width={692}
          height={768}
          alt=""
          data-fid={FID.login.greenPanel}
        />
        <LoginForm onForgotPassword={openForgotPassword} />
      </div>
    </main>
  );
}
