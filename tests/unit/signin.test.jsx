// Story 1.3 — sign in and reach the Dashboard: every I/O-matrix row (FR-21–FR-25, FR-33–FR-35).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import App from '../../src/app/App.jsx';
import { getConfig, getUsers } from '../../src/data/api.js';
import { OUTCOMES, checkCredentials, returnPath } from '../../src/features/auth/useSignIn.js';
import { copy } from '../../src/lib/copy.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, SIGNOUT_KEY, createSessionRecord, getSession, signIn, signOut } from '../../src/lib/session.js';
import { fromRoot } from './support/project.js';

vi.mock('../../src/data/api.js', () => ({ getConfig: vi.fn(), getUsers: vi.fn() }));

const config = JSON.parse(readFileSync(fromRoot('public/app-config.json'), 'utf8'));
const usersData = JSON.parse(readFileSync(fromRoot('src/data/json/users.json'), 'utf8'));
const demo = usersData.users.find((user) => user.username === 'demo');
const TTL = usersData.policy.sessionTtlMinutes;
const t = copy.login;
let consoleSpies;

beforeEach(() => {
  localStorage.clear();
  consoleSpies = ['error', 'warn', 'log', 'info'].map((level) => vi.spyOn(console, level));
  vi.mocked(getConfig).mockResolvedValue(config);
  vi.mocked(getUsers).mockResolvedValue(usersData);
});

afterEach(() => {
  try {
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  } finally {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  }
});

async function renderAt(url) {
  window.history.replaceState(null, '', url);
  const view = render(<App />);
  await act(async () => {
    await Promise.resolve();
  });
  return view;
}

const usernameInput = () => screen.getByLabelText(t.usernameLabel);
const passwordInput = () => screen.getByLabelText(t.passwordLabel);
const loginButton = () => screen.getByRole('button', { name: t.submit });
// The visible field messages; the live region repeats their text for screen readers.
const MESSAGE = { ignore: '[aria-live], script, style' };
const liveRegion = () => document.querySelector('[aria-live="polite"]');
const routerState = () => window.history.state?.usr;
const storeSession = (overrides = {}) =>
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ ...createSessionRecord(demo, { now: Date.now(), ttlMinutes: TTL }), ...overrides }),
  );

function fillAndSubmit(username, password) {
  fireEvent.change(usernameInput(), { target: { value: username } });
  fireEvent.change(passwordInput(), { target: { value: password } });
  fireEvent.click(loginButton());
}

async function waitForDashboard() {
  await waitFor(() => expect(window.location.pathname).toBe(paths.dashboard()));
  await screen.findByText(copy.placeholder.comingSoon);
}

async function waitForIdle() {
  await waitFor(() => expect(getUsers).toHaveBeenCalled());
  await waitFor(() => expect(loginButton().hasAttribute('aria-busy')).toBe(false));
}

