// Single source of every app URL (AD-10). Pure: no React, DOM or storage.
//
// Paths are exactly PRD FR-57 and FR-75 (plus /login and /dashboard) and
// supersede PRD addendum §C.1. Components use these builders and never write a
// "/"-prefixed URL literal. The app must never own /api/*, /markdown* or
// /markdown.html — those belong to Markdown Studio on the same dev server.

export const DASHBOARD_STATES = Object.freeze(['full', 'small', 'allgood']);
export const EQUIPMENT_TYPES = Object.freeze(['bins', 'piles', 'flats', 'tanks', 'dryers']);
export const EQUIPMENT_STATUSES = Object.freeze(['online', 'offline']);
export const ALERT_ACTION_KEYS = Object.freeze(['hotspot', 'fans', 'connection', 'fan-switches']);

/** Prefixes owned by Markdown Studio; no app route may start with these. */
export const RESERVED_PREFIXES = Object.freeze(['/api', '/markdown']);

/** Route patterns for the route table (src/app/routes.jsx). */
export const routePatterns = Object.freeze({
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  equipment: '/equipment',
  equipmentDetail: '/equipment/:deviceId',
  alertAction: '/equipment/:deviceId/:actionKey',
  alerts: '/alerts',
});

function assertOneOf(value, allowed, name) {
  if (!allowed.includes(value)) {
    throw new TypeError(`${name} must be one of ${allowed.join(', ')}; got ${String(value)}`);
  }
}

function assertDeviceId(deviceId) {
  if (typeof deviceId !== 'string' || deviceId === '') {
    throw new TypeError(`deviceId must be a non-empty string; got ${String(deviceId)}`);
  }
}

export const paths = Object.freeze({
  root: () => routePatterns.root,

  login: () => routePatterns.login,

  /** `/dashboard`, or `/dashboard?state=<state>` (FR-93). */
  dashboard: (state) => {
    if (state === undefined || state === null) return routePatterns.dashboard;
    assertOneOf(state, DASHBOARD_STATES, 'state');
    return `${routePatterns.dashboard}?state=${state}`;
  },

  /** `/equipment`, `/equipment?type=<type>` or `/equipment?status=<status>` (FR-57, FR-64, FR-72). */
  equipment: ({ type, status } = {}) => {
    if (type !== undefined && status !== undefined) {
      throw new TypeError('equipment() takes either type or status, not both');
    }
    if (type !== undefined) {
      assertOneOf(type, EQUIPMENT_TYPES, 'type');
      return `${routePatterns.equipment}?type=${type}`;
    }
    if (status !== undefined) {
      assertOneOf(status, EQUIPMENT_STATUSES, 'status');
      return `${routePatterns.equipment}?status=${status}`;
    }
    return routePatterns.equipment;
  },

  /** `/equipment/<deviceId>` (FR-57, FR-75 row activation). */
  equipmentDetail: (deviceId) => {
    assertDeviceId(deviceId);
    return `${routePatterns.equipment}/${encodeURIComponent(deviceId)}`;
  },

  /** `/equipment/<deviceId>/<actionKey>` (FR-75 Action link). */
  alertAction: (deviceId, actionKey) => {
    assertDeviceId(deviceId);
    assertOneOf(actionKey, ALERT_ACTION_KEYS, 'actionKey');
    return `${routePatterns.equipment}/${encodeURIComponent(deviceId)}/${actionKey}`;
  },

  alerts: () => routePatterns.alerts,
});
