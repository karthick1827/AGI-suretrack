// The single overlay owner (AD-12), mounted once in src/app/App.jsx.
//
// - One overlay at a time: `open()` replaces whatever is open.
// - Each overlay renders through a portal into #overlay-root (index.html) on a
//   `position: fixed` full-viewport layer (AD-4 overlay exception) and is
//   unmounted on close, so it starts fresh every time it opens.
// - Esc closes the open overlay. Focus returns to the trigger on close.
// - `modal` kind: backdrop (a click on it closes the modal), focus trap
//   (Tab / Shift+Tab wrap inside the layer, focus can never land behind it),
//   the rest of the page is `inert` and does not scroll while it is open.
// - `menu` and `panel` kinds: no trap, no backdrop; their own stories add
//   their click-outside rules.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { tabbables } from './focus.js';
import { OVERLAY_KINDS, OverlayContext } from './useOverlay.js';
import styles from './OverlayProvider.module.css';

function portalTarget() {
  return document.getElementById('overlay-root') ?? document.body;
}

/** Make every body child except the overlay root inert; returns the undo function. */
function makeBackgroundInert(target) {
  const changed = [];
  for (const el of document.body.children) {
    if (el === target || el.contains(target) || el.hasAttribute('inert')) continue;
    el.setAttribute('inert', '');
    changed.push(el);
  }
  return () => {
    for (const el of changed) el.removeAttribute('inert');
  };
}

export default function OverlayProvider({ children }) {
  const [overlay, setOverlay] = useState(null);
  const layerRef = useRef(null);
  const sequence = useRef(0);
  const triggerRef = useRef(null);
  const pendingFocus = useRef(null);
  const isOpen = useRef(false);

  const open = useCallback(({ id, kind = OVERLAY_KINDS.modal, content, trigger }) => {
    if (!Object.values(OVERLAY_KINDS).includes(kind)) throw new Error(`useOverlay: unknown kind "${kind}"`);
    const active = document.activeElement;
    triggerRef.current = trigger ?? (active && active !== document.body ? active : null);
    pendingFocus.current = null;
    sequence.current += 1;
    isOpen.current = true;
    setOverlay({ key: sequence.current, id, kind, content });
  }, []);

  const close = useCallback(() => {
    if (!isOpen.current) return; // nothing open: a no-op
    isOpen.current = false;
    pendingFocus.current = triggerRef.current;
    triggerRef.current = null;
    setOverlay(null);
  }, []);

  // Modal: inert background, no scroll behind, initial focus inside.
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!overlay || !layer) return undefined;
    const isModal = overlay.kind === OVERLAY_KINDS.modal;
    const undoInert = isModal ? makeBackgroundInert(portalTarget()) : () => {};
    const stopScroll = (event) => event.preventDefault();
    if (isModal) {
      layer.addEventListener('wheel', stopScroll, { passive: false });
      layer.addEventListener('touchmove', stopScroll, { passive: false });
    }
    if (isModal) {
      const first = layer.querySelector('[data-overlay-autofocus]') ?? tabbables(layer)[0];
      (first ?? layer).focus();
    }
    return () => {
      layer.removeEventListener('wheel', stopScroll);
      layer.removeEventListener('touchmove', stopScroll);
      undoInert();
    };
  }, [overlay]);

  // Focus return after close (runs after the cleanup above lifted `inert`).
  useLayoutEffect(() => {
    if (overlay) return;
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target?.isConnected) target.focus();
  }, [overlay]);

  // Esc closes; a modal also pulls stray focus back inside.
  useEffect(() => {
    if (!overlay) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        close();
      }
    };
    const onFocusIn = (event) => {
      const layer = layerRef.current;
      if (overlay.kind !== OVERLAY_KINDS.modal || !layer || layer.contains(event.target)) return;
      (tabbables(layer)[0] ?? layer).focus();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [overlay, close]);

  const trapTab = (event) => {
    if (event.key !== 'Tab' || overlay?.kind !== OVERLAY_KINDS.modal) return;
    const list = tabbables(layerRef.current);
    if (list.length === 0) {
      event.preventDefault();
      return;
    }
    const first = list[0];
    const last = list.at(-1);
    const index = list.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (index === -1 || index === list.length - 1)) {
      event.preventDefault();
      first.focus();
    }
  };

  const value = useMemo(
    () => ({ open, close, current: overlay ? { id: overlay.id, kind: overlay.kind } : null }),
    [open, close, overlay],
  );

  let layer = null;
  if (overlay) {
    const isModal = overlay.kind === OVERLAY_KINDS.modal;
    const kindClass = {
      [OVERLAY_KINDS.modal]: styles.modalLayer,
      [OVERLAY_KINDS.menu]: styles.menuLayer,
      [OVERLAY_KINDS.panel]: styles.panelLayer,
    }[overlay.kind];
    layer = createPortal(
      <div
        key={overlay.key}
        ref={layerRef}
        className={`${styles.layer} ${kindClass}`}
        data-overlay={overlay.id}
        data-overlay-kind={overlay.kind}
        tabIndex={-1}
        onKeyDown={trapTab}
      >
        {isModal && <div className={styles.backdrop} aria-hidden="true" data-overlay-backdrop="" onClick={close} />}
        {isModal ? overlay.content : <div className={styles.passiveContent}>{overlay.content}</div>}
      </div>,
      portalTarget(),
    );
  }

  return (
    <OverlayContext.Provider value={value}>
      {children}
      {layer}
    </OverlayContext.Provider>
  );
}