describe('valid sign-in (FR-24, FR-25)', () => {
  it('demo / Demo@123: loading, Session written, lands on /dashboard replacing /login', async () => {
    let release;
    vi.mocked(getUsers).mockImplementation(() => new Promise((resolve) => (release = resolve)));
    await renderAt(paths.login());
    const historyLength = window.history.length;

    fillAndSubmit('demo', 'Demo@123');
    await waitFor(() => expect(loginButton().getAttribute('aria-busy')).toBe('true'));
    expect(getUsers).toHaveBeenCalledWith({ signIn: true });
    expect(getSession()).toBeNull();

    await act(async () => release(usersData));
    await waitForDashboard();
    expect(window.history.length).toBe(historyLength);

    const session = getSession();
    expect(session).toMatchObject({ v: 1, username: 'demo', displayName: 'Demo Farmer', dashboardState: 'full' });
    expect(session.expiresAt - session.issuedAt).toBe(TTL * 60_000);
  });

  it('Enter in the Password input submits the form', async () => {
    await renderAt(paths.login());
    fireEvent.change(usernameInput(), { target: { value: 'demo' } });
    fireEvent.change(passwordInput(), { target: { value: 'Demo@123' } });
    fireEvent.submit(passwordInput().form);
    await waitForDashboard();
  });

  it('returns to state.from with its query (FR-11, FR-25)', async () => {
    await renderAt(paths.equipment({ type: 'bins' }));
    expect(window.location.pathname).toBe(paths.login());
    expect(routerState()).toEqual({ from: paths.equipment({ type: 'bins' }), reason: 'required' });
    fillAndSubmit('demo', 'Demo@123');
    await waitFor(() =>
      expect(`${window.location.pathname}${window.location.search}`).toBe(paths.equipment({ type: 'bins' })),
    );
  });

  it('keeps the hash in state.from and returns to it', async () => {
    await renderAt(`${paths.alerts()}#latest`);
    expect(routerState()).toEqual({ from: `${paths.alerts()}#latest`, reason: 'required' });
    fillAndSubmit('demo', 'Demo@123');
    await waitFor(() => expect(`${window.location.pathname}${window.location.hash}`).toBe(`${paths.alerts()}#latest`));
  });

  it('stores no password anywhere in localStorage', async () => {
    await renderAt(paths.login());
    fillAndSubmit('demo', 'Demo@123');
    await waitForDashboard();
    expect(localStorage.length).toBeGreaterThan(0);
    for (let i = 0; i < localStorage.length; i += 1) {
      expect(localStorage.getItem(localStorage.key(i))).not.toContain('Demo@123');
    }
  });
});

describe('case and spaces (FR-22, FR-24)', () => {
  it('"  DEMO " / Demo@123 signs in as demo', async () => {
    await renderAt(paths.login());
    fillAndSubmit('  DEMO ', 'Demo@123');
    await waitForDashboard();
    expect(getSession().username).toBe('demo');
  });

  it('the password is exact: demo@123 does not sign in, and shows nothing yet (Story 1.4)', async () => {
    await renderAt(paths.login());
    fillAndSubmit('demo', 'demo@123');
    await waitForIdle();
    expect(window.location.pathname).toBe(paths.login());
    expect(getSession()).toBeNull();
    expect(liveRegion().textContent).toBe('');
    expect(usernameInput().value).toBe('demo');
  });
});

describe('empty fields (FR-22)', () => {
  it('both empty: both messages, no getUsers call, focus on Username, announced once', async () => {
    await renderAt(paths.login());
    fireEvent.click(loginButton());
    expect(await screen.findByText(t.errors.usernameRequired, MESSAGE)).toBeTruthy();
    expect(screen.getByText(t.errors.passwordRequired, MESSAGE)).toBeTruthy();
    expect(getUsers).not.toHaveBeenCalled();
    expect(loginButton().hasAttribute('aria-busy')).toBe(false);
    expect(document.activeElement).toBe(usernameInput());
    expect(usernameInput().getAttribute('aria-invalid')).toBe('true');
    expect(usernameInput().getAttribute('aria-describedby')).toBe(screen.getByText(t.errors.usernameRequired, MESSAGE).id);
    expect(passwordInput().getAttribute('aria-describedby')).toBe(screen.getByText(t.errors.passwordRequired, MESSAGE).id);
    // One polite live region; no role="alert" per message.
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(1);
    expect(liveRegion().textContent).toBe(`${t.errors.usernameRequired} ${t.errors.passwordRequired}`);
  });

  it('all-spaces Username counts as empty', async () => {
    await renderAt(paths.login());
    fillAndSubmit('   ', 'Demo@123');
    expect(await screen.findByText(t.errors.usernameRequired, MESSAGE)).toBeTruthy();
    expect(screen.queryByText(t.errors.passwordRequired, MESSAGE)).toBeNull();
    expect(getUsers).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(usernameInput());
  });

  it('empty Password only: its message, focus on Password', async () => {
    await renderAt(paths.login());
    fillAndSubmit('demo', '');
    expect(await screen.findByText(t.errors.passwordRequired, MESSAGE)).toBeTruthy();
    expect(screen.queryByText(t.errors.usernameRequired, MESSAGE)).toBeNull();
    expect(getUsers).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(passwordInput());
  });

  it('a message clears as soon as the user types into its field', async () => {
    await renderAt(paths.login());
    fireEvent.click(loginButton());
    await screen.findByText(t.errors.usernameRequired, MESSAGE);
    fireEvent.change(usernameInput(), { target: { value: 'd' } });
    await waitFor(() => expect(screen.queryByText(t.errors.usernameRequired, MESSAGE)).toBeNull());
    expect(usernameInput().hasAttribute('aria-invalid')).toBe(false);
    expect(screen.getByText(t.errors.passwordRequired, MESSAGE)).toBeTruthy();
    expect(liveRegion().textContent).toBe(t.errors.passwordRequired);
  });

  it('at rest no message, aria-invalid or aria-busy is rendered', async () => {
    await renderAt(paths.login());
    expect(liveRegion().textContent).toBe('');
    expect(document.querySelector('[aria-invalid], [aria-busy], [aria-describedby]')).toBeNull();
  });
});

