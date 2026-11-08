// Avatar (FR-54): a 48×48 holder, content at its right edge, holding a 32 px
// round button with the avatar photo over the #1C447E fallback disc. It opens
// and closes the profile menu through the overlay owner (AD-12, kind `menu`).
import { useRef } from 'react';
import { copy } from '../../lib/copy.js';
import { FID } from '../../lib/fid.js';
import { OVERLAY_KINDS, useOverlay } from '../../ui/overlay/useOverlay.js';
import ProfileMenu, { PROFILE_MENU_ID } from './ProfileMenu.jsx';
import avatarPng from '../../assets/avatar.png';
import styles from './AvatarButton.module.css';

export default function AvatarButton() {
  const { open, close, current } = useOverlay();
  const buttonRef = useRef(null);
  const expanded = current?.id === PROFILE_MENU_ID;

  const toggle = () => {
    if (expanded) {
      close(PROFILE_MENU_ID);
      return;
    }
    open({
      id: PROFILE_MENU_ID,
      kind: OVERLAY_KINDS.menu,
      component: ProfileMenu,
      props: { triggerRef: buttonRef },
      trigger: buttonRef.current,
    });
  };

  return (
    <div className={styles.holder} data-fid={FID.shell.avatarHolder}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-label={copy.shell.avatarLabel}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        onClick={toggle}
        data-fid={FID.shell.avatarButton}
      >
        <img className={styles.photo} src={avatarPng} alt="" width="32" height="32" data-fid={FID.shell.avatar} />
      </button>
    </div>
  );
}
