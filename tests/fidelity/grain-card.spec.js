// Fidelity check — Grain On Hand card (Story 2.7, FR-83 to FR-87): for each
// Dashboard state at 1366 px, the card region screenshot against the card
// cropped out of the 1× Figma render (≤ 0.5 %), the summary, Fill bar
// segments, track and Legend boxes within ±1 px of the PRD table
// (expected/grain-card.json), exact computed styles, exact copy, and no
// visual change when the pointer is over a segment (no tooltip, no hover
// style: AD-14). macOS Chromium is authoritative; Windows runs are advisory.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
import {
  BOX_TOLERANCE_PX,
  GRAIN_CARD_X,
  MASKED_BASELINE_DIR,
  cssColour,
  diffRatio,
  grainCardBaseline,
  grainCardClip,
  readExpected,
  waitForFonts,
} from './support/fidelity.js';

const users = JSON.parse(readFileSync(path.resolve('src/data/json/users.json'), 'utf8'));
const demo = users.users.find((user) => user.username === 'demo');
const expected = readExpected('grain-card.json');
const STATES = ['full', 'small', 'allgood'];
const SLOT = '[data-section="grain"]';
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
  try {
    await expect(page.locator(`${SLOT}[data-status="ready"]`)).toHaveCount(1);
    await page.locator(`${SLOT} [data-grain-body]`).waitFor({ timeout: 5000 });
  } catch (error) {
    const status = await slot(page).getAttribute('data-status').catch(() => null);
    throw new Error(`openDashboard(${state}): the Grain On Hand card did not render its body (section status ${JSON.stringify(status)}): ${error.message}`);
  }
  await waitForFonts(page);
  // Only the card's own images (it draws none today); fail fast with a clear message.
  try {
    await page.waitForFunction(
      (selector) => [...document.querySelectorAll(`${selector} img`)].every((img) => img.complete && img.naturalWidth > 0),
      SLOT,
      { timeout: 5000 },
    );
  } catch (error) {
    throw new Error(`openDashboard(${state}): an image inside the Grain On Hand card did not load within 5 s (${error.message})`);
  }
  // No pointer over the page, no focus: the at-rest render (AD-13).
  await page.mouse.move(1360, 1090);
}

/** Every Grain box in card (slot) coordinates, plus the slot's page box. */
function measureCard(page) {
  return slot(page).evaluate((el) => {
    const s = el.getBoundingClientRect();
    const rel = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x: r.x - s.x, y: r.y - s.y, w: r.width, h: r.height, right: r.right - s.x, bottom: r.bottom - s.y };
    };
    const part = (root, name) => root.querySelector(`[data-grain-part="${name}"]`);
    return {
      page: { x: s.x + window.scrollX, y: s.y + window.scrollY, w: s.width, h: s.height },
      body: rel(el.querySelector('[data-grain-body]')),
      textRow: rel(el.querySelector('[data-grain-row]')),
      summary: rel(part(el, 'summary')),
      fillLabel: rel(part(el, 'fillLabel')),
      bar: rel(el.querySelector('[data-grain-bar]')),
      track: rel(el.querySelector('[data-grain-track]')),
      segments: [...el.querySelectorAll('[data-grain-segment]')].map(rel),
      legend: rel(el.querySelector('[data-grain-legend]')),
      items: [...el.querySelectorAll('[data-grain-item]')].map((item) => ({
        layout: item.dataset.grainLayout,
        box: rel(item),
        swatch: rel(part(item, 'swatch')),
        name: rel(part(item, 'name')),
        sub: rel(part(item, 'sub')),
      })),
    };
  });
}

