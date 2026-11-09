// Fidelity check — Dashboard layout (Story 2.2): for each Dashboard state at
// 1366 px, every section box within ±1 px of the PRD frame, the exact
// document height (1052 / 860 / 856), and the card-shell / KPI-shell /
// card-header computed styles (FR-50, FR-59, FR-65, FR-93–FR-96, AD-18).
// Visual comparison against the 1× Figma renders waits for the card contents
// (Story 2.8); this story uses measurement audits only.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
import { BOX_TOLERANCE_PX, cssColour, readExpected, waitForFonts } from './support/fidelity.js';

const users = JSON.parse(readFileSync(path.resolve('src/data/json/users.json'), 'utf8'));
const demo = users.users.find((user) => user.username === 'demo');
const expected = readExpected('dashboard-layout.json');
const STATES = ['full', 'small', 'allgood'];
const CARD_KEYS = ['equipmentCard', 'recentAlerts', 'fanActivity', 'grain', 'liquid'];
const DASHBOARD_JSON = /\/dashboard\.(full|small|allgood)[^/]*\.json(\?|$)/;

/** Sign in as `demo` by writing the Session record, then open `url`. */
async function openSignedIn(page, url) {
  await page.goto(paths.login());
  const record = createSessionRecord(demo, { now: Date.now(), ttlMinutes: users.policy.sessionTtlMinutes });
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SESSION_KEY, JSON.stringify(record)]);
  await page.goto(url);
}

async function waitForStatus(page, status) {
  await expect(page.locator('[data-section]')).toHaveCount(6);
  await expect(page.locator(`[data-section][data-status="${status}"]`)).toHaveCount(6);
}

/** Every section box (page coords) and the document height. */
function measure(page) {
  return page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    width: document.documentElement.scrollWidth,
    sections: Object.fromEntries(
      [...document.querySelectorAll('[data-section]')].map((el) => {
        const r = el.getBoundingClientRect();
        return [el.dataset.section, { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height }];
      }),
    ),
  }));
}

function boxProblems(got, want) {
  const problems = [];
  for (const [key, box] of Object.entries(want.sections)) {
    const actual = got.sections[key];
    if (!actual) {
      problems.push(`${key}: missing`);
      continue;
    }
    for (const k of ['x', 'y', 'w', 'h']) {
      if (Math.abs(actual[k] - box[k]) > BOX_TOLERANCE_PX) problems.push(`${key}.${k}: expected ${box[k]}, got ${actual[k]}`);
    }
  }
  if (Object.keys(got.sections).join() !== Object.keys(want.sections).join()) {
    problems.push(`section order: ${Object.keys(got.sections).join()}`);
  }
  if (got.height !== want.height) problems.push(`document height: expected ${want.height}, got ${got.height}`);
  if (got.width !== 1366) problems.push(`document width: expected 1366, got ${got.width}`);
  return problems;
}

