// Fidelity check helpers (FR-10, AD-6, AD-15).
//
// - waitForFonts():      load every bundled family/weight before capture (AD-6).
// - Photo mask:           Playwright paints `mask` boxes in `maskColor` over the
//                         capture. A Figma baseline has no such boxes, so the
//                         same boxes are painted onto a derived copy of the
//                         committed Figma export (global-setup.js). The boxes
//                         are a staircase that covers ONLY the visible silo
//                         photo right of the green panel's angled edge.
// - measurementAudit():   getBoundingClientRect() (±1 px) and exact computed
//                         style for every `data-fid` in an expected table.
// - copyAudit():          exact text for every copy-bearing `data-fid`.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const FIDELITY_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BASELINE_DIR = path.join(FIDELITY_DIR, '__baselines__');
export const MASKED_BASELINE_DIR = path.join(FIDELITY_DIR, '.baselines-masked');

export const MASK_COLOR = '#FF00FF';
const MASK_RGB = [255, 0, 255];
export const BOX_TOLERANCE_PX = 1;

/* ------------------------------------------------------------------------ */
/* Fonts                                                                     */
/* ------------------------------------------------------------------------ */

const FONT_FACES = [
  ...[400, 500, 600, 700, 800].map((weight) => `${weight} 16px Roboto`),
  ...[400, 500, 600, 700].map((weight) => `${weight} 16px Inter`),
];

/**
 * AD-6: load every family and weight, await document.fonts.ready, then assert
 * each face is really available (no silent fallback font in the capture).
 */
export async function waitForFonts(page) {
  const missing = await page.evaluate(async (faces) => {
    await Promise.all(faces.map((face) => document.fonts.load(face)));
    await document.fonts.ready;
    return faces.filter((face) => !document.fonts.check(face));
  }, FONT_FACES);
  if (missing.length > 0) {
    throw new Error(`waitForFonts: these font faces are not available: ${missing.join(', ')}`);
  }
}

/* ------------------------------------------------------------------------ */
/* Login photo mask (silo photo only)                                        */
/* ------------------------------------------------------------------------ */

// Green panel edge (FR-13): from (692, 0) to (519.958, 768).
const panelEdgeX = (y) => 692 - (172.042 * y) / 768;
// Bottom-right leftover triangle (FR-14) spans y 755.32…768, x 1356.83…1366.
const TRIANGLE_TOP = 755.32;
const TRIANGLE_LEFT = 1356;
const STRIP_PX = 8;

/**
 * Integer rectangles covering the visible silo photo of the Login frame: for
 * each 8 px band, from the panel edge at the band's BOTTOM row (its smallest
 * x, since the edge slants left) to the frame edge, stopping short of the 9×13
 * triangle. No photo sliver is left unmasked; the cost is up to ~1.8 px of the
 * panel's angled edge per band. The form and the triangle are never masked.
 */
export const LOGIN_PHOTO_MASK = Object.freeze(
  Array.from({ length: 768 / STRIP_PX }, (_, i) => {
    const top = i * STRIP_PX;
    const left = Math.floor(panelEdgeX(top + STRIP_PX));
    const right = top + STRIP_PX > TRIANGLE_TOP ? TRIANGLE_LEFT : 1366;
    return Object.freeze({ left, top, width: right - left, height: STRIP_PX });
  }),
);

/** Inject transparent, fixed boxes for `rects`; returns a locator for `mask`. */
export async function installMask(page, rects) {
  await page.evaluate((boxes) => {
    for (const box of boxes) {
      const el = document.createElement('div');
      el.setAttribute('data-fidelity-mask', '');
      el.setAttribute('aria-hidden', 'true');
      Object.assign(el.style, {
        position: 'fixed',
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        pointerEvents: 'none',
        background: 'transparent',
      });
      document.body.append(el);
    }
  }, rects);
  return page.locator('[data-fidelity-mask]');
}