function boxProblems(state, got) {
  const want = expected[state];
  const problems = [];
  const near = (name, actual, wanted, tolerance = BOX_TOLERANCE_PX) => {
    if (typeof actual !== 'number' || Math.abs(actual - wanted) > tolerance) {
      problems.push(`${state} ${name}: expected ${wanted}, got ${actual}`);
    }
  };
  const present = (name, box) => {
    if (box === null || box === undefined) problems.push(`${state}: missing ${name}`);
    return box ?? {};
  };
  // The crop constant (support/fidelity.js) and this table name the same card.
  if (expected.card.x !== GRAIN_CARD_X) problems.push(`expected card.x ${expected.card.x} ≠ GRAIN_CARD_X ${GRAIN_CARD_X}`);
  near('card.x', got.page.x, expected.card.x);
  near('card.y', got.page.y, want.top);
  near('card.w', got.page.w, expected.card.w);
  near('card.h', got.page.h, expected.card.h);
  const body = present('the body [data-grain-body]', got.body);
  near('body.x', body.x, expected.body.x);
  near('body.w', body.w, expected.body.w);
  const row = present('the text row', got.textRow);
  for (const key of ['x', 'y', 'w', 'h']) near(`text row.${key}`, row[key], expected.textRow[key]);
  const summary = present('the summary', got.summary);
  near('summary.x', summary.x, expected.summary.x);
  near('summary.bottom', summary.bottom, expected.summary.bottom);
  near('summary.h', summary.h, expected.summary.h);
  const fill = present('the fill label', got.fillLabel);
  near('fill label.right', fill.right, expected.fillLabel.right);
  near('fill label.bottom', fill.bottom, expected.fillLabel.bottom);
  near('fill label.h', fill.h, expected.fillLabel.h);
  const bar = present('the Fill bar', got.bar);
  for (const key of ['x', 'y', 'w', 'h']) near(`bar.${key}`, bar[key], expected.bar[key]);
  const track = present('the track', got.track);
  near('track.x', track.x, expected.bar.x + expected.track.left);
  near('track.w', track.w, expected.track.width);
  near('track.y', track.y, expected.bar.y);
  near('track.h', track.h, expected.segment.h);
  if (got.segments.length !== want.segments.length) problems.push(`${state}: ${got.segments.length} segments drawn, expected ${want.segments.length}`);
  got.segments.forEach((segment, i) => {
    const [, left, width, top] = want.segments[i] ?? [];
    near(`segment ${i}.x`, segment.x, expected.bar.x + left);
    near(`segment ${i}.w`, segment.w, width);
    near(`segment ${i}.y`, segment.y, expected.bar.y + top);
    near(`segment ${i}.h`, segment.h, expected.segment.h);
  });
  const legend = present('the Legend', got.legend);
  for (const key of ['x', 'y', 'w']) near(`legend.${key}`, legend[key], expected.legend[key]);
  if (got.items.length !== want.legend.length) problems.push(`${state}: ${got.items.length} Legend items drawn, expected ${want.legend.length}`);
  got.items.forEach((item, i) => {
    const [name, , , layoutName, y] = want.legend[i] ?? [];
    if (item.layout !== layoutName) problems.push(`${state} item ${i} (${name}): layout ${item.layout}, expected ${layoutName}`);
    const layout = expected.item.layouts[layoutName] ?? {};
    const x = expected.item.xs[i % 2];
    near(`${name}.x`, item.box.x, x);
    near(`${name}.y`, item.box.y, y);
    near(`${name}.w`, item.box.w, expected.item.w);
    near(`${name}.h`, item.box.h, layout.h);
    const swatch = present(`${name} swatch`, item.swatch);
    near(`${name} swatch.x`, swatch.x, x);
    near(`${name} swatch.y`, swatch.y, y + layout.swatchTop);
    near(`${name} swatch.w`, swatch.w, layout.swatch);
    near(`${name} swatch.h`, swatch.h, layout.swatch);
    const label = present(`${name} name`, item.name);
    near(`${name} name.x`, label.x, x + layout.textLeft);
    near(`${name} name.y`, label.y, y);
    near(`${name} name.h`, label.h, layout.nameH);
    const sub = present(`${name} sub-label`, item.sub);
    near(`${name} sub.x`, sub.x, x + layout.textLeft);
    near(`${name} sub centre`, sub.y + sub.h / 2, y + layout.subCentre);
    near(`${name} sub.h`, sub.h, layout.subH);
  });
  return problems;
}

