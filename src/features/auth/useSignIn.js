// Sign-in flow for the Login form (FR-22–FR-25, AD-9).
//
// Order: double-submit guard → required fields (no data call) → load users.json
// with the policy latency → credentials → account status → Session + redirect.
// Story 1.3 shows only the required-field errors and the loading state. Every
// other failure resolves to an `{ outcome }` code with no UI; Story 1.4 adds
// the messages, the lockout counter, offline and timeout handling.
import { useRef, useState } from 'react';
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

/**
 * FR-11 / FR-25: only a same-origin, in-app path is a valid return target.
 * Anything else (absolute or protocol-relative URL, Markdown Studio paths,
 * /login itself) falls back to /dashboard.
 */
export function returnPath(from) {
  if (typeof from !== 'string' || !from.startsWith(paths.root()) || from.startsWith('//') || from.includes('\\')) {
    return paths.dashboard();
  }
  const pathname = from.split(/[?#]/)[0];
  if (pathname === paths.login() || RESERVED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return paths.dashboard();
  }
  return from;
}

/** Credentials and account-status checks (FR-24 steps 5–8). Pure. */
export function checkCredentials(data, username, password) {
  const wanted = username.toLowerCase();
  const users = Array.isArray(data?.users) ? data.users : [];
  const user = users.find((entry) => typeof entry?.username === 'string' && entry.username.toLowerCase() === wanted);
  if (!user) return { outcome: OUTCOMES.unknownUser };
  if (user.password !== password) return { outcome: OUTCOMES.wrongPassword };
  if (user.status === 'locked') return { outcome: OUTCOMES.locked, user };
  if (user.status === 'inactive' || user.subscriptionActive === false) return { outcome: OUTCOMES.inactive, user };
  if (user.passwordExpired === true) return { outcome: OUTCOMES.passwordExpired, user };
  return { outcome: OUTCOMES.success, user };
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

  const clearError = (field) => {
    setErrors((current) => (current[field] ? { ...current, [field]: false } : current));
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

    let data;
    try {
      data = await getUsers({ signIn: true });
    } catch {
      inFlight.current = false;
      setLoading(false);
      return { outcome: OUTCOMES.unavailable };
    }

    const result = checkCredentials(data, username, pass);
    if (result.outcome !== OUTCOMES.success) {
      inFlight.current = false;
      setLoading(false);
      return { outcome: result.outcome };
    }

    signIn(result.user, { ttlMinutes: data.policy.sessionTtlMinutes });
    // FR-25: back to the remembered page or /dashboard, replacing /login.
    navigate(returnPath(location.state?.from), { replace: true });
    return { outcome: OUTCOMES.success };
  };

  return { errors, loading, submit, clearError };
}
