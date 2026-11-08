// The single overlay owner (AD-12), mounted once in src/app/App.jsx.
//
// - One overlay at a time: `open()` replaces whatever is open.
// - Each overlay renders through a portal into #overlay-root (index.html; the
//   body if it is missing) on a `position: fixed` full-viewport layer (AD-4
//   overlay exception) and is unmounted on close, so it starts fresh every
//   time it opens. Its content is a live component (`component` + `props`).
// - Esc closes the open overlay (not during IME composition, not when a
//   control inside already handled it). Focus returns to the trigger.
// - `routeKey` (the pathname, passed by app/): when it changes the open
//   overlay closes, so an overlay never outlives its page. The provider stays
//   router-agnostic (ui/ never imports the router).
// - `modal` kind: backdrop (a click on it closes the modal); focus trap (Tab /
//   Shift+Tab wrap inside the layer; stray focus returns to the last control
//   focused inside); every other body child — including ones added later — is
//   `inert`; the page does not scroll (html overflow hidden, wheel/touchmove
//   cancelled unless they target a scrollable region inside the modal).
// - `menu` and `panel` kinds: no trap, no backdrop; their own stories add
//   their click-outside rules.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { insideScrollable, tabbables } from './focus.js';
import { OVERLAY_KINDS, OverlayActionsContext, OverlayStateContext } from './useOverlay.js';
import styles from './OverlayProvider.module.css';

function portalTarget() {
  return document.getElementById('overlay-root') ?? document.body;
}

/**
 * Make every body child that does not hold `layer` inert — and any added while
 * the modal is open. Returns the undo function (only what it changed is undone).
 */
function makeBackgroundInert(layer) {
  const changed = new Set();
  const apply = (el) => {
    if (!(el instanceof Element) || el === layer || el.contains(layer) || el.hasAttribute('inert')) return;
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') return;
    el.setAttribute('inert', '');
    changed.add(el);
  };
  for (const el of document.body.children) apply(el);
  const observer = new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) apply(node);
  });
  observer.observe(document.body, { childList: true });
  return () => {
    observer.disconnect();
    for (const el of changed) el.removeAttribute('inert');
  };
}

/** Lock page scroll behind a modal; returns the undo function. */
function lockScroll(layer) {
  const html = document.documentElement;
  const previous = html.style.overflow;
  html.style.overflow = 'hidden';
  const stop = (event) => {
    if (event.cancelable && !insideScrollable(event.target, layer)) event.preventDefault();
  };
  layer.addEventListener('wheel', stop, { passive: false });
  layer.addEventListener('touchmove', stop, { passive: false });
  return () => {
    layer.removeEventListener('wheel', stop);
    layer.removeEventListener('touchmove', stop);
    html.style.overflow = previous;
  };
}

function initialFocus(layer) {
  return layer.querySelector('[data-overlay-autofocus]') ?? tabbables(layer)[0] ?? layer;
}

