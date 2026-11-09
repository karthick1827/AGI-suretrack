// Fidelity check — Fan activity card (Story 2.6, FR-78 to FR-82): for each
// Dashboard state at 1366 px, the card region screenshot against the card
// cropped out of the 1× Figma render (≤ 0.5 %), the Runtime bars at exactly
// barPx (0 px, AD-14: boxes and painted pixels), every tile, label, column and
// caption box within ±1 px of the PRD table (expected/fan-activity-card.json),
// exact computed styles and exact copy. macOS Chromium is authoritative;
// Windows runs are advisory.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { RUNTIME_BAR_SPACE_PX, RUNTIME_COLUMN_HEIGHT_PX, RUNTIME_DAY_LABEL_PX, RUNTIME_MAX_BAR_PX } from '../../src/lib/geometry.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
import {
  BOX_TOLERANCE_PX,
  MASKED_BASELINE_DIR,
  cssColour,
  diffRatio,
  fanActivityBaseline,
  fanActivityClip,
  readExpected,
  waitForFonts,
} from './support/fidelity.js';

const users = JSON.parse(readFileSync(path.resolve('src/data/json/users.json'), 'utf8'));
const demo = users.users.find((user) => user.username === 'demo');
const expected = readExpected('fan-activity-card.json');
const STATES = ['full', 'small', 'allgood'];
const SLOT = '[data-section="fanActivity"]';
const slot = (page) => page.locator(SLOT);

// The card reaches page y 1036 (Full) / 832, below the 768 px viewport: a
// taller viewport at the same 1366 px width keeps the whole card on screen.
test.use({ viewport: { width: 1366, height: 1100 } });

/** Sign in as `demo`, open the Dashboard in `state` and wait for a stable render. */
async function openDashboard(page, state) {
  await page.goto(paths.login());
  const record = createSessionRecord(demo, { now: Date.now(), ttlMinutes: users.policy.sessionTtlMinutes });
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SESSION_KEY, JSON.stringify(record)]);
  await page.goto(paths.dashboard(state));
  await expect(page.locator(`${SLOT}[data-status="ready"]`)).toHaveCount(1);
  await page.locator(`${SLOT} [data-fan-body]`).waitFor();
  await waitForFonts(page);
  // Only the card's own images (it draws none today); fail fast with a clear message.
  try {
    await page.waitForFunction(
      (selector) => [...document.querySelectorAll(`${selector} img`)].every((img) => img.complete && img.naturalWidth > 0),
      SLOT,
      { timeout: 5000 },
    );
  } catch (error) {
    throw new Error(`openDashboard(${state}): an image inside the Fan activity card did not load within 5 s (${error.message})`);
  }
  // No pointer over the page, no focus: the at-rest render (AD-13).
  await page.mouse.move(1360, 1090);
}

/** Every Fan activity box in card (slot) coordinates, plus the slot's page box. */
function measureCard(page) {
  return slot(page).evaluate((el) => {
    const s = el.getBoundingClientRect();
    const rel = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x: r.x - s.x, y: r.y - s.y, w: r.width, h: r.height, right: r.right - s.x, bottom: r.bottom - s.y };
    };
    const part = (root, name) => root.querySelector(`[data-fan-part="${name}"]`);
    const caption = part(el, 'caption');
    let lines = null;
    if (caption) {
      const range = document.createRange();
      range.selectNodeContents(caption);
      lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
    }
    return {
      page: { x: s.x + window.scrollX, y: s.y + window.scrollY, w: s.width, h: s.height },
      body: rel(el.querySelector('[data-fan-body]')),
      tileRow: rel(el.querySelector('[data-fan-tiles]')),
      tiles: [...el.querySelectorAll('[data-fan-tile]')].map((tile) => ({
        box: rel(tile),
        value: rel(part(tile, 'value')?.parentElement),
        label: rel(part(tile, 'label')?.parentElement),
      })),
      chart: rel(el.querySelector('[data-fan-chart]')),
      columns: [...el.querySelectorAll('[data-fan-column]')].map((column) => ({
        box: rel(column),
        bar: rel(part(column, 'bar')),
        hours: rel(part(column, 'hours')),
        day: rel(part(column, 'day')),
      })),
      caption: rel(caption),
      lines,
    };
  });
}

