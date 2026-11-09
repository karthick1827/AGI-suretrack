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

/* ------------------------------------------------------------------------ */
/* Forgot Password modal (Story 1.5)                                         */
/* ------------------------------------------------------------------------ */

// The committed Figma render of 6026:62907 is 636×410: the 600×374 card plus
// the Shadow/Lg overflow (0 12px 20px -2px → 18 px left/right, 6 px above,
// 30 px below) on Figma's grey canvas. The card therefore sits at (18, 6).
export const FORGOT_PASSWORD_REFERENCE = path.resolve(
  FIDELITY_DIR,
  '../../_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-reference/forgot-password-6026-62907.png',
);
export const FORGOT_PASSWORD_BASELINE = 'forgot-password-6026-62907.png';
export const FORGOT_PASSWORD_CARD_IN_REFERENCE = Object.freeze({ left: 18, top: 6, width: 600, height: 374 });
// FR-36: centred at 1366×768 → x 383, y 197.
export const FORGOT_PASSWORD_CLIP = Object.freeze({ x: 383, y: 197, width: 600, height: 374 });
// The four 16×16 corners outside the 16 px radius show Figma's canvas in the
// render and the backdrop-dimmed Login page in the app: masked in both.
const CORNER = 16;
export const FORGOT_PASSWORD_CORNER_MASK = Object.freeze(
  [
    [0, 0],
    [600 - CORNER, 0],
    [0, 374 - CORNER],
    [600 - CORNER, 374 - CORNER],
  ].map(([left, top]) => Object.freeze({ left, top, width: CORNER, height: CORNER })),
);

/**
 * Crop `crop` out of the committed `source` render (never modified) into
 * .baselines-masked/<name>, painting `rects` (crop coordinates) in MASK_COLOR.
 */
export async function writeCroppedBaseline(source, name, crop, rects) {
  const meta = await sharp(source).metadata();
  if (crop.left + crop.width > meta.width || crop.top + crop.height > meta.height) {
    throw new Error(
      `writeCroppedBaseline: the ${crop.width}×${crop.height} crop at (${crop.left}, ${crop.top}) does not fit the ${meta.width}×${meta.height} render ${path.basename(source)}`,
    );
  }
  assertCardAligned(await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), crop, source);
  const { data, info } = await sharp(source)
    .extract(crop)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  paintRects(data, info, rects);
  const target = path.join(MASKED_BASELINE_DIR, name);
  await sharp(data, { raw: info }).png().toFile(target);
  return target;
}

/** Paint `rects` in MASK_COLOR, clamped to the image bounds. */
function paintRects(data, info, rects) {
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
}

/**
 * The crop must sit exactly on the white card: its edge pixels (mid-points of
 * the top and bottom rows, left and right columns, clear of the corners) are
 * opaque white, and the pixels just outside them are not.
 */
