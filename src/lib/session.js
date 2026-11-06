// The one Session module (AD-9). It is the ONLY code that touches browser
// storage, and the only impure module in src/lib/.
//
// `localStorage['suretrack.session']` = { v: 1, username, displayName,
// dashboardState, issuedAt, expiresAt } with integer epoch-ms times (PRD
// addendum A.4 rule 5). The password is never stored. Records are built only
// by createSessionRecord(); expiry is checked only in getSession(now) /
// getSessionState(now), which delete a corrupt or expired record.
//
// Cross-tab sync: every tab hears the `storage` event when another tab
// removes the Session. signOut() also writes `suretrack.signout` (a fresh
// timestamp), so the event fires even when the Session key was already gone.
// Listeners in the SAME tab are notified directly (the `storage` event only
// reaches other tabs).
import { DASHBOARD_STATES } from './paths.js';

export const SESSION_KEY = 'suretrack.session';
export const SIGNOUT_KEY = 'suretrack.signout';
export const SESSION_VERSION = 1;

const MS_PER_MINUTE = 60_000;
const listeners = new Set();

function storage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // Storage access can throw (blocked site data, sandboxed frame).
    return null;
  }
}

function notify() {
  for (const listener of [...listeners]) listener();
}

const isEpochMs = (value) => Number.isSafeInteger(value) && value >= 0;
const isNonEmptyString = (value) => typeof value === 'string' && value !== '';

function isValidRecord(record) {
  return (
    record !== null &&
    typeof record === 'object' &&
    !Array.isArray(record) &&
    record.v === SESSION_VERSION &&
    isNonEmptyString(record.username) &&
    typeof record.displayName === 'string' &&
    DASHBOARD_STATES.includes(record.dashboardState) &&
    isEpochMs(record.issuedAt) &&
    isEpochMs(record.expiresAt) &&
    record.expiresAt > record.issuedAt
  );
}

/**
 * Build a Session record from a Dummy account (addendum A.4 rule 5). Only the
 * listed fields are copied, so the password can never reach storage.
 * @param {{ username: string, displayName: string, dashboardState: string }} user
 * @param {{ now: number, ttlMinutes: number }} options
 */
export function createSessionRecord(user, { now, ttlMinutes }) {
  const issuedAt = Math.trunc(now);
  return {
    v: SESSION_VERSION,
    username: String(user.username),
    displayName: String(user.displayName ?? ''),
    dashboardState: DASHBOARD_STATES.includes(user.dashboardState) ? user.dashboardState : DASHBOARD_STATES[0],
    issuedAt,
    expiresAt: issuedAt + Math.trunc(ttlMinutes * MS_PER_MINUTE),
  };
}

function clearSessionKey(store) {
  try {
    store.removeItem(SESSION_KEY);
  } catch {
    // Nothing more can be done; never throw.
  }
}

/**
 * The stored Session and why there is none.
 * Returns `{ session, reason }`: `reason` is null with a valid Session,
 * `'expired'` when the record's `expiresAt` has passed (FR-34) and `'required'`
 * otherwise (no record, bad JSON, wrong `v`, missing fields). A corrupt or
 * expired record is deleted. Never throws.
 * @param {number} [now=Date.now()]
 */
export function getSessionState(now = Date.now()) {
  const store = storage();
  if (!store) return { session: null, reason: 'required' };
  let raw;
  try {
    raw = store.getItem(SESSION_KEY);
  } catch {
    return { session: null, reason: 'required' };
  }
  if (raw === null) return { session: null, reason: 'required' };

  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    record = null;
  }
  if (!isValidRecord(record)) {
    clearSessionKey(store);
    return { session: null, reason: 'required' };
  }
  if (!(now < record.expiresAt)) {
    clearSessionKey(store);
    return { session: null, reason: 'expired' };
  }
  return { session: record, reason: null };
}

/** The valid Session, or null (corrupt or expired records are cleared). Never throws. */
export function getSession(now = Date.now()) {
  return getSessionState(now).session;
}

/**
 * Write the Session for `user` (FR-25). Returns the stored record.
 * @param {{ username: string, displayName: string, dashboardState: string }} user
 * @param {{ now?: number, ttlMinutes: number }} options
 */
export function signIn(user, { now = Date.now(), ttlMinutes }) {
  const record = createSessionRecord(user, { now, ttlMinutes });
  const store = storage();
  if (store) {
    try {
      store.setItem(SESSION_KEY, JSON.stringify(record));
    } catch {
      // Quota or blocked storage: the guard will treat the user as signed out.
    }
  }
  notify();
  return record;
}

/** End the Session in this tab and every other tab (FR-35). Never throws. */
export function signOut() {
  const store = storage();
  if (store) {
    clearSessionKey(store);
    try {
      store.setItem(SIGNOUT_KEY, String(Date.now()));
    } catch {
      // The Session key removal alone still reaches other tabs.
    }
  }
  notify();
}

/**
 * Call `listener()` whenever the Session may have changed: sign-in or sign-out
 * in this tab, or a change to the Session / sign-out key in another tab.
 * Returns the unsubscribe function.
 */
export function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    // `key === null` means another tab called localStorage.clear().
    if (event.key === null || event.key === SESSION_KEY || event.key === SIGNOUT_KEY) listener();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}
