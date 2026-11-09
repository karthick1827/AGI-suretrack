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
import { grainLegend, hasGrainContent } from '../../src/features/dashboard/grain/grain.js';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { GRAIN_COMMODITIES } from '../../src/lib/geometry.js';
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
const renderCard = (data) =>
  render(
    <MemoryRouter>
      <GrainCard data={data} />
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
/** The inline colour of a segment's paint layer or a swatch ('' when none). */
const paintColour = (segment) => segment.firstElementChild.style.backgroundColor;
const swatchColour = (item) => part(item, 'swatch').style.backgroundColor;

const item = (fields) => ({ name: 'Wheat', subLabel: '224k bu · 1 unit', color: '#C98F2E', amountK: 224, ...fields });

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

  it.each(STATES)('%s: Legend swatches carry the segment colours; Corn keeps its scaled layout (Q-G2, data-fid 6337:54860)', async (state) => {
    await openDashboard(state);
    const names = LEGEND[state].map(([name]) => name);
    expect(items().map((el) => el.dataset.grainColour)).toEqual(names.map((name) => GRAIN_COMMODITIES[name].token));
    expect(items().map(swatchColour)).toEqual(names.map((name) => `var(${GRAIN_COMMODITIES[name].token})`));
    const layouts = { Corn: 'corn', Canola: 'canola' };
    expect(items().map((el) => el.dataset.grainLayout)).toEqual(names.map((name) => layouts[name] ?? 'regular'));
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
    renderCard({ items: [item({ segmentPx: 50, segmentTopPx: 2 })] });
    expect(segments().map((el) => el.dataset.grainBleed)).toEqual(['bottom']);
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
      { items: [{ name: 'Rye' }] },
      { items: [{ subLabel: '5k bu' }] },
      { items: [{ name: { x: 1 }, color: '#C98F2E', amountK: 10 }, { name: 'Wheat', color: '#C98F2E', amountK: 10 }] },
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
      // A segment without a colour shows nothing.
      { items: [{ amountK: 100 }, { name: 7n, amountK: 50, color: '#C98F2E' }] },
    ]) {
      expect(hasGrainContent(bad), String(bad?.items ?? bad)).toBe(false);
      renderCard(bad);
      expect(items()).toHaveLength(0);
      expect(segments().filter((el) => el.dataset.grainColour !== 'none')).toHaveLength(0);
      expect(body().textContent).toBe('');
      cleanup();
    }
  });

  it('a slice with only a summary, or only a Legend, is drawn (not the error)', async () => {
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS.full, grain: { ...DOCS.full.grain, items: [] } });
    await openDashboard('full');
    expect(summaryText()).toEqual(SUMMARY.full);
    expect(items()).toHaveLength(0);
    expect(segments()).toHaveLength(0);
    // The empty bar still shows its track.
    expect(boxOf(track())).toEqual(TRACK);
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

