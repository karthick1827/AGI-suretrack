// Focus helpers for the overlay owner (AD-12): the modal focus trap (FR-49).

const TABBABLE = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[tabindex]',
].join(', ');

/** Keyboard-reachable elements inside `root`, in document order. */
export function tabbables(root) {
  return [...root.querySelectorAll(TABBABLE)].filter(
    (el) => !el.disabled && el.tabIndex >= 0 && !el.closest('[hidden], [inert]'),
  );
}
