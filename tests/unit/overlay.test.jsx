// Story 1.5 — the single overlay owner (AD-12): portal into #overlay-root,
// modal/menu/panel kinds, one overlay at a time, Esc, backdrop click, focus
// trap and return, inert background, scroll lock, unmount on close.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { useEffect } from 'react';
import OverlayProvider from '../../src/ui/overlay/OverlayProvider.jsx';
import { tabbables } from '../../src/ui/overlay/focus.js';
import { OVERLAY_KINDS, useOverlay, useOverlayActions } from '../../src/ui/overlay/useOverlay.js';
import { fromRoot } from './support/project.js';

let overlayRoot;
let consoleSpies;

beforeEach(() => {
  overlayRoot = document.createElement('div');
  overlayRoot.id = 'overlay-root';
  document.body.append(overlayRoot);
  consoleSpies = ['error', 'warn', 'log'].map((level) => vi.spyOn(console, level));
});

afterEach(() => {
  try {
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  } finally {
    cleanup();
    overlayRoot.remove();
    document.documentElement.style.overflow = '';
    vi.restoreAllMocks();
  }
});

function Dialog({ name, onNext, label }) {
  const { close } = useOverlayActions();
  return (
    <div role="dialog" aria-label={name}>
      <button type="button">{`${name} first`}</button>
      <input aria-label={`${name} input`} data-overlay-autofocus="" />
      {label && <p data-testid="live-label">{label}</p>}
      <div data-testid="scroller" style={{ overflowY: 'auto' }}>
        <button type="button" style={{ visibility: 'hidden' }}>{`${name} invisible`}</button>
      </div>
      {onNext && (
        <button type="button" onClick={onNext}>
          {`${name} next`}
        </button>
      )}
      <button type="button" onClick={() => close()}>
        {`${name} last`}
      </button>
    </div>
  );
}

function Harness() {
  const { open, update, close, current } = useOverlay();
  const openB = () => open({ id: 'b', kind: OVERLAY_KINDS.modal, component: Dialog, props: { name: 'B' } });
  return (
    <main>
      <p data-testid="current">{current ? `${current.id}:${current.kind}` : 'none'}</p>
      <button
        type="button"
        onClick={(event) =>
          open({
            id: 'a',
            kind: OVERLAY_KINDS.modal,
            trigger: event.currentTarget,
            component: Dialog,
            props: { name: 'A', onNext: openB },
          })
        }
      >
        open modal
      </button>
      <button type="button" onClick={() => open({ id: 'm', kind: OVERLAY_KINDS.menu, component: Dialog, props: { name: 'M' } })}>
        open menu
      </button>
      <button type="button" onClick={() => open({ id: 'p', kind: OVERLAY_KINDS.panel, component: Dialog, props: { name: 'P' } })}>
        open panel
      </button>
      <button type="button" onClick={() => update('a', { label: 'updated' })}>
        update a
      </button>
      <button type="button" onClick={() => close('zzz')}>
        close other
      </button>
    </main>
  );
}

function setup({ routeKey } = {}) {
  const view = render(
    <OverlayProvider routeKey={routeKey}>
      <Harness />
    </OverlayProvider>,
  );
  return { view, trigger: screen.getByRole('button', { name: 'open modal' }) };
}

const layer = () => document.querySelector('[data-overlay]');
const backdrop = () => document.querySelector('[data-overlay-backdrop]');

