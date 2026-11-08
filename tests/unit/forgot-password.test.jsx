// Story 1.5 — Forgot Password modal (FR-36–FR-49): every I/O-matrix row,
// driven through the real App, overlay owner and data port (fetch served from
// disk, fake timers for the sign-in latency).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router';
import App from '../../src/app/App.jsx';
import { getConfig, requestPasswordReset } from '../../src/data/api.js';
import LoginForm from '../../src/features/auth/LoginForm.jsx';
import { copy } from '../../src/lib/copy.js';
import { isValidEmail } from '../../src/lib/email.js';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
import { tabbables } from '../../src/ui/overlay/focus.js';
import { fromRoot } from './support/project.js';

vi.mock('../../src/data/api.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getConfig: vi.fn(actual.getConfig),
    requestPasswordReset: vi.fn(actual.requestPasswordReset),
  };
});

const actualApi = await vi.importActual('../../src/data/api.js');
const config = JSON.parse(readFileSync(fromRoot('public/app-config.json'), 'utf8'));
const usersData = JSON.parse(readFileSync(fromRoot('src/data/json/users.json'), 'utf8'));
const t = copy.forgotPassword;
const login = copy.login;

/** fetch() served from disk; json() settles on microtasks only, so fake timers can drive everything. */
function diskFetch(url) {
  const pathname = decodeURIComponent(new URL(String(url), 'http://localhost/').pathname).replace(/^\//, '');
  for (const file of [fromRoot(pathname), fromRoot('public', pathname)]) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(text)) });
  }
  return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('404')) });
}

let overlayRoot;
let consoleSpies;

beforeEach(() => {
  localStorage.clear();
  overlayRoot = document.createElement('div');
  overlayRoot.id = 'overlay-root';
  document.body.append(overlayRoot);
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  vi.stubGlobal('fetch', vi.fn(diskFetch));
  consoleSpies = ['error', 'warn', 'log', 'info'].map((level) => vi.spyOn(console, level));
  vi.mocked(requestPasswordReset).mockImplementation(actualApi.requestPasswordReset);
  vi.mocked(getConfig).mockImplementation(actualApi.getConfig);
});

afterEach(() => {
  try {
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  } finally {
    cleanup();
    overlayRoot.remove();
    localStorage.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.mocked(requestPasswordReset).mockClear();
    vi.mocked(getConfig).mockClear();
  }
});

async function advance(ms) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function renderLogin() {
  window.history.replaceState(null, '', paths.login());
  const view = render(<App />);
  await advance(0); // config + router settle
  return view;
}

const forgotLink = () => screen.getByRole('button', { name: login.forgotLink });
const dialog = () => screen.queryByRole('dialog', { name: t.title });
const email = () => screen.getByRole('textbox', { name: t.emailAccessibleLabel });
const submit = () => screen.queryByRole('button', { name: t.submit });
const cancel = () => screen.getByRole('button', { name: t.cancel });
const closeX = () => screen.getByRole('button', { name: t.close });
const errorMessage = () => screen.queryByText(t.invalidEmail, { selector: `[id]` });
const confirmation = () => overlayRoot.querySelector(`[data-fid="${FID.forgotPassword.body}"] p`);
const byFid = (fid) => overlayRoot.querySelector(`[data-fid="${CSS.escape(fid)}"]`);

async function openFromLink() {
  forgotLink().focus();
  fireEvent.click(forgotLink());
  await advance(0); // modal's config load
}