function boxProblems(state, got) {
  const want = expected[state];
  const problems = [];
  const near = (name, actual, wanted, tolerance = BOX_TOLERANCE_PX) => {
    if (typeof actual !== 'number' || Math.abs(actual - wanted) > tolerance) {
      problems.push(`${state} ${name}: expected ${wanted}${tolerance === 0 ? ' exactly' : ''}, got ${actual}`);
    }
  };
  const present = (name, box) => {
    if (box === null || box === undefined) problems.push(`${state}: missing ${name}`);
    return box ?? {};
  };
  near('card.x', got.page.x, expected.card.x);
  near('card.y', got.page.y, want.top);
  near('card.w', got.page.w, expected.card.w);
  near('card.h', got.page.h, expected.card.h);
  const body = present('the body [data-fan-body]', got.body);
  near('body.x', body.x, expected.body.x);
  near('body.y', body.y, expected.body.y);
  near('body.w', body.w, expected.body.w);
  const row = present('the Stat tile row', got.tileRow);
  near('tile row.y', row.y, expected.tileRow.y);
  near('tile row.h', row.h, expected.tileRow.h);
  if (got.tiles.length !== expected.tile.xs.length) problems.push(`${state}: ${got.tiles.length} tiles drawn`);
  got.tiles.forEach((tile, i) => {
    const x = expected.tile.xs[i];
    near(`tile ${i}.x`, tile.box.x, x);
    near(`tile ${i}.y`, tile.box.y, expected.tile.y);
    near(`tile ${i}.w`, tile.box.w, expected.tile.w);
    near(`tile ${i}.h`, tile.box.h, expected.tile.h);
    for (const [name, spec] of [
      ['value', expected.tileValue],
      ['label', expected.tileLabel],
    ]) {
      const box = present(`tile ${i} ${name} box`, tile[name]);
      near(`tile ${i} ${name}.x`, box.x, x + spec.dx);
      near(`tile ${i} ${name}.y`, box.y, expected.tile.y + spec.dy);
      near(`tile ${i} ${name}.w`, box.w, spec.w);
      near(`tile ${i} ${name}.h`, box.h, spec.h);
    }
  });
  const chart = present('the Runtime chart [data-fan-chart]', got.chart);
  near('chart.x', chart.x, expected.chart.x);
  near('chart.y', chart.y, expected.chart.y);
  near('chart.w', chart.w, expected.chart.w);
  near('chart.h', chart.h, want.chartH);
  const chartBottom = expected.chart.y + want.chartH;
  if (got.columns.length !== expected.bar.barPx.length) problems.push(`${state}: ${got.columns.length} columns drawn`);
  got.columns.forEach((column, i) => {
    const barX = expected.chart.x + expected.bar.xs[i];
    near(`column ${i}.x`, column.box.x, barX);
    near(`column ${i}.w`, column.box.w, expected.column.w);
    near(`column ${i}.h`, column.box.h, expected.column.h);
    near(`column ${i}.bottom`, column.box.bottom, chartBottom);
    const bar = present(`bar ${i}`, column.bar);
    // AD-14: the bar height is barPx with 0 px tolerance.
    near(`bar ${i}.h (barPx)`, bar.h, expected.bar.barPx[i], 0);
    near(`bar ${i}.x`, bar.x, barX);
    near(`bar ${i}.w`, bar.w, expected.bar.w);
    near(`bar ${i}.bottom`, bar.bottom, chartBottom - expected.bar.bottomInset);
    const hours = present(`value label ${i}`, column.hours);
    near(`value label ${i}.y`, hours.y, bar.y + expected.hours.dy);
    near(`value label ${i}.h`, hours.h, expected.hours.h);
    near(`value label ${i}.x`, hours.x, barX + expected.hours.dx);
    near(`value label ${i}.w`, hours.w, expected.hours.w);
    const day = present(`day label ${i}`, column.day);
    near(`day label ${i}.y`, day.y, chartBottom - expected.day.h);
    near(`day label ${i}.h`, day.h, expected.day.h);
    near(`day label ${i} centre`, day.x + day.w / 2, barX + expected.bar.w / 2);
    // The CSS column geometry is the geometry.js geometry (exact): a CSS
    // change cannot silently move the bar space or the label clearance.
    if (column.box.h !== RUNTIME_COLUMN_HEIGHT_PX) problems.push(`${state} column ${i}: height ${column.box.h} ≠ RUNTIME_COLUMN_HEIGHT_PX ${RUNTIME_COLUMN_HEIGHT_PX}`);
    if (day.h !== RUNTIME_DAY_LABEL_PX) problems.push(`${state} column ${i}: day label box ${day.h} ≠ RUNTIME_DAY_LABEL_PX ${RUNTIME_DAY_LABEL_PX}`);
    if (column.box.h - day.h !== RUNTIME_BAR_SPACE_PX) {
      problems.push(`${state} column ${i}: bar space ${column.box.h - day.h} ≠ RUNTIME_BAR_SPACE_PX ${RUNTIME_BAR_SPACE_PX}`);
    }
    // The tallest usable barPx keeps its value label inside the chart.
    const clearance = chart.h - day.h - (bar.y - hours.y);
    if (clearance < RUNTIME_MAX_BAR_PX) problems.push(`${state} column ${i}: room for a bar with its label ${clearance} < RUNTIME_MAX_BAR_PX ${RUNTIME_MAX_BAR_PX}`);
  });
  const caption = present('the caption', got.caption);
  near('caption.x', caption.x, expected.caption.x);
  near('caption.y', caption.y, chartBottom);
  near('caption.w', caption.w, expected.caption.w);
  near('caption.h', caption.h, expected.caption.h);
  if (got.lines !== expected.caption.lines) problems.push(`${state} caption: ${got.lines} lines, expected ${expected.caption.lines}`);
  return problems;
}

