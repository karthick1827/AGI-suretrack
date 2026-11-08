// Story 1.5 — the single overlay owner (AD-12): portal into #overlay-root,
// modal/menu/panel kinds, one overlay at a time, Esc, backdrop click, focus
// trap and return, inert background, unmount on close.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { useEffect } from 'react';
import OverlayProvider from '../../src/ui/overlay/OverlayProvider.jsx';
import { tabbables } from '../../src/ui/overlay/focus.js';
import { OVERLAY_KINDS, useOverlay } from '../../src/ui/overlay/useOverlay.js';
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
    vi.restoreAllMocks();
  }
});

function Dialog({ name, onNext }) {
  const { close } = useOverlay();
  return (
    <div role="dialog" aria-label={name}>
      <button type="button">{`${name} first`}</button>
      <input aria-label={`${name} input`} data-overlay-autofocus="" />
      {onNext && (
        <button type="button" onClick={onNext}>
          {`${name} next`}
        </button>
      )}
      <button type="button" onClick={close}>
        {`${name} last`}
      </button>
    </div>
  );
}

function Harness() {
  const { open, current } = useOverlay();
  const openB = () => open({ id: 'b', kind: OVERLAY_KINDS.modal, content: <Dialog name="B" /> });
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
            content: <Dialog name="A" onNext={openB} />,
          })
        }
      >
        open modal
      </button>
      <button type="button" onClick={() => open({ id: 'm', kind: OVERLAY_KINDS.menu, content: <Dialog name="M" /> })}>
        open menu
      </button>
      <button type="button" onClick={() => open({ id: 'p', kind: OVERLAY_KINDS.panel, content: <Dialog name="P" /> })}>
        open panel
      </button>
    </main>
  );
}

function setup() {
  render(
    <OverlayProvider>
      <Harness />
    </OverlayProvider>,
  );
  return { trigger: screen.getByRole('button', { name: 'open modal' }) };
}

const layer = () => overlayRoot.querySelector('[data-overlay]');
const backdrop = () => overlayRoot.querySelector('[data-overlay-backdrop]');

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
    expect(layer()).not.toBeNull();
    expect(layer().getAttribute('data-overlay-kind')).toBe('modal');
    expect(overlayRoot.contains(screen.getByRole('dialog', { name: 'A' }))).toBe(true);
    expect(backdrop()).not.toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText('A input'));
    expect(screen.getByTestId('current').textContent).toBe('a:modal');
    const app = trigger.closest('body > div');
    expect(app.hasAttribute('inert')).toBe(true);
    expect(overlayRoot.hasAttribute('inert')).toBe(false);
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

  it('close() from inside the overlay closes it and returns focus', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'A last' }));
    expect(layer()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('focus trap: Tab on the last control wraps to the first, Shift+Tab on the first wraps to the last', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    const list = tabbables(layer());
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

  it('focus that escapes the modal is pulled back inside', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    act(() => trigger.focus());
    expect(layer().contains(document.activeElement)).toBe(true);
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
    expect(document.activeElement).toBe(opener);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name })).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('close() with nothing open is a no-op', () => {
    const onReady = vi.fn();
    function Grab() {
      const overlay = useOverlay();
      useEffect(() => onReady(overlay));
      return null;
    }
    render(
      <OverlayProvider>
        <Grab />
      </OverlayProvider>,
    );
    const api = onReady.mock.calls.at(-1)[0];
    expect(() => act(() => api.close())).not.toThrow();
    expect(() => api.open({ id: 'x', kind: 'drawer', content: null })).toThrow(/unknown kind/);
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
    expect(app.match(/<OverlayProvider>/g)).toHaveLength(1);
    const css = readFileSync(fromRoot('src/ui/overlay/OverlayProvider.module.css'), 'utf8');
    for (const [, value] of css.matchAll(/z-index:\s*([^;]+);/g)) expect(value).toMatch(/^var\(--z-/);
  });
});