function assertCardAligned({ data, info }, crop, source) {
  const at = (x, y) => {
    const i = (y * info.width + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  const white = ([r, g, b, a]) => a === 255 && r >= 250 && g >= 250 && b >= 250;
  const midX = crop.left + Math.floor(crop.width / 2);
  const midY = crop.top + Math.floor(crop.height / 2);
  const right = crop.left + crop.width - 1;
  const bottom = crop.top + crop.height - 1;
  const inside = [
    [midX, crop.top],
    [midX, bottom],
    [crop.left, crop.top + 40],
    [right, crop.top + 40],
  ];
  const outside = [
    [midX, crop.top - 1],
    [midX, bottom + 1],
    [crop.left - 1, midY],
    [right + 1, midY],
  ].filter(([x, y]) => x >= 0 && y >= 0 && x < info.width && y < info.height);
  const bad = [
    ...inside.filter((p) => !white(at(...p))).map(([x, y]) => `(${x}, ${y}) should be the white card edge, is rgba(${at(x, y)})`),
    ...outside.filter((p) => white(at(...p))).map(([x, y]) => `(${x}, ${y}) should be outside the card, is white`),
  ];
  if (bad.length > 0) {
    throw new Error(
      `writeCroppedBaseline: the crop (${crop.left}, ${crop.top}, ${crop.width}×${crop.height}) is not aligned with the card in ${path.basename(source)}: ${bad.join('; ')}`,
    );
  }
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

/* ------------------------------------------------------------------------ */
/* Signed-in shell: Header and profile panel (Story 2.1)                     */
/* ------------------------------------------------------------------------ */

const FIGMA_1X = path.resolve(
  FIDELITY_DIR,
  '../../_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05/figma-reference/1x',
);

// The 1× render of Header 6227:63670 is 1374×72: the 1366×64 header plus the
// drop-shadow overflow (4 px each side, 2 px above, 6 px below). It is never
// edited; the header is cropped out at (4, 2) after an alignment check.
export const HEADER_REFERENCE = path.join(FIGMA_1X, 'header-6227-63670.raw-1374x72.png');
export const HEADER_BASELINE = 'header-6227-63670.png';
export const HEADER_IN_REFERENCE = Object.freeze({ left: 4, top: 2, width: 1366, height: 64 });
export const HEADER_CLIP = Object.freeze({ x: 0, y: 0, width: 1366, height: 64 });
// AD-15: the avatar photo is masked (32 px at x 1310–1342, y 16–48).
export const HEADER_MASK = Object.freeze([Object.freeze({ left: 1310, top: 16, width: 32, height: 32 })]);

// The 1× render of profile panel 6026:52937 is exactly 290×768.
export const PROFILE_MENU_REFERENCE = path.join(FIGMA_1X, 'profile-menu-6026-52937.png');
export const PROFILE_MENU_BASELINE = 'profile-menu-6026-52937.png';
export const PROFILE_MENU_IN_REFERENCE = Object.freeze({ left: 0, top: 0, width: 290, height: 768 });
// The app panel sits below the Header, right-aligned to the 1366 canvas.
export const PROFILE_MENU_CLIP = Object.freeze({ x: 1076, y: 64, width: 290, height: 768 });
export const PROFILE_MENU_VIEWPORT = Object.freeze({ width: 1366, height: 64 + 768 });
// AD-14 shows only the title and Logout. The Figma close "X" and the omitted
// user block plus four entries are masked (panel coordinates); the title,
// its divider and the Logout row are compared.
export const PROFILE_MENU_MASK = Object.freeze([
  Object.freeze({ left: 256, top: 18, width: 16, height: 28 }),
  Object.freeze({ left: 20, top: 84, width: 250, height: 290 }),
]);

/** `rects` moved by (dx, dy): panel coordinates → page coordinates for installMask(). */
export const offsetRects = (rects, dx, dy) =>
  rects.map(({ left, top, width, height }) => ({ left: left + dx, top: top + dy, width, height }));

/* ------------------------------------------------------------------------ */
/* KPI strip (Story 2.3)                                                     */
/* ------------------------------------------------------------------------ */

// The 1× Dashboard renders are 1374 × (frame height + 2): the frame plus the
// canvas border Figma exports around it (4 px left/right, 2 px top/bottom),
// so frame (x, y) sits at (x + 4, y + 2). They are never edited; the KPI
// strip (page 24, 136, 1318×90, FR-59) is cropped out at (28, 138) after the
// alignment check.
export const KPI_STRIP_CLIP = Object.freeze({ x: 24, y: 136, width: 1318, height: 90 });
export const KPI_STRIP_IN_REFERENCE = Object.freeze({ left: 28, top: 138, width: 1318, height: 90 });
export const KPI_STRIP_REFERENCES = Object.freeze({
  full: path.join(FIGMA_1X, 'dashboard-full-6215-58878.raw-1374x1054.png'),
  small: path.join(FIGMA_1X, 'dashboard-small-6864-4514.raw-1374x862.png'),
  allgood: path.join(FIGMA_1X, 'dashboard-allgood-6879-15603.raw-1374x858.png'),
});
export const kpiStripBaseline = (state) => `kpi-strip-${state}.png`;

/* ------------------------------------------------------------------------ */
/* Equipment card (Story 2.4)                                                */
/* ------------------------------------------------------------------------ */

// The Equipment card (page 24, 246, 649 × 444 Full / 240 Small and All-good,
// FR-66) is compared inside its 1 px #D1D5DB border: the 647 × (h − 2) box
// at page (25, 247), cropped out of the 1× Dashboard renders after the
// alignment check (the crop's edge rows and columns are white card interior;
// the pixels just outside them are the grey border).
export const EQUIPMENT_CARD_REFERENCES = Object.freeze({
  full: path.join(FIGMA_1X, 'dashboard-full-6215-58878.raw-1374x1054.png'),
  small: path.join(FIGMA_1X, 'dashboard-small-6864-4514.raw-1374x862.png'),
  allgood: path.join(FIGMA_1X, 'dashboard-allgood-6879-15603.raw-1374x858.png'),
});
export const EQUIPMENT_CARD_HEIGHT = Object.freeze({ full: 444, small: 240, allgood: 240 });
const equipmentCardHeight = (state) => {
  if (!Object.hasOwn(EQUIPMENT_CARD_HEIGHT, state)) {
    throw new Error(`equipment card: unknown Dashboard state ${JSON.stringify(state)} (expected ${Object.keys(EQUIPMENT_CARD_HEIGHT).join(', ')})`);
  }
  return EQUIPMENT_CARD_HEIGHT[state];
};
export const equipmentCardClip = (state) =>
  Object.freeze({ x: 25, y: 247, width: 647, height: equipmentCardHeight(state) - 2 });
// Render (29, 249) = page (25, 247) + the render's 4 px left / 2 px top canvas border.
export const equipmentCardInReference = (state) =>
  Object.freeze({ left: 29, top: 249, width: 647, height: equipmentCardHeight(state) - 2 });
export const equipmentCardBaseline = (state) => {
  equipmentCardHeight(state);
  return `equipment-card-${state}.png`;
};

/* ------------------------------------------------------------------------ */
/* Recent Alerts card (Story 2.5)                                            */
/* ------------------------------------------------------------------------ */

// The Recent Alerts card (page 693, 246, 649 × 444 Full / 240 Small and
// All-good, FR-73) is compared inside its 1 px #D1D5DB border: the
// 647 × (h − 2) box at page (694, 247), cropped out of the 1× Dashboard
// renders after the alignment check (the crop's edge rows and columns are
// white card interior; the pixels just outside them are the grey border).
export const RECENT_ALERTS_REFERENCES = Object.freeze({
  full: path.join(FIGMA_1X, 'dashboard-full-6215-58878.raw-1374x1054.png'),
  small: path.join(FIGMA_1X, 'dashboard-small-6864-4514.raw-1374x862.png'),
  allgood: path.join(FIGMA_1X, 'dashboard-allgood-6879-15603.raw-1374x858.png'),
});
export const RECENT_ALERTS_HEIGHT = Object.freeze({ full: 444, small: 240, allgood: 240 });
const recentAlertsHeight = (state) => {
  if (!Object.hasOwn(RECENT_ALERTS_HEIGHT, state)) {
    throw new Error(`recent alerts card: unknown Dashboard state ${JSON.stringify(state)} (expected ${Object.keys(RECENT_ALERTS_HEIGHT).join(', ')})`);
  }
  return RECENT_ALERTS_HEIGHT[state];
};
export const recentAlertsClip = (state) =>
  Object.freeze({ x: 694, y: 247, width: 647, height: recentAlertsHeight(state) - 2 });
// Render (698, 249) = page (694, 247) + the render's 4 px left / 2 px top canvas border.
export const recentAlertsInReference = (state) =>
  Object.freeze({ left: 698, top: 249, width: 647, height: recentAlertsHeight(state) - 2 });
export const recentAlertsBaseline = (state) => {
  recentAlertsHeight(state);
  return `recent-alerts-card-${state}.png`;
};