export default function OverlayProvider({ children, routeKey }) {
  const [overlay, setOverlay] = useState(null);
  const layerRef = useRef(null);
  const sequence = useRef(0);
  const triggerRef = useRef(null);
  const pendingFocus = useRef(null);
  const openId = useRef(null);
  const lastFocused = useRef(null);

  const open = useCallback(({ id, kind = OVERLAY_KINDS.modal, component, props, trigger }) => {
    if (!Object.values(OVERLAY_KINDS).includes(kind)) throw new Error(`useOverlay: unknown kind "${kind}"`);
    if (typeof component !== 'function' && typeof component !== 'object') {
      throw new Error('useOverlay: open() needs a component');
    }
    if (trigger) {
      triggerRef.current = trigger;
    } else if (openId.current === null) {
      const active = document.activeElement;
      triggerRef.current = active && active !== document.body ? active : null;
    } // else: a replacement keeps the original trigger
    pendingFocus.current = null;
    lastFocused.current = null;
    sequence.current += 1;
    openId.current = id;
    setOverlay({ key: sequence.current, id, kind, component, props: props ?? {} });
  }, []);

  const update = useCallback((id, props) => {
    if (openId.current !== id) return;
    setOverlay((current) => (current?.id === id ? { ...current, props: { ...current.props, ...props } } : current));
  }, []);

  const close = useCallback((id) => {
    if (openId.current === null) return; // nothing open: a no-op
    if (id !== undefined && id !== openId.current) return; // another overlay is open
    openId.current = null;
    pendingFocus.current = triggerRef.current;
    triggerRef.current = null;
    setOverlay(null);
  }, []);

  // Leaving the page (routeKey changes) closes the open overlay; its trigger
  // belongs to the old page, so focus is not returned.
  const lastRouteKey = useRef(routeKey);
  useEffect(() => {
    if (lastRouteKey.current === routeKey) return;
    lastRouteKey.current = routeKey;
    if (openId.current === null) return;
    close();
    pendingFocus.current = null;
  }, [routeKey, close]);

  // Modal: inert background, no scroll behind, initial focus inside. Keyed on
  // the overlay instance, so a props update() does not re-run it.
  const overlayKey = overlay?.key ?? null;
  const overlayKind = overlay?.kind ?? null;
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (overlayKey === null || !layer || overlayKind !== OVERLAY_KINDS.modal) return undefined;
    const undoInert = makeBackgroundInert(layer);
    const unlockScroll = lockScroll(layer);
    initialFocus(layer).focus();
    return () => {
      unlockScroll();
      undoInert();
    };
  }, [overlayKey, overlayKind]);

  // Focus return after close (runs after the cleanup above lifted `inert`).
  useLayoutEffect(() => {
    if (overlay) return;
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target?.isConnected) target.focus();
  }, [overlay]);

  // Esc closes; a modal remembers focus inside and pulls stray focus back.
  const isModal = overlay?.kind === OVERLAY_KINDS.modal;
  const isShown = overlay !== null;
  useEffect(() => {
    if (!isShown) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) return;
      event.preventDefault();
      close();
    };
    const onFocusIn = (event) => {
      const layer = layerRef.current;
      if (!isModal || !layer) return;
      if (layer.contains(event.target)) {
        if (event.target !== layer) lastFocused.current = event.target;
        return;
      }
      const back = lastFocused.current;
      (back?.isConnected && layer.contains(back) ? back : initialFocus(layer)).focus();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [isShown, isModal, close]);

  const trapTab = (event) => {
    if (event.key !== 'Tab' || !isModal) return;
    const list = tabbables(layerRef.current);
    if (list.length === 0) {
      event.preventDefault();
      return;
    }
    const index = list.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      list.at(-1).focus();
    } else if (!event.shiftKey && (index === -1 || index === list.length - 1)) {
      event.preventDefault();
      list[0].focus();
    }
  };

  const actions = useMemo(() => ({ open, update, close }), [open, update, close]);
  const currentId = overlay?.id ?? null;
  const currentKind = overlay?.kind ?? null;
  const state = useMemo(
    () => (currentId === null ? null : { id: currentId, kind: currentKind }),
    [currentId, currentKind],
  );

  let layer = null;
  if (overlay) {
    const kindClass = {
      [OVERLAY_KINDS.modal]: styles.modalLayer,
      [OVERLAY_KINDS.menu]: styles.menuLayer,
      [OVERLAY_KINDS.panel]: styles.panelLayer,
    }[overlay.kind];
    const Content = overlay.component;
    const content = <Content {...overlay.props} />;
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
        {isModal && <div className={styles.backdrop} aria-hidden="true" data-overlay-backdrop="" onClick={() => close()} />}
        {isModal ? content : <div className={styles.passiveContent}>{content}</div>}
      </div>,
      portalTarget(),
    );
  }

  return (
    <OverlayActionsContext.Provider value={actions}>
      <OverlayStateContext.Provider value={state}>
        {children}
        {layer}
      </OverlayStateContext.Provider>
    </OverlayActionsContext.Provider>
  );
}
