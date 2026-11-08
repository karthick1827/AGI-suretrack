// Sign-in flow for the Login form (FR-22–FR-34, AD-9).
//
// Check order (PRD FR-24, addendum A.5 rule 2): double-submit guard → active
// too-many-attempts lockout (a submit guard: the Login button is only
// aria-disabled, so Enter could still submit) → required fields (no data call)
// → offline → load users.json with the sign-in latency, all under one
// FR-31 deadline → credentials → locked → inactive / no subscription →
// password expired → Session + redirect.
//
// Every failure after the required-field check shows its verbatim message in
// the one alert banner (FR-32); account-status messages appear only after a
// correct password. Wrong credentials count towards the lockout held by
// session.js (FR-30). No failure creates a Session.
//
// Service failures (users.json fails to load, an unusable policy, the Session
// cannot be written, the Coach number is missing or the config fails) have no
// PRD message of their own. They reuse existing FR-31 copy, never new copy:
// the offline message when the browser reports it is offline, otherwise the
// timeout message (`The server did not respond in time. Please try again.`),
// the closest existing "service unavailable" wording. The user is never left
// without a banner.
//
// Dummy-build limits: the lockout is counted per browser (not per account) and
// the per-account `simulatedLatencyMs` exists only to exercise the timeout.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { MAX_TIMEOUT_MS, getConfig, getUsers } from '../../data/api.js';
import { accountLockedMessage, copy, tooManyAttemptsMessage } from '../../lib/copy.js';
import { RESERVED_PREFIXES, paths } from '../../lib/paths.js';
import {
  MAX_SESSION_TTL_MINUTES,
  endLockout,
  getAttempts,
  recordFailure,
  resetAttempts,
  signIn,
  subscribeAttempts,
} from '../../lib/session.js';

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

/** Banner kinds: `passwordExpired` adds the FR-29 reset link; `lockout` text is built at render time. */
export const BANNER_KINDS = Object.freeze({
  error: 'error',
  lockout: 'lockout',
  passwordExpired: 'password-expired',
  sessionExpired: 'session-expired',
});

/** FR-31 deadline used from submit until users.json gives `policy.requestTimeoutMs` (same value, 15 s). */
export const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

const LOCKOUT_BANNER = Object.freeze({ kind: BANNER_KINDS.lockout });
const errorBanner = (message) => ({ kind: BANNER_KINDS.error, message });

/** FR-31: the browser reports it is offline. */
function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** A positive finite number, else null. */
function positiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

/** Every policy field sign-in needs, validated up front; null when any is unusable. */
function readPolicy(data) {
  const policy = data?.policy;
  const maxFailedAttempts = policy?.maxFailedAttempts;
  const lockoutMinutes = positiveNumber(policy?.lockoutMinutes);
  const requestTimeoutMs = positiveNumber(policy?.requestTimeoutMs);
  const sessionTtlMinutes = positiveNumber(policy?.sessionTtlMinutes);
  if (
    !Number.isSafeInteger(maxFailedAttempts) ||
    maxFailedAttempts < 1 ||
    lockoutMinutes === null ||
    requestTimeoutMs === null ||
    sessionTtlMinutes === null ||
    sessionTtlMinutes > MAX_SESSION_TTL_MINUTES
  ) {
    return null;
  }
  return { maxFailedAttempts, lockoutMinutes, requestTimeoutMs, sessionTtlMinutes };
}

