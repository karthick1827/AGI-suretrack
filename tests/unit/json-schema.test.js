// JSON contracts (AD-7): the data files are the PRD addendum JSON, verbatim,
// and users.json satisfies the addendum §A.2 JSON Schema.
import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { PRD_DIR, customProperties, fromRoot, jsonBlockAfter, readText } from './support/project.js';

const addendum = readText(path.join(PRD_DIR, 'addendum.md'));
const readJson = (file) => JSON.parse(readText(fromRoot(file)));

const CONTRACTS = [
  ['users.json', '### A.3'],
  ['dashboard.full.json', '### B.3'],
  ['dashboard.small.json', '### B.4'],
  ['dashboard.allgood.json', '### B.5'],
  ['notifications.json', '### B.7'],
];

describe('src/data/json — verbatim copies of the PRD addendum', () => {
  it.each(CONTRACTS)('%s equals addendum %s character for character', (file, heading) => {
    expect(readText(fromRoot('src/data/json', file))).toBe(jsonBlockAfter(addendum, heading));
  });
});

// Minimal JSON Schema (2020-12) subset: exactly the keywords addendum §A.2 uses.
// Anything else throws, so a schema change can never be silently ignored.
const SUPPORTED_KEYWORDS = new Set([
  '$schema', '$id', '$defs', '$ref', 'title', 'description',
  'type', 'const', 'enum', 'not', 'minimum', 'minLength', 'pattern', 'format',
  'minItems', 'items', 'required', 'properties', 'additionalProperties', 'if', 'then',
]);
const SUPPORTED_FORMATS = new Set(['email', 'date-time']);

function resolveRef(ref, root) {
  if (!ref.startsWith('#')) throw new Error(`Unsupported $ref (only local refs): ${ref}`);
  const pointer = ref.slice(1);
  if (pointer === '') return root;
  if (!pointer.startsWith('/')) throw new Error(`Unsupported $ref (not a JSON pointer): ${ref}`);
  return pointer
    .slice(1)
    .split('/')
    .map((token) => decodeURIComponent(token).replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((node, key) => {
      if (node === null || typeof node !== 'object' || !Object.hasOwn(node, key)) {
        throw new Error(`$ref target not found: ${ref} (missing "${key}")`);
      }
      return node[key];
    }, root);
}

function validate(schema, value, root = schema, at = '$') {
  const errors = [];
  for (const keyword of Object.keys(schema)) {
    if (!SUPPORTED_KEYWORDS.has(keyword)) throw new Error(`Unsupported schema keyword "${keyword}" at ${at}`);
  }
  if (schema.format !== undefined && !SUPPORTED_FORMATS.has(schema.format)) {
    throw new Error(`Unsupported format "${schema.format}" at ${at}`);
  }
  if (schema.additionalProperties !== undefined && schema.additionalProperties !== false) {
    throw new Error(`Unsupported additionalProperties value at ${at} (only false)`);
  }
  if (schema.$ref) {
    return validate(resolveRef(schema.$ref, root), value, root, at);
  }
  const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
  if (schema.type) {
    const allowed = [].concat(schema.type);
    const actual = typeOf(value);
    if (!allowed.includes(actual) && !(actual === 'integer' && allowed.includes('number'))) {
      errors.push(`${at}: expected ${allowed.join('|')}, got ${actual}`);
      return errors;
    }
  }
  if ('const' in schema && value !== schema.const) errors.push(`${at}: expected const ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${at}: not in enum`);
  if (schema.not && validate(schema.not, value, root, at).length === 0) errors.push(`${at}: matches not`);
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: < minimum`);
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${at}: too short`);
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) errors.push(`${at}: pattern`);
    if (schema.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`${at}: email`);
    if (schema.format === 'date-time' && Number.isNaN(Date.parse(value))) errors.push(`${at}: date-time`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${at}: minItems`);
    if (schema.items) value.forEach((item, i) => errors.push(...validate(schema.items, item, root, `${at}[${i}]`)));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${at}: missing ${key}`);
    for (const [key, child] of Object.entries(value)) {
      if (schema.properties?.[key]) errors.push(...validate(schema.properties[key], child, root, `${at}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${at}: unexpected ${key}`);
    }
  }
  if (schema.if && validate(schema.if, value, root, at).length === 0 && schema.then) {
    errors.push(...validate(schema.then, value, root, at));
  }
  return errors;
}

