// The overlay hooks (AD-12). `OverlayProvider` (mounted once in src/app/) is
// the only holder of open/close state; every overlay — the Forgot Password
// modal, the profile menu and the Notifications panel — opens through here.
//
// Two contexts: the actions (stable for the provider's lifetime) and the state
// (which overlay is open). A component that only opens or closes overlays
// reads the actions and never re-renders when an overlay opens or closes.
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

export const OverlayActionsContext = createContext(null);
export const OverlayStateContext = createContext(undefined);

/**
 * Stable actions:
 * - `open({ id, kind, component, props?, trigger? })` shows one overlay,
 *   replacing any open one (one at a time). The provider renders
 *   `<component {...props} />`, a live component (its own state, hooks and
 *   contexts update as usual). `trigger` (default: the focused element) gets
 *   focus back on close; a replacement without a trigger keeps the trigger
 *   of the overlay it replaces.
 * - `update(id, props)` merges new props into the open overlay `id`.
 * - `close(id?)` unmounts the open overlay (its state is discarded) and
 *   returns focus to its trigger. With an `id`, it only closes that overlay.
 */
export function useOverlayActions() {
  const value = useContext(OverlayActionsContext);
  if (!value) throw new Error('useOverlay() must be used inside <OverlayProvider>.');
  return value;
}

/** `{ id, kind }` of the open overlay, or null. Re-renders on every open/close. */
export function useOverlayState() {
  const value = useContext(OverlayStateContext);
  if (value === undefined) throw new Error('useOverlay() must be used inside <OverlayProvider>.');
  return value;
}

/** Actions plus `current` (the open overlay's `{ id, kind }`, or null). */
export function useOverlay() {
  return { ...useOverlayActions(), current: useOverlayState() };
}