/** `promise`, but rejecting with ABORTED as soon as `signal` aborts (even if the callee ignores it). */
function untilAborted(promise, signal) {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject({ code: 'ABORTED', message: 'Sign-in check abandoned.' });
    if (signal.aborted) {
      onAbort();
      promise.catch(() => {});
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

/** Local midnight after `now`, in epoch ms. */
function nextMidnight(now) {
  const date = new Date(now);
  date.setHours(24, 0, 0, 0);
  return date.getTime();
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
  // The clock the lockout text is formatted against (same-day `h:mm A` vs dated);
  // refreshed when a lockout is adopted and at local midnight during one.
  const [now, setNow] = useState(() => Date.now());
  const [banner, setBanner] = useState(() => {
    if (lockedUntil !== null) return LOCKOUT_BANNER;
    // FR-34: RequireSession / SessionSync send an expired Session here with reason 'expired'.
    if (location.state?.reason === 'expired') {
      return { kind: BANNER_KINDS.sessionExpired, message: copy.login.errors.sessionExpired };
    }
    return null;
  });
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const request = useRef(null);

  /** Show the stored lockout state: start, move or end it (this tab, another tab, or the end timer). */
  const adoptLock = (lock) => {
    setLockedUntil(lock);
    setNow(Date.now());
    if (lock !== null) setBanner(LOCKOUT_BANNER);
    else setBanner((current) => (current?.kind === BANNER_KINDS.lockout ? null : current));
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  // FR-34: the expired notice is shown once. Drop `reason` from the history
  // entry (keeping `from`), so a reload or Back does not show it again.
  useEffect(() => {
    if (location.state?.reason !== 'expired') return;
    const { reason: _reason, ...rest } = location.state;
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: rest });
  }, [location, navigate]);

  // FR-30: another tab's lockout disables Login here at once; its reset re-enables it.
  useEffect(() => subscribeAttempts(() => adoptLock(getAttempts().lockedUntil)), []);

  // FR-30: when the lockout ends, Login re-enables without a reload, the banner
  // clears and the count resets to 0. The timer is clamped to setTimeout's
  // maximum and re-armed; it also wakes at local midnight to refresh the time
  // format. When it fires it trusts storage: a newer lockout is adopted, and
  // only the record for THIS lockout is removed.
  useEffect(() => {
    if (lockedUntil === null) return undefined;
    let timer;
    const arm = () => {
      const current = Date.now();
      const wake = Math.min(lockedUntil, nextMidnight(current));
      timer = setTimeout(onWake, Math.min(Math.max(wake - current, 0), MAX_TIMEOUT_MS));
    };
    const onWake = () => {
      const current = Date.now();
      const stored = getAttempts(current).lockedUntil;
      if (stored !== null && stored !== lockedUntil) {
        adoptLock(stored); // a newer lockout: this effect re-runs for it
        return;
      }
      if (current < lockedUntil) {
        if (stored === null) {
          adoptLock(null); // reset elsewhere
          return;
        }
        setNow(current); // midnight or a clamped delay: refresh the text, keep waiting
        arm();
        return;
      }
      endLockout(lockedUntil);
      adoptLock(null);
    };
    arm();
    return () => clearTimeout(timer);
  }, [lockedUntil]);

  const clearError = (field) => {
    setErrors((current) => (current[field] ? { ...current, [field]: false } : current));
  };

  /** A service failure (see the header): offline copy when offline, else the timeout copy. */
  const serviceFailure = () => {
    if (isOffline()) {
      setBanner(errorBanner(copy.login.errors.offline));
      return { outcome: OUTCOMES.offline };
    }
    setBanner(errorBanner(copy.login.errors.timeout));
    return { outcome: OUTCOMES.unavailable };
  };

  /** FR-26 / FR-30: count a wrong-credential failure; the one that reaches the limit starts the lockout. */
  const credentialFailure = (outcome, policy) => {
    const record = recordFailure(policy);
    if (record.lockedUntil !== null) {
      adoptLock(record.lockedUntil);
      return { outcome: OUTCOMES.tooManyAttempts, clearPassword: true };
    }
    setBanner(errorBanner(copy.login.errors.wrongCredentials));
    return { outcome, clearPassword: true };
  };

  /** The checks after submit; every await is bounded by `signal` (the FR-31 deadline). */
  const check = async (username, password, signal, tighten) => {
    const data = await untilAborted(
      getUsers({
        signIn: true,
        signal,
        username,
        onLoaded: (users) => {
          const limit = positiveNumber(users?.policy?.requestTimeoutMs);
          if (limit !== null) tighten(limit);
        },
      }),
      signal,
    );
    // Left the page while waiting: no Session, no navigation.
    if (!mounted.current) return { outcome: OUTCOMES.unavailable };

    const policy = readPolicy(data);
    if (policy === null) return serviceFailure();

    const result = checkCredentials(data, username, password);
    switch (result.outcome) {
      case OUTCOMES.unknownUser:
      case OUTCOMES.wrongPassword:
        return credentialFailure(result.outcome, policy);
      case OUTCOMES.locked: {
        // FR-27: the Coach number comes from the runtime config.
        const config = await untilAborted(getConfig({ signal }), signal);
        if (!mounted.current) return { outcome: OUTCOMES.unavailable };
        const coachPhone = config?.coach?.phone;
        if (typeof coachPhone !== 'string' || coachPhone.trim() === '') return serviceFailure();
        setBanner(errorBanner(accountLockedMessage({ lockedUntil: result.user.lockedUntil, coachPhone })));
        return { outcome: OUTCOMES.locked };
      }
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
      written = signIn(result.user, { ttlMinutes: policy.sessionTtlMinutes });
    } catch {
      written = false; // RangeError: TTL outside what a Session may claim.
    }
    if (!written) return serviceFailure();
    resetAttempts(); // FR-25 / FR-30: a successful sign-in resets the count.

    // FR-25: back to the remembered page or /dashboard, replacing /login.
    navigate(returnPath(location.state?.from), { replace: true });
    return { outcome: OUTCOMES.success };
  };

  /**
   * FR-31: one AbortController and one deadline, armed at submit with
   * DEFAULT_REQUEST_TIMEOUT_MS and re-armed to `policy.requestTimeoutMs`
   * (still counted from submit) once users.json has loaded. It covers the
   * users.json fetch, the sign-in latency and the locked path's config load.
   */
  const attempt = async (username, password) => {
    const controller = new AbortController();
    const startedAt = Date.now();
    const deadline = { timer: undefined, fired: false };
    const arm = (limitMs) => {
      clearTimeout(deadline.timer);
      const remaining = Math.min(Math.max(limitMs - (Date.now() - startedAt), 0), MAX_TIMEOUT_MS);
      deadline.timer = setTimeout(() => {
        deadline.fired = true;
        controller.abort();
      }, remaining);
    };
    arm(DEFAULT_REQUEST_TIMEOUT_MS);
    request.current = controller;
    try {
      return await check(username, password, controller.signal, arm);
    } catch {
      if (!mounted.current) return { outcome: OUTCOMES.unavailable };
      if (deadline.fired) {
        setBanner(errorBanner(copy.login.errors.timeout));
        return { outcome: OUTCOMES.timeout };
      }
      return serviceFailure(); // includes offline detected after a failed fetch
    } finally {
      clearTimeout(deadline.timer);
      request.current = null;
    }
  };

  const submit = async ({ username: rawUsername, password }) => {
    if (inFlight.current) return { outcome: OUTCOMES.busy };

    // FR-30 submit guard: no check runs during a lockout (also one another tab started).
    const lock = getAttempts().lockedUntil;
    if (lock !== lockedUntil) adoptLock(lock);
    if (lock !== null) return { outcome: OUTCOMES.tooManyAttempts };

    // FR-22: trim the username only; the password is used exactly as typed.
    const username = String(rawUsername ?? '').trim();
    const pass = String(password ?? '');
    const missing = { username: username === '', password: pass === '' };
    if (missing.username || missing.password) {
      setErrors(missing);
      setBanner(null); // FR-32: a new submit clears the banner.
      return { outcome: OUTCOMES.invalid, field: missing.username ? 'username' : 'password' };
    }
    setErrors(NO_ERRORS);

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

  // FR-30: the lockout text is built at render time from `lockedUntil` and the clock.
  let shown = banner;
  if (banner?.kind === BANNER_KINDS.lockout) {
    const message = lockedUntil === null ? null : tooManyAttemptsMessage(lockedUntil, now);
    shown = message === null ? null : { kind: BANNER_KINDS.lockout, message };
  }

  return { errors, loading, banner: shown, locked: lockedUntil !== null, submit, clearError };
}
