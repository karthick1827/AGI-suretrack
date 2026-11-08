// Story 1.4 — clear messages when sign-in fails: every I/O-matrix row
// (FR-26–FR-32, FR-34), driven through the real data port (api.js) with
// fetch served from disk and fake timers for latency, timeout and lockout.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import App from '../../src/app/App.jsx';
import { getUsers } from '../../src/data/api.js';
import {
  accountLockedMessage,
  copy,
  fill,
  formatSignInTime,
  tooManyAttemptsMessage,
} from '../../src/lib/copy.js';
import { paths } from '../../src/lib/paths.js';
import {
  ATTEMPTS_KEY,
  SESSION_KEY,
  createSessionRecord,
  getAttempts,
  getSession,
  recordFailure,
  resetAttempts,
} from '../../src/lib/session.js';
import { fromRoot } from './support/project.js';

vi.mock('../../src/data/api.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getConfig: vi.fn(actual.getConfig), getUsers: vi.fn(actual.getUsers) };
});

const config = JSON.parse(readFileSync(fromRoot('public/app-config.json'), 'utf8'));
const usersData = JSON.parse(readFileSync(fromRoot('src/data/json/users.json'), 'utf8'));
const { policy } = usersData;
const demo = usersData.users.find((user) => user.username === 'demo');
const t = copy.login;
const MINUTE = 60_000;
// 10:00 local time, so a 15-minute lockout ends the same day (`h:mm A`).
const NOW = new Date(2026, 10, 9, 10, 0, 0).getTime();
const COACH = config.coach.phone;

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

let consoleSpies;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  vi.setSystemTime(NOW);
  vi.stubGlobal('fetch', vi.fn(diskFetch));
  consoleSpies = ['error', 'warn', 'log', 'info'].map((level) => vi.spyOn(console, level));
});

afterEach(() => {
  try {
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  } finally {
    cleanup();
    localStorage.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.mocked(getUsers).mockClear();
  }
});

async function advance(ms) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function renderAt(url) {
  window.history.replaceState(null, '', url);
  const view = render(<App />);
  await advance(0); // config + router settle
  return view;
}

const usernameInput = () => screen.getByLabelText(t.usernameLabel);
const passwordInput = () => screen.getByLabelText(t.passwordLabel);
const loginButton = () => screen.getByRole('button', { name: t.submit });
const banner = () => screen.queryByRole('alert');

/** Fill, click Login and let the sign-in latency (800 ms) pass. */
async function signInAs(username, password, wait = policy.simulatedLatencyMs) {
  fireEvent.change(usernameInput(), { target: { value: username } });
  fireEvent.change(passwordInput(), { target: { value: password } });
  fireEvent.click(loginButton());
  await advance(wait);
}

function expectNoSession() {
  expect(getSession()).toBeNull();
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  expect(window.location.pathname).toBe(paths.login());
}

function expectIdle() {
  expect(loginButton().hasAttribute('aria-busy')).toBe(false);
}

describe('at rest (FR-32)', () => {
  it('renders no banner and no disabled Login button', async () => {
    await renderAt(paths.login());
    expect(banner()).toBeNull();
    expect(loginButton().disabled).toBe(false);
  });
});

