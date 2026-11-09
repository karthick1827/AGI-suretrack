// Fidelity check — Recent Alerts card (Story 2.5, FR-73 to FR-77): for each
// Dashboard state at 1366 px, the card region screenshot against the card
// cropped out of the 1× Figma render (≤ 0.5 %), every row, icon, text,
// Action link, separator and the Empty state within ±1 px of the PRD table
// (expected/recent-alerts-card.json), exact computed styles, exact copy, and
// real pointer / keyboard navigation. macOS Chromium is authoritative;
// Windows runs are advisory.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
import {
  BOX_TOLERANCE_PX,
  MASKED_BASELINE_DIR,
  cssColour,
  diffRatio,
  readExpected,
  recentAlertsBaseline,
  recentAlertsClip,
  waitForFonts,
} from './support/fidelity.js';

const users = JSON.parse(readFileSync(path.resolve('src/data/json/users.json'), 'utf8'));
const demo = users.users.find((user) => user.username === 'demo');
const expected = readExpected('recent-alerts-card.json');
const STATES = ['full', 'small', 'allgood'];
const SLOT = '[data-section="recentAlerts"]';
const slot = (page) => page.locator(SLOT);
const DASHBOARD_JSON = /\/dashboard\.(full|small|allgood)[^/]*\.json(\?|$)/;

/** RGB of page pixels in a viewport screenshot. */
async function pixelsAt(page, points) {
  const { data, info } = await sharp(await page.screenshot()).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return points.map(([x, y]) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= info.width || py >= info.height) {
      throw new Error(`pixelsAt: (${px}, ${py}) is outside the ${info.width}×${info.height} screenshot`);
    }
    const i = (py * info.width + px) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  });
}
const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const closeTo = (rgb, hex, tolerance = 40) => rgb.every((c, i) => Math.abs(c - hexRgb(hex)[i]) <= tolerance);

/** Sign in as `demo`, open the Dashboard in `state` and wait for a stable render. */
async function openDashboard(page, state) {
  await page.goto(paths.login());
  const record = createSessionRecord(demo, { now: Date.now(), ttlMinutes: users.policy.sessionTtlMinutes });
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SESSION_KEY, JSON.stringify(record)]);
  await page.goto(paths.dashboard(state));
  await expect(page.locator(`${SLOT}[data-status="ready"]`)).toHaveCount(1);
  await page.locator(`${SLOT} [data-alert-list], ${SLOT} [data-alert-empty]`).first().waitFor();
  await waitForFonts(page);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  // No pointer over the page, no focus: the at-rest render (AD-13).
  await page.mouse.move(1360, 760);
}

/** A locator's page box; a clear error when it is not rendered. */
async function boxOf(locator) {
  const box = await locator.boundingBox();
  if (box === null) throw new Error(`boxOf: ${locator} has no bounding box (missing or not visible)`);
  return box;
}

async function clickCentre(page, locator) {
  const box = await boxOf(locator);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** Every Recent Alerts box in card (slot) coordinates, plus the slot's page box. */
function measureCard(page) {
  return slot(page).evaluate((el) => {
    const s = el.getBoundingClientRect();
    const rel = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x: r.x - s.x, y: r.y - s.y, w: r.width, h: r.height, right: r.right - s.x, bottom: r.bottom - s.y };
    };
    const part = (row, name) => row.querySelector(`[data-alert-part="${name}"]`);
    return {
      page: { x: s.x + window.scrollX, y: s.y + window.scrollY, w: s.width, h: s.height },
      list: rel(el.querySelector('[data-alert-list]')),
      empty: rel(el.querySelector('[data-alert-empty]')),
      emptyTitle: rel(el.querySelector('[data-alert-part="empty-title"]')),
      emptyBody: rel(el.querySelector('[data-alert-part="empty-body"]')),
      rows: [...el.querySelectorAll('[data-alert-row]')].map((row) => {
        const separator = part(row, 'separator');
        return {
          id: row.dataset.alertRow,
          box: rel(row),
          rowLink: rel(row.querySelector('[data-alert-link="row"]')),
          icon: rel(part(row, 'icon')),
          glyph: rel(row.querySelector('[data-alert-part="icon"] img')),
          title: rel(part(row, 'title')),
          meta: rel(part(row, 'meta')),
          severity: rel(part(row, 'severity')),
          time: rel(part(row, 'time')),
          action: rel(row.querySelector('[data-alert-link="action"]')),
          label: rel(part(row, 'action-label')),
          arrow: rel(row.querySelector('[data-alert-link="action"] img')),
          // The separator line is the bottom border of its 8 px track.
          separator: separator
            ? { ...rel(separator), line: getComputedStyle(separator).borderBottomWidth }
            : null,
        };
      }),
    };
  });
}