describe('open from the Forgot link (FR-36, FR-37)', () => {
  it('opens the modal over Login: dialog named by its title, focus on Email, URL and typed values unchanged', async () => {
    await renderLogin();
    fireEvent.change(screen.getByLabelText(login.usernameLabel), { target: { value: 'farmer' } });
    expect(dialog()).toBeNull();
    await openFromLink();
    const modal = dialog();
    expect(modal).not.toBeNull();
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('data-fid')).toBe(FID.frames.forgotPassword);
    expect(overlayRoot.contains(modal)).toBe(true);
    expect(overlayRoot.querySelector('[data-overlay-backdrop]')).not.toBeNull();
    expect(document.activeElement).toBe(email());
    expect(window.location.pathname).toBe(paths.login());
    expect(window.location.search).toBe('');
    expect(screen.getByLabelText(login.usernameLabel).value).toBe('farmer');
  });

  it('starts empty: blank Email, no error, no confirmation; Submit drawn and exposed as disabled', async () => {
    await renderLogin();
    await openFromLink();
    expect(email().value).toBe('');
    expect(errorMessage()).toBeNull();
    expect(submit().getAttribute('aria-disabled')).toBe('true');
    expect(submit().hasAttribute('disabled')).toBe(false); // still focusable (FR-49)
  });

  it('renders every string verbatim (FR-38–FR-44), with the Coach number from app-config.json', async () => {
    await renderLogin();
    await openFromLink();
    expect(byFid(FID.forgotPassword.title).textContent).toBe(t.title);
    expect(byFid(FID.forgotPassword.intro).textContent).toBe(
      'Forgot your password or username? Enter your email address, and we’ll send you a link to reset your password.',
    );
    expect(byFid(FID.forgotPassword.emailLabel).textContent).toBe('Email *');
    expect(byFid(FID.forgotPassword.emailField).getAttribute('placeholder')).toBe('Eg. example@mail.com');
    expect(byFid(FID.forgotPassword.helpText).textContent).toBe(`Need additional help?SureTrack Coach ${config.coach.phone}`);
    const coach = screen.getByRole('link', { name: `SureTrack Coach ${config.coach.phone}` });
    expect(coach.getAttribute('href')).toBe(config.coach.tel);
    expect(byFid(FID.forgotPassword.cancel).textContent).toBe('Cancel');
    expect(byFid(FID.forgotPassword.submit).textContent).toBe('Submit');
    expect(closeX().getAttribute('data-fid')).toBe(FID.forgotPassword.closeButton);
  });

  it('Email is a required email field with the email autocomplete hint (FR-41)', async () => {
    await renderLogin();
    await openFromLink();
    expect(email().getAttribute('type')).toBe('email');
    expect(email().getAttribute('autocomplete')).toBe('email');
    expect(email().required).toBe(true);
  });
});

describe('open from the expired-password banner (FR-29, FR-36)', () => {
  it('"Reset your password" is no longer aria-disabled and opens the same modal; closing refocuses it', async () => {
    await renderLogin();
    fireEvent.change(screen.getByLabelText(login.usernameLabel), { target: { value: 'expired' } });
    fireEvent.change(screen.getByLabelText(login.passwordLabel), { target: { value: 'Expired@123' } });
    fireEvent.click(screen.getByRole('button', { name: login.submit }));
    await advance(usersData.policy.simulatedLatencyMs);
    const reset = screen.getByRole('button', { name: login.errors.resetPasswordLink });
    expect(reset.hasAttribute('aria-disabled')).toBe(false);
    reset.focus();
    fireEvent.click(reset);
    await advance(0);
    expect(dialog()).not.toBeNull();
    expect(document.activeElement).toBe(email());
    fireEvent.click(cancel());
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(reset);
    expect(screen.getByRole('alert')).not.toBeNull(); // the banner stays
  });
});