test.describe('Fan activity card (FR-78 to FR-82)', () => {
  for (const state of STATES) {
    test(`${state}: card screenshot matches the cropped Figma render (≤ 0.5 %)`, async ({ page }, testInfo) => {
      await openDashboard(page, state);
      const baseline = fanActivityBaseline(state);
      // The comparison file is the card cropped from the committed 1× Figma
      // render by global-setup (alignment-checked); never an app screenshot.
      expect(existsSync(path.join(MASKED_BASELINE_DIR, baseline))).toBe(true);
      const clip = fanActivityClip(state);
      const actual = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
      const reference = readFileSync(path.join(MASKED_BASELINE_DIR, baseline));
      const ratio = await diffRatio(actual, reference);
      // Breakdown for the report: the same comparison with every text box
      // (header, tile values and labels, chart labels, caption: measured
      // boxes, 1 px margin) painted out of both images, i.e. what is left
      // when text rasterisation is taken out.
      const textBoxes = await slot(page).evaluate((el, origin) => {
        const nodes = [
          ...el.querySelectorAll('h2, p, [data-fan-part="value"], [data-fan-part="label"], [data-fan-part="hours"], [data-fan-part="day"]'),
        ];
        if (nodes.length === 0) throw new Error('the Fan activity card has no text boxes to mask');
        return nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return {
            left: Math.floor(r.left + window.scrollX - origin.x) - 1,
            top: Math.floor(r.top + window.scrollY - origin.y) - 1,
            right: Math.ceil(r.right + window.scrollX - origin.x) + 1,
            bottom: Math.ceil(r.bottom + window.scrollY - origin.y) + 1,
          };
        });
      }, clip);
      const paint = async (png) => {
        const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        for (const box of textBoxes) {
          for (let y = Math.max(0, box.top); y < Math.min(info.height, box.bottom); y += 1) {
            for (let x = Math.max(0, box.left); x < Math.min(info.width, box.right); x += 1) {
              data.fill(0, (y * info.width + x) * 4, (y * info.width + x) * 4 + 3);
              data[(y * info.width + x) * 4 + 3] = 255;
            }
          }
        }
        return sharp(data, { raw: info }).png().toBuffer();
      };
      const maskedRatio = await diffRatio(await paint(actual), await paint(reference));
      const note = `pixel-diff ratio ≤ ${(ratio * 100).toFixed(3)} % (text boxes masked ≤ ${(maskedRatio * 100).toFixed(3)} %; YIQ threshold 0.1, no AA exclusion)`;
      testInfo.annotations.push({ type: 'pixel-diff', description: note });
      process.stdout.write(`[fidelity] ${baseline}: ${note}\n`);
      // maxDiffPixelRatio / threshold come from playwright.config.js (single source).
      await expect(page).toHaveScreenshot(baseline, { clip });
    });

    test(`${state}: Runtime bars are exactly barPx (0 px) in layout and in paint (FR-80, AD-14)`, async ({ page }) => {
      await openDashboard(page, state);
      const bars = await slot(page).evaluate((el) =>
        [...el.querySelectorAll('[data-fan-part="bar"]')].map((bar) => {
          const r = bar.getBoundingClientRect();
          return { x: r.x + window.scrollX, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, h: r.height };
        }),
      );
      expect(bars.map((bar) => bar.h)).toEqual(expected.bar.barPx);
      // Painted: down the bar's centre column, the run of bar-coloured pixels
      // (from just above the value label to below the bar) is exactly barPx.
      const shot = await page.screenshot({ fullPage: false });
      const { data, info } = await sharp(shot).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const painted = bars.map((bar, i) => {
        const colour = i === expected.copy.todayIndex ? expected.styles.todayBar.backgroundColor : expected.styles.bar.backgroundColor;
        const [r, g, b] = [1, 3, 5].map((k) => parseInt(colour.slice(k, k + 2), 16));
        const x = Math.round(bar.x + expected.bar.w / 2);
        const from = Math.floor(bar.top) - 4;
        const to = Math.ceil(bar.bottom) + 4;
        if (from < 0 || to > info.height || x >= info.width) {
          throw new Error(`bar ${i}: rows ${from}–${to} at x ${x} are outside the ${info.width}×${info.height} screenshot`);
        }
        let rows = 0;
        for (let y = from; y < to; y += 1) {
          const at = (y * info.width + x) * 4;
          if (Math.abs(data[at] - r) <= 2 && Math.abs(data[at + 1] - g) <= 2 && Math.abs(data[at + 2] - b) <= 2) rows += 1;
        }
        return rows;
      });
      expect(painted).toEqual(expected.bar.barPx);
    });

    test(`${state}: every tile, chart column, label and caption box ±1 px (FR-79 to FR-82)`, async ({ page }) => {
      await openDashboard(page, state);
      expect(boxProblems(state, await measureCard(page))).toEqual([]);
    });

    test(`${state}: copy audit — header, tiles, chart labels, chart name and caption verbatim (FR-78 to FR-82)`, async ({ page }) => {
      await openDashboard(page, state);
      const c = expected.copy;
      const got = await slot(page).evaluate((el) => ({
        tiles: [...el.querySelectorAll('[data-fan-tile]')].map((tile) =>
          ['value', 'label'].map((p) => tile.querySelector(`[data-fan-part="${p}"]`)?.textContent ?? null),
        ),
        columns: [...el.querySelectorAll('[data-fan-column]')].map((column) =>
          ['hours', 'day'].map((p) => column.querySelector(`[data-fan-part="${p}"]`)?.textContent ?? null),
        ),
        caption: el.querySelector('[data-fan-part="caption"]')?.textContent ?? null,
        text: el.textContent,
        links: el.querySelectorAll('a, button, [tabindex], [title]').length,
      }));
      expect(got.tiles).toEqual(expected[state].tiles);
      expect(got.columns).toEqual(c.days.map((day, i) => [c.hours[i], day]));
      expect(got.caption).toBe(c.caption);
      // Nothing else is written in the card; display-only (no links, no tooltips).
      expect(got.text).toBe([c.title, c.subtitle, ...expected[state].tiles.flat(), ...c.days.flatMap((day, i) => [c.hours[i], day]), c.caption].join(''));
      expect(got.links).toBe(0);
      // The chart is one image named by fanActivity.chartLabel.
      await expect(slot(page).getByRole('img', { name: c.chartLabel, exact: true })).toHaveCount(1);
      await expect(slot(page).getByRole('img')).toHaveCount(1);
      const tree = await slot(page).getByRole('img').ariaSnapshot();
      expect(tree.trim()).toBe(`- img "${c.chartLabel}"`);
    });

    test(`${state}: exact computed styles; nothing overlaid at rest (FR-79 to FR-82, AD-13)`, async ({ page }) => {
      await openDashboard(page, state);
      const st = expected.styles;
      const got = await slot(page).evaluate((el) => {
        const pick = (node, props) => {
          if (!node) return null;
          const cs = getComputedStyle(node);
          return Object.fromEntries(props.map((p) => [p, cs[p]]));
        };
        const first = (family) => family.split(',')[0].trim().replace(/^["']|["']$/g, '');
        const TYPE = ['fontWeight', 'fontSize', 'lineHeight', 'color'];
        const tiles = [...el.querySelectorAll('[data-fan-tile]')];
        const columns = [...el.querySelectorAll('[data-fan-column]')];
        const withFamily = (node, props) => {
          const out = pick(node, props);
          return out ? { ...out, fontFamily: first(out.fontFamily) } : null;
        };
        return {
          tiles: tiles.map((tile) => ({
            box: pick(tile, ['backgroundColor', 'borderTopLeftRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']),
            value: pick(tile.querySelector('[data-fan-part="value"]'), TYPE),
            label: pick(tile.querySelector('[data-fan-part="label"]'), TYPE),
          })),
          bars: columns.map((column) =>
            pick(column.querySelector('[data-fan-part="bar"]'), [
              'backgroundColor',
              'borderTopLeftRadius',
              'borderTopRightRadius',
              'borderBottomRightRadius',
              'borderBottomLeftRadius',
            ]),
          ),
          hours: columns.map((column) => withFamily(column.querySelector('[data-fan-part="hours"]'), ['fontFamily', ...TYPE, 'textAlign'])),
          days: columns.map((column) => withFamily(column.querySelector('[data-fan-part="day"]'), ['fontFamily', ...TYPE, 'paddingTop'])),
          caption: pick(el.querySelector('[data-fan-part="caption"]'), [...TYPE, 'paddingTop']),
          // No pseudo-element overlays anywhere in the card.
          pseudo: [...el.querySelectorAll('*')].filter((node) =>
            ['::before', '::after'].some((p) => getComputedStyle(node, p).content !== 'none' && getComputedStyle(node, p).content !== 'normal'),
          ).length,
          cursors: [...new Set([...el.querySelectorAll('[data-fan-body] *')].map((node) => getComputedStyle(node).cursor))],
        };
      });
      const typeOf = (t) => ({ ...t, color: cssColour(t.color) });
      const { padding, radius, backgroundColor } = st.tile;
      for (const tile of got.tiles) {
        expect(tile.box).toEqual({
          backgroundColor: cssColour(backgroundColor),
          borderTopLeftRadius: radius,
          paddingTop: padding[0],
          paddingRight: padding[1],
          paddingBottom: padding[2],
          paddingLeft: padding[3],
        });
        expect(tile.value).toEqual(typeOf(st.tileValue));
        expect(tile.label).toEqual(typeOf(st.tileLabel));
      }
      const today = expected.copy.todayIndex;
      got.bars.forEach((bar, i) => {
        const [tl, tr, br, bl] = st.bar.radius;
        expect(bar, `bar ${i}`).toEqual({
          backgroundColor: cssColour(i === today ? st.todayBar.backgroundColor : st.bar.backgroundColor),
          borderTopLeftRadius: tl,
          borderTopRightRadius: tr,
          borderBottomRightRadius: br,
          borderBottomLeftRadius: bl,
        });
      });
      for (const hours of got.hours) expect(hours).toEqual(typeOf(st.hours));
      got.days.forEach((day, i) => expect(day, `day ${i}`).toEqual(typeOf(i === today ? st.todayDay : st.day)));
      expect(got.caption).toEqual(typeOf(st.caption));
      expect(got.pseudo).toBe(0);
      // Display-only: nothing in the body looks clickable.
      expect(got.cursors).toEqual(['auto']);
    });
  }

  test('the caption wraps after "used" into exactly two 18 px lines, as drawn (FR-82)', async ({ page }) => {
    await openDashboard(page, 'full');
    const lines = await slot(page)
      .locator('[data-fan-part="caption"]')
      .evaluate((p) => {
        const text = p.firstChild;
        if (!text || text.nodeType !== Node.TEXT_NODE) throw new Error('the caption has no text node');
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
    expect(lines).toEqual(['Runtime hours, last 7 days. Higher this week as Auto modes used ', 'the cool nights.']);
  });
});
