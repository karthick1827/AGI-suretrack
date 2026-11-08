// Sign-in flow for the Login form (FR-22–FR-25, AD-9).
//
// Order: double-submit guard → required fields (no data call) → load users.json
// with the policy latency → credentials → account status → Session + redirect.
// Story 1.3 shows only the required-field errors and the loading state. Every
// other failure resolves to an `{ outcome }` code with no UI; Story 1.4 adds
// the messages, the lockout counter, offline and timeout handling.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getUsers } from '../../data/api.js';
import { RESERVED_PREFIXES, paths } from '../../lib/paths.js';
import { signIn } from '../../lib/session.js';

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
});

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
 *   submit: (values: { username: string, password: string }) => Promise<{ outcome: string, field?: string }>,
 *   clearError: (field: 'username' | 'password') => void,
 * }}
 */
export function useSignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errors, setErrors] = useState(NO_ERRORS);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const clearError = (field) => {
    setErrors((current) => (current[field] ? { ...current, [field]: false } : current));
  };

  const attempt = async (username, password) => {
    let data;
    try {
      data = await getUsers({ signIn: true });
    } catch {
      return { outcome: OUTCOMES.unavailable };
    }
    // Left the page while waiting: no Session, no navigation.
    if (!mounted.current) return { outcome: OUTCOMES.unavailable };

    const ttlMinutes = sessionTtlMinutes(data);
    if (ttlMinutes === null) return { outcome: OUTCOMES.unavailable };

    const result = checkCredentials(data, username, password);
    if (result.outcome !== OUTCOMES.success) return { outcome: result.outcome };

    let written;
    try {
      written = signIn(result.user, { ttlMinutes });
    } catch {
      written = false; // RangeError: TTL outside what a Session may claim.
    }
    if (!written) return { outcome: OUTCOMES.unavailable };

    // FR-25: back to the remembered page or /dashboard, replacing /login.
    navigate(returnPath(location.state?.from), { replace: true });
    return { outcome: OUTCOMES.success };
  };

  const submit = async ({ username: rawUsername, password }) => {
    if (inFlight.current) return { outcome: OUTCOMES.busy };

    // FR-22: trim the username only; the password is used exactly as typed.
    const username = String(rawUsername ?? '').trim();
    const pass = String(password ?? '');
    const missing = { username: username === '', password: pass === '' };
    if (missing.username || missing.password) {
      setErrors(missing);
      return { outcome: OUTCOMES.invalid, field: missing.username ? 'username' : 'password' };
    }

    inFlight.current = true;
    setErrors(NO_ERRORS);
    setLoading(true);
    try {
      return await attempt(username, pass);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  return { errors, loading, submit, clearError };
}