describe('invalid email (FR-45, FR-46)', () => {
  it.each([[''], ['abc'], ['a@b']])('%j: Submit stays disabled; leaving the field shows the message', async (value) => {
    await renderLogin();
    await openFromLink();
    fireEvent.change(email(), { target: { value } });
    expect(errorMessage()).toBeNull(); // never before the field has been left once
    expect(submit().getAttribute('aria-disabled')).toBe('true');
    fireEvent.blur(email());
    const message = errorMessage();
    expect(message.textContent).toBe(t.invalidEmail);
    expect(email().getAttribute('aria-invalid')).toBe('true');
    expect(email().getAttribute('aria-describedby')).toBe(message.id);
    expect(screen.getByText(t.invalidEmail, { selector: '[aria-live="polite"]' })).not.toBeNull();
    // Activating the disabled Submit (click or Enter) does nothing.
    fireEvent.click(submit());
    fireEvent.submit(email().form);
    await advance(0);
    expect(requestPasswordReset).not.toHaveBeenCalled();
    expect(submit()).not.toBeNull();
  });

  it('the message hides as soon as the value becomes valid', async () => {
    await renderLogin();
    await openFromLink();
    fireEvent.change(email(), { target: { value: 'abc' } });
    fireEvent.blur(email());
    expect(errorMessage()).not.toBeNull();
    fireEvent.change(email(), { target: { value: 'abc@farm.com' } });
    expect(errorMessage()).toBeNull();
    expect(email().hasAttribute('aria-invalid')).toBe(false);
    expect(submit().hasAttribute('aria-disabled')).toBe(false);
  });

  it('a pointer pressing Cancel or the close X: no message (the footer never moves under the pointer)', async () => {
    await renderLogin();
    await openFromLink();
    for (const control of [cancel(), closeX()]) {
      fireEvent.pointerDown(control);
      fireEvent.blur(email(), { relatedTarget: control });
      expect(errorMessage()).toBeNull();
      fireEvent.pointerUp(control); // released on the control: the click closes the modal
      expect(errorMessage()).toBeNull();
      email().focus();
    }
  });

  it('a press on Cancel dragged off and released elsewhere validates after all', async () => {
    await renderLogin();
    await openFromLink();
    fireEvent.pointerDown(cancel());
    fireEvent.blur(email(), { relatedTarget: cancel() });
    expect(errorMessage()).toBeNull();
    fireEvent.pointerUp(byFid(FID.forgotPassword.body));
    expect(errorMessage().textContent).toBe(t.invalidEmail);
    expect(dialog()).not.toBeNull();
  });

  it('keyboard focus moving to Cancel validates as usual', async () => {
    await renderLogin();
    await openFromLink();
    fireEvent.blur(email(), { relatedTarget: cancel() });
    expect(errorMessage().textContent).toBe(t.invalidEmail);
  });

  it('the FR-45 rule', () => {
    const valid = [
      'x@y.com',
      ' farmer@agi.ca ',
      'a.b+c@mail.co.uk',
      'user@sub-domain.example.org',
      'user@example.xn--p1ai',
      `${'l'.repeat(64)}@example.com`,
      `a@${'d'.repeat(63)}.${'e'.repeat(63)}.${'f'.repeat(63)}.${'g'.repeat(56)}.com`, // 254 characters
    ];
    const invalid = [
      '',
      'abc',
      'a@b',
      'a b@c.com',
      'a@@b.com',
      'a@b@c.com',
      '@y.com',
      'x@y.c',
      'x@y.c0m',
      'a..b@c.com',
      '.a@c.com',
      'a.@c.com',
      'a@b..com',
      'a@.b.com',
      'a@b.com.',
      'a@-b.com',
      'a@b-.com',
      'a@b.-co',
      'a@b.xn--',
      `${'l'.repeat(65)}@example.com`,
      `a@${'d'.repeat(63)}.${'e'.repeat(63)}.${'f'.repeat(63)}.${'g'.repeat(57)}.com`, // 255 characters
      null,
      42,
    ];
    expect(valid[valid.length - 1]).toHaveLength(254);
    expect(invalid[invalid.length - 3]).toHaveLength(255);
    for (const value of valid) expect(isValidEmail(value), String(value)).toBe(true);
    for (const value of invalid) expect(isValidEmail(value), String(value)).toBe(false);
  });
});