/** Write `<name>` from __baselines__ into .baselines-masked with `rects` painted in MASK_COLOR. */
export async function writeMaskedBaseline(name, rects) {
  const source = path.join(BASELINE_DIR, name);
  const { data, info } = await sharp(source).raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 1366 || info.height !== 768 || info.channels !== 4) {
    throw new Error(
      `writeMaskedBaseline: ${name} must be 1366×768 RGBA; got ${info.width}×${info.height} with ${info.channels} channels`,
    );
  }
  for (const { left, top, width, height } of rects) {
    for (let y = Math.max(0, top); y < Math.min(info.height, top + height); y += 1) {
      for (let x = Math.max(0, left); x < Math.min(info.width, left + width); x += 1) {
        const at = (y * info.width + x) * 4;
        data[at] = MASK_RGB[0];
        data[at + 1] = MASK_RGB[1];
        data[at + 2] = MASK_RGB[2];
        data[at + 3] = 255;
      }
    }
  }
  const target = path.join(MASKED_BASELINE_DIR, name);
  await sharp(data, { raw: info }).png().toFile(target);
  return target;
}

/**
 * Share of differing pixels between two PNG buffers, using pixelmatch's YIQ
 * colour distance at `threshold` WITHOUT anti-aliasing exclusion. It is an
 * upper bound of the ratio Playwright's comparator computes; reported only.
 */
export async function diffRatio(actualPng, expectedPng, threshold = 0.1) {
  const [a, b] = await Promise.all(
    [actualPng, expectedPng].map((png) => sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })),
  );
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) return 1;
  const maxDelta = 35215 * threshold * threshold;
  const blend = (c, alpha) => 255 + (c - 255) * alpha;
  let diff = 0;
  const pixels = a.info.width * a.info.height;
  for (let i = 0; i < pixels * 4; i += 4) {
    const aa = a.data[i + 3] / 255;
    const ba = b.data[i + 3] / 255;
    const r1 = blend(a.data[i], aa);
    const g1 = blend(a.data[i + 1], aa);
    const b1 = blend(a.data[i + 2], aa);
    const r2 = blend(b.data[i], ba);
    const g2 = blend(b.data[i + 1], ba);
    const b2 = blend(b.data[i + 2], ba);
    const y = (r1 - r2) * 0.29889531 + (g1 - g2) * 0.58662247 + (b1 - b2) * 0.11448223;
    const iq = (r1 - r2) * 0.59597799 - (g1 - g2) * 0.2741761 - (b1 - b2) * 0.32180189;
    const q = (r1 - r2) * 0.21147017 - (g1 - g2) * 0.52261711 + (b1 - b2) * 0.31114694;
    if (0.5053 * y * y + 0.299 * iq * iq + 0.1957 * q * q > maxDelta) diff += 1;
  }
  return diff / pixels;
}

/* ------------------------------------------------------------------------ */
/* Measurement audit                                                         */
/* ------------------------------------------------------------------------ */

export function readExpected(file) {
  const table = JSON.parse(readFileSync(path.join(FIDELITY_DIR, 'expected', file), 'utf8'));
  return Object.fromEntries(Object.entries(table).filter(([key]) => !key.startsWith('$')));
}

const BOX_KEYS = ['x', 'y', 'w', 'h'];
const COLOUR_KEYS = new Set(['color', 'backgroundColor', 'borderColor']);
const STYLE_PROPS = {
  color: 'color',
  backgroundColor: 'backgroundColor',
  borderColor: 'borderTopColor',
  borderWidth: 'borderTopWidth',
  fontFamily: 'fontFamily',
  fontWeight: 'fontWeight',
  fontSize: 'fontSize',
  lineHeight: 'lineHeight',
  letterSpacing: 'letterSpacing',
  radius: 'borderTopLeftRadius',
  opacity: 'opacity',
  insetStroke: 'boxShadow',
};

