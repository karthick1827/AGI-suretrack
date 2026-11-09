// Fidelity check — Equipment card (Story 2.4, FR-66 to FR-72): for each
// Dashboard state at 1366 px, the card region screenshot against the card
// cropped out of the 1× Figma render (≤ 0.5 %), every row, Health bar,
// segment, text and chevron box within ±1 px of the PRD table
// (expected/equipment-card.json), exact computed styles, the FR-70 hatch, exact
// copy, and real pointer / keyboard navigation. macOS Chromium is
// authoritative; Windows runs are advisory.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
import {
  BOX_TOLERANCE_PX,
  MASKED_BASELINE_DIR,
  cssColour,
  diffRatio,
  equipmentCardBaseline,
  equipmentCardClip,
  readExpected,
  waitForFonts,
} from './support/fidelity.js';

const users = JSON.parse(readFileSync(path.resolve('src/data/json/users.json'), 'utf8'));
const demo = users.users.find((user) => user.username === 'demo');
const expected = readExpected('equipment-card.json');
const STATES = ['full', 'small', 'allgood'];
const slot = (page) => page.locator('[data-section="equipmentCard"]');

/** Sign in as `demo`, open the Dashboard in `state` and wait for a stable render. */
async function openDashboard(page, state) {
  await page.goto(paths.login());
  const record = createSessionRecord(demo, { now: Date.now(), ttlMinutes: users.policy.sessionTtlMinutes });
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SESSION_KEY, JSON.stringify(record)]);
  await page.goto(paths.dashboard(state));
  await expect(page.locator('[data-section="equipmentCard"][data-status="ready"]')).toHaveCount(1);
  await page.locator('[data-equipment-list]').waitFor();
  await waitForFonts(page);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  // No pointer over the page, no focus: the at-rest render (AD-13).
  await page.mouse.move(1360, 760);
}

/** Every Equipment box in card (slot) coordinates, plus the slot's page box. */
function measureCard(page) {
  return slot(page).evaluate((el) => {
    const s = el.getBoundingClientRect();
    const rel = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x: r.x - s.x, y: r.y - s.y, w: r.width, h: r.height };
    };
    const part = (row, name) => row.querySelector(`[data-row-part="${name}"]`);
    return {
      page: { x: s.x + window.scrollX, y: s.y + window.scrollY, w: s.width, h: s.height },
      list: rel(el.querySelector('[data-equipment-list]')),
      rows: [...el.querySelectorAll('[data-equipment-row]')].map((row) => {
        const bar = part(row, 'bar');
        const b = bar.getBoundingClientRect();
        return {
          typeKey: row.dataset.equipmentRow,
          box: rel(row),
          name: rel(part(row, 'name')),
          count: rel(part(row, 'count')),
          bar: rel(bar),
          caption: rel(part(row, 'caption')),
          chevron: rel(part(row, 'chevron')),
          segments: [...bar.querySelectorAll('[data-health-segment]')].map((seg) => {
            const r = seg.getBoundingClientRect();
            return { kind: seg.dataset.healthSegment, x: r.x - b.x, w: r.width, y: r.y - b.y, h: r.height };
          }),
        };
      }),
    };
  });
}

function boxProblems(state, got) {
  const want = expected[state];
  const problems = [];
  const near = (name, actual, wanted) => {
    if (typeof actual !== 'number' || Math.abs(actual - wanted) > BOX_TOLERANCE_PX) {
      problems.push(`${state} ${name}: expected ${wanted}, got ${actual}`);
    }
  };
  near('card.x', got.page.x, expected.card.x);
  near('card.y', got.page.y, expected.card.y);
  near('card.w', got.page.w, expected.card.w);
  near('card.h', got.page.h, expected.height[state]);
  near('list.x', got.list.x, expected.list.x);
  near('list.y', got.list.y, expected.list.y);
  near('list.w', got.list.w, expected.list.w);
  near('list.h', got.list.h, want.listH);
  const order = got.rows.map((row) => row.typeKey).join();
  if (order !== want.rows.map((row) => row.typeKey).join()) problems.push(`${state} row order: ${order}`);
  want.rows.forEach((w, i) => {
    const row = got.rows[i];
    if (!row) return;
    const k = `${w.typeKey}`;
    near(`${k}.x`, row.box.x, expected.list.x);
    near(`${k}.y`, row.box.y, w.y);
    near(`${k}.w`, row.box.w, expected.list.w);
    near(`${k}.h`, row.box.h, w.h);
    near(`${k} name.x`, row.name.x, expected.list.x);
    near(`${k} name.y`, row.name.y, w.nameY);
    near(`${k} name.h`, row.name.h, expected.nameH);
    near(`${k} name.w`, row.name.w, expected.styles.left.w);
    near(`${k} count.y`, row.count.y, w.nameY + expected.nameH + 1);
    near(`${k} count.h`, row.count.h, expected.countH);
    near(`${k} bar.x`, row.bar.x, w.barX);
    near(`${k} bar.y`, row.bar.y, w.barY);
    near(`${k} bar.w`, row.bar.w, expected.bar.w);
    near(`${k} bar.h`, row.bar.h, expected.bar.h);
    near(`${k} caption.x`, row.caption.x, w.barX);
    near(`${k} caption.y`, row.caption.y, w.barY + expected.bar.h + 6);
    near(`${k} caption.h`, row.caption.h, expected.captionH);
    near(`${k} chevron.x`, row.chevron.x, w.chevronX);
    near(`${k} chevron.y`, row.chevron.y, w.chevronY);
    near(`${k} chevron.w`, row.chevron.w, expected.chevron.w);
    near(`${k} chevron.h`, row.chevron.h, expected.chevron.h);
    const kinds = row.segments.map((seg) => seg.kind).join();
    if (kinds !== w.segments.map((seg) => seg.kind).join()) problems.push(`${state} ${k} segments: ${kinds}`);
    w.segments.forEach((ws, j) => {
      const seg = row.segments[j];
      if (!seg) return;
      near(`${k} ${ws.kind}.x`, seg.x, ws.x);
      near(`${k} ${ws.kind}.w`, seg.w, ws.w);
      near(`${k} ${ws.kind}.y`, seg.y, 0);
      near(`${k} ${ws.kind}.h`, seg.h, expected.bar.h);
    });
  });
  return problems;
}