describe('bad data and verbatim readings (AD-7, AD-8)', () => {
  it('an unknown Commodity or a colour that does not match the map: no segment or swatch colour, no crash', () => {
    renderCard({
      items: [
        item({ name: 'Rye', subLabel: '10k bu · 1 unit', color: '#C98F2E', amountK: 100 }),
        item({ name: 'Corn', subLabel: '314k bu · 1 unit', color: '#E3C341', amountK: 314 }),
        item({ name: 'Wheat', color: 'wheat' }),
        item({ name: 'Oats', color: '#b9a47a', amountK: 111 }),
      ],
    });
    expect(segments().map((el) => el.dataset.grainColour)).toEqual(['none', 'none', 'none', '--raw-b9a47a']);
    expect(segments().map(paintColour)).toEqual(['', '', '', 'var(--raw-b9a47a)']);
    expect(items().map((el) => el.dataset.grainColour)).toEqual(['none', 'none', 'none', '--raw-b9a47a']);
    expect(items().map(swatchColour)).toEqual(['', '', '', 'var(--raw-b9a47a)']);
    // Unknown names are drawn verbatim in the Legend and use the regular layout.
    expect(items().map(itemText)[0]).toEqual(['Rye', '10k bu · 1 unit']);
    expect(items().map((el) => el.dataset.grainLayout)).toEqual(['regular', 'corn', 'regular', 'regular']);
  });

  it('objects, arrays, booleans, null, NaN and Infinity render nothing (no crash, no "NaN", no "[object Object]")', () => {
    renderCard({
      summaryBold: { v: '1.40M bu' },
      summaryRest: 'of 1.78M bu · 79% full',
      fillLabel: true,
      items: [
        item({ name: { n: 'Canola' }, subLabel: '340k bu · 1 unit', amountK: { k: 340 } }),
        item({ name: 'Corn', subLabel: ['314k bu'], color: '#E07B39', amountK: Number.NaN }),
        item({ name: Number.NaN, subLabel: Infinity }),
        item({ name: null, subLabel: false }),
        item({ name: 'Oats', subLabel: 111, color: '#B9A47A', amountK: -111 }),
      ],
    });
    expect(summaryText()).toEqual([null, 'of 1.78M bu · 79% full', null]);
    // No bold span, so no leading space either.
    expect(text(part(body(), 'summary'))).toBe('of 1.78M bu · 79% full');
    expect(items().map(itemText)).toEqual([
      ['', '340k bu · 1 unit'],
      ['Corn', ''],
      ['Oats', '111'],
    ]);
    // Segments for the two items with the default usable amount (224 k bu), uncoloured: their names are not mapped Commodities.
    expect(segments().map((el) => boxOf(el).width)).toEqual([47.5, 47.5]);
    expect(document.body.textContent).not.toMatch(/NaN|Infinity|\[object Object\]|undefined|true|false|null/);
    expect(document.body.innerHTML).not.toMatch(/NaN|\[object Object\]|undefined/);
  });

  it('zero or invalid amounts give no segment and no NaN; segmentPx / segmentTopPx override the formula', () => {
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
    // Every item with a visible label is still in the Legend.
    expect(items()).toHaveLength(4);
    expect(document.body.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it('the FR-84 space sits between the two summary parts only: no trailing space without summaryRest', () => {
    renderCard({ summaryBold: '1.40M bu', summaryRest: '  ', fillLabel: '79% Fill' });
    expect(text(part(body(), 'summary'))).toBe('1.40M bu');
    expect(summaryText()).toEqual(['1.40M bu', null, '79% Fill']);
  });

  it('whitespace-only names or sub-labels render as empty parts; an item with neither visible is not in the Legend', () => {
    renderCard({
      items: [
        item({ name: '   ', subLabel: '340k bu · 1 unit' }),
        item({ name: 'Corn', subLabel: '\t' }),
        item({ name: ' ', subLabel: '  ' }),
        item({ name: 0, subLabel: 'Zero' }),
      ],
    });
    expect(items().map(itemText)).toEqual([
      ['', '340k bu · 1 unit'],
      ['Corn', ''],
      ['0', 'Zero'],
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
        item({ name: 'wheat', subLabel: ' 1e21 ', color: '#C98F2E', amountK: 1e-9 }),
      ],
    });
    expect(summaryText()).toEqual([' 1.4M  bu', 'of 1780000 bu', '79']);
    expect(items().map(itemText)).toEqual([
      ['Oats', '0111k bu'],
      ['Canola', '0.30000000000000004'],
      ['wheat', ' 1e21 '],
    ]);
    // File order is kept (no re-sort by amount); 1e-9 k bu rounds to 0 px: no segment.
    expect(segments().map((el) => el.dataset.grainColour)).toEqual(['--raw-b9a47a', '--raw-e3c341']);
    const texts = [...body().querySelectorAll('*')].filter((el) => el.children.length === 0).map((el) => el.textContent);
    const allowed = new Set([' 1.4M  bu', 'of 1780000 bu', '79', 'Oats', '0111k bu', 'Canola', '0.30000000000000004', 'wheat', ' 1e21 ', '']);
    for (const value of texts) expect(allowed.has(value), JSON.stringify(value)).toBe(true);
    // The bold span holds the reading plus the one PRD space.
    expect(part(body(), 'summaryBold').parentElement.textContent).toBe(' 1.4M  bu ');
  });

  it('grainLegend: every usable item, in file order, with no cap (rows of two)', () => {
    const many = Array.from({ length: 9 }, (_, i) => item({ name: `C${i}` }));
    expect(grainLegend({ items: many }).map((entry) => entry.name)).toEqual(many.map((entry) => entry.name));
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'grain'],
    ['an empty object', {}],
  ])('data %s → an empty body with the bare track, no crash', (_name, data) => {
    renderCard(data);
    expect(body()).not.toBeNull();
    expect(items()).toHaveLength(0);
    expect(segments()).toHaveLength(0);
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
