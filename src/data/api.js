// Data port (AD-7). The ONLY module that touches src/data/json/*.
//
// Each file is loaded through `?url` + fetch() so a real request exists that
// tests can intercept or fail (FR-96). `&no-inline` stops Vite from inlining
// the smaller files as data: URLs, which no network route could intercept.
// Every function returns a Promise and never throws synchronously; failures
// reject with `{ code, message }`.
//
// Latency: VITE_DATA_LATENCY_MS in dev and test builds (default 300 in
// `npm run dev`, 0 under Vitest). Production builds always use 0.
// Test seam: in dev and test builds only, `?__fail=dashboard|notifications|users|config`
// (comma-separated, case-insensitive) forces the matching call to reject with
// `{ code: 'FORCED_FAIL' }`. The seam is compiled out of production builds.
//
// Every call follows one order: forced fail → known key (NOT_FOUND) →
// latency → fetch.

import usersUrl from './json/users.json?url&no-inline';
import dashboardFullUrl from './json/dashboard.full.json?url&no-inline';
import dashboardSmallUrl from './json/dashboard.small.json?url&no-inline';
import dashboardAllgoodUrl from './json/dashboard.allgood.json?url&no-inline';
import notificationsUrl from './json/notifications.json?url&no-inline';

const DASHBOARD_URLS = Object.freeze({
  full: dashboardFullUrl,
  small: dashboardSmallUrl,
  allgood: dashboardAllgoodUrl,
});

const CONFIG_URL = `${import.meta.env.BASE_URL}app-config.json`;
const DEV_DEFAULT_LATENCY_MS = 300;
/** setTimeout's maximum delay; the one copy every caller clamps to. */
export const MAX_TIMEOUT_MS = 2147483647;

function dataError(code, message) {
  return { code, message };
}

function latencyMs() {
  // Production build: always 0 (AD-7), whatever VITE_DATA_LATENCY_MS says.
  if (!import.meta.env.DEV) return 0;
  const raw = import.meta.env.VITE_DATA_LATENCY_MS;
  if (typeof raw === 'string' ? raw.trim() !== '' : raw !== undefined && raw !== null) {
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) return Math.min(value, MAX_TIMEOUT_MS);
  }
  return import.meta.env.MODE === 'test' ? 0 : DEV_DEFAULT_LATENCY_MS;
}

function abortError(label) {
  return dataError('ABORTED', `Request for ${label} was aborted.`);
}

/** Resolve after `ms`; reject with ABORTED as soon as `signal` aborts. */
function wait(ms, signal, label = 'data') {
  if (signal?.aborted) return Promise.reject(abortError(label));
  if (!(ms > 0)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError(label));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function isForcedFail(key) {
  if (typeof window === 'undefined' || !window.location) return false;
  const value = new URLSearchParams(window.location.search).get('__fail');
  if (!value) return false;
  return value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .includes(key);
}

async function loadJson(url, label, signal) {
  let response;
  try {
    response = await (signal ? fetch(url, { signal }) : fetch(url));
  } catch {
    if (signal?.aborted) throw abortError(label);
    throw dataError('LOAD_FAILED', `Could not load ${label}.`);
  }
  if (!response.ok) {
    throw dataError('LOAD_FAILED', `Could not load ${label} (HTTP ${response.status}).`);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    if (signal?.aborted) throw abortError(label);
    throw dataError('LOAD_FAILED', `Could not parse ${label}.`);
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw dataError('LOAD_FAILED', `Unexpected content in ${label}: expected a JSON object.`);
  }
  return body;
}

/**
 * The single loading path for every port function.
 * @param {string} failKey  `?__fail` key for this call
 * @param {() => { url: string, label: string }} resolveSource  throws NOT_FOUND for an unknown key
 * @param {AbortSignal} [signal]  aborts the latency wait and the fetch (rejects ABORTED)
 */
async function load(failKey, resolveSource, signal) {
  // import.meta.env.DEV is a build-time constant: false in production, so
  // the whole seam is removed from the production bundle.
  if (import.meta.env.DEV && isForcedFail(failKey)) {
    throw dataError('FORCED_FAIL', `Forced failure for ${failKey} (?__fail).`);
  }
  const { url, label } = resolveSource();
  await wait(latencyMs(), signal, label);
  return loadJson(url, label, signal);
}

/**
 * Dummy accounts and sign-in policy (PRD addendum §A).
 *
 * Latency, in this order: (1) the data latency every call has
 * (VITE_DATA_LATENCY_MS in dev/test builds, 0 in production) before the
 * fetch; then, with `{ signIn: true }` only, (2) the sign-in latency after the
 * fetch, in every build including production, so the Login loading state is
 * observable (FR-23, AD-7, AD-14). The sign-in latency is the matching
 * account's own `simulatedLatencyMs` when it has one (the `slow` account, FR-31),
 * else `policy.simulatedLatencyMs` (800 ms). This is the only place the
 * sign-in latency lives.
 *
 * Options:
 * - `signal`: an AbortSignal; aborting rejects with `{ code: 'ABORTED' }`
 *   (the caller's FR-31 timeout uses this).
 * - `username`: the typed username (trimmed, case-insensitive match) that
 *   selects the per-account latency.
 * - `onLoaded(users)`: called once users.json has loaded, before the sign-in
 *   latency, so the caller can arm its timeout from `policy.requestTimeoutMs`.
 * @param {{ signIn?: boolean, signal?: AbortSignal, username?: string, onLoaded?: (users: object) => void }} [options]
 */
export async function getUsers(options) {
  const signal = options?.signal;
  const users = await load('users', () => ({ url: usersUrl, label: 'users.json' }), signal);
  if (options?.signIn) {
    options.onLoaded?.(users);
    await wait(signInLatencyMs(users, options.username), signal, 'users.json');
  }
  return users;
}

function signInLatencyMs(users, username) {
  const wanted = typeof username === 'string' ? username.trim().toLowerCase() : '';
  const list = Array.isArray(users?.users) ? users.users : [];
  const account = wanted
    ? list.find((entry) => typeof entry?.username === 'string' && entry.username.toLowerCase() === wanted)
    : undefined;
  const own = account?.simulatedLatencyMs;
  const value =
    typeof own === 'number' && Number.isFinite(own) && own >= 0 ? own : Number(users?.policy?.simulatedLatencyMs);
  return Number.isFinite(value) && value > 0 ? Math.min(value, MAX_TIMEOUT_MS) : 0;
}

/**
 * One Dashboard state document (PRD addendum §B.3–B.5).
 * @param {'full'|'small'|'allgood'} [state='full']
 */
export function getDashboard(state = 'full') {
  return load('dashboard', () => {
    if (typeof state !== 'string' || !Object.hasOwn(DASHBOARD_URLS, state)) {
      throw dataError('NOT_FOUND', `Unknown dashboard state: ${String(state)}`);
    }
    return { url: DASHBOARD_URLS[state], label: `dashboard.${state}.json` };
  });
}

/** Notifications panel data (PRD addendum §B.7). */
export function getNotifications() {
  return load('notifications', () => ({ url: notificationsUrl, label: 'notifications.json' }));
}

/**
 * Runtime config: legal URLs and the SureTrack Coach number (public/app-config.json).
 * @param {{ signal?: AbortSignal }} [options]  aborting rejects with `{ code: 'ABORTED' }`
 */
export function getConfig(options) {
  return load('config', () => ({ url: CONFIG_URL, label: 'app-config.json' }), options?.signal);
}
