// Fidelity check — KPI strip (Story 2.3, FR-59 to FR-64): for each Dashboard
// state at 1366 px, the strip region screenshot against the strip cropped out
// of the 1× Figma render (≤ 0.5 %), every tile, icon and text box within
// ±1 px of the PRD table (expected/kpi-strip.json), exact computed styles and
// exact copy. macOS Chromium is authoritative; Windows runs are advisory.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
import {
  BOX_TOLERANCE_PX,
  KPI_STRIP_CLIP,
  MASKED_BASELINE_DIR,
  cssColour,
  diffRatio,
  kpiStripBaseline,
  readExpected,
  waitForFonts,
} from './support/fidelity.js';

const users = JSON.parse(readFileSync(path.resolve('src/data/json/users.json'), 'utf8'));
const demo = users.users.find((user) => user.username === 'demo');
const expected = readExpected('kpi-strip.json');
const STATES = ['full', 'small', 'allgood'];
const strip = (page) => page.locator(`[data-fid="${FID.kpi.strip}"]`);

/** Sign in as `demo`, open the Dashboard in `state` and wait for a stable render. */
async function openDashboard(page, state) {
  await page.goto(paths.login());
  const record = createSessionRecord(demo, { now: Date.now(), ttlMinutes: users.policy.sessionTtlMinutes });
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SESSION_KEY, JSON.stringify(record)]);
  await page.goto(paths.dashboard(state));
  await expect(page.locator('[data-section="kpi"][data-status="ready"]')).toHaveCount(1);
  await strip(page).waitFor();
  await waitForFonts(page);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  // No pointer over the page, no focus: the at-rest render (AD-13).
  await page.mouse.move(1360, 760);
}

/** Every KPI box in strip coordinates, plus the strip's own page box. */
function measureStrip(page, iconFids) {
  return strip(page).evaluate((el, fids) => {
    const s = el.getBoundingClientRect();
    const rel = (node) => {
      const r = node.getBoundingClientRect();
      return { x: r.x - s.x, y: r.y - s.y, w: r.width, h: r.height };
    };
    const tiles = Object.fromEntries(
      [...el.querySelectorAll('[data-kpi-tile]')].map((tile) => [
        tile.dataset.kpiTile,
        {
          box: rel(tile),
          value: rel(tile.querySelector('[data-kpi-value]')),
          label: rel(tile.querySelector('[data-kpi-label]')),
        },
      ]),
    );
    const icons = Object.fromEntries(
      fids.map((fid) => {
        const nodes = el.querySelectorAll(`[data-fid="${CSS.escape(fid)}"]`);
        return [fid, nodes.length === 1 ? rel(nodes[0]) : { count: nodes.length }];
      }),
    );
    return {
      page: { x: s.x + window.scrollX, y: s.y + window.scrollY, w: s.width, h: s.height },
      order: [...el.querySelectorAll('[data-kpi-tile]')].map((tile) => tile.dataset.kpiTile),
      tiles,
      icons,
    };
  }, iconFids);
}

function boxProblems(state, got) {
  const want = expected[state];
  const problems = [];
  const near = (name, actual, wanted) => {
    if (typeof actual !== 'number' || Math.abs(actual - wanted) > BOX_TOLERANCE_PX) {
      problems.push(`${state} ${name}: expected ${wanted}, got ${actual}`);
    }
  };
  for (const k of ['x', 'y', 'w', 'h']) near(`strip.${k}`, got.page[k], expected.strip[k]);
  if (got.order.join() !== Object.keys(want.tiles).join()) problems.push(`${state} tile order: ${got.order.join()}`);
  for (const [key, box] of Object.entries(want.tiles)) {
    const tile = got.tiles[key];
    if (!tile) {
      problems.push(`${state} ${key}: missing`);
      continue;
    }
    near(`${key}.x`, tile.box.x, box.x);
    near(`${key}.w`, tile.box.w, box.w);
    const sub = key.startsWith('equipment:');
    // Tiles are 70 high at y 10; a sub-count block is its text block.
    near(`${key}.y`, tile.box.y, sub ? expected.valueY : expected.tileY);
    if (!sub) near(`${key}.h`, tile.box.h, expected.tileH);
    near(`${key} value.x`, tile.value.x, sub ? box.x : want.textX[key]);
    near(`${key} value.y`, tile.value.y, expected.valueY);
    near(`${key} value.h`, tile.value.h, expected.valueH);
    near(`${key} label.x`, tile.label.x, sub ? box.x : want.textX[key]);
    near(`${key} label.y`, tile.label.y, expected.labelY);
    near(`${key} label.h`, tile.label.h, expected.labelH);
  }
  for (const [fid, box] of Object.entries(want.icons)) {
    const icon = got.icons[fid];
    if (icon.count !== undefined) {
      problems.push(`${state} icon ${fid}: expected exactly one, found ${icon.count}`);
      continue;
    }
    for (const k of ['x', 'y', 'w', 'h']) near(`icon ${fid}.${k}`, icon[k], box[k]);
  }
  return problems;
}

