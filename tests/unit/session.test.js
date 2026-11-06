// Story 1.3 — the Session module (AD-9) and its I/O-matrix rows.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  SESSION_KEY,
  SIGNOUT_KEY,
  createSessionRecord,
  getSession,
  getSessionState,
  signIn,
  signOut,
  subscribe,
} from '../../src/lib/session.js';
import { fromRoot } from './support/project.js';

const users = JSON.parse(readFileSync(fromRoot('src/data/json/users.json'), 'utf8'));
const demo = users.users.find((user) => user.username === 'demo');
const TTL = users.policy.sessionTtlMinutes;
const NOW = 1_800_000_000_000;

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
    const record = createSessionRecord(demo, { now: NOW, ttlMinutes: TTL });
    expect(Object.keys(record).sort()).toEqual(
      ['dashboardState', 'displayName', 'expiresAt', 'issuedAt', 'username', 'v'].sort(),
    );
    expect(JSON.stringify(record)).not.toContain(demo.password);
  });
});

describe('signIn / getSession', () => {
  it('writes suretrack.session and reads it back while valid', () => {
    const record = signIn(demo, { now: NOW, ttlMinutes: TTL });
    expect(JSON.parse(localStorage.getItem(SESSION_KEY))).toEqual(record);
    expect(getSession(NOW + 1)).toEqual(record);
    expect(getSessionState(NOW + 1)).toEqual({ session: record, reason: null });
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
    ['wrong v', JSON.stringify({ ...createSessionRecord(demo, { now: NOW, ttlMinutes: TTL }), v: 2 })],
    ['missing username', JSON.stringify({ ...createSessionRecord(demo, { now: NOW, ttlMinutes: TTL }), username: '' })],
    ['unknown dashboardState', JSON.stringify({ ...createSessionRecord(demo, { now: NOW, ttlMinutes: TTL }), dashboardState: 'x' })],
    ['string times', JSON.stringify({ ...createSessionRecord(demo, { now: NOW, ttlMinutes: TTL }), expiresAt: 'later' })],
    ['an array', '[]'],
    ['null', 'null'],
  ])('corrupt storage (%s): returns null, clears the key, never throws', (_, raw) => {
    localStorage.setItem(SESSION_KEY, raw);
    expect(() => getSession(NOW)).not.toThrow();
    localStorage.setItem(SESSION_KEY, raw);
    expect(getSessionState(NOW)).toEqual({ session: null, reason: 'required' });
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('expired storage: returns null with reason "expired" and clears the key', () => {
    const record = signIn(demo, { now: NOW, ttlMinutes: TTL });
    expect(getSessionState(record.expiresAt)).toEqual({ session: null, reason: 'expired' });
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    signIn(demo, { now: NOW, ttlMinutes: TTL });
    expect(getSession(record.expiresAt + 1)).toBeNull();
  });

  it('never throws when storage itself throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getSessionState(NOW)).toEqual({ session: null, reason: 'required' });
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

  it('notifies same-tab listeners on signIn and signOut', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    signIn(demo, { now: NOW, ttlMinutes: TTL });
    signOut();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    signOut();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('notifies on storage events from other tabs for the Session or sign-out key only', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    window.dispatchEvent(new StorageEvent('storage', { key: SIGNOUT_KEY, newValue: '1' }));
    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY, newValue: null }));
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'something.else', newValue: 'x' }));
    expect(listener).toHaveBeenCalledTimes(3);
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
