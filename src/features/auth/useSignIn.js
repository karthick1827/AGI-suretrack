// Sign-in flow for the Login form (FR-22–FR-34, AD-9).
//
// Check order (PRD FR-24, addendum A.5 rule 2): double-submit guard →
// required fields (no data call) → active too-many-attempts lockout → offline
// → load users.json with the sign-in latency, abandoned after
// `policy.requestTimeoutMs` (timeout) → credentials → locked → inactive / no
// subscription → password expired → Session + redirect.
//
// Every failure after the required-field check shows its verbatim message in
// the one alert banner (FR-32); account-status messages appear only after a
// correct password. Wrong credentials count towards the per-browser lockout
// held by session.js (FR-30). No failure creates a Session. A users.json load
// failure or an unusable runtime config has no PRD message, so it shows none.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getConfig, getUsers } from '../../data/api.js';
import { accountLockedMessage, copy, tooManyAttemptsMessage } from '../../lib/copy.js';
import { RESERVED_PREFIXES, paths } from '../../lib/paths.js';
import { getAttempts, recordFailure, resetAttempts, signIn } from '../../lib/session.js';

export const OUTCOMES = Object.freeze({
  success: 'success',
  busy: 'busy',
  invalid: 'invalid',
  unavailable: 'unavailable',
  unknownUser: 'unknown-user',
  wrongPassword: 'wrong-password',
  locked: 'locked',
  inactive: 'inactive',
  passwordExpired: 'password-expired',
  tooManyAttempts: 'too-many-attempts',
  offline: 'offline',
  timeout: 'timeout',
});

/** Banner kinds: `passwordExpired` adds the FR-29 reset link; `lockout` clears itself when the lockout ends. */
export const BANNER_KINDS = Object.freeze({
  error: 'error',
  lockout: 'lockout',
  passwordExpired: 'password-expired',
  sessionExpired: 'session-expired',
});

const MAX_TIMEOUT_MS = 2147483647; // setTimeout's maximum delay

const errorBanner = (message) => ({ kind: BANNER_KINDS.error, message });
const lockoutBanner = (lockedUntil, now = Date.now()) => ({
  kind: BANNER_KINDS.lockout,
  message: tooManyAttemptsMessage(lockedUntil, now),
});

/** FR-31: the browser reports it is offline. */
function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** A positive finite number, else null. */
function positiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

const NO_ERRORS = Object.freeze({ username: false, password: false });

