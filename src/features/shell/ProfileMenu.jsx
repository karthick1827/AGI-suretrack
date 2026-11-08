// Profile menu (FR-54, AD-14): Figma panel 6026:52937 (290×768) with only the
// `My Profile` title and the `Logout` row. The omitted user block and the
// four other entries leave their space empty, so Logout keeps its Figma
// position (x 26, y 379 inside the panel).
//
// Opened by AvatarButton through useOverlay() as kind `menu` (no focus trap).
// Esc and a route change are handled by the overlay owner; a click outside
// the panel (and outside the avatar, which toggles it) closes it here. It
// listens for the click, not the press, so the press's own focus change is
// over and focus can return to the avatar.
// Focus moves to Logout on open and returns to the avatar on close.
//
// Logout calls session.signOut(); the app's SessionSync then shows /login in
// every tab, with no return path and no banner (FR-35).
import { useEffect, useId, useRef } from 'react';
import { copy } from '../../lib/copy.js';
import { FID } from '../../lib/fid.js';
import { signOut } from '../../lib/session.js';
import { useOverlayActions } from '../../ui/overlay/useOverlay.js';
import logoutSvg from '../../assets/icons/logout.svg';
import styles from './ProfileMenu.module.css';

export const PROFILE_MENU_ID = 'profile-menu';

export default function ProfileMenu({ triggerRef }) {
  const { close } = useOverlayActions();
  const panelRef = useRef(null);
  const logoutRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    logoutRef.current?.focus();
  }, []);

  useEffect(() => {
    const onOutsideClick = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef?.current?.contains(target)) return; // the avatar toggles the menu itself
      close(PROFILE_MENU_ID);
    };
    document.addEventListener('click', onOutsideClick, true);
    return () => document.removeEventListener('click', onOutsideClick, true);
  }, [close, triggerRef]);

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      role="dialog"
      aria-labelledby={titleId}
      data-fid={FID.frames.profileMenu}
    >
      <div className={styles.titleRow} data-fid={FID.profileMenu.titleRow}>
        <h2 id={titleId} className={styles.title} data-fid={FID.profileMenu.title}>
          {copy.shell.profileMenuTitle}
        </h2>
      </div>
      <div className={styles.menu}>
        <button
          ref={logoutRef}
          type="button"
          className={styles.logout}
          onClick={() => signOut()}
          data-fid={FID.profileMenu.logout}
        >
          <img
            className={styles.logoutIcon}
            src={logoutSvg}
            alt=""
            width="24"
            height="24"
            data-fid={FID.profileMenu.logoutIcon}
          />
          <span className={styles.logoutLabel} data-fid={FID.profileMenu.logoutLabel}>
            {copy.shell.logout}
          </span>
        </button>
      </div>
    </div>
  );
}
