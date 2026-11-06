// Story 1.3 — sign in and reach the Dashboard: every I/O-matrix row (FR-21–FR-25, FR-33, FR-35).
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
const routerState = () => window.history.state?.usr;

function fillAndSubmit(username, password) {
  fireEvent.change(usernameInput(), { target: { value: username } });
  fireEvent.change(passwordInput(), { target: { value: password } });
  fireEvent.click(loginButton());
}

async function waitForDashboard() {
  await waitFor(() => expect(window.location.pathname).toBe(paths.dashboard()));
  await screen.findByText(copy.placeholder.comingSoon);
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
    await waitFor(() => expect(`${window.location.pathname}${window.location.search}`).toBe(paths.equipment({ type: 'bins' })));
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
    await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(loginButton().hasAttribute('aria-busy')).toBe(false));
    expect(window.location.pathname).toBe(paths.login());
    expect(getSession()).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(usernameInput().value).toBe('demo');
  });
});

describe('empty fields (FR-22)', () => {
  it('both empty: both messages, no getUsers call, focus on Username', async () => {
    await renderAt(paths.login());
    fireEvent.click(loginButton());
    expect(await screen.findByText(t.errors.usernameRequired)).toBeTruthy();
    expect(screen.getByText(t.errors.passwordRequired)).toBeTruthy();
    expect(getUsers).not.toHaveBeenCalled();
    expect(loginButton().hasAttribute('aria-busy')).toBe(false);
    expect(document.activeElement).toBe(usernameInput());
    expect(usernameInput().getAttribute('aria-invalid')).toBe('true');
    expect(usernameInput().getAttribute('aria-describedby')).toBe(screen.getByText(t.errors.usernameRequired).id);
    expect(passwordInput().getAttribute('aria-describedby')).toBe(screen.getByText(t.errors.passwordRequired).id);
  });

  it('all-spaces Username counts as empty', async () => {
    await renderAt(paths.login());
    fillAndSubmit('   ', 'Demo@123');
    expect(await screen.findByText(t.errors.usernameRequired)).toBeTruthy();
    expect(screen.queryByText(t.errors.passwordRequired)).toBeNull();
    expect(getUsers).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(usernameInput());
  });

  it('empty Password only: its message, focus on Password', async () => {
    await renderAt(paths.login());
    fillAndSubmit('demo', '');
    expect(await screen.findByText(t.errors.passwordRequired)).toBeTruthy();
    expect(screen.queryByText(t.errors.usernameRequired)).toBeNull();
    expect(getUsers).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(passwordInput());
  });

  it('a message clears as soon as the user types into its field', async () => {
    await renderAt(paths.login());
    fireEvent.click(loginButton());
    await screen.findByText(t.errors.usernameRequired);
    fireEvent.change(usernameInput(), { target: { value: 'd' } });
    await waitFor(() => expect(screen.queryByText(t.errors.usernameRequired)).toBeNull());
    expect(usernameInput().hasAttribute('aria-invalid')).toBe(false);
    expect(screen.getByText(t.errors.passwordRequired)).toBeTruthy();
  });

  it('at rest no message, aria-invalid or aria-busy is rendered', async () => {
    await renderAt(paths.login());
    expect(screen.queryByRole('alert')).toBeNull();
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

  it('an expired Session redirects with reason "expired" and is cleared', async () => {
    const record = createSessionRecord(demo, { now: Date.now() - (TTL + 1) * 60_000, ttlMinutes: TTL });
    localStorage.setItem(SESSION_KEY, JSON.stringify(record));
    await renderAt(paths.dashboard());
    expect(window.location.pathname).toBe(paths.login());
    expect(routerState()).toEqual({ from: paths.dashboard(), reason: 'expired' });
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('corrupt storage on a guarded route redirects to /login without throwing', async () => {
    localStorage.setItem(SESSION_KEY, '{oops');
    await renderAt(paths.dashboard());
    expect(window.location.pathname).toBe(paths.login());
  });

  it('signed in, /login redirects to /dashboard without rendering the form', async () => {
    signIn(demo, { ttlMinutes: TTL });
    await renderAt(paths.login());
    expect(window.location.pathname).toBe(paths.dashboard());
    expect(screen.queryByLabelText(t.usernameLabel)).toBeNull();
    expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy();
  });

  it('signed in, / goes to /dashboard', async () => {
    signIn(demo, { ttlMinutes: TTL });
    await renderAt(paths.root());
    expect(window.location.pathname).toBe(paths.dashboard());
  });
});

describe('sign-out (FR-35)', () => {
  it('signOut() in this tab shows /login', async () => {
    signIn(demo, { ttlMinutes: TTL });
    await renderAt(paths.dashboard());
    await act(async () => signOut());
    await waitFor(() => expect(window.location.pathname).toBe(paths.login()));
    expect(screen.getByLabelText(t.usernameLabel).value).toBe('');
  });

  it('signOut() in another tab (storage event) shows /login', async () => {
    signIn(demo, { ttlMinutes: TTL });
    await renderAt(paths.dashboard());
    await act(async () => {
      localStorage.removeItem(SESSION_KEY);
      localStorage.setItem(SIGNOUT_KEY, String(Date.now()));
      window.dispatchEvent(new StorageEvent('storage', { key: SIGNOUT_KEY, newValue: String(Date.now()) }));
    });
    await waitFor(() => expect(window.location.pathname).toBe(paths.login()));
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

  it('a non-success account never gets a Session', async () => {
    await renderAt(paths.login());
    fillAndSubmit('locked', 'Locked@123');
    await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(loginButton().hasAttribute('aria-busy')).toBe(false));
    expect(getSession()).toBeNull();
    expect(window.location.pathname).toBe(paths.login());
  });

  it('a users.json load failure ends loading with no Session', async () => {
    vi.mocked(getUsers).mockRejectedValue({ code: 'LOAD_FAILED', message: 'x' });
    await renderAt(paths.login());
    fillAndSubmit('demo', 'Demo@123');
    await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(loginButton().hasAttribute('aria-busy')).toBe(false));
    expect(getSession()).toBeNull();
  });
});

describe('returnPath (same-origin, in-app paths only)', () => {
  it.each([
    [paths.alerts(), paths.alerts()],
    [paths.dashboard('small'), paths.dashboard('small')],
    [undefined, paths.dashboard()],
    [42, paths.dashboard()],
    ['https://evil.example/x', paths.dashboard()],
    ['//evil.example/x', paths.dashboard()],
    ['/\\evil.example', paths.dashboard()],
    [paths.login(), paths.dashboard()],
    ['/markdown.html', paths.dashboard()],
    ['/api/save-markdown', paths.dashboard()],
  ])('%j → %s', (from, expected) => {
    expect(returnPath(from)).toBe(expected);
  });
});