describe('valid email (FR-47)', () => {
  it.each([['x@y.com'], ['nobody-at-all@example.org']])(
    '%j: loading, repeat submits ignored, then the identical confirmation; nothing is sent',
    async (value) => {
      let resolve;
      vi.mocked(requestPasswordReset).mockImplementation(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      );
      await renderLogin();
      await openFromLink();
      const fetchesBefore = vi.mocked(fetch).mock.calls.length;
      fireEvent.change(email(), { target: { value } });
      fireEvent.click(submit());
      await advance(0);
      expect(submit().getAttribute('aria-busy')).toBe('true');
      expect(submit().getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(submit());
      fireEvent.submit(email().form);
      expect(requestPasswordReset).toHaveBeenCalledTimes(1);
      expect(requestPasswordReset).toHaveBeenCalledWith(value);
      await act(async () => resolve({ ok: true }));
      expect(confirmation().textContent).toBe(t.confirmation);
      expect(within(dialog()).queryByRole('textbox')).toBeNull(); // intro and Email replaced
      expect(byFid(FID.forgotPassword.intro)).toBeNull();
      expect(submit()).toBeNull();
      expect(byFid(FID.forgotPassword.helpText)).not.toBeNull(); // help text stays
      expect(document.activeElement).toBe(cancel());
      expect(screen.getByText(t.confirmation, { selector: '[aria-live="polite"]' })).not.toBeNull();
      expect(vi.mocked(fetch).mock.calls.length).toBe(fetchesBefore);
    },
  );

  it('Enter in a valid Email field submits through the real requestPasswordReset: zero fetch calls', async () => {
    await renderLogin();
    await openFromLink();
    vi.mocked(fetch).mockClear(); // config and users loads are done; count only what Submit does
    fireEvent.change(email(), { target: { value: 'demo@suretrack.example' } });
    fireEvent.submit(email().form);
    await advance(0);
    expect(requestPasswordReset).toHaveBeenCalledTimes(1);
    expect(vi.mocked(requestPasswordReset).mock.results[0].value).toBeInstanceOf(Promise);
    expect(confirmation().textContent).toBe(t.confirmation);
    expect(fetch).not.toHaveBeenCalled();
    await expect(actualApi.requestPasswordReset('any@thing.com')).resolves.toEqual({ ok: true });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('a rejected request returns to the form (email kept, Submit idle); nothing is logged', async () => {
    vi.mocked(requestPasswordReset).mockImplementation(() => Promise.reject({ code: 'LOAD_FAILED', message: 'x' }));
    await renderLogin();
    await openFromLink();
    fireEvent.change(email(), { target: { value: 'x@y.com' } });
    fireEvent.submit(email().form);
    await advance(0);
    expect(confirmation()?.textContent).not.toBe(t.confirmation);
    expect(email().value).toBe('x@y.com');
    expect(submit().hasAttribute('aria-busy')).toBe(false);
    expect(submit().hasAttribute('aria-disabled')).toBe(false);
  });

  it('closing while the request is pending discards the late result', async () => {
    let resolve;
    vi.mocked(requestPasswordReset).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    await renderLogin();
    await openFromLink();
    fireEvent.change(email(), { target: { value: 'x@y.com' } });
    fireEvent.submit(email().form);
    await advance(0);
    fireEvent.click(cancel());
    await act(async () => resolve({ ok: true }));
    expect(dialog()).toBeNull();
  });

  it('confirmation-state tab order: Close X → Coach number → Cancel (FR-49)', async () => {
    await renderLogin();
    await openFromLink();
    fireEvent.change(email(), { target: { value: 'x@y.com' } });
    fireEvent.submit(email().form);
    await advance(0);
    const layer = overlayRoot.querySelector('[data-overlay]');
    expect(tabbables(layer).map((el) => el.getAttribute('aria-label') ?? el.textContent)).toEqual([
      t.close,
      `SureTrack Coach ${config.coach.phone}`,
      t.cancel,
    ]);
  });
});

describe('close (FR-48)', () => {
  it.each([
    ['Cancel', () => fireEvent.click(cancel())],
    ['the close X', () => fireEvent.click(closeX())],
    ['Esc', () => fireEvent.keyDown(email(), { key: 'Escape' })],
    ['a backdrop click', () => fireEvent.click(overlayRoot.querySelector('[data-overlay-backdrop]'))],
  ])('%s: unmounts, discards input, returns focus to the Forgot link', async (_, act_) => {
    await renderLogin();
    fireEvent.change(screen.getByLabelText(login.usernameLabel), { target: { value: 'farmer' } });
    await openFromLink();
    fireEvent.change(email(), { target: { value: 'typed@farm.com' } });
    act_();
    expect(dialog()).toBeNull();
    expect(overlayRoot.childElementCount).toBe(0);
    expect(document.activeElement).toBe(forgotLink());
    expect(screen.getByLabelText(login.usernameLabel).value).toBe('farmer');
    await openFromLink();
    expect(email().value).toBe('');
  });

  it('closes from the confirmation state too, and a click inside the surface never closes it', async () => {
    await renderLogin();
    await openFromLink();
    fireEvent.click(dialog());
    fireEvent.click(byFid(FID.forgotPassword.body));
    expect(dialog()).not.toBeNull();
    fireEvent.change(email(), { target: { value: 'x@y.com' } });
    fireEvent.submit(email().form);
    await advance(0);
    fireEvent.keyDown(cancel(), { key: 'Escape' });
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(forgotLink());
  });
});

describe('focus (FR-49)', () => {
  it('form-state order: Close X → help → Email → Coach number → Cancel → Submit, wrapping both ways', async () => {
    await renderLogin();
    await openFromLink();
    const layer = overlayRoot.querySelector('[data-overlay]');
    const list = tabbables(layer);
    expect(list).toEqual([
      closeX(),
      screen.getByRole('button', { name: t.helpIconLabel }),
      email(),
      screen.getByRole('link', { name: `SureTrack Coach ${config.coach.phone}` }),
      cancel(),
      submit(),
    ]);
    submit().focus();
    fireEvent.keyDown(submit(), { key: 'Tab' });
    expect(document.activeElement).toBe(closeX());
    fireEvent.keyDown(closeX(), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(submit());
  });

  it('the Login page behind is inert while the modal is open, and not after', async () => {
    const { container } = await renderLogin();
    await openFromLink();
    expect(container.hasAttribute('inert')).toBe(true);
    act(() => forgotLink().focus());
    expect(overlayRoot.contains(document.activeElement)).toBe(true);
    fireEvent.click(cancel());
    expect(container.hasAttribute('inert')).toBe(false);
  });
});

describe('help tooltip (FR-42)', () => {
  const help = () => screen.getByRole('button', { name: t.helpIconLabel });
  const tooltip = () => document.getElementById(help().getAttribute('aria-describedby'));

  it('hidden at rest; shows while hovered or focused (tracked separately); it is the icon’s description', async () => {
    await renderLogin();
    await openFromLink();
    expect(tooltip().getAttribute('role')).toBe('tooltip');
    expect(tooltip().textContent).toBe(t.helpTooltip);
    expect(tooltip().hidden).toBe(true);
    fireEvent.mouseEnter(help());
    expect(tooltip().hidden).toBe(false);
    fireEvent.focus(help());
    fireEvent.mouseLeave(help().parentElement);
    expect(tooltip().hidden).toBe(false); // still focused
    fireEvent.blur(help());
    expect(tooltip().hidden).toBe(true);
    fireEvent.focus(help());
    fireEvent.mouseEnter(help());
    fireEvent.blur(help());
    expect(tooltip().hidden).toBe(false); // still hovered
  });

  it('the pointer can move onto the tooltip without hiding it', async () => {
    await renderLogin();
    await openFromLink();
    fireEvent.mouseEnter(help());
    fireEvent.mouseOver(tooltip());
    expect(help().parentElement.contains(tooltip())).toBe(true); // same hover region
    expect(tooltip().hidden).toBe(false);
  });

  it('Esc first dismisses a visible tooltip and keeps the modal; a second Esc closes the modal', async () => {
    await renderLogin();
    await openFromLink();
    fireEvent.focus(help());
    expect(tooltip().hidden).toBe(false);
    fireEvent.keyDown(help(), { key: 'Escape' });
    expect(dialog()).not.toBeNull();
    expect(tooltip().hidden).toBe(true);
    fireEvent.keyDown(help(), { key: 'Escape' });
    expect(dialog()).toBeNull();
  });
});

describe('SureTrack Coach line fallbacks (FR-43)', () => {
  const helpText = () => byFid(FID.forgotPassword.helpText);
  const withConfig = (impl) =>
    vi.mocked(getConfig).mockImplementation((options) => {
      // The Login legal links get the real config; the modal's load gets `impl`.
      if (document.querySelector('[data-overlay]')) return impl();
      return actualApi.getConfig(options);
    });

  it('a non-tel value: the number is plain text, readable, with no link', async () => {
    withConfig(() => Promise.resolve({ coach: { phone: config.coach.phone, tel: 'javascript:alert(1)' } }));
    await renderLogin();
    await openFromLink();
    expect(helpText().textContent).toBe(`${t.helpLead}SureTrack Coach ${config.coach.phone}`);
    expect(helpText().querySelector('a')).toBeNull();
    expect(screen.queryByRole('link', { name: /SureTrack Coach/ })).toBeNull();
  });

  it('a missing phone: no Coach line', async () => {
    withConfig(() => Promise.resolve({ coach: { tel: config.coach.tel } }));
    await renderLogin();
    await openFromLink();
    expect(helpText().textContent).toBe(t.helpLead);
  });

  it('a rejected config: no Coach line, nothing logged', async () => {
    withConfig(() => Promise.reject({ code: 'LOAD_FAILED', message: 'x' }));
    await renderLogin();
    await openFromLink();
    expect(helpText().textContent).toBe(t.helpLead);
  });
});

describe('leaving /login with the modal open (cross-tab sign-in)', () => {
  it('the overlay closes: #overlay-root empty, app root not inert, html scroll restored', async () => {
    const { container } = await renderLogin();
    await openFromLink();
    expect(container.hasAttribute('inert')).toBe(true);
    const demo = usersData.users.find((user) => user.username === 'demo');
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(createSessionRecord(demo, { now: Date.now(), ttlMinutes: usersData.policy.sessionTtlMinutes })),
    );
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY, newValue: localStorage.getItem(SESSION_KEY) }));
    });
    await advance(0);
    expect(window.location.pathname).toBe(paths.dashboard());
    expect(overlayRoot.childElementCount).toBe(0);
    expect(container.hasAttribute('inert')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('LoginForm without a Forgot Password handler', () => {
  it('the Forgot trigger is aria-disabled', async () => {
    render(
      <MemoryRouter initialEntries={[paths.login()]}>
        <LoginForm />
      </MemoryRouter>,
    );
    await advance(0);
    expect(screen.getByRole('button', { name: login.forgotLink }).getAttribute('aria-disabled')).toBe('true');
  });
});
