// Data port (AD-7). The ONLY module that touches src/data/json/*.
//
// Each file is loaded through `?url` + fetch() so a real request exists that
// tests can intercept or fail (FR-96). `&no-inline` stops Vite from inlining
// the smaller files as data: URLs, which no network route could intercept. Every function returns a Promise and
// never throws synchronously; failures reject with `{ code, message }`.
//
// Latency: VITE_DATA_LATENCY_MS (default 300 in `npm run dev`, 0 in Vitest and
// production builds).
// Test seam: in dev and test builds only, `?__fail=dashboard|notifications|users`
// (comma-separated for several) forces the matching call to reject with
// `{ code: 'FORCED_FAIL' }`. The seam is compiled out of production builds.

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

function dataError(code, message) {
  return { code, message };
}

function latencyMs() {
  const raw = import.meta.env.VITE_DATA_LATENCY_MS;
  if (raw !== undefined && raw !== '') {
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return import.meta.env.DEV && import.meta.env.MODE !== 'test' ? DEV_DEFAULT_LATENCY_MS : 0;
}

function wait(ms) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function isForcedFail(key) {
  if (typeof window === 'undefined' || !window.location) return false;
  const value = new URLSearchParams(window.location.search).get('__fail');
  if (!value) return false;
  return value.split(',').map((part) => part.trim()).includes(key);
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
  try {
    return await response.json();
  } catch {
    throw dataError('LOAD_FAILED', `Could not parse ${label}.`);
  }
}

async function load(failKey, url, label) {
  // import.meta.env.DEV is a build-time constant: false in production, so
  // the whole seam is removed from the production bundle.
  if (import.meta.env.DEV && failKey && isForcedFail(failKey)) {
    throw dataError('FORCED_FAIL', `Forced failure for ${failKey} (?__fail).`);
  }
  await wait(latencyMs());
  return loadJson(url, label);
}

/** Dummy accounts and sign-in policy (PRD addendum §A). */
export function getUsers() {
  return load('users', usersUrl, 'users.json');
}

/**
 * One Dashboard state document (PRD addendum §B.3–B.5).
 * @param {'full'|'small'|'allgood'} [state='full']
 */
export async function getDashboard(state = 'full') {
  if (import.meta.env.DEV && isForcedFail('dashboard')) {
    throw dataError('FORCED_FAIL', 'Forced failure for dashboard (?__fail).');
  }
  if (!Object.hasOwn(DASHBOARD_URLS, state)) {
    throw dataError('NOT_FOUND', `Unknown dashboard state: ${String(state)}`);
  }
  return load(null, DASHBOARD_URLS[state], `dashboard.${state}.json`);
}

/** Notifications panel data (PRD addendum §B.7). */
export function getNotifications() {
  return load('notifications', notificationsUrl, 'notifications.json');
}

/** Runtime config: legal URLs and the SureTrack Coach number (public/app-config.json). */
export function getConfig() {
  return load(null, CONFIG_URL, 'app-config.json');
}
