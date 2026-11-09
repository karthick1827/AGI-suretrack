// Profile menu (FR-54, AD-14): Figma panel 6026:52937 (290×768) with only the
// `My Profile` title and the `Logout` row. The omitted user block and the
// four other entries leave their space empty, so Logout keeps its Figma
// position (x 26, y 379 inside the panel).
//
// Opened by AvatarButton through useOverlay() as kind `menu` (no focus trap).
// Focus moves to Logout on open. It closes on:
//   - Esc and a route change (the overlay owner): focus returns to the avatar;
//   - focus leaving panel + avatar (focusout whose relatedTarget is outside
//     both): focus stays where the user moved it;
//   - a press outside panel + avatar. The pointerdown target decides: on a
//     focusable control (bell, nav tab, …) the menu closes and that control
//     keeps focus; elsewhere it closes when the press ends (pointerup) and
//     focus returns to the avatar. A press inside that is released outside
//     never closes it. The avatar itself toggles the menu.
//
// Logout calls session.signOut() once (a second activation is ignored); the
// app's SessionSync then shows /login in every tab, with no return path and
// no banner (FR-35).
import { useEffect, useRef } from 'react';
import { copy } from '../../lib/copy.js';
import { FID } from '../../lib/fid.js';
import { signOut } from '../../lib/session.js';
import { useOverlayActions } from '../../ui/overlay/useOverlay.js';
import logoutSvg from '../../assets/icons/logout.svg';
import styles from './ProfileMenu.module.css';

export const PROFILE_MENU_ID = 'profile-menu';

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"]), [contenteditable]';

export default function ProfileMenu({ panelId, triggerRef, onOpenChange }) {
  const { close } = useOverlayActions();
  const panelRef = useRef(null);
  const logoutRef = useRef(null);
  const loggingOut = useRef(false);
  const titleId = `${panelId}-title`;

  useEffect(() => {
    onOpenChange?.(true);
    logoutRef.current?.focus();
    return () => onOpenChange?.(false);
  }, [onOpenChange]);

  useEffect(() => {
    const inside = (node) =>
      node instanceof Node && (panelRef.current?.contains(node) || triggerRef?.current?.contains(node));
    const press = { outside: false };

    const onPointerDown = (event) => {
      press.outside = !inside(event.target);
      if (!press.outside) return;
      const control = event.target instanceof Element ? event.target.closest(FOCUSABLE) : null;
      if (control) {
        press.outside = false;
        close(PROFILE_MENU_ID, { restoreFocus: false });
      }
    };
    const onPointerUp = () => {
      if (!press.outside) return;
      press.outside = false;
      close(PROFILE_MENU_ID);
    };
    const onFocusOut = (event) => {
      if (event.relatedTarget && !inside(event.relatedTarget)) close(PROFILE_MENU_ID, { restoreFocus: false });
    };

    const panel = panelRef.current;
    const trigger = triggerRef?.current;
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp, true);
    panel?.addEventListener('focusout', onFocusOut);
    trigger?.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      panel?.removeEventListener('focusout', onFocusOut);
      trigger?.removeEventListener('focusout', onFocusOut);
    };
  }, [close, triggerRef]);

  const logout = () => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    signOut();
  };

  return (
    <div
      ref={panelRef}
      id={panelId}
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
          onClick={logout}
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