describe('OverlayProvider (AD-12)', () => {
  it('renders nothing at rest', () => {
    setup();
    expect(overlayRoot.childElementCount).toBe(0);
    expect(screen.getByTestId('current').textContent).toBe('none');
  });

  it('modal: portals into #overlay-root with a backdrop, focuses [data-overlay-autofocus], makes the page inert', () => {
    const { trigger } = setup();
    trigger.focus();
    fireEvent.click(trigger);
    expect(layer().getAttribute('data-overlay-kind')).toBe('modal');
    expect(overlayRoot.contains(screen.getByRole('dialog', { name: 'A' }))).toBe(true);
    expect(backdrop()).not.toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText('A input'));
    expect(screen.getByTestId('current').textContent).toBe('a:modal');
    expect(trigger.closest('body > div').hasAttribute('inert')).toBe(true);
    expect(overlayRoot.hasAttribute('inert')).toBe(false);
  });

  it('without #overlay-root it portals into the body and never makes the overlay itself inert', () => {
    overlayRoot.remove();
    const { trigger } = setup();
    fireEvent.click(trigger);
    expect(layer().parentElement).toBe(document.body);
    for (let node = layer(); node; node = node.parentElement) expect(node.hasAttribute('inert')).toBe(false);
    expect(trigger.closest('body > div').hasAttribute('inert')).toBe(true);
    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(layer()).toBeNull();
    expect(trigger.closest('body > div').hasAttribute('inert')).toBe(false);
    document.body.append(overlayRoot); // for afterEach
  });

  it('body children added while a modal is open become inert, and are restored on close', async () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    const late = document.createElement('div');
    await act(async () => {
      document.body.append(late);
      await Promise.resolve();
    });
    expect(late.hasAttribute('inert')).toBe(true);
    fireEvent.click(backdrop());
    expect(late.hasAttribute('inert')).toBe(false);
    late.remove();
  });

  it('Esc closes, unmounts, lifts inert and returns focus to the trigger', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.change(screen.getByLabelText('A input'), { target: { value: 'typed' } });
    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(layer()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.closest('body > div').hasAttribute('inert')).toBe(false);
    fireEvent.click(trigger);
    expect(screen.getByLabelText('A input').value).toBe('');
  });

  it('Esc is ignored during IME composition and when a control already handled it', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(document.activeElement, { key: 'Escape', isComposing: true });
    expect(layer()).not.toBeNull();
    const handled = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    handled.preventDefault();
    document.activeElement.dispatchEvent(handled);
    expect(layer()).not.toBeNull();
  });

  it('a backdrop click closes the modal; a click inside it does not', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('dialog', { name: 'A' }));
    fireEvent.click(screen.getByRole('button', { name: 'A first' }));
    expect(layer()).not.toBeNull();
    fireEvent.click(backdrop());
    expect(layer()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('close() from inside closes it and returns focus; close(id) of another overlay is a no-op', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    act(() => screen.getByRole('button', { name: 'close other' }).click());
    expect(layer()).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'A last' }));
    expect(layer()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('content stays live: update(id, props) reaches the open component', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    expect(screen.queryByTestId('live-label')).toBeNull();
    act(() => screen.getByRole('button', { name: 'update a' }).click());
    expect(screen.getByTestId('live-label').textContent).toBe('updated');
    expect(document.activeElement).toBe(screen.getByLabelText('A input')); // not re-initialised
  });

  it('focus trap: Tab on the last control wraps to the first, Shift+Tab on the first wraps to the last', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    const list = tabbables(layer());
    // The visibility:hidden button is not reachable.
    expect(list.map((el) => el.getAttribute('aria-label') ?? el.textContent)).toEqual([
      'A first',
      'A input',
      'A next',
      'A last',
    ]);
    list.at(-1).focus();
    fireEvent.keyDown(list.at(-1), { key: 'Tab' });
    expect(document.activeElement).toBe(list[0]);
    fireEvent.keyDown(list[0], { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(list.at(-1));
  });

  it('tabbables(): summary, contenteditable and media controls count; hidden ones do not', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <details><summary>more</summary></details>
      <div contenteditable="true">edit</div>
      <div contenteditable="false">no</div>
      <audio controls></audio><video controls></video><video></video>
      <button style="visibility:hidden">hidden</button>
      <span hidden><button>gone</button></span>`;
    document.body.append(root);
    expect(tabbables(root).map((el) => el.tagName)).toEqual(['SUMMARY', 'DIV', 'AUDIO', 'VIDEO']);
    root.remove();
  });

  it('stray focus returns to the last control focused inside, else the autofocus field', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    act(() => trigger.focus());
    expect(document.activeElement).toBe(screen.getByLabelText('A input'));
    act(() => screen.getByRole('button', { name: 'A next' }).focus());
    act(() => trigger.focus());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'A next' }));
  });

  it('one overlay at a time: opening another replaces the open one', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'A next' }));
    expect(screen.queryByRole('dialog', { name: 'A' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'B' })).not.toBeNull();
    expect(overlayRoot.querySelectorAll('[data-overlay]')).toHaveLength(1);
    expect(screen.getByTestId('current').textContent).toBe('b:modal');
  });

  it('a replacement without a trigger keeps the original trigger: closing B refocuses T', () => {
    const { trigger } = setup();
    trigger.focus();
    fireEvent.click(trigger);
    const next = screen.getByRole('button', { name: 'A next' });
    next.focus();
    fireEvent.click(next);
    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(layer()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('scroll lock: html overflow hidden, wheel/touchmove cancelled outside scrollable regions; all restored on close', () => {
    document.documentElement.style.overflow = 'clip';
    const { trigger } = setup();
    fireEvent.click(trigger);
    expect(document.documentElement.style.overflow).toBe('hidden');
    for (const type of ['wheel', 'touchmove']) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      screen.getByRole('button', { name: 'A first' }).dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
    // A scrollable region inside the modal keeps its own scrolling.
    const scroller = screen.getByTestId('scroller');
    Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 500 });
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 100 });
    const inside = new Event('wheel', { bubbles: true, cancelable: true });
    scroller.dispatchEvent(inside);
    expect(inside.defaultPrevented).toBe(false);

    const oldLayer = layer();
    fireEvent.click(backdrop());
    expect(document.documentElement.style.overflow).toBe('clip');
    const after = new Event('wheel', { bubbles: true, cancelable: true });
    oldLayer.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });

  it('routeKey change (a page change) closes the open overlay', () => {
    const { view, trigger } = setup({ routeKey: '/login' });
    fireEvent.click(trigger);
    view.rerender(
      <OverlayProvider routeKey="/dashboard">
        <Harness />
      </OverlayProvider>,
    );
    expect(layer()).toBeNull();
    expect(trigger.closest('body > div').hasAttribute('inert')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it.each([
    ['menu', 'open menu', 'M'],
    ['panel', 'open panel', 'P'],
  ])('%s kind: no backdrop, no trap, page not inert; Esc closes it', (kind, button, name) => {
    setup();
    const opener = screen.getByRole('button', { name: button });
    opener.focus();
    fireEvent.click(opener);
    expect(layer().getAttribute('data-overlay-kind')).toBe(kind);
    expect(backdrop()).toBeNull();
    expect(opener.closest('body > div').hasAttribute('inert')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name })).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('action-only consumers do not re-render when an overlay opens or closes', () => {
    const renders = vi.fn();
    function ActionsOnly() {
      const { open } = useOverlayActions();
      renders();
      return (
        <button type="button" onClick={() => open({ id: 'x', component: Dialog, props: { name: 'X' } })}>
          open x
        </button>
      );
    }
    render(
      <OverlayProvider>
        <ActionsOnly />
      </OverlayProvider>,
    );
    const before = renders.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'open x' }));
    fireEvent.click(backdrop());
    expect(renders.mock.calls.length).toBe(before);
  });

  it('close() with nothing open is a no-op; an unknown kind or a missing component throws', () => {
    const onReady = vi.fn();
    function Grab() {
      const actions = useOverlayActions();
      useEffect(() => onReady(actions));
      return null;
    }
    render(
      <OverlayProvider>
        <Grab />
      </OverlayProvider>,
    );
    const api = onReady.mock.calls.at(-1)[0];
    expect(() => act(() => api.close())).not.toThrow();
    expect(() => api.open({ id: 'x', kind: 'drawer', component: Dialog })).toThrow(/unknown kind/);
    expect(() => api.open({ id: 'x' })).toThrow(/component/);
  });

  it('useOverlay() outside the provider throws', () => {
    function Orphan() {
      useOverlay();
      return null;
    }
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/OverlayProvider/);
    consoleSpies = consoleSpies.filter((spy) => spy !== console.error);
  });

  it('is the single overlay mechanism: mounted once in src/app/App.jsx, z-index only from tokens', () => {
    const app = readFileSync(fromRoot('src/app/App.jsx'), 'utf8');
    expect(app.match(/<OverlayProvider\b/g)).toHaveLength(1);
    expect(app).toMatch(/routeKey=\{pathname\}/);
    const css = readFileSync(fromRoot('src/ui/overlay/OverlayProvider.module.css'), 'utf8');
    for (const [, value] of css.matchAll(/z-index:\s*([^;]+);/g)) expect(value).toMatch(/^var\(--z-/);
  });
});