describe('double submit (FR-23)', () => {
  it('clicking Login twice and pressing Enter while loading starts one attempt', async () => {
    let release;
    vi.mocked(getUsers).mockImplementation(() => new Promise((resolve) => (release = resolve)));
    await renderAt(paths.login());
    fillAndSubmit('demo', 'Demo@123');
    fireEvent.click(loginButton());
    fireEvent.submit(passwordInput().form);
    fireEvent.click(loginButton());
    expect(getUsers).toHaveBeenCalledTimes(1);
    expect(loginButton().getAttribute('aria-disabled')).toBe('true');
    await act(async () => release(usersData));
    await waitForDashboard();
    expect(getUsers).toHaveBeenCalledTimes(1);
  });

  it('the guard is released after a failed attempt, so a retry works', async () => {
    await renderAt(paths.login());
    fillAndSubmit('demo', 'nope');
    await waitForIdle();
    fillAndSubmit('demo', 'Demo@123');
    await waitForDashboard();
    expect(getUsers).toHaveBeenCalledTimes(2);
  });
});

describe('guarded routes (FR-11, FR-33)', () => {
  it.each([paths.dashboard(), paths.dashboard('small'), paths.alerts(), paths.equipmentDetail('759')])(
    'signed out, %s redirects to /login with { from, reason: "required" }',
    async (url) => {
      await renderAt(url);
      expect(window.location.pathname).toBe(paths.login());
      expect(routerState()).toEqual({ from: url, reason: 'required' });
    },
  );

  it('an expired Session redirects with reason "expired"; SessionSync purges it', async () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(createSessionRecord(demo, { now: Date.now() - (TTL + 1) * 60_000, ttlMinutes: TTL })),
    );
    await renderAt(paths.dashboard());
    expect(window.location.pathname).toBe(paths.login());
    expect(routerState()).toEqual({ from: paths.dashboard(), reason: 'expired' });
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('corrupt storage on a guarded route redirects to /login; SessionSync purges it', async () => {
    localStorage.setItem(SESSION_KEY, '{oops');
    await renderAt(paths.dashboard());
    expect(window.location.pathname).toBe(paths.login());
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('signed in, /login redirects to /dashboard without rendering the form', async () => {
    storeSession();
    await renderAt(paths.login());
    expect(window.location.pathname).toBe(paths.dashboard());
    expect(screen.queryByLabelText(t.usernameLabel)).toBeNull();
    expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy();
  });

  it('signed in, / goes to /dashboard', async () => {
    storeSession();
    await renderAt(paths.root());
    expect(window.location.pathname).toBe(paths.dashboard());
  });
});

describe('sign-out and SessionSync (FR-34, FR-35)', () => {
  const pageshow = (persisted) => {
    const event = new Event('pageshow');
    Object.defineProperty(event, 'persisted', { value: persisted });
    return event;
  };

  it('signOut() in this tab shows /login with empty fields', async () => {
    storeSession();
    await renderAt(paths.dashboard());
    await act(async () => signOut());
    await waitFor(() => expect(window.location.pathname).toBe(paths.login()));
    expect(routerState()).toEqual({ from: paths.dashboard(), reason: 'required' });
    expect(usernameInput().value).toBe('');
  });

  it('signOut() in another tab (storage event) shows /login', async () => {
    storeSession();
    await renderAt(paths.dashboard());
    await act(async () => {
      localStorage.removeItem(SESSION_KEY);
      localStorage.setItem(SIGNOUT_KEY, String(Date.now()));
      window.dispatchEvent(new StorageEvent('storage', { key: SIGNOUT_KEY, newValue: String(Date.now()) }));
    });
    await waitFor(() => expect(window.location.pathname).toBe(paths.login()));
  });

  it('a sign-in in another tab while on /login → /dashboard', async () => {
    await renderAt(paths.login());
    await act(async () => {
      storeSession();
      window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY, newValue: localStorage.getItem(SESSION_KEY) }));
    });
    await waitFor(() => expect(window.location.pathname).toBe(paths.dashboard()));
  });

  it('pageshow persisted, signed out on /dashboard → /login', async () => {
    storeSession();
    await renderAt(paths.dashboard());
    localStorage.removeItem(SESSION_KEY); // signed out while this page sat in the back-forward cache
    await act(async () => window.dispatchEvent(pageshow(true)));
    await waitFor(() => expect(window.location.pathname).toBe(paths.login()));
    expect(routerState()).toEqual({ from: paths.dashboard(), reason: 'required' });
  });

  it('pageshow persisted, signed in on /login → /dashboard (not on a non-persisted pageshow)', async () => {
    await renderAt(paths.login());
    storeSession();
    await act(async () => window.dispatchEvent(pageshow(false)));
    expect(window.location.pathname).toBe(paths.login());
    await act(async () => window.dispatchEvent(pageshow(true)));
    await waitFor(() => expect(window.location.pathname).toBe(paths.dashboard()));
  });

  it('expiry while mounted → /login with reason "expired"', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      signIn(demo, { ttlMinutes: 1 });
      await renderAt(paths.alerts());
      expect(window.location.pathname).toBe(paths.alerts());
      await act(async () => {
        vi.advanceTimersByTime(59_999);
      });
      expect(window.location.pathname).toBe(paths.alerts());
      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(window.location.pathname).toBe(paths.login());
      expect(routerState()).toEqual({ from: paths.alerts(), reason: 'expired' });
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('focus re-checks an expiry the timer could not catch', async () => {
    storeSession();
    await renderAt(paths.alerts());
    storeSession({ expiresAt: Date.now() - 1, issuedAt: Date.now() - 60_000 });
    await act(async () => window.dispatchEvent(new Event('focus')));
    await waitFor(() => expect(window.location.pathname).toBe(paths.login()));
    expect(routerState()).toEqual({ from: paths.alerts(), reason: 'expired' });
  });
});

