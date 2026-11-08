// Dashboard state resolver (AD-11). Pure: no React, DOM or storage.
//
// The state resolves ONCE, in this order, each unknown value falling through
// to the next source: `?state=full|small|allgood` in the URL, then the
// Session's `dashboardState`, then `full`.
import { DASHBOARD_STATES } from './paths.js';

export const DEFAULT_DASHBOARD_STATE = DASHBOARD_STATES[0];

const isState = (value) => typeof value === 'string' && DASHBOARD_STATES.includes(value);

/**
 * @param {string | URLSearchParams | null | undefined} search  `location.search` (with or without `?`)
 * @param {{ dashboardState?: string } | null | undefined} session  the Session record, or null
 * @returns {'full' | 'small' | 'allgood'}
 */
export function resolveDashboardState(search, session) {
  let fromUrl = null;
  try {
    fromUrl = (search instanceof URLSearchParams ? search : new URLSearchParams(search ?? '')).get('state');
  } catch {
    fromUrl = null;
  }
  if (isState(fromUrl)) return fromUrl;
  if (isState(session?.dashboardState)) return session.dashboardState;
  return DEFAULT_DASHBOARD_STATE;
}