describe('wrong credentials (FR-26)', () => {
  it.each([
    ['wrong password', 'demo', 'x'],
    ['unknown user', 'nobody', 'x'],
  ])('%s: generic banner, Username kept, Password cleared and focused, counter +1', async (_, user, pass) => {
    await renderAt(paths.login());
    await signInAs(user, pass);
    expect(banner().textContent).toBe(t.errors.wrongCredentials);
    expect(usernameInput().value).toBe(user);
    expect(passwordInput().value).toBe('');
    expect(document.activeElement).toBe(passwordInput());
    expect(loginButton().disabled).toBe(false);
    expectIdle();
    expect(getAttempts()).toEqual({ count: 1, lockedUntil: null });
    expectNoSession();
  });

  it('the banner sits under the title, before the Username label, and is announced', async () => {
    await renderAt(paths.login());
    await signInAs('demo', 'x');
    const alert = banner();
    expect(alert.getAttribute('aria-live')).toBe('assertive');
    expect(alert.previousElementSibling.textContent).toBe(t.title);
    const label = screen.getByText(t.usernameLabel);
    expect(alert.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('account-status messages need the correct password: locked + wrong password says "incorrect"', async () => {
    await renderAt(paths.login());
    await signInAs('locked', 'wrong');
    expect(banner().textContent).toBe(t.errors.wrongCredentials);
  });

  it('a new submit clears the banner before the next result', async () => {
    await renderAt(paths.login());
    await signInAs('demo', 'x');
    fireEvent.change(passwordInput(), { target: { value: 'y' } });
    fireEvent.click(loginButton());
    await advance(0);
    expect(banner()).toBeNull();
    await advance(policy.simulatedLatencyMs);
    expect(banner().textContent).toBe(t.errors.wrongCredentials);
  });
});

describe('account status after a correct password (FR-27–FR-29)', () => {
  it('locked, with a future lockedUntil: FR-27 copy with {time} and the Coach number', async () => {
    const user = usersData.users.find((entry) => entry.username === 'locked-until');
    await renderAt(paths.login());
    await signInAs('locked-until', user.password);
    const time = formatSignInTime(Date.parse(user.lockedUntil), NOW);
    expect(banner().textContent).toBe(fill(t.errors.accountLockedUntil, { time, coachPhone: COACH }));
    expect(banner().textContent).toContain(`Contact SureTrack Coach ${COACH}.`);
    expect(passwordInput().value).toBe(user.password);
    expect(getAttempts().count).toBe(0);
    expectNoSession();
  });

  it('locked, lockedUntil null: FR-27 copy without a time', async () => {
    await renderAt(paths.login());
    await signInAs('locked', 'Locked@123');
    expect(banner().textContent).toBe(`Your account is locked. Contact SureTrack Coach ${COACH}.`);
    expectNoSession();
  });

  it('locked, lockedUntil already past: FR-27 copy without a time', async () => {
    vi.setSystemTime(Date.parse('2100-01-01T00:00:00Z'));
    await renderAt(paths.login());
    await signInAs('locked-until', 'Locked@123');
    expect(banner().textContent).toBe(fill(t.errors.accountLocked, { coachPhone: COACH }));
    expectNoSession();
  });

  it.each([
    ['inactive', 'Inactive@123'],
    ['nosub', 'NoSub@123'],
  ])('%s: FR-28 copy, counter unchanged', async (user, pass) => {
    await renderAt(paths.login());
    await signInAs(user, pass);
    expect(banner().textContent).toBe('Your account is inactive. Contact SureTrack Coach.');
    expect(getAttempts().count).toBe(0);
    expectNoSession();
  });

  it('expired password: FR-29 copy followed by the "Reset your password" link', async () => {
    await renderAt(paths.login());
    await signInAs('expired', 'Expired@123');
    const alert = banner();
    expect(alert.textContent).toBe(`${t.errors.passwordExpired}${t.errors.resetPasswordLink}`);
    const link = screen.getByRole('button', { name: t.errors.resetPasswordLink });
    expect(alert.contains(link)).toBe(true);
    fireEvent.click(link); // no-op until Story 1.5
    expect(banner()).not.toBeNull();
    expectNoSession();
  });
});

describe('too many attempts (FR-30)', () => {
  it('the 5th consecutive failure locks Login for 15 min; it survives reload and ends on its own', async () => {
    await renderAt(paths.login());
    for (let i = 1; i < policy.maxFailedAttempts; i += 1) {
      await signInAs('demo', `wrong${i}`);
      expect(banner().textContent).toBe(t.errors.wrongCredentials);
      expect(getAttempts().count).toBe(i);
    }
    await signInAs('nobody', 'wrong5');
    const record = getAttempts();
    expect(record.count).toBe(policy.maxFailedAttempts);
    // Counted from the failure that reached the limit (its result arrives after the latency).
    expect(record.lockedUntil).toBe(Date.now() + policy.lockoutMinutes * MINUTE);
    expect(banner().textContent).toBe(tooManyAttemptsMessage(record.lockedUntil, Date.now()));
    expect(banner().textContent).toBe('Too many sign-in attempts. You can try again at 10:15 AM.');
    expect(passwordInput().value).toBe('');
    expect(loginButton().disabled).toBe(true);
    expect(JSON.parse(localStorage.getItem(ATTEMPTS_KEY))).toEqual(record);

    // Reload: still disabled with the banner, and Enter runs no check.
    cleanup();
    vi.mocked(getUsers).mockClear();
    await renderAt(paths.login());
    expect(loginButton().disabled).toBe(true);
    expect(banner().textContent).toBe(tooManyAttemptsMessage(record.lockedUntil, Date.now()));
    fireEvent.change(usernameInput(), { target: { value: 'demo' } });
    fireEvent.change(passwordInput(), { target: { value: 'Demo@123' } });
    fireEvent.submit(passwordInput().form);
    await advance(policy.simulatedLatencyMs);
    expect(getUsers).not.toHaveBeenCalled();
    expect(banner().textContent).toBe(tooManyAttemptsMessage(record.lockedUntil, Date.now()));
    expectNoSession();

    // The lockout ends: Login re-enables without a reload, the banner clears, the count resets.
    await advance(record.lockedUntil - Date.now());
    expect(loginButton().disabled).toBe(false);
    expect(banner()).toBeNull();
    expect(localStorage.getItem(ATTEMPTS_KEY)).toBeNull();
    expect(getAttempts()).toEqual({ count: 0, lockedUntil: null });
  });

  it('a successful sign-in resets the count', async () => {
    await renderAt(paths.login());
    await signInAs('demo', 'a');
    await signInAs('demo', 'b');
    expect(getAttempts().count).toBe(2);
    await signInAs('demo', 'Demo@123');
    expect(window.location.pathname).toBe(paths.dashboard());
    expect(localStorage.getItem(ATTEMPTS_KEY)).toBeNull();
  });

  it('locked, inactive and expired results do not count (offline and timeout: see FR-31)', async () => {
    await renderAt(paths.login());
    await signInAs('locked', 'Locked@123');
    await signInAs('inactive', 'Inactive@123');
    await signInAs('expired', 'Expired@123');
    expect(getAttempts().count).toBe(0);
  });
});

describe('offline and timeout (FR-31)', () => {
  it('slow (16 s) times out after policy.requestTimeoutMs (15 s): banner, request aborted, retry allowed', async () => {
    const slow = usersData.users.find((user) => user.username === 'slow');
    expect(slow.simulatedLatencyMs).toBeGreaterThan(policy.requestTimeoutMs);
    await renderAt(paths.login());
    await signInAs('slow', slow.password, policy.requestTimeoutMs - 1);
    expect(loginButton().getAttribute('aria-busy')).toBe('true');
    expect(banner()).toBeNull();
    await advance(1);
    expect(banner().textContent).toBe(t.errors.timeout);
    expectIdle();
    expect(loginButton().disabled).toBe(false);
    expect(usernameInput().value).toBe('slow');
    expect(passwordInput().value).toBe(slow.password);
    expect(getUsers.mock.calls[0][0].signal.aborted).toBe(true);
    expect(getAttempts().count).toBe(0);
    // The abandoned check never finishes later.
    await advance(slow.simulatedLatencyMs);
    expectNoSession();
    // Retry runs a new check.
    fireEvent.click(loginButton());
    await advance(0);
    expect(getUsers).toHaveBeenCalledTimes(2);
    expect(banner()).toBeNull();
  });

  it('offline at submit: connection banner, no request, values kept; retry when back online signs in', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await renderAt(paths.login());
    await signInAs('demo', 'Demo@123');
    expect(banner().textContent).toBe(t.errors.offline);
    expect(getUsers).not.toHaveBeenCalled();
    expect(usernameInput().value).toBe('demo');
    expect(passwordInput().value).toBe('Demo@123');
    expect(getAttempts().count).toBe(0);
    expectNoSession();

    onLine.mockReturnValue(true);
    fireEvent.click(loginButton());
    await advance(policy.simulatedLatencyMs);
    expect(window.location.pathname).toBe(paths.dashboard());
  });
});

describe('session expired (FR-34)', () => {
  it('an expired Session lands on /login with the banner; signing in returns to state.from', async () => {
    const issuedAt = NOW - (policy.sessionTtlMinutes + 1) * MINUTE;
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(createSessionRecord(demo, { now: issuedAt, ttlMinutes: policy.sessionTtlMinutes })),
    );
    await renderAt(paths.alerts());
    expect(window.location.pathname).toBe(paths.login());
    expect(banner().textContent).toBe('Your session has expired. Please sign in again.');

    fireEvent.change(usernameInput(), { target: { value: 'demo' } });
    fireEvent.change(passwordInput(), { target: { value: 'Demo@123' } });
    fireEvent.click(loginButton());
    await advance(0);
    expect(banner()).toBeNull();
    await advance(policy.simulatedLatencyMs);
    expect(window.location.pathname).toBe(paths.alerts());
    expect(getSession()?.username).toBe('demo');
  });

  it('a required-field submit clears the session-expired banner', async () => {
    window.history.replaceState({ usr: { from: paths.alerts(), reason: 'expired' }, key: 'k', idx: 0 }, '', paths.login());
    render(<App />);
    await advance(0);
    expect(banner().textContent).toBe(t.errors.sessionExpired);
    fireEvent.click(loginButton());
    await advance(0);
    expect(banner()).toBeNull();
    expect(usernameInput().getAttribute('aria-invalid')).toBe('true');
  });
});

describe('session.js attempts record (AD-9)', () => {
  const POLICY = { maxFailedAttempts: policy.maxFailedAttempts, lockoutMinutes: policy.lockoutMinutes };

  it('reads a missing or corrupt record as zero', () => {
    expect(getAttempts(NOW)).toEqual({ count: 0, lockedUntil: null });
    for (const raw of ['{', 'null', '[]', '{"count":-1,"lockedUntil":null}', '{"count":2,"lockedUntil":"soon"}']) {
      localStorage.setItem(ATTEMPTS_KEY, raw);
      expect(getAttempts(NOW)).toEqual({ count: 0, lockedUntil: null });
    }
  });

  it('getAttempts is a pure read', () => {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ count: 5, lockedUntil: NOW - 1 }));
    expect(getAttempts(NOW)).toEqual({ count: 0, lockedUntil: null });
    expect(localStorage.getItem(ATTEMPTS_KEY)).toBe(JSON.stringify({ count: 5, lockedUntil: NOW - 1 }));
  });

  it('recordFailure counts and starts the lockout at the limit; a finished lockout starts over', () => {
    for (let i = 1; i < POLICY.maxFailedAttempts; i += 1) {
      expect(recordFailure({ now: NOW, ...POLICY })).toEqual({ count: i, lockedUntil: null });
    }
    const locked = recordFailure({ now: NOW, ...POLICY });
    expect(locked).toEqual({ count: 5, lockedUntil: NOW + 15 * MINUTE });
    expect(getAttempts(NOW + 15 * MINUTE - 1)).toEqual(locked);
    expect(getAttempts(NOW + 15 * MINUTE)).toEqual({ count: 0, lockedUntil: null });
    expect(recordFailure({ now: NOW + 15 * MINUTE, ...POLICY })).toEqual({ count: 1, lockedUntil: null });
    resetAttempts();
    expect(localStorage.getItem(ATTEMPTS_KEY)).toBeNull();
  });

  it('never stores anything but { count, lockedUntil }', () => {
    recordFailure({ now: NOW, ...POLICY });
    expect(Object.keys(JSON.parse(localStorage.getItem(ATTEMPTS_KEY))).sort()).toEqual(['count', 'lockedUntil']);
  });

  it('rejects an unusable policy', () => {
    expect(() => recordFailure({ now: NOW, maxFailedAttempts: 0, lockoutMinutes: 15 })).toThrow(RangeError);
    expect(() => recordFailure({ now: NOW, maxFailedAttempts: 5, lockoutMinutes: undefined })).toThrow(RangeError);
  });
});

