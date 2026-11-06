// Copy encoding (AD-16): UI strings are verbatim PRD copy in UTF-8, with
// U+00B7 "·" and U+2019 "’" intact and no mojibake.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { copy, equipmentRowLabel, fill, runtimeValueLabel } from '../../src/lib/copy.js';
import { PRD_DIR, fromRoot, readText } from './support/project.js';

const MIDDOT = '·';
const RSQUO = '’';
const MOJIBAKE = /Â·|â€™|â€|Ã|�/;

const prd = readText(path.join(PRD_DIR, 'prd.md'));
const config = JSON.parse(readFileSync(fromRoot('public/app-config.json'), 'utf8'));

function leaves(object, prefix = '') {
  return Object.entries(object).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value]] : leaves(value, `${prefix}${key}.`),
  );
}

const SAMPLE = {
  time: '{time}', // PRD writes the slot literally
  coachPhone: config.coach.phone,
  name: 'Canola',
  amountLabel: '340k bu',
  share: '19',
  hours: '62',
  type: 'Bins',
  count: '7',
  caption: '3 alerts, 1 offline, 3 healthy',
  message: '<message>', // PRD writes the slot as <message>
};

describe('copy.js — file encoding', () => {
  const bytes = readFileSync(fromRoot('src/lib/copy.js'));

  it('is valid UTF-8 without a BOM', () => {
    expect(bytes[0]).not.toBe(0xef);
    expect(new TextDecoder('utf-8', { fatal: true }).decode(bytes)).toBeTruthy();
  });

  it('stores U+00B7 and U+2019 as real characters, not escapes or look-alikes', () => {
    const text = bytes.toString('utf8');
    expect(text).not.toMatch(MOJIBAKE);
    expect(copy.forgotPassword.intro).toContain(`we${RSQUO}ll`);
    expect(copy.dashboard.sectionError).toBe(`Couldn${RSQUO}t load this section.`);
    expect(copy.dashboard.segmentTooltip).toBe(`{name} ${MIDDOT} {amountLabel} ${MIDDOT} {share}% of capacity`);
  });

  it('keeps the PRD’s straight apostrophe in the reset confirmation (FR-47 note)', () => {
    expect(copy.forgotPassword.confirmation).toContain("we've");
  });
});

describe('copy.js — every string is verbatim PRD copy', () => {
  const strings = leaves(copy);

  it.each(strings)('%s', (_, template) => {
    const text = /\{\w+\}/.test(template) ? fill(template, SAMPLE) : template;
    expect(prd.includes(text.trim())).toBe(true);
  });

  it('keeps significant whitespace exactly', () => {
    expect(copy.login.legalLead).toBe('By clicking login, you hereby agree to our ');
    expect(copy.login.legalSeparator).toBe(' | ');
    expect(copy.forgotPassword.emailLabel).toBe('Email ');
    // The PRD quotes each piece in backticks, so the whitespace is part of the copy.
    expect(prd).toContain(`\`${copy.login.legalLead}\``);
    expect(prd).toContain(`\`${copy.login.legalSeparator}\``);
    expect(prd).toContain('`Email ` + `*`');
  });

  it('composes the FR-20 legal sentence from the PRD pieces', () => {
    const { legalLead, privacyPolicy, legalSeparator, termsOfService } = copy.login;
    expect(`${legalLead}${privacyPolicy}${legalSeparator}${termsOfService}`).toBe(
      'By clicking login, you hereby agree to our Privacy Policy | Terms of Service',
    );
    expect(prd).toContain(
      `Line 1: \`${legalLead}\` (Roboto Regular 400, 14px / 24px, \`#ffffff\`) followed by a hard line break.`,
    );
    expect(prd).toContain(`Line 2: \`${privacyPolicy}\` · \`${legalSeparator}\` · \`${termsOfService}\``);
  });

  it('is deeply frozen', () => {
    expect(Object.isFrozen(copy)).toBe(true);
    expect(Object.isFrozen(copy.login.errors)).toBe(true);
  });
});

describe('copy.js — helpers', () => {
  it('fill() throws on a missing slot instead of leaking "{slot}"', () => {
    expect(() => fill(copy.login.errors.tooManyAttempts, {})).toThrow(/time/);
    expect(fill(copy.login.errors.accountLocked, { coachPhone: config.coach.phone })).toBe(
      'Your account is locked. Contact SureTrack Coach (855) 293-5607.',
    );
  });

  it('builds the FR-72 row label and FR-81 value label', () => {
    expect(equipmentRowLabel({ type: 'Bins', count: 7, caption: `3 alerts ${MIDDOT} 1 offline ${MIDDOT} 3 healthy` })).toBe(
      'Bins, 7: 3 alerts, 1 offline, 3 healthy',
    );
    expect(equipmentRowLabel({ type: 'Bin', count: 1, caption: '1 alert' })).toBe('Bin, 1: 1 alert');
    expect(runtimeValueLabel(62)).toBe('62h');
    expect(runtimeValueLabel(0)).toBe('0h');
  });

  it('missing values hit the missing-slot error, never a TypeError or "undefinedh"', () => {
    expect(() => fill(copy.login.errors.tooManyAttempts, null)).toThrow(/missing value for \{time\}/);
    expect(() => runtimeValueLabel(undefined)).toThrow(/missing value for \{hours\}/);
    expect(() => runtimeValueLabel(null)).toThrow(/missing value for \{hours\}/);
    expect(() => equipmentRowLabel({ type: 'Bins', count: 7 })).toThrow(/missing value for \{caption\}/);
  });
});

describe('data JSON — copy characters survive', () => {
  const read = (file) => readFileSync(fromRoot('src/data/json', file), 'utf8');

  it.each(['users.json', 'dashboard.full.json', 'dashboard.small.json', 'dashboard.allgood.json', 'notifications.json'])(
    '%s has no mojibake',
    (file) => {
      expect(read(file)).not.toMatch(MOJIBAKE);
    },
  );

  it('keeps U+00B7, U+2019 and the design typo', () => {
    const full = JSON.parse(read('dashboard.full.json'));
    const allgood = JSON.parse(read('dashboard.allgood.json'));
    expect(full.kpi.attention.label).toBe(`Need attention ${MIDDOT} 2 critical`);
    expect(full.recentAlerts.items[3].title).toBe('Missing Fan Switched');
    expect(allgood.recentAlerts.empty.body).toContain(`We${RSQUO}ll notify you`);
  });
});