/** The card screenshot (clip) as raw RGBA. */
async function cardPixels(page, clip) {
  return sharp(await page.screenshot({ clip, animations: 'disabled', caret: 'hide' }))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

test.describe('Grain On Hand card (FR-83 to FR-87)', () => {
  for (const state of STATES) {
    test(`${state}: card screenshot matches the cropped Figma render (≤ 0.5 %)`, async ({ page }, testInfo) => {
      await openDashboard(page, state);
      const baseline = grainCardBaseline(state);
      // The comparison file is the card cropped from the committed 1× Figma
      // render by global-setup (alignment-checked); never an app screenshot.
      expect(existsSync(path.join(MASKED_BASELINE_DIR, baseline))).toBe(true);
      const clip = grainCardClip(state);
      const actual = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
      const reference = readFileSync(path.join(MASKED_BASELINE_DIR, baseline));
      const ratio = await diffRatio(actual, reference);
      // Breakdown for the report: the same comparison with every text box
      // (header, summary, fill label, Legend names and sub-labels: measured
      // boxes, 1 px margin) painted out of both images, i.e. what is left
      // when text rasterisation is taken out.
      const textBoxes = await slot(page).evaluate((el, origin) => {
        const nodes = [...el.querySelectorAll('h2, p, [data-grain-part="name"], [data-grain-part="sub"]')];
        if (nodes.length === 0) throw new Error('the Grain On Hand card has no text boxes to mask');
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

    test(`${state}: summary, Fill bar segments, track and Legend boxes ±1 px (FR-84, FR-85, FR-87)`, async ({ page }) => {
      await openDashboard(page, state);
      expect(boxProblems(state, await measureCard(page))).toEqual([]);
    });

    test(`${state}: copy audit — header, summary, fill label and Legend verbatim (FR-83, FR-84, FR-87)`, async ({ page }) => {
      await openDashboard(page, state);
      const want = expected[state];
      const got = await slot(page).evaluate((el) => {
        const part = (root, name) => root.querySelector(`[data-grain-part="${name}"]`)?.textContent ?? null;
        return {
          title: el.querySelector('h2')?.textContent ?? null,
          subtitle: el.querySelector('h2 + p')?.textContent ?? null,
          summary: ['summaryBold', 'summaryRest', 'fillLabel'].map((name) => part(el, name)),
          line: part(el, 'summary'),
          legend: [...el.querySelectorAll('[data-grain-item]')].map((item) => [part(item, 'name'), part(item, 'sub')]),
          text: el.textContent,
          links: el.querySelectorAll('a, button, [tabindex], [title], [role="tooltip"]').length,
        };
      });
      expect([got.title, got.subtitle]).toEqual([expected.copy.title, expected.copy.subtitle]);
      expect(got.summary).toEqual(want.summary);
      // FR-84: summaryBold + one space + summaryRest.
      expect(got.line).toBe(`${want.summary[0]} ${want.summary[1]}`);
      expect(got.legend).toEqual(want.legend.map(([name, sub]) => [name, sub]));
      // Nothing else is written in the card; display-only (no links, no tooltips).
      expect(got.text).toBe([expected.copy.title, expected.copy.subtitle, got.line, want.summary[2], ...want.legend.flatMap(([name, sub]) => [name, sub])].join(''));
      expect(got.links).toBe(0);
      // The Legend is one list; the Fill bar is not announced.
      await expect(slot(page).getByRole('list')).toHaveCount(1);
      await expect(slot(page).getByRole('listitem')).toHaveCount(want.legend.length);
      await expect(slot(page).locator('[data-grain-bar]')).toHaveAttribute('aria-hidden', 'true');
    });

    test(`${state}: exact computed styles and colours; nothing overlaid at rest (FR-84 to FR-87, AD-13)`, async ({ page }) => {
      await openDashboard(page, state);
      const st = expected.styles;
      const want = expected[state];
      const got = await slot(page).evaluate((el) => {
        const TYPE = ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'color'];
        const pick = (node, props) => {
          if (!node) return null;
          const cs = getComputedStyle(node);
          const out = Object.fromEntries(props.map((p) => [p, cs[p]]));
          if (out.fontFamily) out.fontFamily = out.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
          return out;
        };
        const part = (root, name) => root.querySelector(`[data-grain-part="${name}"]`);
        const bar = el.querySelector('[data-grain-bar]');
        const paintOf = (box) => getComputedStyle(box.querySelector('[data-grain-paint]')).backgroundColor;
        // The paint layer's top / bottom against the edges data-grain-bleed lists.
        const bleedOf = (box) => {
          const cs = getComputedStyle(box.querySelector('[data-grain-paint]'));
          return { bleed: box.dataset.grainBleed, top: cs.top, bottom: cs.bottom };
        };
        return {
          summary: pick(part(el, 'summary'), TYPE),
          summaryBold: pick(part(el, 'summaryBold'), TYPE),
          summaryRest: pick(part(el, 'summaryRest'), TYPE),
          fillLabel: pick(part(el, 'fillLabel'), TYPE),
          bar: { ...pick(bar, ['borderTopLeftRadius', 'overflow']), width: bar.getBoundingClientRect().width },
          track: paintOf(el.querySelector('[data-grain-track]')),
          segments: [...el.querySelectorAll('[data-grain-segment]')].map(paintOf),
          bleeds: [...el.querySelectorAll('[data-grain-track], [data-grain-segment]')].map(bleedOf),
          items: [...el.querySelectorAll('[data-grain-item]')].map((item) => {
            const swatch = part(item, 'swatch');
            return {
              layout: item.dataset.grainLayout,
              swatch: getComputedStyle(swatch).backgroundColor,
              // The swatch is a 1 px box scaled to its size: its drawn radius is the computed radius × the scale.
              radius: Number.parseFloat(getComputedStyle(swatch).borderTopLeftRadius) * swatch.getBoundingClientRect().width,
              name: pick(part(item, 'name'), TYPE),
              sub: pick(part(item, 'sub'), TYPE),
            };
          }),
          // No pseudo-element overlays anywhere in the card.
          pseudo: [...el.querySelectorAll('*')].filter((node) =>
            ['::before', '::after'].some((p) => getComputedStyle(node, p).content !== 'none' && getComputedStyle(node, p).content !== 'normal'),
          ).length,
          // The drawn parts a pointer could rest on: summary, fill label, bar boxes, Legend items and their parts.
          cursors: [
            ...new Set(
              [
                ...el.querySelectorAll(
                  '[data-grain-part], [data-grain-bar], [data-grain-track], [data-grain-segment], [data-grain-paint], [data-grain-item]',
                ),
              ].map((node) => getComputedStyle(node).cursor),
            ),
          ],
        };
      });
      const typeOf = (t) => ({ ...t, color: cssColour(t.color) });
      expect(got.summary).toEqual(typeOf(st.summary));
      expect(got.summaryBold).toEqual(typeOf(st.summaryBold));
      expect(got.summaryRest).toEqual(typeOf(st.summaryRest));
      expect(got.fillLabel).toEqual(typeOf(st.fillLabel));
      expect(got.bar).toEqual({ borderTopLeftRadius: st.bar.radius, overflow: st.bar.overflow, width: expected.bar.w });
      expect(got.track).toBe(cssColour(st.track));
      expect(got.segments).toEqual(want.segments.map(([colour]) => cssColour(colour)));
      // Each bar box's paint reaches 1 px past exactly the edges data-grain-bleed lists (0 elsewhere).
      expect(got.bleeds).toHaveLength(want.segments.length + 1);
      for (const { bleed, top, bottom } of got.bleeds) {
        const edges = bleed.split(' ');
        expect(edges.length).toBeGreaterThan(0);
        expect({ top, bottom }, bleed).toEqual({
          top: edges.includes('top') ? st.bleedPx : '0px',
          bottom: edges.includes('bottom') ? st.bleedPx : '0px',
        });
      }
      // Track (0) and Full segments bleed on both edges; the nudged Small / All-good Wheat (−0.5) only at the top.
      expect(got.bleeds.map(({ bleed }) => bleed)).toEqual(['top bottom', ...want.segments.map(([, , , top]) => (top < 0 ? 'top' : 'top bottom'))]);
      got.items.forEach((item, i) => {
        const [name, , colour] = want.legend[i];
        expect(item.swatch, `${name} swatch`).toBe(cssColour(colour));
        expect(Math.abs(item.radius - (item.layout === 'corn' ? st.swatchRadius.corn : st.swatchRadius.regular)), `${name} radius ${item.radius}`).toBeLessThanOrEqual(0.05);
        if (item.layout === 'corn') {
          const { lineHeight: nameLine, ...nameRest } = item.name;
          const { lineHeight: subLine, ...subRest } = item.sub;
          expect(nameRest, `${name} name`).toEqual(typeOf(st.cornName));
          expect(subRest, `${name} sub`).toEqual(typeOf(st.cornSub));
          // 1.5 lines of the scaled sizes.
          expect(Math.abs(Number.parseFloat(nameLine) - 14.551 * 1.5)).toBeLessThanOrEqual(0.01);
          expect(Math.abs(Number.parseFloat(subLine) - 10.913 * 1.5)).toBeLessThanOrEqual(0.01);
        } else {
          expect(item.name, `${name} name`).toEqual(typeOf(st.name));
          expect(item.sub, `${name} sub`).toEqual(typeOf(st.sub));
        }
      });
      expect(got.pseudo).toBe(0);
      // Display-only: nothing in the body looks clickable.
      expect(got.cursors).toEqual(['auto']);
    });

    test(`${state}: pointer over each segment, the track and each Legend item changes no pixel and shows no tooltip (AD-14)`, async ({ page }) => {
      await openDashboard(page, state);
      const clip = grainCardClip(state);
      const atRest = await cardPixels(page, clip);
      const targets = await slot(page).evaluate((el) =>
        [...el.querySelectorAll('[data-grain-segment], [data-grain-track], [data-grain-item]')].map((node) => {
          const r = node.getBoundingClientRect();
          // The track's visible part ends at the bar's 386 px clip.
          const right = node.hasAttribute('data-grain-track') ? Math.min(r.right, el.querySelector('[data-grain-bar]').getBoundingClientRect().right) : r.right;
          return { name: node.dataset.grainSegment ?? (node.hasAttribute('data-grain-track') ? 'track' : `item ${node.dataset.grainItem}`), x: (r.left + right) / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY };
        }),
      );
      expect(targets.length).toBeGreaterThan(1);
      for (const target of targets) {
        await page.mouse.move(target.x, target.y);
        const hovered = await cardPixels(page, clip);
        const changed = atRest.data.reduce((count, byte, i) => count + (byte !== hovered.data[i] ? 1 : 0), 0);
        expect(changed, `pointer over ${target.name}: ${changed} bytes changed`).toBe(0);
        await expect(page.getByRole('tooltip')).toHaveCount(0);
      }
      await page.mouse.move(1360, 1090);
    });
  }
});