describe('copy.js time and Coach helpers (FR-27, FR-30)', () => {
  it('formats h:mm A today and MMM D, YYYY h:mm A otherwise', () => {
    expect(formatSignInTime(new Date(2026, 10, 9, 15, 45).getTime(), NOW)).toBe('3:45 PM');
    expect(formatSignInTime(new Date(2026, 10, 9, 0, 5).getTime(), NOW)).toBe('12:05 AM');
    expect(formatSignInTime(new Date(2026, 10, 9, 12, 0).getTime(), NOW)).toBe('12:00 PM');
    expect(formatSignInTime(new Date(2027, 0, 1, 9, 0).getTime(), NOW)).toBe('Jan 1, 2027 9:00 AM');
    expect(() => formatSignInTime('not a date', NOW)).toThrow(RangeError);
  });

  it('builds the locked messages with and without a time', () => {
    const until = new Date(2026, 10, 9, 15, 45).toISOString();
    expect(accountLockedMessage({ lockedUntil: until, coachPhone: COACH, now: NOW })).toBe(
      `Your account is locked. Try again after 3:45 PM. Contact SureTrack Coach ${COACH}.`,
    );
    expect(accountLockedMessage({ lockedUntil: null, coachPhone: COACH, now: NOW })).toBe(
      `Your account is locked. Contact SureTrack Coach ${COACH}.`,
    );
    expect(() => accountLockedMessage({ lockedUntil: null, coachPhone: undefined, now: NOW })).toThrow(/coachPhone/);
  });
});
