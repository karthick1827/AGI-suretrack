// Focus and scroll helpers for the overlay owner (AD-12): the modal focus trap
// (FR-49) and the modal scroll lock.

const TABBABLE = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ');

/**
 * Rendered (has a box) and not `visibility: hidden`. The box check needs a
 * document with layout (the root element has a box); without one (jsdom) it
 * is skipped rather than treating every element as hidden.
 */
function isVisible(el) {
  const doc = el.ownerDocument;
  if (doc.defaultView?.getComputedStyle(el).visibility === 'hidden') return false;
  const hasLayout = doc.documentElement.getClientRects().length > 0;
  return !hasLayout || el.getClientRects().length > 0;
}

/** In the tab order: an explicit tabindex decides; otherwise the element is natively focusable. */
function inTabOrder(el) {
  return el.hasAttribute('tabindex') ? el.tabIndex >= 0 : true;
}

/** Keyboard-reachable elements inside `root`, in document order. */
export function tabbables(root) {
  return [...root.querySelectorAll(TABBABLE)].filter(
    (el) => !el.disabled && inTabOrder(el) && !el.closest('[hidden], [inert]') && isVisible(el),
  );
}

/** True when `el` (or an ancestor up to, not including, `boundary`) can scroll. */
export function insideScrollable(el, boundary) {
  for (let node = el; node && node !== boundary; node = node.parentElement) {
    if (!(node instanceof Element)) continue;
    const { overflowY, overflowX } = getComputedStyle(node);
    const canY = /auto|scroll/.test(overflowY) && node.scrollHeight > node.clientHeight;
    const canX = /auto|scroll/.test(overflowX) && node.scrollWidth > node.clientWidth;
    if (canY || canX) return true;
  }
  return false;
}