describe('users.json — addendum §A.2 schema and §A rules', () => {
  const schema = JSON.parse(jsonBlockAfter(addendum, '### A.2'));
  const users = readJson('src/data/json/users.json');

  it('validates against the schema', () => {
    expect(validate(schema, users)).toEqual([]);
  });

  it('the validator rejects a broken file', () => {
    const broken = structuredClone(users);
    broken.users[0].status = 'banned';
    broken.users[1].lockedUntil = '2099-01-01T09:00:00Z';
    delete broken.policy.lockoutMinutes;
    expect(validate(schema, broken)).toHaveLength(3);
  });

  it('the validator refuses what it cannot check', () => {
    expect(() => validate({ maxLength: 3 }, 'abcd')).toThrow(/Unsupported schema keyword "maxLength"/);
    expect(() => validate({ type: 'string', format: 'uri' }, 'x')).toThrow(/Unsupported format "uri"/);
    expect(() => validate({ $ref: '#/$defs/missing', $defs: {} }, 1)).toThrow(/\$ref target not found/);
    expect(validate({ $ref: '#/$defs/a~1b~0c', $defs: { 'a/b~c': { type: 'integer' } } }, 1)).toEqual([]);
  });

  it('usernames are unique, case-insensitively', () => {
    const names = users.users.map((u) => u.username.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('carries the sign-in policy (5 / 15 min / 15 s / 800 ms / 480 min)', () => {
    expect(users.policy).toEqual({
      maxFailedAttempts: 5,
      lockoutMinutes: 15,
      requestTimeoutMs: 15000,
      simulatedLatencyMs: 800,
      sessionTtlMinutes: 480,
    });
  });
});

describe('dashboard.<state>.json — addendum §B.2 contract', () => {
  const tokens = [...customProperties(readText(fromRoot('src/styles/tokens.css'))).values()].map((v) => v.toLowerCase());
  const FRAMES = { full: '6215:58878', small: '6864:4514', allgood: '6879:15603' };
  const BOTTOM = { full: 16, small: 28, allgood: 24 };

  it.each(Object.keys(FRAMES))('%s has the contract shape', (state) => {
    const doc = readJson(`src/data/json/dashboard.${state}.json`);
    expect(doc.state).toBe(state);
    expect(doc.figmaFrame).toBe(FRAMES[state]);
    expect(doc.pageBottomSpacePx).toBe(BOTTOM[state]);
    expect(Object.keys(doc).sort()).toEqual(
      ['equipmentCard', 'fanActivity', 'figmaFrame', 'grain', 'header', 'kpi', 'liquid', 'pageBottomSpacePx', 'pageTitle', 'recentAlerts', 'state'],
    );
    expect(doc.header.tabs).toEqual(['Dashboard', 'Equipment', 'Alerts']);
    expect(doc.fanActivity.chart.map((d) => d.barPx)).toEqual([54, 61, 66, 72, 68, 79, 76]);
    expect(doc.recentAlerts.items.length).toBeLessThanOrEqual(4);
    expect(doc.recentAlerts.empty === null).toBe(doc.recentAlerts.items.length > 0);
    expect(doc.liquid.empty === null).toBe(doc.liquid.items.length > 0);
    for (const item of doc.recentAlerts.items) {
      expect(['Critical', 'Warning']).toContain(item.severity);
      expect(['hotspot', 'fans', 'connection', 'fan-switches']).toContain(item.actionKey);
    }
    for (const row of doc.equipmentCard.rows) {
      expect(['bins', 'piles', 'flats', 'tanks', 'dryers']).toContain(row.typeKey);
    }
  });

  it.each(Object.keys(FRAMES))('%s commodity / product colours are design tokens', (state) => {
    const doc = readJson(`src/data/json/dashboard.${state}.json`);
    for (const item of [...doc.grain.items, ...doc.liquid.items]) {
      expect(tokens).toContain(item.color.toLowerCase());
    }
  });
});

describe('notifications.json — addendum §B.6 contract', () => {
  const doc = readJson('src/data/json/notifications.json');

  it('has chips and items with known tags', () => {
    expect(doc.chips.map((c) => c.label)).toEqual(['All', 'App', 'Equipment', 'Promotions']);
    expect(doc.items).toHaveLength(6);
    for (const item of doc.items) {
      expect(['App', 'Promotion', 'Equipment']).toContain(item.tag);
      expect(item.time).toMatch(/^[A-Z][a-z]{2} \d{2} \| \d{1,2}:\d{2} (am|pm)$/);
      expect(item.unread).toBe(true);
    }
    expect(doc.items[3].message).toContain('\n');
  });
});

describe('public/app-config.json — runtime config (AD-7)', () => {
  const config = readJson('public/app-config.json');

  it('holds the placeholder legal URLs and the Coach number', () => {
    expect(config.legal).toEqual({
      privacyPolicyUrl: 'https://example.com/privacy',
      termsOfServiceUrl: 'https://example.com/terms',
    });
    expect(config.coach.phone).toBe('(855) 293-5607');
    expect(config.coach.tel).toBe('tel:+18552935607');
  });
});