function boxProblems(state, got) {
  const want = expected[state];
  const r = expected.row;
  const problems = [];
  const near = (name, actual, wanted) => {
    if (typeof actual !== 'number' || Math.abs(actual - wanted) > BOX_TOLERANCE_PX) {
      problems.push(`${state} ${name}: expected ${wanted}, got ${actual}`);
    }
  };
  const present = (name, box) => {
    if (box === null) problems.push(`${state}: missing ${name}`);
    return box ?? {};
  };
  near('card.x', got.page.x, expected.card.x);
  near('card.y', got.page.y, expected.card.y);
  near('card.w', got.page.w, expected.card.w);
  near('card.h', got.page.h, expected.height[state]);
  if (want.empty) {
    const e = present('the Empty state', got.empty);
    near('empty.x', e.x, want.empty.x);
    near('empty.y', e.y, want.empty.y);
    near('empty.w', e.w, want.empty.w);
    near('empty.h', e.h, want.empty.h);
    const title = present('the Empty-state title', got.emptyTitle);
    near('empty title.y', title.y, want.empty.titleY);
    near('empty title.h', title.h, want.empty.titleH);
    near('empty title centre', title.x + title.w / 2, want.empty.x + want.empty.w / 2);
    const body = present('the Empty-state body', got.emptyBody);
    near('empty body.x', body.x, want.empty.bodyX);
    near('empty body.y', body.y, want.empty.bodyY);
    near('empty body.w', body.w, expected.styles.emptyBody.w);
    near('empty body.h', body.h, want.empty.bodyH);
    if (got.list !== null) problems.push(`${state}: an Alert list is drawn beside the Empty state`);
    return problems;
  }
  const list = present('the Alert list [data-alert-list]', got.list);
  near('list.x', list.x, expected.list.x);
  near('list.y', list.y, expected.list.y);
  near('list.w', list.w, expected.list.w);
  near('list.h', list.h, want.listH);
  const order = got.rows.map((row) => row.id).join();
  if (order !== want.rows.map((row) => row.id).join()) problems.push(`${state} row order: ${order}`);
  want.rows.forEach((w, i) => {
    const row = got.rows[i];
    if (!row) return;
    const k = w.id;
    const top = expected.list.y + i * r.pitch;
    const h = w.separator ? r.h : r.lastH;
    near(`${k}.x`, row.box.x, expected.list.x);
    near(`${k}.y`, row.box.y, top);
    near(`${k}.w`, row.box.w, expected.list.w);
    near(`${k}.h`, row.box.h, h);
    // The row link covers the whole row (the Action link is laid over it).
    const link = present(`${k} row link`, row.rowLink);
    for (const key of ['x', 'y', 'w', 'h']) near(`${k} row link.${key}`, link[key], row.box[key]);
    const icon = present(`${k} icon`, row.icon);
    near(`${k} icon.x`, icon.x, expected.list.x + r.icon.dx);
    near(`${k} icon.y`, icon.y, top + r.icon.dy);
    near(`${k} icon.w`, icon.w, r.icon.w);
    near(`${k} icon.h`, icon.h, r.icon.h);
    const g = r.glyph[w.severity];
    const glyph = present(`${k} glyph`, row.glyph);
    near(`${k} glyph.x`, glyph.x, expected.list.x + g.dx);
    near(`${k} glyph.y`, glyph.y, top + g.dy);
    near(`${k} glyph.w`, glyph.w, g.w);
    near(`${k} glyph.h`, glyph.h, g.h);
    for (const name of ['title', 'meta']) {
      const box = present(`${k} ${name}`, row[name]);
      near(`${k} ${name}.x`, box.x, r.detailX);
      near(`${k} ${name}.y`, box.y, top + r[name].dy);
      near(`${k} ${name}.w`, box.w, r[name].w);
      near(`${k} ${name}.h`, box.h, r[name].h);
    }
    for (const name of ['severity', 'time']) {
      const box = present(`${k} ${name}`, row[name]);
      near(`${k} ${name}.right`, box.right, r[name].right);
      near(`${k} ${name}.y`, box.y, top + r[name].dy);
      near(`${k} ${name}.h`, box.h, r[name].h);
    }
    const action = present(`${k} Action link`, row.action);
    near(`${k} action.x`, action.x, r.detailX);
    near(`${k} action.y`, action.y, top + r.action.dy);
    near(`${k} action.h`, action.h, r.action.h);
    const label = present(`${k} Action label`, row.label);
    const arrow = present(`${k} Action arrow`, row.arrow);
    near(`${k} label.x`, label.x, r.detailX);
    near(`${k} arrow.x`, arrow.x, label.right + r.arrow.gap);
    near(`${k} arrow.y`, arrow.y, top + r.arrow.dy);
    near(`${k} arrow.w`, arrow.w, r.arrow.w);
    near(`${k} arrow.h`, arrow.h, r.arrow.h);
    near(`${k} action.right`, action.right, arrow.right);
    if (w.separator) {
      const sep = present(`${k} separator`, row.separator);
      near(`${k} separator.x`, sep.x, r.detailX);
      near(`${k} separator.w`, sep.w, r.detailW);
      near(`${k} separator line y`, sep.bottom - 1, top + r.separator.dy);
      if (sep.line !== '1px') problems.push(`${state} ${k} separator line: ${sep.line}`);
    } else if (row.separator !== null) {
      problems.push(`${state} ${k}: the last row of ${want.rows.length} rows has a separator`);
    }
  });
  return problems;
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const urlEndingWith = (target) => new RegExp(`${escapeRegExp(target)}$`);
const rowLink = (page, id) => slot(page).locator(`[data-alert-row="${id}"] [data-alert-link="row"]`);
const actionLink = (page, id) => slot(page).locator(`[data-alert-row="${id}"] [data-alert-link="action"]`);
const viewAll = (page) => slot(page).getByRole('link', { name: expected.full.copy.link, exact: true });

test.describe('Recent Alerts card (FR-73 to FR-77)', () => {
  for (const state of STATES) {
    test(`${state}: card screenshot matches the cropped Figma render (≤ 0.5 %)`, async ({ page }, testInfo) => {
      await openDashboard(page, state);
      const baseline = recentAlertsBaseline(state);
      // The comparison file is the card cropped from the committed 1× Figma
      // render by global-setup (alignment-checked); never an app screenshot.
      expect(existsSync(path.join(MASKED_BASELINE_DIR, baseline))).toBe(true);
      const clip = recentAlertsClip(state);
      const actual = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
      const reference = readFileSync(path.join(MASKED_BASELINE_DIR, baseline));
      const ratio = await diffRatio(actual, reference);
      // Below the card header (clip y ≥ 75, card y ≥ 76): the Alert rows / Empty state alone.
      const below = async (png) =>
        sharp(png).extract({ left: 0, top: 75, width: clip.width, height: clip.height - 75 }).png().toBuffer();
      const bodyRatio = await diffRatio(await below(actual), await below(reference));
      const note = `pixel-diff ratio ≤ ${(ratio * 100).toFixed(3)} % (below the header ≤ ${(bodyRatio * 100).toFixed(3)} %; YIQ threshold 0.1, no AA exclusion)`;
      testInfo.annotations.push({ type: 'pixel-diff', description: note });
      process.stdout.write(`[fidelity] ${baseline}: ${note}\n`);
      // maxDiffPixelRatio / threshold come from playwright.config.js (single source).
      await expect(page).toHaveScreenshot(baseline, { clip });
    });

    test(`${state}: every row, icon, text, Action link, separator and Empty-state box ±1 px (FR-73 to FR-77)`, async ({ page }) => {
      await openDashboard(page, state);
      expect(boxProblems(state, await measureCard(page))).toEqual([]);
    });

    test(`${state}: copy audit — header, rows and Empty state verbatim; link names (FR-73 to FR-77)`, async ({ page }) => {
      await openDashboard(page, state);
      const want = expected[state];
      const got = await slot(page).evaluate((el) => ({
        rows: [...el.querySelectorAll('[data-alert-row]')].map((row) =>
          ['title', 'meta', 'severity', 'time', 'action-label'].map((p) => row.querySelector(`[data-alert-part="${p}"]`)?.textContent ?? null),
        ),
        hrefs: [...el.querySelectorAll('[data-alert-row]')].map((row) => [
          row.querySelector('[data-alert-link="row"]')?.getAttribute('href') ?? null,
          row.querySelector('[data-alert-link="action"]')?.getAttribute('href') ?? null,
        ]),
        empty: ['empty-title', 'empty-body'].map((p) => el.querySelector(`[data-alert-part="${p}"]`)?.textContent ?? null),
        text: el.textContent,
      }));
      expect(got.rows).toEqual(want.rows.map((row) => row.copy));
      expect(got.hrefs).toEqual(want.rows.map((row) => [row.href, row.actionHref]));
      const emptyCopy = want.empty ? [want.empty.title, want.empty.body] : [];
      expect(got.empty).toEqual(want.empty ? emptyCopy : [null, null]);
      // Nothing else is written in the card.
      expect(got.text).toBe([want.copy.title, want.copy.subtitle, want.copy.link, ...want.rows.flatMap((row) => row.copy), ...emptyCopy].join(''));
      // Every link has a usable accessible name: the row by its own texts, the Action by its label.
      for (const row of want.rows) {
        const [title, meta, severity, time, action] = row.copy;
        await expect(slot(page).getByRole('link', { name: [title, meta, severity, time].join(' '), exact: true })).toHaveCount(1);
        await expect(slot(page).getByRole('link', { name: action, exact: true })).toHaveCount(1);
      }
      const names = await slot(page).getByRole('link').evaluateAll((links) => links.length);
      expect(names).toBe(1 + 2 * want.rows.length);
    });

    test(`${state}: exact computed styles; nothing shows at rest (FR-74 to FR-77, AD-13)`, async ({ page }) => {
      await openDashboard(page, state);
      const st = expected.styles;
      const got = await slot(page).evaluate((el) => {
        const pick = (node, props) => {
          if (!node) return null;
          const cs = getComputedStyle(node);
          return Object.fromEntries(props.map((p) => [p, cs[p]]));
        };
        const TYPE = ['fontWeight', 'fontSize', 'lineHeight', 'color'];
        const part = (row, name) => row.querySelector(`[data-alert-part="${name}"]`);
        const empty = el.querySelector('[data-alert-empty]');
        return {
          rows: [...el.querySelectorAll('[data-alert-row]')].map((row) => {
            const link = row.querySelector('[data-alert-link="row"]');
            const action = row.querySelector('[data-alert-link="action"]');
            const separator = part(row, 'separator');
            const cs = (node) => getComputedStyle(node);
            return {
              title: pick(part(row, 'title'), [...TYPE, 'whiteSpace', 'textOverflow']),
              meta: pick(part(row, 'meta'), TYPE),
              severity: pick(part(row, 'severity'), TYPE),
              time: pick(part(row, 'time'), [...TYPE, 'textAlign']),
              label: pick(part(row, 'action-label'), [...TYPE, 'textDecorationLine']),
              circle: pick(part(row, 'icon'), ['backgroundColor', 'borderTopLeftRadius']),
              action: {
                tag: action.tagName,
                height: cs(action).height,
                padding: [cs(action).paddingTop, cs(action).paddingRight, cs(action).paddingBottom, cs(action).paddingLeft],
                gap: cs(action).columnGap,
                radius: cs(action).borderTopLeftRadius,
                overflow: cs(action).overflow,
                cursor: cs(action).cursor,
                outline: cs(action).outlineStyle,
              },
              link: { tag: link.tagName, cursor: cs(link).cursor, outline: cs(link).outlineStyle, background: cs(link).backgroundColor },
              item: { cursor: cs(row).cursor, background: cs(row).backgroundColor },
              separator: separator
                ? `${cs(separator).borderBottomWidth} ${cs(separator).borderBottomStyle} ${cs(separator).borderBottomColor}`
                : null,
            };
          }),
          empty: empty
            ? {
                box: pick(empty, ['backgroundColor', 'borderTopLeftRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'rowGap']),
                title: pick(el.querySelector('[data-alert-part="empty-title"]'), ['fontFamily', 'fontWeight', 'fontSize', 'color', 'textAlign']),
                body: pick(el.querySelector('[data-alert-part="empty-body"]'), ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'color', 'textAlign']),
              }
            : null,
          // No pseudo-element overlays anywhere in the card.
          pseudo: [...el.querySelectorAll('*')].filter((node) =>
            ['::before', '::after'].some((p) => getComputedStyle(node, p).content !== 'none' && getComputedStyle(node, p).content !== 'normal'),
          ).length,
          nested: el.querySelectorAll('a a').length,
        };
      });
      const typeOf = (t) => ({ ...t, ...(t.color ? { color: cssColour(t.color) } : {}) });
      expect(got.pseudo).toBe(0);
      expect(got.nested).toBe(0);
      const [sw, ss, sc] = st.separator.split(' ');
      got.rows.forEach((row, i) => {
        const want = expected[state].rows[i];
        expect(row.title).toEqual(typeOf(st.title));
        expect(row.meta).toEqual(typeOf(st.meta));
        expect(row.severity).toEqual({ ...st.severity, color: cssColour(st.severityColour[want.severity]) });
        expect(row.time).toEqual(typeOf(st.time));
        expect(row.label).toEqual({ ...typeOf(st.actionLabel), textDecorationLine: 'none' });
        expect(row.circle).toEqual({ backgroundColor: cssColour(st.circle[want.severity]), borderTopLeftRadius: st.circleRadius });
        const { padding, ...action } = st.action;
        expect(row.action).toEqual({ tag: 'A', ...action, padding, cursor: 'pointer', outline: 'none' });
        // Pointer only on <a>; no hover fill or focus ring at rest.
        expect(row.link).toEqual({ tag: 'A', cursor: 'pointer', outline: 'none', background: 'rgba(0, 0, 0, 0)' });
        expect(row.item).toEqual({ cursor: 'auto', background: 'rgba(0, 0, 0, 0)' });
        expect(row.separator).toBe(want.separator ? `${sw} ${ss} ${cssColour(sc)}` : null);
      });
      if (expected[state].empty) {
        expect(got.empty.box).toEqual({
          backgroundColor: cssColour(st.empty.backgroundColor),
          borderTopLeftRadius: st.empty.radius,
          paddingTop: st.empty.padding[0],
          paddingRight: st.empty.padding[1],
          paddingBottom: st.empty.padding[2],
          paddingLeft: st.empty.padding[3],
          rowGap: st.empty.gap,
        });
        const first = (family) => family.split(',')[0].trim().replace(/^["']|["']$/g, '');
        expect({ ...got.empty.title, fontFamily: first(got.empty.title.fontFamily) }).toEqual({
          ...typeOf(st.emptyTitle),
          textAlign: 'center',
        });
        const { w: _w, ...body } = st.emptyBody;
        expect({ ...got.empty.body, fontFamily: first(got.empty.body.fontFamily) }).toEqual({ ...typeOf(body), textAlign: 'center' });
      } else {
        expect(got.empty).toBeNull();
      }
    });
  }

  test('All-good: the Empty-state body wraps after "tanks." into exactly two 20.3 px lines (FR-77)', async ({ page }) => {
    await openDashboard(page, 'allgood');
    const lines = await slot(page)
      .locator('[data-alert-part="empty-body"]')
      .evaluate((p) => {
        const text = p.firstChild;
        if (!text || text.nodeType !== Node.TEXT_NODE) throw new Error('the Empty-state body has no text node');
        const range = document.createRange();
        const out = [];
        let top = null;
        for (let i = 0; i < text.length; i += 1) {
          range.setStart(text, i);
          range.setEnd(text, i + 1);
          const r = range.getBoundingClientRect();
          if (r.height === 0) {
            if (out.length > 0) out[out.length - 1] += text.data[i];
            continue;
          }
          if (top === null || Math.abs(r.top - top) > 5) {
            out.push('');
            top = r.top;
          }
          out[out.length - 1] += text.data[i];
        }
        return out;
      });
    expect(lines).toEqual(expected.allgood.empty.lines);
  });

  test('icons: Figma glyphs and arrow with explicit width/height, alt "" and their fids (AD-5, AD-15)', async ({ page }) => {
    await openDashboard(page, 'full');
    const imgs = await slot(page).locator('[data-alert-row] img').evaluateAll((list) =>
      list.map((img) => [img.dataset.fid, img.getAttribute('width'), img.getAttribute('height'), img.getAttribute('alt')]),
    );
    expect(imgs).toEqual([
      [FID.recentAlerts.criticalGlyph, '15', '15', ''],
      [FID.recentAlerts.actionArrow, '16', '16', ''],
      [FID.recentAlerts.criticalGlyph, '15', '15', ''],
      [FID.recentAlerts.actionArrow, '16', '16', ''],
      [FID.recentAlerts.warningGlyph, '13.8462', '13.8462', ''],
      [FID.recentAlerts.actionArrow, '16', '16', ''],
      [FID.recentAlerts.warningGlyph, '13.8462', '13.8462', ''],
      [FID.recentAlerts.actionArrow, '16', '16', ''],
    ]);
    for (const img of await slot(page).locator('img').all()) {
      expect(await img.evaluate((el) => el.hasAttribute('width') && el.hasAttribute('height'))).toBe(true);
    }
    await openDashboard(page, 'allgood');
    await expect(slot(page).locator(`[data-fid="${FID.recentAlerts.empty}"]`)).toHaveCount(1);
  });

  test('pointer: a real click on each Full Action link opens its alertAction target (FR-75)', async ({ page }) => {
    for (const row of expected.full.rows) {
      await openDashboard(page, 'full');
      await clickCentre(page, actionLink(page, row.id));
      await expect(page, `${row.id} Action → ${row.actionHref}`).toHaveURL(urlEndingWith(row.actionHref));
    }
  });

  test('pointer: a real click anywhere else on the row opens the equipment detail, never the Action (FR-75)', async ({ page }) => {
    const row = expected.full.rows[1];
    const spots = [
      ['title', (b) => [b.x + 10, b.y + b.height / 2]],
      ['time', (b) => [b.x + b.width - 5, b.y + b.height / 2]],
    ];
    for (const [part, at] of spots) {
      await openDashboard(page, 'full');
      const b = await boxOf(slot(page).locator(`[data-alert-row="${row.id}"] [data-alert-part="${part}"]`));
      await page.mouse.click(...at(b));
      await expect(page, `${part} → ${row.href}`).toHaveURL(urlEndingWith(row.href));
    }
    // Beside the Action link (same line, right of it), below the icon, and on the separator track.
    const item = (page) => slot(page).locator(`[data-alert-row="${row.id}"]`);
    for (const [name, at] of [
      ['right of the Action link', (b) => [b.x + 400, b.y + 58]],
      ['below the icon', (b) => [b.x + 10, b.y + 60]],
      ['the separator track', (b) => [b.x + 300, b.y + 74]],
    ]) {
      await openDashboard(page, 'full');
      await page.mouse.click(...at(await boxOf(item(page))));
      await expect(page, `${name} → ${row.href}`).toHaveURL(urlEndingWith(row.href));
    }
    await openDashboard(page, 'full');
    await clickCentre(page, viewAll(page));
    await expect(page).toHaveURL(urlEndingWith(paths.alerts()));
  });

  test('keyboard: Tab visits View All, then each row link and its Action link in order with the FR-58 ring; Enter opens them', async ({ page }) => {
    await openDashboard(page, 'full');
    // Focus the last focusable element before the card, then Tab into it.
    await slot(page).evaluate((el) => {
      const focusable = [...document.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]')].filter(
        (node) => node.tabIndex >= 0 && !el.contains(node) && node.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      if (focusable.length === 0) throw new Error('no focusable element precedes the Recent Alerts card');
      focusable.at(-1).focus();
    });
    const ring = `solid 2px ${cssColour('#006a36')} 2px`;
    const wantOrder = ['viewAll', ...expected.full.rows.flatMap((row) => [`${row.id}:row`, `${row.id}:action`])];
    const order = [];
    for (let i = 0; i < wantOrder.length; i += 1) {
      await page.keyboard.press('Tab');
      const got = await page.evaluate(() => {
        const el = document.activeElement;
        const cs = getComputedStyle(el);
        const row = el.closest('[data-alert-row]');
        const inCard = Boolean(el.closest('[data-section="recentAlerts"]'));
        const r = el.getBoundingClientRect();
        return {
          key: row ? `${row.dataset.alertRow}:${el.dataset.alertLink}` : inCard ? 'viewAll' : null,
          tag: el.tagName,
          ring: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} ${cs.outlineOffset}`,
          box: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
        };
      });
      order.push(got.key);
      expect(got.tag, `${got.key}`).toBe('A');
      expect(got.ring, `${got.key} focus ring`).toBe(ring);
      // The ring (2 px at offset 2) is painted on all four sides: neither the
      // list's clip nor the card cuts it off.
      const { box } = got;
      const cx = (box.left + box.right) / 2;
      const cy = (box.top + box.bottom) / 2;
      const sides = await pixelsAt(page, [
        [box.left - 3, cy],
        [box.right + 2, cy],
        [cx, box.top - 3],
        [cx, box.bottom + 2],
      ]);
      sides.forEach((rgb, side) => expect(closeTo(rgb, '#006a36'), `${got.key} ring side ${side}: rgb(${rgb})`).toBe(true));
    }
    expect(order).toEqual(wantOrder);
    // The next Tab leaves the card.
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement.closest('[data-section="recentAlerts"]')))).toBe(false);

    const [first, , third] = expected.full.rows;
    await actionLink(page, third.id).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(urlEndingWith(third.actionHref));
    await openDashboard(page, 'full');
    await rowLink(page, first.id).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(urlEndingWith(first.href));
    await openDashboard(page, 'full');
    await viewAll(page).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(urlEndingWith(paths.alerts()));
  });

  test('hover: the FR-58 #F0FFF8 row fill stays inside the card border; the Action text underlines; nothing at rest', async ({ page }) => {
    await openDashboard(page, 'full');
    const row = expected.full.rows[1];
    const item = await boxOf(slot(page).locator(`[data-alert-row="${row.id}"]`));
    const card = await boxOf(slot(page).locator('section'));
    const y = item.y + 60; // below the icon, left of the Action link: blank row area
    const probe = () =>
      pixelsAt(page, [
        [card.x, y], // card border
        [item.x - 1, y], // card padding, just outside the row
        [item.x + 1, y], // inside the row's left edge
        [item.x + item.width - 2, y], // inside the row's right edge
        [item.x + item.width + 1, y], // card padding, just outside the row
        [card.x + card.width - 1, y], // card border
        [item.x + 10, item.y + item.height + 6], // the 12 px gap below the row
      ]);
    const atRest = await probe();
    for (const rgb of atRest.slice(1, 5)) expect(closeTo(rgb, '#ffffff', 2), `at rest rgb(${rgb})`).toBe(true);

    await page.mouse.move(item.x + 300, item.y + 20);
    const [leftBorder, outLeft, inLeft, inRight, outRight, rightBorder, gap] = await probe();
    expect(closeTo(leftBorder, '#d1d5db', 6), `left border rgb(${leftBorder})`).toBe(true);
    expect(closeTo(rightBorder, '#d1d5db', 6), `right border rgb(${rightBorder})`).toBe(true);
    expect(closeTo(outLeft, '#ffffff', 2), `left of the row rgb(${outLeft})`).toBe(true);
    expect(closeTo(outRight, '#ffffff', 2), `right of the row rgb(${outRight})`).toBe(true);
    expect(closeTo(inLeft, '#f0fff8', 2), `hover fill (left) rgb(${inLeft})`).toBe(true);
    expect(closeTo(inRight, '#f0fff8', 2), `hover fill (right) rgb(${inRight})`).toBe(true);
    expect(closeTo(gap, '#ffffff', 2), `gap below the row rgb(${gap})`).toBe(true);
    const label = slot(page).locator(`[data-alert-row="${row.id}"] [data-alert-part="action-label"]`);
    expect(await label.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('none');

    // On the Action link: its text underlines and the row keeps its fill.
    await page.mouse.move(...(await boxOf(label).then((b) => [b.x + b.width / 2, b.y + b.height / 2])));
    expect(await label.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('underline');
    const [, , fill] = await probe();
    expect(closeTo(fill, '#f0fff8', 2), `row fill while on the Action rgb(${fill})`).toBe(true);
  });

  test('bad data: unknown severity, missing deviceId, duplicate id and more than 4 items draw at most 4 rows, no unnamed link', async ({ page }) => {
    await page.route(DASHBOARD_JSON, async (route) => {
      const response = await route.fetch();
      const doc = await response.json();
      // The Small document has one item: derive the others from it.
      const [a1] = doc.recentAlerts.items;
      if (!a1) throw new Error('the Small document has no Recent Alerts item to derive test items from');
      const a2 = { ...a1, id: 'a2', severity: 'Warning' };
      const a3 = { ...a1, id: 'a3', severity: 'Warning' };
      const a4 = { ...a1, id: 'a4' };
      doc.recentAlerts.items = [
        { ...a1, severity: 'Info' },
        { ...a2, deviceId: '' },
        { ...a3, id: a1.id, title: 'Duplicate' },
        a3,
        a4,
        { ...a4, id: 'a5', title: 'Fifth' },
      ];
      await route.fulfill({ response, json: doc });
    });
    await openDashboard(page, 'small');
    const got = await slot(page).evaluate((el) => {
      const card = el.querySelector('section').getBoundingClientRect();
      const list = el.querySelector('[data-alert-list]');
      return {
        rows: [...el.querySelectorAll('[data-alert-row]')].map((row) => [
          row.dataset.alertRow,
          row.querySelector('[data-alert-link="row"]') ? 'row-link' : 'plain',
          row.querySelector('[data-alert-link="action"]') ? 'action-link' : 'plain',
          row.querySelectorAll('[data-alert-part="icon"]').length,
        ]),
        unnamed: [...el.querySelectorAll('a')].filter((a) => a.textContent.trim() === '' && !a.getAttribute('aria-labelledby')).length,
        overflow: getComputedStyle(list).overflow,
        listBottom: list.getBoundingClientRect().bottom,
        cardBottom: card.bottom,
      };
    });
    expect(got.rows).toEqual([
      ['a1', 'row-link', 'action-link', 0],
      ['a2', 'plain', 'plain', 1],
      ['a3', 'row-link', 'action-link', 1],
      ['a4', 'row-link', 'action-link', 1],
    ]);
    expect(got.unnamed).toBe(0);
    // Four rows in the 240 px Small card are clipped to the card body, never painted outside it.
    expect(got.overflow).toBe('clip');
    expect(got.listBottom).toBeLessThan(got.cardBottom);
  });
});
