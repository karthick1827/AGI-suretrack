// Story 2.7 — Grain On Hand card: every I/O-matrix row except Fidelity
// (FR-83 to FR-87, AD-7, AD-8, AD-14, AD-16, AD-18), plus a check that no
// shown value is formatted or computed.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, isInaccessible, render, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router';
import App from '../../src/app/App.jsx';
import { getConfig, getDashboard, getUsers } from '../../src/data/api.js';
import GrainCard from '../../src/features/dashboard/grain/GrainCard.jsx';
import { grainCommodities, hasGrainContent, legendLayout } from '../../src/features/dashboard/grain/grain.js';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { GRAIN_COMMODITIES, grainSegments } from '../../src/lib/geometry.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
import { jsxLiterals } from './support/jsx-literals.js';
import { fromRoot, readText } from './support/project.js';

vi.mock('../../src/data/api.js', () => ({
  MAX_TIMEOUT_MS: 2147483647,
  getConfig: vi.fn(),
  getUsers: vi.fn(),
  getDashboard: vi.fn(),
}));

const readJson = (file) => JSON.parse(readFileSync(fromRoot(file), 'utf8'));
const config = readJson('public/app-config.json');
const usersData = readJson('src/data/json/users.json');
const DOCS = {
  full: readJson('src/data/json/dashboard.full.json'),
  small: readJson('src/data/json/dashboard.small.json'),
  allgood: readJson('src/data/json/dashboard.allgood.json'),
};
const TTL = usersData.policy.sessionTtlMinutes;
const user = (name) => usersData.users.find((entry) => entry.username === name);
const SOURCE = readText(fromRoot('src/features/dashboard/grain/GrainCard.jsx'));
const CONTENT_SOURCE = readText(fromRoot('src/features/dashboard/grain/grain.js'));

// Transcribed from PRD FR-83 to FR-87 (not from the JSON), so the two cross-check.
const SUMMARY = {
  full: ['1.40M bu', 'of 1.78M bu · 79% full', '79% Fill'],
  small: ['21,050 bu', 'of 25,000 bu · 79% full', '84% Fill'],
  allgood: ['21,050 bu', 'of 25,000 bu · 79% full', '84% Fill'],
};
const LEGEND = {
  full: [
    ['Canola', '340k bu · 1 unit'],
    ['Corn', '314k bu · 1 unit'],
    ['Soybeans', '268k bu · 1 unit'],
    ['Wheat', '224k bu · 1 unit'],
    ['Barley', '140k bu · 1 unit'],
    ['Oats', '111k bu · 1 unit'],
  ],
  small: [['Wheat', '21,050 bu · 1 unit · Wheat Storage']],
  allgood: [['Wheat', '21,050 bu · 1 unit · Wheat Storage']],
};
/** FR-85 `[token, left, width, top]` per segment. */
const SEGMENTS = {
  full: [
    ['--raw-e3c341', 0, 72.5, 0],
    ['--raw-e07b39', 76.33, 67.5, 0],
    ['--raw-6f8f4f', 147.58, 57.5, 0],
    ['--raw-c98f2e', 208.83, 47.5, 0],
    ['--raw-8fb36b', 260.08, 30, 0],
    ['--raw-b9a47a', 293.83, 23.75, 0],
  ],
  small: [['--raw-c98f2e', 0, 321, -0.5]],
  allgood: [['--raw-c98f2e', 0, 321, -0.5]],
};
const TRACK = { left: 321.33, width: 81.25, top: 0 };
const STATES = ['full', 'small', 'allgood'];

let consoleSpies;
let overlayRoot;

beforeEach(() => {
  localStorage.clear();
  overlayRoot = document.createElement('div');
  overlayRoot.id = 'overlay-root';
  document.body.append(overlayRoot);
  consoleSpies = ['error', 'warn', 'log', 'info'].map((level) => vi.spyOn(console, level));
  vi.mocked(getConfig).mockResolvedValue(config);
  vi.mocked(getUsers).mockResolvedValue(usersData);
  vi.mocked(getDashboard).mockImplementation((state) => Promise.resolve(DOCS[state]));
});

afterEach(({ task }) => {
  try {
    // No React warnings (duplicate or missing keys, invalid DOM nesting) and no logging.
    const failed = task.result?.state === 'fail' || (task.result?.errors?.length ?? 0) > 0;
    if (!failed) for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  } finally {
    cleanup();
    overlayRoot.remove();
    localStorage.clear();
    vi.restoreAllMocks();
  }
});

