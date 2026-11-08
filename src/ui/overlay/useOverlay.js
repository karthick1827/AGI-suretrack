// The overlay hook (AD-12). `OverlayProvider` (mounted once in src/app/) is the
// only holder of open/close state; every overlay — the Forgot Password modal,
// the profile menu and the Notifications panel — opens through this hook.
import { createContext, useContext } from 'react';

/** The three overlay kinds (AD-12). */
export const OVERLAY_KINDS = Object.freeze({
  /** Focus trap, backdrop, closes on Esc and on a backdrop click (Forgot Password). */
  modal: 'modal',
  /** No trap; closes on Esc (profile menu). */
  menu: 'menu',
  /** No trap, no scrim; closes on Esc, not on a click outside (Notifications). */
  panel: 'panel',
});

export const OverlayContext = createContext(null);

/**
 * `{ open, close, current }`:
 * - `open({ id, kind, content, trigger? })` shows one overlay, replacing any
 *   open one (one at a time). `content` is the React element to render (it
 *   closes itself through `close` from this hook). `trigger` (default: the
 *   focused element) gets focus back on close.
 * - `close()` unmounts the open overlay (its state is discarded) and returns
 *   focus to its trigger.
 * - `current`: `{ id, kind }` of the open overlay, or null.
 */
export function useOverlay() {
  const value = useContext(OverlayContext);
  if (!value) throw new Error('useOverlay() must be used inside <OverlayProvider>.');
  return value;
}