/** `#rrggbb` / `#rrggbbaa` / `transparent` → the computed-style `rgb()`/`rgba()` form. */
export function cssColour(value) {
  if (value === 'transparent') return 'rgba(0, 0, 0, 0)';
  if (typeof value !== 'string' || !/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
    throw new Error(`cssColour: expected #rrggbb or #rrggbbaa, got ${JSON.stringify(value)}`);
  }
  const hex = value.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  if (hex.length === 8) {
    const byte = parseInt(hex.slice(6, 8), 16);
    if (byte !== 255) {
      // Chromium serialises alpha with the fewest decimals that round-trip to the byte.
      const two = Number((byte / 255).toFixed(2));
      const alpha = Math.round(two * 255) === byte ? two : Number((byte / 255).toFixed(3));
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function normalise(key, actual) {
  if (key === 'fontFamily') return actual.split(',')[0].trim().replace(/^["']|["']$/g, '');
  if (key === 'letterSpacing') return actual === 'normal' ? '0px' : actual;
  return actual;
}

function expectedValue(key, value) {
  if (COLOUR_KEYS.has(key)) return cssColour(value);
  if (key === 'fontWeight') return String(value);
  if (key === 'letterSpacing') return value === 0 || value === '0' ? '0px' : value;
  if (key === 'insetStroke') {
    // '<width> <#hex>' → Chromium's computed form '<rgb()> 0px 0px 0px <width> inset'.
    const [width, colour] = value.split(' ');
    return `${cssColour(colour)} 0px 0px 0px ${width} inset`;
  }
  return value;
}

/** Returns a list of human-readable mismatches (empty when the audit passes). */
export async function measurementAudit(page, expected) {
  const measured = await page.evaluate(
    ({ fids, props }) =>
      Object.fromEntries(
        fids.map((fid) => {
          const nodes = document.querySelectorAll(`[data-fid="${CSS.escape(fid)}"]`);
          if (nodes.length !== 1) return [fid, { count: nodes.length }];
          const el = nodes[0];
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const style = Object.fromEntries(Object.entries(props).map(([k, p]) => [k, cs[p]]));
          return [fid, { count: 1, box: { x: r.x, y: r.y, w: r.width, h: r.height }, style }];
        }),
      ),
    { fids: Object.keys(expected), props: STYLE_PROPS },
  );

  const problems = [];
  const known = new Set([...BOX_KEYS, ...Object.keys(STYLE_PROPS)]);
  for (const [fid, want] of Object.entries(expected)) {
    for (const key of Object.keys(want)) {
      if (!known.has(key)) problems.push(`${fid}: unknown expected key "${key}"`);
    }
    const got = measured[fid];
    if (got.count !== 1) {
      problems.push(`${fid}: expected exactly one element, found ${got.count}`);
      continue;
    }
    for (const key of BOX_KEYS) {
      if (want[key] === undefined) continue;
      const delta = Math.abs(got.box[key] - want[key]);
      if (delta > BOX_TOLERANCE_PX) {
        problems.push(`${fid}: ${key} ${got.box[key].toFixed(3)} ≠ ${want[key]} (Δ ${delta.toFixed(3)} > ±${BOX_TOLERANCE_PX} px)`);
      }
    }
    for (const key of Object.keys(STYLE_PROPS)) {
      if (want[key] === undefined) continue;
      const actual = normalise(key, got.style[key]);
      const wanted = expectedValue(key, want[key]);
      if (actual !== wanted) problems.push(`${fid}: ${key} "${actual}" ≠ "${wanted}"`);
    }
  }
  return problems;
}

/* ------------------------------------------------------------------------ */
/* Copy audit                                                                */
/* ------------------------------------------------------------------------ */

/**
 * `expected`: { [fid]: { text?: string, alt?: string } }. Text is compared
 * with textContent exactly (no trimming), so `·`, `’` and spacing must match.
 */
export async function copyAudit(page, expected) {
  const found = await page.evaluate(
    (fids) =>
      Object.fromEntries(
        fids.map((fid) => {
          const el = document.querySelector(`[data-fid="${CSS.escape(fid)}"]`);
          return [fid, el ? { text: el.textContent, alt: el.getAttribute('alt') } : null];
        }),
      ),
    Object.keys(expected),
  );
  const problems = [];
  for (const [fid, want] of Object.entries(expected)) {
    const got = found[fid];
    if (!got) {
      problems.push(`${fid}: element missing`);
      continue;
    }
    for (const key of ['text', 'alt']) {
      if (want[key] !== undefined && got[key] !== want[key]) {
        problems.push(`${fid}: ${key} ${JSON.stringify(got[key])} ≠ ${JSON.stringify(want[key])}`);
      }
    }
  }
  return problems;
}