const signInAs = (name = 'demo') =>
  localStorage.setItem(SESSION_KEY, JSON.stringify(createSessionRecord(user(name), { now: Date.now(), ttlMinutes: TTL })));

async function renderAt(url) {
  window.history.replaceState(null, '', url);
  const view = render(<App />);
  await act(async () => {
    await Promise.resolve();
  });
  return view;
}

async function openDashboard(state, status = 'ready') {
  signInAs('demo');
  await renderAt(paths.dashboard(state));
  await waitFor(() => expect(slot().dataset.status).toBe(status));
}

/** The card alone (it has no links, but keep a router like the page has). */
const renderCard = (data, variant) =>
  render(
    <MemoryRouter>
      <GrainCard data={data} variant={variant} />
    </MemoryRouter>,
  );

const slot = () => {
  const el = document.querySelector('[data-section="grain"]');
  if (!el) throw new Error('the Grain section [data-section="grain"] is not rendered');
  return el;
};
const body = () => document.querySelector('[data-grain-body]');
const items = () => [...document.querySelectorAll('[data-grain-item]')];
const segments = () => [...document.querySelectorAll('[data-grain-segment]')];
const track = () => {
  const el = document.querySelector('[data-grain-track]');
  if (!el) throw new Error('the Fill bar track [data-grain-track] is not rendered');
  return el;
};
const part = (el, name) => el.querySelector(`[data-grain-part="${name}"]`);
const text = (el) => el?.textContent ?? null;
const summaryText = () => [text(part(body(), 'summaryBold')), text(part(body(), 'summaryRest')), text(part(body(), 'fillLabel'))];
const itemText = (item) => [text(part(item, 'name')), text(part(item, 'sub'))];

/** A bar box's `{ left, top, width }` from its inline `translate(L px, T px) scaleX(W)`. */
const boxOf = (el) => {
  const match = /^translate\((-?[\d.e+-]+)px, (-?[\d.e+-]+)px\) scaleX\((-?[\d.e+-]+)\)$/.exec(el.style.transform);
  if (!match) throw new Error(`bar box has no translate + scaleX: ${JSON.stringify(el.style.transform)}`);
  const [left, top, width] = match.slice(1).map(Number.parseFloat);
  return { left, top, width };
};
const near = (actual, expected, label) => expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThanOrEqual(0.01);
/** The inline colour of a segment's paint layer or a swatch. */
const paintColour = (segment) => segment.firstElementChild.style.backgroundColor;
const swatchColour = (item) => part(item, 'swatch').style.backgroundColor;

const item = (fields) => ({ name: 'Wheat', subLabel: '224k bu · 1 unit', color: '#C98F2E', amountK: 224, ...fields });
/** Full layouts by frame position: the 42 px first-row item, then Corn's scaled slot. */
const LAYOUTS = { full: ['fullFirst', 'corn', 'regular', 'regular', 'regular', 'regular'], small: ['regular'], allgood: ['regular'] };

/* ------------------------------------------------------------------------ */
/* I/O matrix: Full, Small, All-good                                         */
/* ------------------------------------------------------------------------ */