describe('sign-in robustness', () => {
  it('unmounting during the check writes no Session and does not navigate', async () => {
    let release;
    vi.mocked(getUsers).mockImplementation(() => new Promise((resolve) => (release = resolve)));
    const view = await renderAt(paths.login());
    fillAndSubmit('demo', 'Demo@123');
    await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(1));
    view.unmount();
    await act(async () => release(usersData));
    expect(getSession()).toBeNull();
    expect(window.location.pathname).toBe(paths.login());
  });

  it('a failing storage write (setItem throws) leaves no Session and stays on /login', async () => {
    await renderAt(paths.login());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    fillAndSubmit('demo', 'Demo@123');
    await waitForIdle();
    expect(getSession()).toBeNull();
    expect(window.location.pathname).toBe(paths.login());
  });

  it.each([
    ['missing policy', { ...usersData, policy: undefined }],
    ['TTL 0', { ...usersData, policy: { ...usersData.policy, sessionTtlMinutes: 0 } }],
    ['TTL "480"', { ...usersData, policy: { ...usersData.policy, sessionTtlMinutes: '480' } }],
    ['TTL Infinity', { ...usersData, policy: { ...usersData.policy, sessionTtlMinutes: Infinity } }],
    ['TTL over the maximum', { ...usersData, policy: { ...usersData.policy, sessionTtlMinutes: 100_000 } }],
  ])('%s: no Session, loading ends, stays on /login', async (_, data) => {
    vi.mocked(getUsers).mockResolvedValue(data);
    await renderAt(paths.login());
    fillAndSubmit('demo', 'Demo@123');
    await waitForIdle();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(window.location.pathname).toBe(paths.login());
  });

  it('a users.json load failure ends loading with no Session', async () => {
    vi.mocked(getUsers).mockRejectedValue({ code: 'LOAD_FAILED', message: 'x' });
    await renderAt(paths.login());
    fillAndSubmit('demo', 'Demo@123');
    await waitForIdle();
    expect(getSession()).toBeNull();
  });

  it('a non-success account never gets a Session', async () => {
    await renderAt(paths.login());
    fillAndSubmit('locked', 'Locked@123');
    await waitForIdle();
    expect(getSession()).toBeNull();
    expect(window.location.pathname).toBe(paths.login());
  });
});