test.describe('Dashboard layout 6215:58878 / 6864:4514 / 6879:15603', () => {
  for (const state of STATES) {
    test(`${state}: every section box ±1 px and the exact frame height (${expected[state].height})`, async ({ page }) => {
      await openSignedIn(page, paths.dashboard(state));
      await waitForStatus(page, 'ready');
      await waitForFonts(page);
      expect(boxProblems(await measure(page), expected[state])).toEqual([]);
    });
  }

  test('card shell, KPI shell and card header: exact computed styles (FR-59, FR-65)', async ({ page }) => {
    await openSignedIn(page, paths.dashboard('full'));
    await waitForStatus(page, 'ready');
    await waitForFonts(page);

    const shells = await page.evaluate((keys) =>
      keys.map((key) => {
        const cs = getComputedStyle(document.querySelector(`[data-section="${key}"] > *`));
        return {
          backgroundColor: cs.backgroundColor,
          borderColor: [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor],
          borderWidth: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth],
          borderStyle: cs.borderTopStyle,
          radius: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius],
          padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft],
          filter: cs.filter,
        };
      }),
    CARD_KEYS);
    const c = expected.cardShell;
    for (const shell of shells) {
      expect(shell).toEqual({
        backgroundColor: cssColour(c.backgroundColor),
        borderColor: Array(4).fill(cssColour(c.borderColor)),
        borderWidth: Array(4).fill(c.borderWidth),
        borderStyle: c.borderStyle,
        radius: Array(4).fill(c.radius),
        padding: Array(4).fill(c.padding),
        filter: c.filter,
      });
    }

    const kpi = await page.locator(`[data-fid="${FID.kpi.strip}"]`).evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { backgroundColor: cs.backgroundColor, radius: cs.borderTopLeftRadius, boxShadow: cs.boxShadow, box: [r.x, r.y, r.width, r.height] };
    });
    expect(kpi).toEqual({
      backgroundColor: cssColour(expected.kpiShell.backgroundColor),
      radius: expected.kpiShell.radius,
      boxShadow: expected.kpiShell.boxShadow,
      box: [24, 136, 1318, 90],
    });

    // Card header ("Margin"): 56 px on Equipment, Recent Alerts and Fan
    // activity, 33 px nominal on Grain and Liquid; title and subtitle type.
    const headers = await page.evaluate((keys) =>
      Object.fromEntries(
        keys.map((key) => {
          const title = document.querySelector(`[data-section="${key}"] h2`);
          const subtitle = title.nextElementSibling;
          const header = title.parentElement.parentElement;
          const pick = (el) => {
            const cs = getComputedStyle(el);
            return { color: cs.color, fontWeight: cs.fontWeight, fontSize: cs.fontSize, lineHeight: cs.lineHeight };
          };
          const hr = header.getBoundingClientRect();
          const sr = header.parentElement.getBoundingClientRect();
          return [
            key,
            {
              h: hr.height,
              offset: [hr.x - sr.x, hr.y - sr.y],
              paddingBottom: getComputedStyle(header).paddingBottom,
              title: pick(title),
              subtitle: pick(subtitle),
            },
          ];
        }),
      ),
    CARD_KEYS);
    const h = expected.cardHeader;
    const type = (t) => ({ ...t, color: cssColour(t.color) });
    for (const key of CARD_KEYS) {
      const size = key === 'grain' || key === 'liquid' ? h.compact : h.regular;
      const muted = key !== 'equipmentCard' && key !== 'recentAlerts';
      expect(headers[key]).toEqual({
        h: size.h,
        offset: [21, 21],
        paddingBottom: size.paddingBottom,
        title: type(h.title),
        subtitle: type(muted ? h.subtitleMuted : h.subtitleDark),
      });
    }
  });

  test('error (intercepted JSON request): each section shows the error and Retry at its final box; Retry recovers', async ({ page }) => {
    let fail = true;
    await page.route(DASHBOARD_JSON, (route) => (fail ? route.abort() : route.continue()));
    await openSignedIn(page, paths.dashboard('small'));
    await waitForStatus(page, 'error');
    expect(boxProblems(await measure(page), expected.small)).toEqual([]);
    await expect(page.getByText(copy.dashboard.sectionError)).toHaveCount(6);
    await expect(page.locator(`[data-fid="${FID.shell.badge}"]`)).toHaveCount(0);

    fail = false;
    await page.getByRole('button', { name: copy.dashboard.retry }).first().click();
    await waitForStatus(page, 'ready');
    expect(boxProblems(await measure(page), expected.small)).toEqual([]);
    await expect(page.getByText(copy.dashboard.sectionError)).toHaveCount(0);
  });

  test('loading (delayed JSON request): placeholders at the final boxes, no layout shift when data arrives', async ({ page }) => {
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route(DASHBOARD_JSON, async (route) => {
      await gate;
      await route.continue();
    });
    await openSignedIn(page, paths.dashboard('allgood'));
    await waitForStatus(page, 'loading');
    const before = await measure(page);
    expect(boxProblems(before, expected.allgood)).toEqual([]);
    const block = await page.locator('[data-section="grain"] [aria-hidden="true"]').evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { backgroundColor: cs.backgroundColor, radius: cs.borderTopLeftRadius, w: r.width, h: r.height, animation: cs.animationName };
    });
    // Content box of a 426×326 card: minus the 1 px border and 20 px padding.
    expect(block).toEqual({ backgroundColor: cssColour('#f4f5f6'), radius: '8px', w: 384, h: 284, animation: 'none' });
    release();
    await waitForStatus(page, 'ready');
    expect(await measure(page)).toEqual(before);
  });
});