describe('Grain On Hand per Dashboard state (FR-83, FR-84, FR-87, FR-94)', () => {
  it.each(STATES)('%s: header Grain On Hand / All grain inventory; summary, fill label and Legend verbatim (Q-G3 kept); no links', async (state) => {
    await openDashboard(state);
    const card = within(slot());
    expect(card.getByRole('heading', { level: 2 }).textContent).toBe('Grain On Hand');
    expect(card.getByText('All grain inventory').tagName).toBe('P');
    expect(summaryText()).toEqual(SUMMARY[state]);
    expect(items().map(itemText)).toEqual(LEGEND[state]);
    expect(card.queryAllByRole('link')).toHaveLength(0);
    expect(slot().querySelectorAll('a, button, [tabindex], [title], [role="tooltip"]')).toHaveLength(0);
  });

  it.each(STATES)('%s: the card holds only the header, the summary (bold + one space + rest), the fill label and the Legend', async (state) => {
    await openDashboard(state);
    const [bold, rest, fill] = SUMMARY[state];
    expect(text(part(body(), 'summary'))).toBe(`${bold} ${rest}`);
    // The one space is the bold span's (FR-84: "summaryBold + one space" in 700).
    expect(part(body(), 'summaryBold').parentElement.tagName).toBe('STRONG');
    expect(part(body(), 'summaryBold').parentElement.textContent).toBe(`${bold}${copy.dashboard.grainSummarySpace}`);
    expect(copy.dashboard.grainSummarySpace).toBe(' ');
    expect(slot().textContent).toBe(['Grain On Hand', 'All grain inventory', `${bold} ${rest}`, fill, ...LEGEND[state].flat()].join(''));
    // The PRD transcription and the state document agree.
    const doc = DOCS[state].grain;
    expect([doc.summaryBold, doc.summaryRest, doc.fillLabel]).toEqual(SUMMARY[state]);
    expect(doc.items.map((entry) => [entry.name, entry.subLabel])).toEqual(LEGEND[state]);
  });

  it.each(STATES)('%s: Fill bar segments at the FR-85 px (±0.01) with the Commodity map colours; the track at 321.33 + 81.25', async (state) => {
    await openDashboard(state);
    expect(segments()).toHaveLength(SEGMENTS[state].length);
    segments().forEach((segment, i) => {
      const [token, left, width, top] = SEGMENTS[state][i];
      const box = boxOf(segment);
      near(box.left, left, `segment ${i} left`);
      near(box.width, width, `segment ${i} width`);
      expect(box.top, `segment ${i} top`).toBe(top);
      expect(segment.dataset.grainColour).toBe(token);
      expect(paintColour(segment)).toBe(`var(${token})`);
    });
    expect(boxOf(track())).toEqual(TRACK);
    // The track is drawn first, so the segments paint over it.
    expect(track().parentElement.firstElementChild).toBe(track());
  });

  it.each(STATES)('%s: Legend swatches carry the segment colours; Full keeps its first-row and scaled Corn layouts (Q-G2, data-fid 6337:54860)', async (state) => {
    await openDashboard(state);
    const names = LEGEND[state].map(([name]) => name);
    expect(items().map((el) => el.dataset.grainColour)).toEqual(names.map((name) => GRAIN_COMMODITIES[name].token));
    expect(items().map(swatchColour)).toEqual(names.map((name) => `var(${GRAIN_COMMODITIES[name].token})`));
    expect(items().map((el) => el.dataset.grainLayout)).toEqual(LAYOUTS[state]);
    const fids = items().map((el) => el.dataset.fid ?? null);
    expect(fids).toEqual(names.map((name) => (name === 'Corn' ? FID.grain.cornLegendItem : null)));
    expect(FID.grain.cornLegendItem).toBe('6337:54860');
  });

  it('the Legend is a list of its items in file order (row-major); the Fill bar and swatches are hidden from assistive technology', async () => {
    await openDashboard('full');
    const list = within(slot()).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toEqual(items());
    expect(document.querySelector('[data-grain-bar]').getAttribute('aria-hidden')).toBe('true');
    for (const segment of segments()) expect(isInaccessible(segment)).toBe(true);
    for (const el of items()) {
      expect(part(el, 'swatch').getAttribute('aria-hidden')).toBe('true');
      expect(isInaccessible(part(el, 'name'))).toBe(false);
      expect(isInaccessible(part(el, 'sub'))).toBe(false);
    }
    expect(isInaccessible(part(body(), 'summary'))).toBe(false);
    expect(isInaccessible(part(body(), 'fillLabel'))).toBe(false);
  });

  it('bar box edges on the bar edge bleed (data-grain-bleed): the track and Full segments both; the nudged Wheat only at the top', async () => {
    await openDashboard('full');
    expect(track().dataset.grainBleed).toBe('top bottom');
    expect(segments().map((el) => el.dataset.grainBleed)).toEqual(SEGMENTS.full.map(() => 'top bottom'));
    cleanup();
    await openDashboard('small');
    expect(segments().map((el) => el.dataset.grainBleed)).toEqual(['top']);
    cleanup();
    renderCard({ items: [item({ segmentPx: 50, segmentTopPx: 0.5 })] });
    expect(segments().map((el) => el.dataset.grainBleed)).toEqual(['bottom']);
    // Every box bleeds on at least one edge (top in [−1, 1]).
    for (const top of [-1, -0.25, 0, 0.25, 1]) {
      cleanup();
      renderCard({ items: [item({ segmentTopPx: top })] });
      expect(['top', 'bottom', 'top bottom']).toContain(segments()[0].dataset.grainBleed);
    }
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: hover (AD-14)                                                 */
/* ------------------------------------------------------------------------ */

describe('no tooltip and no hover change (FR-86 deferred, AD-14)', () => {
  it('pointer over, into and out of every segment, the track and the Legend: nothing appears and nothing changes', async () => {
    await openDashboard('full');
    const before = slot().innerHTML;
    for (const el of [...segments(), track(), ...items()]) {
      fireEvent.pointerOver(el);
      fireEvent.pointerEnter(el);
      fireEvent.mouseOver(el);
      fireEvent.mouseEnter(el);
      fireEvent.mouseMove(el);
      fireEvent.focus(el);
      expect(slot().innerHTML).toBe(before);
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
      expect(overlayRoot.childElementCount).toBe(0);
      fireEvent.mouseLeave(el);
      fireEvent.pointerLeave(el);
    }
    // The tooltip copy (FR-86) is never written.
    expect(document.body.textContent).not.toMatch(/of capacity/);
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: loading and error (AD-18)                                     */
/* ------------------------------------------------------------------------ */

describe('Grain loading and error (FR-95, FR-96, AD-18)', () => {
  it('loading: the Story 2.2 placeholder at the card size; no body yet; same size when ready', async () => {
    let release;
    vi.mocked(getDashboard).mockImplementation((state) => new Promise((resolve) => (release = () => resolve(DOCS[state]))));
    signInAs('demo');
    await renderAt(paths.dashboard('full'));
    expect(slot().dataset.status).toBe('loading');
    expect([slot().style.width, slot().style.height]).toEqual(['426px', '326px']);
    expect(body()).toBeNull();
    expect(slot().querySelector('[aria-hidden="true"]')).not.toBeNull();
    await act(async () => release());
    await waitFor(() => expect(slot().dataset.status).toBe('ready'));
    expect([slot().style.width, slot().style.height]).toEqual(['426px', '326px']);
    expect(items()).toHaveLength(6);
  });

  it('error (rejected load, as ?__fail=dashboard): Couldn’t load this section. + Retry at the card size; Retry reloads through the layout', async () => {
    let fail = true;
    vi.mocked(getDashboard).mockImplementation((state) =>
      fail ? Promise.reject({ code: 'FORCED_FAIL', message: 'forced' }) : Promise.resolve(DOCS[state]),
    );
    await openDashboard('small', 'error');
    expect([slot().style.width, slot().style.height]).toEqual(['426px', '326px']);
    expect(within(slot()).getByText(copy.dashboard.sectionError)).toBeTruthy();
    expect(body()).toBeNull();
    fail = false;
    await act(async () => fireEvent.click(within(slot()).getByRole('button', { name: copy.dashboard.retry })));
    await waitFor(() => expect(slot().dataset.status).toBe('ready'));
    expect(items().map(itemText)).toEqual(LEGEND.small);
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });

  const header = { title: 'Grain On Hand', subtitle: 'All grain inventory' };
  it.each([
    ['no summary and no items', header],
    ['blank summary and empty items', { ...header, summaryBold: ' ', summaryRest: '', fillLabel: '\t', items: [] }],
    ['items not an array', { ...header, items: { 0: item({}) } }],
    ['only unusable items (no visible label, no coloured segment)', { ...header, items: [null, 'Wheat', [item({})], { name: ' ', subLabel: {}, amountK: 0 }] }],
    ['only unknown-Commodity segments without labels', { ...header, items: [{ name: { n: 1 }, amountK: 200, color: '#C98F2E' }, { amountK: 100 }] }],
    ['only labelled items without a mapped name and matching colour', { ...header, items: [{ name: 'Rye', subLabel: '5k bu', color: '#C98F2E', amountK: 5 }, { name: 'Wheat', subLabel: '5k bu', color: '#E3C341', amountK: 5 }] }],
    ['only items too wide for the room before the track', { ...header, items: [{ name: 'Wheat', subLabel: '2M bu', color: '#C98F2E', amountK: 2000, segmentPx: 400 }] }],
    ['object and NaN summary values', { ...header, summaryBold: { v: '1.40M bu' }, summaryRest: ['of'], fillLabel: Number.NaN, items: [] }],
    ['a string slice', 'grain'],
  ])('ready with %s → the section shows the Story 2.2 error state, not a blank card', async (_name, slice) => {
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS.full, grain: slice });
    signInAs('demo');
    await renderAt(paths.dashboard('full'));
    await waitFor(() => expect(document.querySelector('[data-section="kpi"]').dataset.status).toBe('ready'));
    expect(slot().dataset.status).toBe('error');
    expect(within(slot()).getByText(copy.dashboard.sectionError)).toBeTruthy();
    expect(within(slot()).getByRole('button', { name: copy.dashboard.retry })).toBeTruthy();
    expect(body()).toBeNull();
    expect(document.querySelector('[data-section="fanActivity"]').dataset.status).toBe('ready');
  });

  it('the shared rule: hasGrainContent agrees with what the card draws', () => {
    expect(hasGrainContent(DOCS.full.grain)).toBe(true);
    expect(hasGrainContent(DOCS.small.grain)).toBe(true);
    // Any one usable part is content.
    for (const good of [
      { summaryBold: '1.40M bu' },
      { summaryRest: 'of 1.78M bu' },
      { fillLabel: '79% Fill' },
      { fillLabel: 0 },
      { items: [{ name: 'Wheat', color: '#C98F2E', amountK: 10 }] },
      { items: [{ name: { x: 1 }, color: '#C98F2E', amountK: 10 }, { name: 'Wheat', color: ' #c98f2e ', segmentPx: 5 }] },
    ]) {
      expect(hasGrainContent(good), JSON.stringify(good)).toBe(true);
    }
    for (const bad of [
      null,
      undefined,
      [],
      'x',
      7,
      {},
      { items: null },
      { items: [] },
      { summaryBold: '  ', summaryRest: null, fillLabel: Infinity, items: [null, 1, {}, { name: ' ', subLabel: [] }] },
      // Labels alone, or segments without a mapped name and matching colour, are not usable items.
      { items: [{ name: 'Rye', subLabel: '5k bu', amountK: 5 }, { subLabel: '5k bu' }, { name: 'Wheat', subLabel: '5k bu', amountK: 5 }] },
      { items: [{ amountK: 100 }, { name: 7n, amountK: 50, color: '#C98F2E' }, { name: 'Wheat', color: '#C98', amountK: 50 }] },
      // A mapped, coloured item without a usable width.
      { items: [{ name: 'Wheat', color: '#C98F2E', amountK: 0 }, { name: 'Oats', color: '#B9A47A', amountK: 2000 }] },
    ]) {
      expect(hasGrainContent(bad), String(bad?.items ?? bad)).toBe(false);
      renderCard(bad);
      expect(items()).toHaveLength(0);
      expect(segments()).toHaveLength(0);
      expect(document.querySelector('[data-grain-track]')).toBeNull();
      expect(body().textContent).toBe('');
      cleanup();
    }
  });

  it('a slice with only a summary, or only usable items, is drawn (not the error); no segments → no track', async () => {
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS.full, grain: { ...DOCS.full.grain, items: [] } });
    await openDashboard('full');
    expect(summaryText()).toEqual(SUMMARY.full);
    expect(items()).toHaveLength(0);
    expect(segments()).toHaveLength(0);
    expect(document.querySelector('[data-grain-track]')).toBeNull();
    expect(document.querySelector('[data-grain-bar]')).not.toBeNull();
    cleanup();
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS.full, grain: { ...DOCS.full.grain, summaryBold: null, summaryRest: null, fillLabel: null } });
    await openDashboard('full');
    expect(summaryText()).toEqual([null, null, null]);
    expect(items().map(itemText)).toEqual(LEGEND.full);
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: bad data; verbatim readings (AD-7, FR-94)                     */
/* ------------------------------------------------------------------------ */

/** Each drawn segment's Legend item: same slot, same Commodity colour. */
const expectOneToOne = () => {
  expect(segments().map((el) => el.dataset.grainColour)).toEqual(items().map((el) => el.dataset.grainColour));
  expect(segments().map((el) => el.dataset.grainSegment)).toEqual(items().map((el) => el.dataset.grainItem));
};

describe('bad data and verbatim readings (AD-7, AD-8)', () => {
  it('one membership rule: an unknown Commodity or a colour that does not match the map is in neither the bar nor the Legend', () => {
    renderCard({
      items: [
        item({ name: 'Rye', subLabel: '10k bu · 1 unit', color: '#C98F2E', amountK: 100 }),
        item({ name: 'Corn', subLabel: '314k bu · 1 unit', color: '#E3C341', amountK: 314 }),
        item({ name: 'Wheat', color: 'wheat' }),
        item({ name: 'Wheat', color: '#C98' }),
        item({ name: 'corn', color: '#E07B39' }),
        item({ name: 'Oats', subLabel: '111k bu · 1 unit', color: '#b9a47a', amountK: 111 }),
        item({ name: 'Barley', subLabel: '140k bu · 1 unit', color: '  #8fb36B\t', amountK: 140 }),
      ],
    });
    expect(items().map(itemText)).toEqual([
      ['Oats', '111k bu · 1 unit'],
      ['Barley', '140k bu · 1 unit'],
    ]);
    expect(items().map(swatchColour)).toEqual(['var(--raw-b9a47a)', 'var(--raw-8fb36b)']);
    expect(segments().map(paintColour)).toEqual(['var(--raw-b9a47a)', 'var(--raw-8fb36b)']);
    expectOneToOne();
  });

  it('the Legend and the bar always have the same members, whatever the data', () => {
    const cases = [
      DOCS.full.grain.items,
      DOCS.small.grain.items,
      [item({ amountK: 0 }), item({ name: 'Oats', color: '#B9A47A' }), item({ name: 'Rye' }), null, item({ name: 'Corn', color: '#E07B39', amountK: 5000 })],
      [item({ segmentPx: 400 }), item({ name: 'Oats', color: '#B9A47A', amountK: 1500 }), item({ name: 'Corn', color: '#E07B39', amountK: 10 })],
      Array.from({ length: 9 }, () => item({ amountK: 10 })),
    ];
    for (const list of cases) {
      renderCard({ items: list });
      expectOneToOne();
      const drawn = grainCommodities({ items: list });
      expect(grainSegments(list).segments.map((s) => [s.name, s.left, s.width])).toEqual(drawn.map((c) => [c.name, c.left, c.width]));
      cleanup();
    }
  });

  it('objects, arrays, booleans, null, NaN and Infinity render nothing (no crash, no "NaN", no "[object Object]")', () => {
    renderCard({
      summaryBold: { v: '1.40M bu' },
      summaryRest: 'of 1.78M bu · 79% full',
      fillLabel: true,
      items: [
        item({ name: { n: 'Canola' }, subLabel: '340k bu · 1 unit', amountK: { k: 340 } }),
        item({ name: 'Corn', subLabel: ['314k bu'], color: '#E07B39', amountK: 314 }),
        item({ name: Number.NaN, subLabel: Infinity }),
        item({ name: null, subLabel: false }),
        item({ name: 'Oats', subLabel: 111, color: '#B9A47A', amountK: Number.NaN }),
        item({ name: 'Barley', subLabel: { s: 1 }, color: '#8FB36B', amountK: 140 }),
      ],
    });
    expect(summaryText()).toEqual([null, 'of 1.78M bu · 79% full', null]);
    // No bold span, so no leading space either.
    expect(text(part(body(), 'summary'))).toBe('of 1.78M bu · 79% full');
    // Unshown sub-labels are left empty.
    expect(items().map(itemText)).toEqual([
      ['Corn', ''],
      ['Barley', ''],
    ]);
    expect(segments().map((el) => boxOf(el).width)).toEqual([67.5, 30]);
    expect(document.body.textContent).not.toMatch(/NaN|Infinity|\[object Object\]|undefined|true|false|null/);
    expect(document.body.innerHTML).not.toMatch(/NaN|\[object Object\]|undefined/);
  });

  it('zero or invalid amounts drop the item; usable segmentPx / segmentTopPx override the formula', () => {
    renderCard({
      items: [
        item({ name: 'Canola', color: '#E3C341', amountK: 0 }),
        item({ name: 'Corn', color: '#E07B39', amountK: '314' }),
        item({ name: 'Soybeans', color: '#6F8F4F', amountK: 268, segmentPx: 100, segmentTopPx: -0.5 }),
        item({ name: 'Wheat', color: '#C98F2E', amountK: 224, segmentPx: -3 }),
      ],
    });
    expect(segments().map((el) => [el.dataset.grainColour, boxOf(el)])).toEqual([
      ['--raw-6f8f4f', { left: 0, top: -0.5, width: 100 }],
      ['--raw-c98f2e', { left: 103.83, top: 0, width: 47.5 }],
    ]);
    expect(items().map((el) => text(part(el, 'name')))).toEqual(['Soybeans', 'Wheat']);
    expect(document.body.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it.each([
    ['past the track (321.33)', { segmentPx: 321.34 }, 47.5, 0],
    ['0', { segmentPx: 0 }, 47.5, 0],
    ['a string', { segmentPx: '321' }, 47.5, 0],
    ['segmentTopPx 1.5', { segmentPx: 321, segmentTopPx: 1.5 }, 321, 0],
    ['segmentTopPx −2', { segmentPx: 321, segmentTopPx: -2 }, 321, 0],
    ['segmentTopPx 1 (in range)', { segmentPx: 321.33, segmentTopPx: 1 }, 321.33, 1],
  ])('an out-of-range override (%s) is rejected, never capped: the formula / top 0 apply', (_name, fields, width, top) => {
    renderCard({ items: [item(fields)] });
    expect(boxOf(segments()[0])).toEqual({ left: 0, top, width });
  });

  it('a formula segment that would pass the track is dropped from the bar and the Legend; no segment overlaps the track', () => {
    renderCard({
      items: [
        item({ name: 'Canola', color: '#E3C341', amountK: 1000 }),
        item({ name: 'Corn', color: '#E07B39', amountK: 2000 }),
        item({ name: 'Oats', color: '#B9A47A', amountK: 300 }),
      ],
    });
    // Canola 213.75; Corn (427.5) would pass 321.33; Oats 63.75 still fits.
    expect(items().map((el) => text(part(el, 'name')))).toEqual(['Canola', 'Oats']);
    const boxes = segments().map(boxOf);
    for (const box of boxes) expect(box.left + box.width).toBeLessThanOrEqual(TRACK.left);
    expect(boxes.map((box) => box.width)).toEqual([213.75, 63.75]);
  });

  it('more than 6 usable items: the first 6 (FR-87, 3 rows × 2), in file order, in the bar and the Legend', () => {
    const names = Object.keys(GRAIN_COMMODITIES);
    const list = [...names, 'Canola', 'Corn'].map((name, i) => item({ name, color: GRAIN_COMMODITIES[name].color, amountK: 10, subLabel: `#${i}` }));
    renderCard({ items: list });
    expect(items().map(itemText)).toEqual(names.map((name, i) => [name, `#${i}`]));
    expect(segments()).toHaveLength(6);
  });

  it('special Legend layouts go by Full-frame position: a Corn or Canola elsewhere, or in Small / All-good, is regular', () => {
    const corn = item({ name: 'Corn', color: '#E07B39', amountK: 10 });
    const canola = item({ name: 'Canola', color: '#E3C341', amountK: 10 });
    const wheat = item({ amountK: 10 });
    const layouts = (list, variant) => {
      renderCard({ items: list }, variant);
      const out = items().map((el) => [el.dataset.grainLayout, el.dataset.fid ?? null]);
      cleanup();
      return out;
    };
    expect(layouts([corn, canola, wheat], 'full')).toEqual([
      ['fullFirst', null],
      ['regular', null],
      ['regular', null],
    ]);
    expect(layouts([wheat, wheat, corn, canola], 'full').map(([layout]) => layout)).toEqual(['fullFirst', 'regular', 'regular', 'regular']);
    expect(layouts([canola, corn], 'full')).toEqual([
      ['fullFirst', null],
      ['corn', FID.grain.cornLegendItem],
    ]);
    for (const variant of ['small', 'allgood']) {
      expect(layouts([canola, corn], variant)).toEqual([
        ['regular', null],
        ['regular', null],
      ]);
    }
    // An unknown variant falls back to Full (as the Fan activity card).
    expect(layouts([canola, corn], 'nope').map(([layout]) => layout)).toEqual(['fullFirst', 'corn']);
    expect([legendLayout(1, 'Corn', 'full'), legendLayout(3, 'Corn', 'full'), legendLayout(0, 'Wheat', 'small')]).toEqual(['corn', 'regular', 'regular']);
  });

  it('the FR-84 space sits between the two summary parts only: no trailing space without summaryRest', () => {
    renderCard({ summaryBold: '1.40M bu', summaryRest: '  ', fillLabel: '79% Fill' });
    expect(text(part(body(), 'summary'))).toBe('1.40M bu');
    expect(summaryText()).toEqual(['1.40M bu', null, '79% Fill']);
  });

  it('whitespace-only or non-text sub-labels render as empty parts; whitespace or mis-cased names are not mapped Commodities', () => {
    renderCard({
      items: [
        item({ name: '   ', subLabel: '340k bu · 1 unit' }),
        item({ name: ' Wheat', subLabel: '340k bu · 1 unit' }),
        item({ name: 'Corn', color: '#E07B39', subLabel: '\t' }),
        item({ name: 'Oats', color: '#B9A47A', subLabel: 0 }),
      ],
    });
    expect(items().map(itemText)).toEqual([
      ['Corn', ''],
      ['Oats', '0'],
    ]);
  });

  it('readings are never formatted, trimmed or re-sorted: everything shown is the reading as given', () => {
    renderCard({
      summaryBold: ' 1.4M  bu',
      summaryRest: 'of 1780000 bu',
      fillLabel: 79,
      items: [
        item({ name: 'Oats', subLabel: '0111k bu', color: '#B9A47A', amountK: 111 }),
        item({ name: 'Canola', subLabel: 0.1 + 0.2, color: '#E3C341', amountK: 340 }),
        item({ name: 'Wheat', subLabel: ' 1e21 ', color: '#C98F2E', amountK: 1e-9 }),
        item({ name: 'Barley', subLabel: ' 1e21 ', color: '#8FB36B', amountK: 10 }),
      ],
    });
    expect(summaryText()).toEqual([' 1.4M  bu', 'of 1780000 bu', '79']);
    // File order is kept (no re-sort by amount); 1e-9 k bu rounds to 0 px: Wheat is not drawn.
    expect(items().map(itemText)).toEqual([
      ['Oats', '0111k bu'],
      ['Canola', '0.30000000000000004'],
      ['Barley', ' 1e21 '],
    ]);
    const texts = [...body().querySelectorAll('*')].filter((el) => el.children.length === 0).map((el) => el.textContent);
    const allowed = new Set([' 1.4M  bu', 'of 1780000 bu', '79', 'Oats', '0111k bu', 'Canola', '0.30000000000000004', 'Barley', ' 1e21 ', '']);
    for (const value of texts) expect(allowed.has(value), JSON.stringify(value)).toBe(true);
    // The bold span holds the reading plus the one PRD space.
    expect(part(body(), 'summaryBold').parentElement.textContent).toBe(' 1.4M  bu ');
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'grain'],
    ['an empty object', {}],
  ])('data %s → an empty body with an empty bar (no track), no crash', (_name, data) => {
    renderCard(data);
    expect(body()).not.toBeNull();
    expect(items()).toHaveLength(0);
    expect(segments()).toHaveLength(0);
    expect(document.querySelector('[data-grain-track]')).toBeNull();
    expect(body().textContent).toBe('');
  });

  it('keys are slot positions: re-rendering with new readings reuses every segment and Legend element', () => {
    const tree = (data) => (
      <MemoryRouter>
        <GrainCard data={data} />
      </MemoryRouter>
    );
    const { rerender } = render(tree(DOCS.full.grain));
    const before = [...segments(), ...items()];
    const changed = { ...DOCS.full.grain, items: DOCS.full.grain.items.map((entry) => ({ ...entry, subLabel: `${entry.subLabel}!` })) };
    rerender(tree(changed));
    [...segments(), ...items()].forEach((el, i) => expect(el).toBe(before[i]));
    expect(items().map(itemText)).toEqual(LEGEND.full.map(([name, sub]) => [name, `${sub}!`]));
    // Fewer items: the first slot is reused.
    rerender(tree(DOCS.small.grain));
    expect(items()[0]).toBe(before[SEGMENTS.full.length]);
    expect(segments()[0]).toBe(before[0]);
  });

  it('the component sources format nothing: no toLocaleString, Intl, toFixed, Number(), sums, rounding, plural rules or timers', () => {
    for (const source of [SOURCE, CONTENT_SOURCE]) {
      expect(source).not.toMatch(
        /toLocaleString|Intl\.|toFixed|toPrecision|Number\(|parseInt|parseFloat|\.reduce\(|PluralRules|padStart|Math\.|Date|setInterval|setTimeout|\.sort\(|toUpperCase|toLowerCase|totalBu|capacityBu|fillPct|amountBu|amountLabel/,
      );
    }
  });

  it('no literal text, text attributes, inline data-fid or "/" URLs in the JSX (AD-15, AD-16)', () => {
    expect(jsxLiterals(SOURCE)).toEqual([]);
  });
});
