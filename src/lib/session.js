// The one Session module (AD-9). It is the ONLY code that touches browser
// storage, and the only impure module in src/lib/.
//
// `localStorage['suretrack.session']` = { v: 1, username, displayName,
// dashboardState, issuedAt, expiresAt } with integer epoch-ms times (PRD
// addendum A.4 rule 5). The password is never stored. Records are built only
// by createSessionRecord(); expiry is checked only in getSessionState(now).
//
// Reads are pure: getSession() / getSessionState() never write, so they are
// safe during render. A corrupt or expired record is removed only by
// purgeInvalidSession(), which the app calls from an effect (SessionSync).
//
// Cross-tab sync: every tab hears the `storage` event when another tab
// removes the Session. signOut() also writes `suretrack.signout` (a fresh
// timestamp), so the event fires even when the Session key was already gone.
// Listeners in the SAME tab are notified directly (the `storage` event only
// reaches other tabs) with `{ crossTab: false }`; storage events give
// `{ crossTab: true }`.
//
// It also owns `localStorage['suretrack.signin-attempts']`, the FR-30 lockout
// counter (getAttempts / recordFailure / resetAttempts, below).
import { DASHBOARD_STATES } from './paths.js';

export const SESSION_KEY = 'suretrack.session';
export const SIGNOUT_KEY = 'suretrack.signout';
export const SESSION_VERSION = 1;

/**
 * Longest Session lifetime a stored record may claim, in minutes. It mirrors
 * `policy.sessionTtlMinutes` in the users.json data file (480, PRD addendum
 * §A.1); lib/ may not import the data JSON, so the value is copied here and a
 * unit test keeps the two equal. A record claiming a longer life is rejected.
 */
export const MAX_SESSION_TTL_MINUTES = 480;

/** A record issued more than this far in the future is rejected (clock skew allowance). */
export const MAX_CLOCK_SKEW_MS = 60_000;

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

function notify(detail) {
  for (const listener of [...listeners]) listener(detail);
}

// 8.64e15 ms is the largest time a JavaScript Date can hold (ECMA-262 §21.4.1.1).
export const MAX_EPOCH_MS = 8.64e15;
const isEpochMs = (value) => Number.isSafeInteger(value) && value >= 0 && value <= MAX_EPOCH_MS;
const isNonEmptyString = (value) => typeof value === 'string' && value !== '';
const isValidTtl = (ttlMinutes) =>
  typeof ttlMinutes === 'number' && Number.isFinite(ttlMinutes) && ttlMinutes > 0 && ttlMinutes <= MAX_SESSION_TTL_MINUTES;

function isValidRecord(record, now) {
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
    record.expiresAt > record.issuedAt &&
    record.expiresAt - record.issuedAt <= MAX_SESSION_TTL_MINUTES * MS_PER_MINUTE &&
    record.issuedAt <= now + MAX_CLOCK_SKEW_MS
  );
}

/**
 * Build a Session record from a Dummy account (addendum A.4 rule 5). Only the
 * listed fields are copied, so the password can never reach storage.
 * Throws RangeError when `ttlMinutes` is not a finite number in
 * (0, MAX_SESSION_TTL_MINUTES].
 * @param {{ username: string, displayName: string, dashboardState: string }} user
 * @param {{ now: number, ttlMinutes: number }} options
 */
