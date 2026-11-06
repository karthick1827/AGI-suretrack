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
const MAX_TIMEOUT_MS = 2147483647; // setTimeout's maximum delay

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

function wait(ms) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
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

async function loadJson(url, label) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw dataError('LOAD_FAILED', `Could not load ${label}.`);
  }
  if (!response.ok) {
    throw dataError('LOAD_FAILED', `Could not load ${label} (HTTP ${response.status}).`);
  }
  let body;
  try {
    body = await response.json();
  } catch {
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
 */
async function load(failKey, resolveSource) {
  // import.meta.env.DEV is a build-time constant: false in production, so
  // the whole seam is removed from the production bundle.
  if (import.meta.env.DEV && isForcedFail(failKey)) {
    throw dataError('FORCED_FAIL', `Forced failure for ${failKey} (?__fail).`);
  }
  const { url, label } = resolveSource();
  await wait(latencyMs());
  return loadJson(url, label);
}

/** Dummy accounts and sign-in policy (PRD addendum §A). */
export function getUsers() {
  return load('users', () => ({ url: usersUrl, label: 'users.json' }));
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

/** Runtime config: legal URLs and the SureTrack Coach number (public/app-config.json). */
export function getConfig() {
  return load('config', () => ({ url: CONFIG_URL, label: 'app-config.json' }));
}