describe('checkCredentials outcomes (no UI until Story 1.4)', () => {
  it.each([
    ['demo', 'Demo@123', OUTCOMES.success],
    ['DeMo', 'Demo@123', OUTCOMES.success],
    ['nobody', 'Demo@123', OUTCOMES.unknownUser],
    ['demo', 'wrong', OUTCOMES.wrongPassword],
    ['locked', 'wrong', OUTCOMES.wrongPassword],
    ['locked', 'Locked@123', OUTCOMES.locked],
    ['inactive', 'Inactive@123', OUTCOMES.inactive],
    ['nosub', 'NoSub@123', OUTCOMES.inactive],
    ['expired', 'Expired@123', OUTCOMES.passwordExpired],
  ])('%s / %s → %s', (username, password, outcome) => {
    expect(checkCredentials(usersData, username, password).outcome).toBe(outcome);
  });

  it.each([
    ['an unknown status', 'suspended'],
    ['a missing status', undefined],
  ])('%s is treated as inactive', (_, status) => {
    expect(checkCredentials({ users: [{ ...demo, status }] }, 'demo', 'Demo@123').outcome).toBe(OUTCOMES.inactive);
  });
});

describe('returnPath (same-origin, in-app paths only)', () => {
  it.each([
    [paths.alerts(), paths.alerts()],
    [paths.dashboard('small'), paths.dashboard('small')],
    ['/alerts?x=1#top', '/alerts?x=1#top'],
    ['/equipment/759#hash', '/equipment/759#hash'],
    ['/apiary', '/apiary'],
    ['/markdownish', '/markdownish'],
    [undefined, paths.dashboard()],
    [42, paths.dashboard()],
    ['https://evil.example/x', paths.dashboard()],
    ['//evil.example/x', paths.dashboard()],
    ['/\\evil.example', paths.dashboard()],
    [paths.login(), paths.dashboard()],
    ['/login/', paths.dashboard()],
    ['/LOGIN', paths.dashboard()],
    ['/Login//?x=1', paths.dashboard()],
    ['/api', paths.dashboard()],
    ['/api/x', paths.dashboard()],
    ['/API/save-markdown', paths.dashboard()],
    ['/markdown', paths.dashboard()],
    ['/markdown/x', paths.dashboard()],
    ['/markdown.html', paths.dashboard()],
    ['/markdownstudio', paths.dashboard()],
    ['/alerts\u0000', paths.dashboard()],
    ['/alerts\n', paths.dashboard()],
    ['/alerts\u007f', paths.dashboard()],
  ])('%j → %s', (from, expected) => {
    expect(returnPath(from)).toBe(expected);
  });
});
