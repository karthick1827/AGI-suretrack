// paths.js (AD-10) and fid.js (AD-15) — pure lib modules.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ALERT_ACTION_KEYS, RESERVED_PREFIXES, paths, routePatterns } from '../../src/lib/paths.js';
import { FID } from '../../src/lib/fid.js';
import { fromRoot } from './support/project.js';

describe('paths.js — FR-57 / FR-75 routes', () => {
  it('builds every placeholder route listed in FR-57', () => {
    const built = [
      paths.equipment(),
      ...['bins', 'piles', 'flats', 'tanks', 'dryers'].map((type) => paths.equipment({ type })),
      ...['online', 'offline'].map((status) => paths.equipment({ status })),
      paths.alerts(),
      paths.equipmentDetail('759'),
      ...ALERT_ACTION_KEYS.map((key) => paths.alertAction('759', key)),
    ];
    expect(built).toEqual([
      '/equipment',
      '/equipment?type=bins',
      '/equipment?type=piles',
      '/equipment?type=flats',
      '/equipment?type=tanks',
      '/equipment?type=dryers',
      '/equipment?status=online',
      '/equipment?status=offline',
      '/alerts',
      '/equipment/759',
      '/equipment/759/hotspot',
      '/equipment/759/fans',
      '/equipment/759/connection',
      '/equipment/759/fan-switches',
    ]);
  });

  it('builds /login and /dashboard with an optional state', () => {
    expect(paths.login()).toBe('/login');
    expect(paths.root()).toBe('/');
    expect(paths.dashboard()).toBe('/dashboard');
    expect(paths.dashboard('small')).toBe('/dashboard?state=small');
  });

  it('rejects values outside the FR-57 / FR-75 shapes', () => {
    expect(() => paths.dashboard('xyz')).toThrow(TypeError);
    expect(() => paths.equipment({ type: 'silos' })).toThrow(TypeError);
    expect(() => paths.equipment({ type: 'bins', status: 'online' })).toThrow(TypeError);
    expect(() => paths.alertAction('759', 'reboot')).toThrow(TypeError);
    expect(() => paths.equipmentDetail('')).toThrow(TypeError);
  });

  it.each([[''], ['   '], ['.'], ['..'], [759], [null], [undefined]])(
    'deviceId builders reject %j',
    (deviceId) => {
      expect(() => paths.equipmentDetail(deviceId)).toThrow(TypeError);
      expect(() => paths.alertAction(deviceId, 'hotspot')).toThrow(TypeError);
    },
  );

  it('encodes a deviceId as one path segment', () => {
    expect(paths.equipmentDetail('a/b')).toBe('/equipment/a%2Fb');
  });

  it('treats null options like no options, as dashboard(null) does', () => {
    expect(paths.equipment(null)).toBe('/equipment');
    expect(paths.equipment({ type: null })).toBe('/equipment');
    expect(paths.dashboard(null)).toBe('/dashboard');
  });

  it('never claims a Markdown Studio path (/api/*, /markdown*)', () => {
    for (const pattern of Object.values(routePatterns)) {
      for (const prefix of RESERVED_PREFIXES) expect(pattern.startsWith(prefix)).toBe(false);
    }
  });

  it('is pure: no React, DOM or storage', () => {
    const source = readFileSync(fromRoot('src/lib/paths.js'), 'utf8');
    expect(source).not.toMatch(/from 'react|window\.|document\.|localStorage|sessionStorage/);
  });
});

describe('fid.js — Figma node IDs', () => {
  const values = [];
  const collect = (node) => Object.values(node).forEach((v) => (typeof v === 'string' ? values.push(v) : collect(v)));
  collect(FID);

  it('holds node IDs verbatim (colon kept, instance paths allowed)', () => {
    expect(values.length).toBeGreaterThan(60);
    for (const id of values) expect(id).toMatch(/^I?\d+:\d+(;\d+:\d+)*$/);
  });

  it('maps each node once', () => {
    expect(new Set(values).size).toBe(values.length);
  });

  it('has the six PRD frames', () => {
    expect(FID.frames).toMatchObject({
      login: '6026:60111',
      forgotPassword: '6026:62907',
      dashboardFull: '6215:58878',
      dashboardSmall: '6864:4514',
      dashboardAllgood: '6879:15603',
      notifications: '8270:44312',
    });
    expect(Object.isFrozen(FID.login)).toBe(true);
  });
});