export function createSessionRecord(user, { now, ttlMinutes }) {
  if (!isValidTtl(ttlMinutes)) {
    throw new RangeError(`ttlMinutes must be a number in (0, ${MAX_SESSION_TTL_MINUTES}]; got ${String(ttlMinutes)}`);
  }
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

function readRaw() {
  const store = storage();
  if (!store) return null;
  try {
    return store.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * The stored Session and why there is none. Pure: never writes storage.
 * Returns `{ session, reason }`: `reason` is null with a valid Session,
 * `'expired'` when the record's `expiresAt` has passed (FR-34) and `'required'`
 * otherwise (no record, bad JSON, wrong `v`, invalid fields). Never throws.
 * @param {number} [now=Date.now()]
 */
export function getSessionState(now = Date.now()) {
  const raw = readRaw();
  if (raw === null) return { session: null, reason: 'required' };
  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    return { session: null, reason: 'required' };
  }
  if (!isValidRecord(record, now)) return { session: null, reason: 'required' };
  if (!(now < record.expiresAt)) return { session: null, reason: 'expired' };
  return { session: record, reason: null };
}

/** The valid Session, or null. Pure; never throws. */
export function getSession(now = Date.now()) {
  return getSessionState(now).session;
}

/**
 * Remove a stored record that is corrupt or expired. Call from effects, never
 * during render. Returns true when something was removed. Never throws.
 */
export function purgeInvalidSession(now = Date.now()) {
  if (readRaw() === null || getSessionState(now).session) return false;
  const store = storage();
  try {
    store.removeItem(SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write the Session for `user` (FR-25). Returns true only when the record was
 * written and reads back intact; false when storage is unavailable or the
 * write fails (nothing is left behind). Throws RangeError on a bad TTL.
 * @param {{ username: string, displayName: string, dashboardState: string }} user
 * @param {{ now?: number, ttlMinutes: number }} options
 */
export function signIn(user, { now = Date.now(), ttlMinutes }) {
  const record = createSessionRecord(user, { now, ttlMinutes });
  const store = storage();
  if (!store) return false;
  const serialised = JSON.stringify(record);
  let ok = false;
  try {
    store.setItem(SESSION_KEY, serialised);
    ok = store.getItem(SESSION_KEY) === serialised;
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      store.removeItem(SESSION_KEY);
    } catch {
      // Nothing more can be done.
    }
    return false;
  }
  notify({ crossTab: false });
  return true;
}

/** End the Session in this tab and every other tab (FR-35). Never throws. */
export function signOut() {
  const store = storage();
  if (store) {
    try {
      store.removeItem(SESSION_KEY);
    } catch {
      // Fall through to the sign-out marker.
    }
    try {
      store.setItem(SIGNOUT_KEY, String(Date.now()));
    } catch {
      // The Session key removal alone still reaches other tabs.
    }
  }
  notify({ crossTab: false });
}

/* ------------------------------------------------------------------------ */
/* Sign-in attempts (FR-30)                                                  */
/* ------------------------------------------------------------------------ */
//
// `localStorage['suretrack.signin-attempts']` = { count, lockedUntil }: the
// consecutive wrong-credential failures in this browser and, while a lockout
// runs, its end as integer epoch ms (null otherwise). It survives reload and is
// reset by a successful sign-in or when the lockout ends.

export const ATTEMPTS_KEY = 'suretrack.signin-attempts';

const NO_ATTEMPTS = Object.freeze({ count: 0, lockedUntil: null });
const isCount = (value) => Number.isSafeInteger(value) && value >= 0;

function readAttemptsRaw() {
  const store = storage();
  if (!store) return null;
  try {
    return store.getItem(ATTEMPTS_KEY);
  } catch {
    return null;
  }
}

/**
 * The attempts record as it stands at `now`. Pure: never writes storage.
 * A missing or corrupt record reads as `{ count: 0, lockedUntil: null }`, and
 * so does a lockout that has already ended (FR-30: the count resets to 0).
 * Never throws.
 * @param {number} [now=Date.now()]
 * @returns {{ count: number, lockedUntil: number | null }}
 */
export function getAttempts(now = Date.now()) {
  const raw = readAttemptsRaw();
  if (raw === null) return { ...NO_ATTEMPTS };
  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    return { ...NO_ATTEMPTS };
  }
  if (record === null || typeof record !== 'object' || Array.isArray(record) || !isCount(record.count)) {
    return { ...NO_ATTEMPTS };
  }
  const { count, lockedUntil } = record;
  if (lockedUntil === null || lockedUntil === undefined) return { count, lockedUntil: null };
  if (!isEpochMs(lockedUntil) || !(now < lockedUntil)) return { ...NO_ATTEMPTS };
  return { count, lockedUntil };
}

function writeAttempts(record) {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(ATTEMPTS_KEY, JSON.stringify(record));
  } catch {
    // Storage full or blocked: the count simply does not persist.
  }
}

/**
 * Count one wrong-credential failure (FR-26, FR-30). When the count reaches
 * `maxFailedAttempts`, a lockout of `lockoutMinutes` starts at `now`.
 * Returns the new record. Throws RangeError on an invalid policy value.
 * @param {{ now?: number, maxFailedAttempts: number, lockoutMinutes: number }} options
 * @returns {{ count: number, lockedUntil: number | null }}
 */
export function recordFailure({ now = Date.now(), maxFailedAttempts, lockoutMinutes }) {
  if (!Number.isSafeInteger(maxFailedAttempts) || maxFailedAttempts < 1) {
    throw new RangeError(`maxFailedAttempts must be an integer ≥ 1; got ${String(maxFailedAttempts)}`);
  }
  if (typeof lockoutMinutes !== 'number' || !Number.isFinite(lockoutMinutes) || lockoutMinutes <= 0) {
    throw new RangeError(`lockoutMinutes must be a positive number; got ${String(lockoutMinutes)}`);
  }
  const current = getAttempts(now);
  const count = current.count + 1;
  const lockedUntil = count >= maxFailedAttempts ? Math.trunc(now) + Math.trunc(lockoutMinutes * MS_PER_MINUTE) : null;
  const record = { count, lockedUntil };
  writeAttempts(record);
  return record;
}

/**
 * End the lockout that ends at `lockedUntil`: the record is removed only if it
 * still holds that same `lockedUntil`, so a stale timer never wipes a newer
 * lockout or a fresh count written by another tab. Returns true when removed.
 * Never throws.
 */
export function endLockout(lockedUntil) {
  const raw = readAttemptsRaw();
  if (raw === null) return false;
  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    return false;
  }
  if (record?.lockedUntil !== lockedUntil) return false;
  resetAttempts();
  return true;
}

/**
 * Call `listener()` when another tab changes the attempts record (a lockout
 * started or a reset), or clears storage. Returns the unsubscribe function.
 */
export function subscribeAttempts(listener) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event) => {
    if (event.key === null || event.key === ATTEMPTS_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

/** Clear the attempts record (successful sign-in, or the lockout ended). Never throws. */
export function resetAttempts() {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(ATTEMPTS_KEY);
  } catch {
    // Nothing more can be done.
  }
}

/**
 * Call `listener({ crossTab })` whenever the Session may have changed:
 * sign-in or sign-out in this tab (`crossTab: false`), or a change to the
 * Session / sign-out key in another tab (`crossTab: true`).
 * Returns the unsubscribe function.
 */
export function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    // `key === null` means another tab called localStorage.clear().
    if (event.key === null || event.key === SESSION_KEY || event.key === SIGNOUT_KEY) listener({ crossTab: true });
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}