test.describe('KPI strip 6337:55041', () => {
  for (const state of STATES) {
    test(`${state}: strip screenshot matches the cropped Figma render (≤ 0.5 %)`, async ({ page }, testInfo) => {
      await openDashboard(page, state);
      const baseline = kpiStripBaseline(state);
      // The comparison file is the strip cropped from the committed 1× Figma
      // render by global-setup (alignment-checked); never an app screenshot.
      expect(existsSync(path.join(MASKED_BASELINE_DIR, baseline))).toBe(true);
      const actual = await page.screenshot({ clip: KPI_STRIP_CLIP, animations: 'disabled', caret: 'hide' });
      const ratio = await diffRatio(actual, readFileSync(path.join(MASKED_BASELINE_DIR, baseline)));
      const note = `pixel-diff ratio ≤ ${(ratio * 100).toFixed(3)} % (YIQ threshold 0.1, no AA exclusion)`;
      testInfo.annotations.push({ type: 'pixel-diff', description: note });
      process.stdout.write(`[fidelity] ${baseline}: ${note}\n`);
      // maxDiffPixelRatio / threshold come from playwright.config.js (single source).
      await expect(page).toHaveScreenshot(baseline, { clip: KPI_STRIP_CLIP });
    });

    test(`${state}: every tile, icon and text box ±1 px (FR-59–FR-63)`, async ({ page }) => {
      await openDashboard(page, state);
      const got = await measureStrip(page, Object.keys(expected[state].icons));
      expect(boxProblems(state, got)).toEqual([]);
      // Only this state's attention icon is drawn.
      const otherAttention = state === 'allgood' ? FID.kpi.iconAttention : FID.kpi.iconAllGood;
      await expect(page.locator(`[data-fid="${otherAttention}"]`)).toHaveCount(0);
      if (expected[state].group) {
        const group = await page.locator(`[data-fid="${expected[state].group.fid}"]`).evaluate((el) => {
          const r = el.getBoundingClientRect();
          const s = el.closest('[data-variant]').getBoundingClientRect();
          return { x: r.x - s.x, w: r.width, gap: getComputedStyle(el).columnGap };
        });
        expect(Math.abs(group.x - expected[state].group.x)).toBeLessThanOrEqual(BOX_TOLERANCE_PX);
        expect(Math.abs(group.w - expected[state].group.w)).toBeLessThanOrEqual(BOX_TOLERANCE_PX);
        expect(group.gap).toBe('20px');
      } else {
        await expect(page.locator(`[data-fid="${FID.kpi.statusGroupAllGood}"]`)).toHaveCount(0);
      }
    });

    test(`${state}: exact computed styles (FR-59, FR-60, FR-61, FR-62)`, async ({ page }) => {
      await openDashboard(page, state);
      const got = await strip(page).evaluate((el) => {
        const cs = (node) => getComputedStyle(node);
        const type = (node) => {
          const c = cs(node);
          return {
            fontFamily: c.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, ''),
            fontWeight: c.fontWeight,
            fontSize: c.fontSize,
            lineHeight: c.lineHeight,
            color: c.color,
          };
        };
        const tile = (key) => el.querySelector(`[data-kpi-tile="${key}"]`);
        const iconTile = (key) => tile(key).querySelector('img').parentElement;
        const s = cs(el);
        const tiles = [...el.querySelectorAll('[data-kpi-tile]')].filter((t) => !t.dataset.kpiTile.includes(':'));
        return {
          strip: {
            backgroundColor: s.backgroundColor,
            radius: s.borderTopLeftRadius,
            boxShadow: s.boxShadow,
            padding: `${s.paddingTop} ${s.paddingRight}`,
          },
          tiles: tiles.map((t) => {
            const c = cs(t);
            return {
              padding: `${c.paddingTop} ${c.paddingRight}`,
              gap: t.dataset.kpiTile === 'equipment' ? null : c.columnGap,
              divider: c.borderLeftStyle === 'none' ? 'none' : `${c.borderLeftWidth} ${c.borderLeftStyle} ${c.borderLeftColor}`,
              cursor: c.cursor,
              outline: c.outlineStyle,
            };
          }),
          equipmentGap: cs(tile('equipment')).columnGap,
          linkCursors: [...el.querySelectorAll('a')].map((a) => cs(a).cursor),
          values: [...el.querySelectorAll('[data-kpi-tile]')]
            .filter((t) => !t.dataset.kpiTile.includes(':'))
            .map((t) => type(t.querySelector('[data-kpi-value]'))),
          subValues: [...el.querySelectorAll('[data-kpi-tile^="equipment:"] [data-kpi-value]')].map(type),
          labels: [...el.querySelectorAll('[data-kpi-tile]')]
            .filter((t) => t.dataset.kpiTile !== 'attention')
            .map((t) => type(t.querySelector('[data-kpi-label]'))),
          attentionLabel: type(tile('attention').querySelector('[data-kpi-label]')),
          iconTiles: Object.fromEntries(
            ['attention', 'equipment', 'online', 'offline', 'fans'].map((key) => {
              const node = iconTile(key);
              const r = node.getBoundingClientRect();
              return [key, { backgroundColor: cs(node).backgroundColor, radius: cs(node).borderTopLeftRadius, w: r.width, h: r.height }];
            }),
          ),
        };
      });

      const st = expected.styles;
      const typeOf = (t) => ({ ...t, color: cssColour(t.color) });
      expect(got.strip).toEqual({ ...st.strip, backgroundColor: cssColour(st.strip.backgroundColor) });
      const [w, style, colour] = st.tile.divider.split(' ');
      expect(got.tiles).toEqual(
        got.tiles.map((_, i) => ({
          padding: st.tile.padding,
          gap: i === 1 ? null : st.tile.gap,
          divider: i === 0 ? 'none' : `${w} ${style} ${cssColour(colour)}`,
          // The Equipment tile wrapper is not a link: pointer only on <a>.
          cursor: i === 1 ? 'auto' : 'pointer',
          outline: 'none',
        })),
      );
      expect(got.equipmentGap).toBe('20px');
      expect(new Set(got.linkCursors)).toEqual(new Set(['pointer']));
      for (const value of got.values) expect(value).toEqual(typeOf(st.value));
      expect(got.subValues.length).toBe(Object.keys(expected[state].tiles).filter((k) => k.includes(':')).length);
      for (const value of got.subValues) expect(value).toEqual(typeOf({ ...st.value, fontWeight: expected[state].subCountWeight }));
      for (const label of got.labels) expect(label).toEqual(typeOf(st.label));
      expect(got.attentionLabel).toEqual(typeOf({ ...st.label, ...expected[state].attentionLabel }));
      const tileBg = { attention: expected[state].attentionIconTile, ...st.iconTiles };
      for (const [key, bg] of Object.entries(tileBg)) {
        expect(got.iconTiles[key]).toEqual({ backgroundColor: cssColour(bg), radius: st.iconTile.radius, w: st.iconTile.w, h: st.iconTile.h });
      }
    });

    test(`${state}: copy audit — every number and label verbatim (FR-61–FR-63)`, async ({ page }) => {
      await openDashboard(page, state);
      const got = await strip(page).evaluate((el) =>
        Object.fromEntries(
          [...el.querySelectorAll('[data-kpi-tile]')].map((tile) => [
            tile.dataset.kpiTile,
            [tile.querySelector('[data-kpi-value]').textContent, tile.querySelector('[data-kpi-label]').textContent],
          ]),
        ),
      );
      expect(got).toEqual(expected[state].copy);
      // Nothing else is written in the strip.
      expect(await strip(page).textContent()).toBe(Object.values(expected[state].copy).flat().join(''));
    });
  }

  // FR-64 targets per KPI link, keyed by data-kpi-tile (the Equipment total is
  // the `equipment` tile's link). Fans → /equipment is the FR-64 [ASSUMPTION].
  const FULL_TARGETS = {
    attention: paths.alerts(),
    equipment: paths.equipment(),
    'equipment:bins': paths.equipment({ type: 'bins' }),
    'equipment:piles': paths.equipment({ type: 'piles' }),
    'equipment:flats': paths.equipment({ type: 'flats' }),
    'equipment:tanks': paths.equipment({ type: 'tanks' }),
    'equipment:dryers': paths.equipment({ type: 'dryers' }),
    online: paths.equipment({ status: 'online' }),
    offline: paths.equipment({ status: 'offline' }),
    fans: paths.equipment(),
  };
  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const urlEndingWith = (target) => new RegExp(`${escapeRegExp(target)}$`);
  /** The pointer target for a KPI link: the tile, or the Equipment total block. */
  const linkLocator = (page, key) =>
    key === 'equipment' ? strip(page).locator('[data-kpi-link="equipment"]') : strip(page).locator(`[data-kpi-tile="${key}"]`);

  async function clickCentre(page, key) {
    const box = await linkLocator(page, key).boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  test('pointer: a real click at the centre of every Full tile and sub-count opens its FR-64 target', async ({ page }) => {
    for (const [key, target] of Object.entries(FULL_TARGETS)) {
      await openDashboard(page, 'full');
      await clickCentre(page, key);
      await expect(page, `${key} → ${target}`).toHaveURL(urlEndingWith(target));
    }
  });

  test('pointer: Small sub-counts Bin and Dryer open their type pages', async ({ page }) => {
    for (const [key, target] of [
      ['equipment:bins', paths.equipment({ type: 'bins' })],
      ['equipment:dryers', paths.equipment({ type: 'dryers' })],
    ]) {
      await openDashboard(page, 'small');
      await clickCentre(page, key);
      await expect(page, `${key} → ${target}`).toHaveURL(urlEndingWith(target));
    }
  });

  test('keyboard: Tab from the element before the strip visits every KPI link left to right with the FR-58 ring; Enter opens it', async ({ page }) => {
    await openDashboard(page, 'full');
    // Focus the last focusable element before the strip, then Tab into it.
    await strip(page).evaluate((el) => {
      const focusable = [...document.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]')].filter(
        (node) => node.tabIndex >= 0 && !el.contains(node) && node.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      focusable.at(-1).focus();
    });
    const ring = `solid 2px ${cssColour('#006a36')} 2px`;
    const order = [];
    for (let i = 0; i < Object.keys(FULL_TARGETS).length; i += 1) {
      await page.keyboard.press('Tab');
      const got = await page.evaluate(() => {
        const el = document.activeElement;
        const cs = getComputedStyle(el);
        return {
          key: el.closest('[data-kpi-tile]')?.dataset.kpiTile ?? null,
          tag: el.tagName,
          ring: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} ${cs.outlineOffset}`,
        };
      });
      order.push(got.key);
      expect(got.tag, `${got.key}`).toBe('A');
      expect(got.ring, `${got.key} focus ring`).toBe(ring);
    }
    expect(order).toEqual(Object.keys(FULL_TARGETS));
    // The next Tab leaves the strip.
    await page.keyboard.press('Tab');
    expect(await page.evaluate((fid) => Boolean(document.activeElement.closest(`[data-fid="${fid}"]`)), FID.kpi.strip)).toBe(false);

    await strip(page).locator('[data-kpi-tile="online"]').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(urlEndingWith(FULL_TARGETS.online));
  });

  test('accessible names: value and label joined by one space (no new copy)', async ({ page }) => {
    await openDashboard(page, 'full');
    for (const name of ['7 Need attention · 2 critical', '20 Equipment', '7 Bins', '6 Tanks', '16 Online', '4 Offline', '7 of 24 Fans running now']) {
      await expect(page.getByRole('link', { name, exact: true })).toHaveCount(1);
    }
  });
});