// Markdown Studio owns these first path segments (AD-10), including the
// /markdownstudio alias the dev server rewrites to /markdown.html.
const RESERVED_SEGMENTS = new Set(
  RESERVED_PREFIXES.flatMap((prefix) => {
    const segment = prefix.slice(1).toLowerCase();
    return segment === 'markdown'
      ? [segment, `${segment}.html`, `${segment}studio`, `${segment}studio.html`]
      : [segment];
  }),
);
/** True when `value` holds a C0 control character or DEL. */
function hasControlCharacter(value) {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/**
 * FR-11 / FR-25: only a same-origin, in-app path is a valid return target.
 * Anything else (absolute or protocol-relative URL, backslashes, control
 * characters, Markdown Studio paths, /login itself in any case or with a
 * trailing slash) falls back to /dashboard. Path, query and hash are kept.
 */
export function returnPath(from) {
  const fallback = paths.dashboard();
  if (
    typeof from !== 'string' ||
    !from.startsWith(paths.root()) ||
    from.startsWith('//') ||
    from.includes('\\') ||
    hasControlCharacter(from)
  ) {
    return fallback;
  }
  const pathname = from.split(/[?#]/)[0].toLowerCase();
  const normalised = pathname.replace(/\/+$/, '') || paths.root();
  if (normalised === paths.login()) return fallback;
  const firstSegment = pathname.split('/')[1] ?? '';
  if (RESERVED_SEGMENTS.has(firstSegment)) return fallback;
  return from;
}

/**
 * Credentials and account-status checks (FR-24 steps 5–8). Pure.
 * Only `status: "active"` (the users.json contract, addendum A.1: status is
 * required and one of active | locked | inactive) may sign in; a missing or
 * unknown status is treated as inactive.
 */
export function checkCredentials(data, username, password) {
  const wanted = username.toLowerCase();
  const users = Array.isArray(data?.users) ? data.users : [];
  const user = users.find((entry) => typeof entry?.username === 'string' && entry.username.toLowerCase() === wanted);
  if (!user) return { outcome: OUTCOMES.unknownUser };
  if (user.password !== password) return { outcome: OUTCOMES.wrongPassword };
  if (user.status === 'locked') return { outcome: OUTCOMES.locked, user };
  if (user.status !== 'active' || user.subscriptionActive === false) return { outcome: OUTCOMES.inactive, user };
  if (user.passwordExpired === true) return { outcome: OUTCOMES.passwordExpired, user };
  return { outcome: OUTCOMES.success, user };
}

/** The policy TTL in minutes, or null when users.json has no usable policy. */
function sessionTtlMinutes(data) {
  const value = data?.policy?.sessionTtlMinutes;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * @returns {{
 *   errors: { username: boolean, password: boolean },
 *   loading: boolean,
 *   banner: { kind: string, message: string } | null,
 *   locked: boolean,
 *   submit: (values: { username: string, password: string }) =>
 *     Promise<{ outcome: string, field?: string, clearPassword?: boolean }>,
 *   clearError: (field: 'username' | 'password') => void,
 * }}
 */
export function useSignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errors, setErrors] = useState(NO_ERRORS);
  const [loading, setLoading] = useState(false);
  // FR-30: a lockout survives reload, so the first render already shows it.
  const [lockedUntil, setLockedUntil] = useState(() => getAttempts().lockedUntil);
  const [banner, setBanner] = useState(() => {
    if (lockedUntil !== null) return lockoutBanner(lockedUntil);
    // FR-34: RequireSession / SessionSync send an expired Session here with reason 'expired'.
    if (location.state?.reason === 'expired') {
      return { kind: BANNER_KINDS.sessionExpired, message: copy.login.errors.sessionExpired };
    }
    return null;
  });
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const request = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  // FR-30: when the lockout ends, Login re-enables without a reload, the
  // banner clears and the count resets to 0.
  useEffect(() => {
    if (lockedUntil === null) return undefined;
    const delay = Math.min(Math.max(lockedUntil - Date.now(), 0), MAX_TIMEOUT_MS);
    const timer = setTimeout(() => {
      resetAttempts();
      setLockedUntil(null);
      setBanner((current) => (current?.kind === BANNER_KINDS.lockout ? null : current));
    }, delay);
    return () => clearTimeout(timer);
  }, [lockedUntil]);

  const clearError = (field) => {
    setErrors((current) => (current[field] ? { ...current, [field]: false } : current));
  };

  /** FR-26 / FR-30: count a wrong-credential failure; the one that reaches the limit starts the lockout. */
  const credentialFailure = (outcome, policy) => {
    let record;
    try {
      record = recordFailure({ maxFailedAttempts: policy?.maxFailedAttempts, lockoutMinutes: policy?.lockoutMinutes });
    } catch {
      record = { lockedUntil: null }; // No usable policy: count nothing, still say "incorrect".
    }
    if (record.lockedUntil !== null) {
      setLockedUntil(record.lockedUntil);
      setBanner(lockoutBanner(record.lockedUntil));
      return { outcome: OUTCOMES.tooManyAttempts, clearPassword: true };
    }
    setBanner(errorBanner(copy.login.errors.wrongCredentials));
    return { outcome, clearPassword: true };
  };

  /** FR-27: the Coach number comes from the runtime config. */
  const lockedAccount = async (user) => {
    let coachPhone;
    try {
      coachPhone = (await getConfig())?.coach?.phone;
    } catch {
      coachPhone = undefined;
    }
    if (!mounted.current || typeof coachPhone !== 'string' || coachPhone.trim() === '') {
      return { outcome: OUTCOMES.unavailable };
    }
    setBanner(errorBanner(accountLockedMessage({ lockedUntil: user.lockedUntil, coachPhone })));
    return { outcome: OUTCOMES.locked };
  };

  const attempt = async (username, password) => {
    // FR-31: the check is abandoned after policy.requestTimeoutMs, counted from submit.
    const controller = new AbortController();
    const startedAt = Date.now();
    const timeout = { timer: undefined, fired: false };
    const onLoaded = (users) => {
      const limit = positiveNumber(users?.policy?.requestTimeoutMs);
      if (limit === null) return;
      const remaining = Math.min(Math.max(limit - (Date.now() - startedAt), 0), MAX_TIMEOUT_MS);
      timeout.timer = setTimeout(() => {
        timeout.fired = true;
        controller.abort();
      }, remaining);
    };

    request.current = controller;
    let data;
    try {
      data = await getUsers({ signIn: true, signal: controller.signal, username, onLoaded });
    } catch {
      if (timeout.fired && mounted.current) {
        setBanner(errorBanner(copy.login.errors.timeout));
        return { outcome: OUTCOMES.timeout };
      }
      return { outcome: OUTCOMES.unavailable };
    } finally {
      clearTimeout(timeout.timer);
      request.current = null;
    }
    // Left the page while waiting: no Session, no navigation.
    if (!mounted.current) return { outcome: OUTCOMES.unavailable };

    const ttlMinutes = sessionTtlMinutes(data);
    if (ttlMinutes === null) return { outcome: OUTCOMES.unavailable };

    const result = checkCredentials(data, username, password);
    switch (result.outcome) {
      case OUTCOMES.unknownUser:
      case OUTCOMES.wrongPassword:
        return credentialFailure(result.outcome, data.policy);
      case OUTCOMES.locked:
        return lockedAccount(result.user);
      case OUTCOMES.inactive:
        setBanner(errorBanner(copy.login.errors.accountInactive));
        return { outcome: result.outcome };
      case OUTCOMES.passwordExpired:
        setBanner({ kind: BANNER_KINDS.passwordExpired, message: copy.login.errors.passwordExpired });
        return { outcome: result.outcome };
      default:
        break;
    }

    let written;
    try {
      written = signIn(result.user, { ttlMinutes });
    } catch {
      written = false; // RangeError: TTL outside what a Session may claim.
    }
    if (!written) return { outcome: OUTCOMES.unavailable };
    resetAttempts(); // FR-25 / FR-30: a successful sign-in resets the count.

    // FR-25: back to the remembered page or /dashboard, replacing /login.
    navigate(returnPath(location.state?.from), { replace: true });
    return { outcome: OUTCOMES.success };
  };

  const submit = async ({ username: rawUsername, password }) => {
    if (inFlight.current) return { outcome: OUTCOMES.busy };

    const now = Date.now();
    const lock = getAttempts(now).lockedUntil;

    // FR-22: trim the username only; the password is used exactly as typed.
    const username = String(rawUsername ?? '').trim();
    const pass = String(password ?? '');
    const missing = { username: username === '', password: pass === '' };
    if (missing.username || missing.password) {
      setErrors(missing);
      // FR-32: a new submit clears the banner, except a lockout that is still running.
      setBanner(lock !== null ? lockoutBanner(lock, now) : null);
      return { outcome: OUTCOMES.invalid, field: missing.username ? 'username' : 'password' };
    }
    setErrors(NO_ERRORS);

    // FR-30: no check runs during a lockout (also when another tab started it).
    if (lock !== null) {
      setLockedUntil(lock);
      setBanner(lockoutBanner(lock, now));
      return { outcome: OUTCOMES.tooManyAttempts };
    }

    // FR-31: offline at submit, so no check runs.
    if (isOffline()) {
      setBanner(errorBanner(copy.login.errors.offline));
      return { outcome: OUTCOMES.offline };
    }

    inFlight.current = true;
    setBanner(null);
    setLoading(true);
    try {
      return await attempt(username, pass);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  return { errors, loading, banner, locked: lockedUntil !== null, submit, clearError };
}