/** The FR-70 hatch as Chromium serialises it: 17 hard stripes of 5.8535 %, then #D1D5DB to 100 %. */
function hatchGradient({ angle, stripePercent, stripes, even, odd }) {
  const at = (i) => `${Number((i * stripePercent).toFixed(4))}%`;
  const stops = [];
  for (let i = 0; i < stripes; i += 1) {
    const colour = cssColour(i % 2 === 0 ? even : odd);
    stops.push(`${colour} ${at(i)}`, `${colour} ${at(i + 1)}`);
  }
  const tail = cssColour(odd);
  stops.push(`${tail} ${at(stripes)}`, `${tail} 100%`);
  return `linear-gradient(${angle}, ${stops.join(', ')})`;
}

test.describe('Equipment card (FR-66 to FR-72)', () => {
  for (const state of STATES) {
    test(`${state}: card screenshot matches the cropped Figma render (≤ 0.5 %)`, async ({ page }, testInfo) => {
      await openDashboard(page, state);
      const baseline = equipmentCardBaseline(state);
      // The comparison file is the card cropped from the committed 1× Figma
      // render by global-setup (alignment-checked); never an app screenshot.
      expect(existsSync(path.join(MASKED_BASELINE_DIR, baseline))).toBe(true);
      const clip = equipmentCardClip(state);
      const actual = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
      const ratio = await diffRatio(actual, readFileSync(path.join(MASKED_BASELINE_DIR, baseline)));
      const note = `pixel-diff ratio ≤ ${(ratio * 100).toFixed(3)} % (YIQ threshold 0.1, no AA exclusion)`;
      testInfo.annotations.push({ type: 'pixel-diff', description: note });
      process.stdout.write(`[fidelity] ${baseline}: ${note}\n`);
      // maxDiffPixelRatio / threshold come from playwright.config.js (single source).
      await expect(page).toHaveScreenshot(baseline, { clip });
    });

    test(`${state}: every row, bar, segment, text and chevron box ±1 px (FR-66 to FR-69)`, async ({ page }) => {
      await openDashboard(page, state);
      expect(boxProblems(state, await measureCard(page))).toEqual([]);
    });

    test(`${state}: exact computed styles, dividers and FR-70 hatch (FR-67 to FR-71)`, async ({ page }) => {
      await openDashboard(page, state);
      const got = await slot(page).evaluate((el) => {
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
        const part = (row, name) => row.querySelector(`[data-row-part="${name}"]`);
        return [...el.querySelectorAll('[data-equipment-row]')].map((row) => {
          const c = cs(row);
          const left = part(row, 'name').parentElement;
          const right = part(row, 'bar').parentElement.parentElement;
          const bar = part(row, 'bar');
          const caption = part(row, 'caption');
          return {
            tag: row.tagName,
            minHeight: c.minHeight,
            padding: [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft],
            divider: c.borderTopStyle === 'none' ? 'none' : `${c.borderTopWidth} ${c.borderTopStyle} ${c.borderTopColor}`,
            cursor: c.cursor,
            outline: c.outlineStyle,
            background: c.backgroundColor,
            textDecoration: c.textDecorationLine,
            left: { w: left.getBoundingClientRect().width, gap: cs(left).rowGap, paddingBottom: cs(left).paddingBottom },
            right: { w: right.getBoundingClientRect().width, gap: cs(right).columnGap },
            barBlockGap: cs(bar.parentElement).rowGap,
            name: type(part(row, 'name')),
            count: type(part(row, 'count')),
            caption: type(caption),
            nums: [...caption.children].map((n) => ({ text: n.textContent, ...type(n) })),
            bar: { radius: cs(bar).borderTopLeftRadius, overflow: cs(bar).overflow },
            segments: [...bar.querySelectorAll('[data-health-segment]')].map((seg) => ({
              kind: seg.dataset.healthSegment,
              background: cs(seg).backgroundColor,
              image: cs(seg).backgroundImage,
              radius: cs(seg).borderTopLeftRadius,
            })),
          };
        });
      });

      const st = expected.styles;
      const typeOf = (t) => ({ ...t, color: cssColour(t.color) });
      const [dw, ds, dc] = st.row.divider.split(' ');
      const hatch = hatchGradient(st.hatch);
      expect(got.length).toBe(expected[state].rows.length);
      got.forEach((row, i) => {
        const want = expected[state].rows[i];
        expect(row.tag).toBe('A');
        expect(row.minHeight).toBe(st.row.minHeight);
        expect(row.divider).toBe(want.divider ? `${dw} ${ds} ${cssColour(dc)}` : 'none');
        // Left / right paddings are 0; the top and bottom keep the 48 px row content box.
        expect([row.padding[3]]).toEqual([st.row.padding[3]]);
        expect(parseFloat(row.padding[0]) + parseFloat(row.padding[2]) + (want.divider ? 1 : 0) + 48).toBe(want.h);
        // Pointer only on <a>; nothing shows at rest (AD-13, FR-58).
        expect(row.cursor).toBe('pointer');
        expect(row.outline).toBe('none');
        expect(row.background).toBe('rgba(0, 0, 0, 0)');
        expect(row.textDecoration).toBe('none');
        expect(Math.abs(row.left.w - st.left.w)).toBeLessThanOrEqual(BOX_TOLERANCE_PX);
        expect([row.left.gap, row.left.paddingBottom]).toEqual([st.left.gap, st.left.paddingBottom]);
        expect(Math.abs(row.right.w - st.right.w)).toBeLessThanOrEqual(BOX_TOLERANCE_PX);
        expect(row.right.gap).toBe(st.right.gap);
        expect(row.barBlockGap).toBe(st.barBlock.gap);
        const { fontFamily: _n, ...name } = row.name;
        expect(name).toEqual(typeOf(st.name));
        const { fontFamily: _c, ...count } = row.count;
        expect(count).toEqual(typeOf(st.count));
        const { lineHeight: _l, ...caption } = row.caption;
        expect(caption).toEqual(typeOf(st.caption));
        // Every digit run of the caption is Roboto 700 #111827; nothing else is wrapped.
        expect(row.nums.map((n) => n.text)).toEqual(want.copy[2].match(/\d+/g));
        for (const { text: _t, lineHeight: _h, ...num } of row.nums) expect(num).toEqual(typeOf(st.num));
        expect(row.bar).toEqual({ radius: st.barRadius, overflow: 'hidden' });
        for (const seg of row.segments) {
          expect(seg.radius).toBe('0px');
          if (seg.kind === 'offline') {
            expect(seg.image).toBe(hatch);
          } else {
            expect(seg.image).toBe('none');
            expect(seg.background).toBe(cssColour(st.segments[seg.kind]));
          }
        }
      });
    });

    test(`${state}: copy audit — title, rows and captions verbatim (FR-66, FR-67, FR-71)`, async ({ page }) => {
      await openDashboard(page, state);
      const got = await slot(page).evaluate((el) => ({
        rows: [...el.querySelectorAll('[data-equipment-row]')].map((row) =>
          ['name', 'count', 'caption'].map((p) => row.querySelector(`[data-row-part="${p}"]`).textContent),
        ),
        labels: [...el.querySelectorAll('[data-equipment-row]')].map((row) => row.getAttribute('aria-label')),
        text: el.textContent,
      }));
      const want = expected[state];
      expect(got.rows).toEqual(want.rows.map((row) => row.copy));
      expect(got.labels).toEqual(want.rows.map((row) => row.label));
      // Nothing else is written in the card.
      expect(got.text).toBe(
        [want.copy.title, want.copy.subtitle, want.copy.link, ...want.rows.flatMap((row) => row.copy)].join(''),
      );
      for (const row of want.rows) await expect(page.getByRole('link', { name: row.label, exact: true })).toHaveCount(1);
    });
  }

  test('Full Bins: the offline segment sits at x 203.43, width 67.14, with the FR-70 hatch (FR-69, FR-70)', async ({ page }) => {
    await openDashboard(page, 'full');
    const seg = await slot(page)
      .locator('[data-equipment-row="bins"] [data-health-segment="offline"]')
      .evaluate((el) => {
        const r = el.getBoundingClientRect();
        const b = el.parentElement.getBoundingClientRect();
        return { x: r.x - b.x, w: r.width, image: getComputedStyle(el).backgroundImage };
      });
    expect(Math.abs(seg.x - 203.43)).toBeLessThanOrEqual(BOX_TOLERANCE_PX);
    expect(Math.abs(seg.w - 67.14)).toBeLessThanOrEqual(BOX_TOLERANCE_PX);
    expect(seg.image).toBe(hatchGradient(expected.styles.hatch));
    // Only Full Bins has an offline segment.
    await expect(page.locator('[data-health-segment="offline"]')).toHaveCount(1);
  });

  // FR-72 targets, keyed by data-equipment-row.
  const FULL_TARGETS = {
    bins: paths.equipment({ type: 'bins' }),
    piles: paths.equipment({ type: 'piles' }),
    flats: paths.equipment({ type: 'flats' }),
    tanks: paths.equipment({ type: 'tanks' }),
    dryers: paths.equipment({ type: 'dryers' }),
  };
  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const urlEndingWith = (target) => new RegExp(`${escapeRegExp(target)}$`);
  const viewAll = (page) => slot(page).getByRole('link', { name: expected.full.copy.link, exact: true });

  async function clickCentre(page, locator) {
    const box = await locator.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  test('pointer: a real click at the centre of every Full row, and of View All, opens its FR-72 target', async ({ page }) => {
    for (const [key, target] of Object.entries(FULL_TARGETS)) {
      await openDashboard(page, 'full');
      await clickCentre(page, slot(page).locator(`[data-equipment-row="${key}"]`));
      await expect(page, `${key} → ${target}`).toHaveURL(urlEndingWith(target));
    }
    await openDashboard(page, 'full');
    await clickCentre(page, viewAll(page));
    await expect(page).toHaveURL(urlEndingWith(paths.equipment()));
  });

  test('pointer: a click on a row’s Health bar or chevron also opens its type page (Small)', async ({ page }) => {
    for (const [key, part] of [
      ['bins', 'bar'],
      ['dryers', 'chevron'],
    ]) {
      await openDashboard(page, 'small');
      await clickCentre(page, slot(page).locator(`[data-equipment-row="${key}"] [data-row-part="${part}"]`));
      await expect(page).toHaveURL(urlEndingWith(paths.equipment({ type: key })));
    }
  });

  test('keyboard: Tab visits View All then every row top to bottom with the FR-58 ring; Enter opens it', async ({ page }) => {
    await openDashboard(page, 'full');
    // Focus the last focusable element before the card, then Tab into it.
    await slot(page).evaluate((el) => {
      const focusable = [...document.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]')].filter(
        (node) => node.tabIndex >= 0 && !el.contains(node) && node.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      focusable.at(-1).focus();
    });
    const ring = `solid 2px ${cssColour('#006a36')} 2px`;
    const order = [];
    for (let i = 0; i < 1 + Object.keys(FULL_TARGETS).length; i += 1) {
      await page.keyboard.press('Tab');
      const got = await page.evaluate(() => {
        const el = document.activeElement;
        const cs = getComputedStyle(el);
        return {
          key: el.dataset.equipmentRow ?? (el.closest('[data-section="equipmentCard"]') ? 'viewAll' : null),
          tag: el.tagName,
          ring: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} ${cs.outlineOffset}`,
        };
      });
      order.push(got.key);
      expect(got.tag, `${got.key}`).toBe('A');
      expect(got.ring, `${got.key} focus ring`).toBe(ring);
    }
    expect(order).toEqual(['viewAll', ...Object.keys(FULL_TARGETS)]);
    // The next Tab leaves the card.
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement.closest('[data-section="equipmentCard"]')))).toBe(false);

    await slot(page).locator('[data-equipment-row="tanks"]').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(urlEndingWith(FULL_TARGETS.tanks));
    await openDashboard(page, 'full');
    await viewAll(page).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(urlEndingWith(paths.equipment()));
  });

  test('the row chevron is the Figma-mapped 12 × 16 chevron with explicit width and height (AD-5, AD-15)', async ({ page }) => {
    await openDashboard(page, 'full');
    const chevrons = slot(page).locator(`[data-fid="${FID.equipmentCard.rowChevron}"]`);
    await expect(chevrons).toHaveCount(expected.full.rows.length);
    const attrs = await chevrons.evaluateAll((imgs) => imgs.map((img) => [img.getAttribute('width'), img.getAttribute('height'), img.getAttribute('alt')]));
    for (const a of attrs) expect(a).toEqual(['12', '16', '']);
  });
});
