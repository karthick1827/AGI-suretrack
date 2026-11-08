// Story 1.3 — the Session module (AD-9) and its I/O-matrix rows.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  MAX_CLOCK_SKEW_MS,
  MAX_SESSION_TTL_MINUTES,
  SESSION_KEY,
  SIGNOUT_KEY,
  createSessionRecord,
  getSession,
  getSessionState,
  purgeInvalidSession,
  signIn,
  signOut,
  subscribe,
} from '../../src/lib/session.js';
import { fromRoot } from './support/project.js';

const users = JSON.parse(readFileSync(fromRoot('src/data/json/users.json'), 'utf8'));
const demo = users.users.find((user) => user.username === 'demo');
const TTL = users.policy.sessionTtlMinutes;
const NOW = 1_800_000_000_000;
const record = (overrides = {}, now = NOW) => ({ ...createSessionRecord(demo, { now, ttlMinutes: TTL }), ...overrides });

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('createSessionRecord', () => {
  it('builds { v: 1, username, displayName, dashboardState, issuedAt, expiresAt } in epoch ms', () => {
    expect(createSessionRecord(demo, { now: NOW, ttlMinutes: TTL })).toEqual({
      v: 1,
      username: 'demo',
      displayName: 'Demo Farmer',
      dashboardState: 'full',
      issuedAt: NOW,
      expiresAt: NOW + 480 * 60_000,
    });
  });

  it('never copies the password or any other account field', () => {
    const built = createSessionRecord(demo, { now: NOW, ttlMinutes: TTL });
    expect(Object.keys(built).sort()).toEqual(
      ['dashboardState', 'displayName', 'expiresAt', 'issuedAt', 'username', 'v'].sort(),
    );
    expect(JSON.stringify(built)).not.toContain(demo.password);
  });

  it.each([[0], [-1], [Number.NaN], [Infinity], ['480'], [undefined], [MAX_SESSION_TTL_MINUTES + 1]])(
    'throws RangeError for ttlMinutes %j',
    (ttlMinutes) => {
      expect(() => createSessionRecord(demo, { now: NOW, ttlMinutes })).toThrow(RangeError);
    },
  );

  it('MAX_SESSION_TTL_MINUTES equals the users.json policy value', () => {
    expect(MAX_SESSION_TTL_MINUTES).toBe(users.policy.sessionTtlMinutes);
  });
});

describe('signIn / getSession', () => {
  it('writes suretrack.session and reads it back while valid', () => {
    expect(signIn(demo, { now: NOW, ttlMinutes: TTL })).toBe(true);
    expect(JSON.parse(localStorage.getItem(SESSION_KEY))).toEqual(record());
    expect(getSession(NOW + 1)).toEqual(record());
    expect(getSessionState(NOW + 1)).toEqual({ session: record(), reason: null });
  });

  it('stores no password anywhere in localStorage', () => {
    signIn(demo, { now: NOW, ttlMinutes: TTL });
    for (let i = 0; i < localStorage.length; i += 1) {
      expect(localStorage.getItem(localStorage.key(i))).not.toContain(demo.password);
    }
  });

  it('returns null with reason "required" when nothing is stored', () => {
    expect(getSession(NOW)).toBeNull();
    expect(getSessionState(NOW)).toEqual({ session: null, reason: 'required' });
  });

  it.each([
    ['bad JSON', '{not json'],
    ['wrong v', JSON.stringify(record({ v: 2 }))],
    ['missing username', JSON.stringify(record({ username: '' }))],
    ['unknown dashboardState', JSON.stringify(record({ dashboardState: 'x' }))],
    ['string times', JSON.stringify(record({ expiresAt: 'later' }))],
    ['an array', '[]'],
    ['null', 'null'],
    ['issuedAt over 60 s in the future', JSON.stringify(record({}, NOW + MAX_CLOCK_SKEW_MS + 1))],
    ['a lifetime over the policy maximum', JSON.stringify(record({ expiresAt: NOW + (TTL + 1) * 60_000 }))],
  ])('corrupt storage (%s): null without touching storage; purge removes it', (_, raw) => {
    localStorage.setItem(SESSION_KEY, raw);
    expect(() => getSession(NOW)).not.toThrow();
    expect(getSessionState(NOW)).toEqual({ session: null, reason: 'required' });
    expect(localStorage.getItem(SESSION_KEY)).toBe(raw);
    expect(purgeInvalidSession(NOW)).toBe(true);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('accepts issuedAt up to 60 s in the future (clock skew)', () => {
    const skewed = record({}, NOW + MAX_CLOCK_SKEW_MS);
    localStorage.setItem(SESSION_KEY, JSON.stringify(skewed));
    expect(getSession(NOW)).toEqual(skewed);
  });

  it('expired storage: reason "expired"; the read does not clear, purge does', () => {
    signIn(demo, { now: NOW, ttlMinutes: TTL });
    const expiresAt = NOW + TTL * 60_000;
    expect(getSessionState(expiresAt)).toEqual({ session: null, reason: 'expired' });
    expect(getSession(expiresAt + 1)).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(purgeInvalidSession(expiresAt)).toBe(true);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('purgeInvalidSession leaves a valid Session and an empty store alone', () => {
    expect(purgeInvalidSession(NOW)).toBe(false);
    signIn(demo, { now: NOW, ttlMinutes: TTL });
    expect(purgeInvalidSession(NOW + 1)).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
  });

  it('never throws when storage itself throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getSessionState(NOW)).toEqual({ session: null, reason: 'required' });
    expect(purgeInvalidSession(NOW)).toBe(false);
  });

  it('signIn returns false, leaves nothing and notifies nobody when setItem throws', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(signIn(demo, { now: NOW, ttlMinutes: TTL })).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('signIn returns false when the write does not read back', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    expect(signIn(demo, { now: NOW, ttlMinutes: TTL })).toBe(false);
  });
});

describe('signOut / subscribe (cross-tab sync)', () => {
  it('signOut clears the Session and writes the suretrack.signout marker', () => {
    signIn(demo, { now: NOW, ttlMinutes: TTL });
    signOut();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(SIGNOUT_KEY)).toMatch(/^\d+$/);
    expect(getSession()).toBeNull();
  });

  it('notifies same-tab listeners on signIn and signOut with { crossTab: false }', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    signIn(demo, { now: Date.now(), ttlMinutes: TTL });
    signOut();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, { crossTab: false });
    // Story 2.1: a deliberate Logout is flagged, so the app keeps no return path.
    expect(listener).toHaveBeenNthCalledWith(2, { crossTab: false, signedOut: true });
    unsubscribe();
    signOut();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('notifies with { crossTab: true } on storage events for the Session or sign-out key only', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    window.dispatchEvent(new StorageEvent('storage', { key: SIGNOUT_KEY, newValue: '1' }));
    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY, newValue: null }));
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'something.else', newValue: 'x' }));
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenCalledWith({ crossTab: true });
    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage', { key: SIGNOUT_KEY, newValue: '2' }));
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe('storage ownership (AD-9)', () => {
  it('only src/lib/session.js touches localStorage or sessionStorage', async () => {
    const { readdirSync, statSync } = await import('node:fs');
    const path = await import('node:path');
    const offenders = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(jsx?|mjs)$/.test(name) && /localStorage|sessionStorage/.test(readFileSync(full, 'utf8'))) {
          offenders.push(path.relative(fromRoot(), full).replace(/\\/g, '/'));
        }
      }
    };
    walk(fromRoot('src'));
    expect(offenders).toEqual(['src/lib/session.js']);
  });
});
