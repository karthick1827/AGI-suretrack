// Story 2.6 — Fan activity card: every I/O-matrix row except Fidelity
// (FR-78 to FR-82, AD-7, AD-8, AD-14, AD-16, AD-18), plus a check that the
// only display string derived from a number is the PRD-defined `<hours>h`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, isInaccessible, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router';
import App from '../../src/app/App.jsx';
import { getConfig, getDashboard, getUsers } from '../../src/data/api.js';
import FanActivityCard from '../../src/features/dashboard/fan/FanActivityCard.jsx';
import cardStyles from '../../src/features/dashboard/fan/FanActivityCard.module.css';
import { MAX_FAN_TILES, fanTiles, hasFanContent } from '../../src/features/dashboard/fan/fanActivity.js';
import { copy } from '../../src/lib/copy.js';
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
const SOURCE = readText(fromRoot('src/features/dashboard/fan/FanActivityCard.jsx'));
const CONTENT_SOURCE = readText(fromRoot('src/features/dashboard/fan/fanActivity.js'));

// Transcribed from PRD FR-79 to FR-82 (not from the JSON), so the two cross-check.
const CHART_LABEL = 'Fan runtime hours for the last 7 days, from 62 to 90 hours';
const CAPTION = 'Runtime hours, last 7 days. Higher this week as Auto modes used the cool nights.';
const DAYS = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Today'];
const VALUE_LABELS = ['62h', '70h', '74h', '81h', '77h', '90h', '86h'];
const BAR_PX = [54, 61, 66, 72, 68, 79, 76];
const X_OFFSETS = [15.57, 70.71, 125.86, 181.0, 236.14, 291.29, 346.43];
const TILES = {
  full: [['7', 'Running Now'], ['86 h', 'Runtime Today'], ['410 kWh', 'Energy Today']],
  small: [['7', 'Running Now'], ['86 h', 'Runtime Today'], ['410 kWh', 'Energy Today']],
  allgood: [['2 of 3', 'Running Now'], ['7 h 24 m', 'Runtime Today'], ['38 kWh', 'Energy Today']],
};

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
const renderCard = (data, variant = 'full') =>
  render(
    <MemoryRouter>
      <FanActivityCard data={data} variant={variant} />
    </MemoryRouter>,
  );

const slot = () => {
  const el = document.querySelector('[data-section="fanActivity"]');
  if (!el) throw new Error('the Fan activity section [data-section="fanActivity"] is not rendered');
  return el;
};
const body = () => document.querySelector('[data-fan-body]');
const tiles = () => [...document.querySelectorAll('[data-fan-tile]')];
const columns = () => [...document.querySelectorAll('[data-fan-column]')];
const chart = () => {
  const el = document.querySelector('[data-fan-chart]');
  if (!el) throw new Error('the Runtime chart [data-fan-chart] is not rendered');
  return el;
};
const part = (el, name) => {
  const found = el.querySelector(`[data-fan-part="${name}"]`);
  if (!found) throw new Error(`no [data-fan-part="${name}"] in ${el.outerHTML.slice(0, 80)}`);
  return found;
};
const tileText = (tile) => [part(tile, 'value').textContent, part(tile, 'label').textContent];
/** `[hours label or null, day label]` per column. */
const columnText = (column) => [column.querySelector('[data-fan-part="hours"]')?.textContent ?? null, part(column, 'day').textContent];
const barHeights = () => columns().map((column) => part(column, 'bar').style.height);
/** A column's x in the chart: its inline translateX (px) from runtimeBars(). */
const columnX = (column) => {
  const match = /^translateX\((-?[\d.e+-]+)px\)$/.exec(column.style.transform);
  if (!match) throw new Error(`column ${column.dataset.fanColumn} has no translateX: ${JSON.stringify(column.style.transform)}`);
  return Number.parseFloat(match[1]);
};
const entry = (fields) => ({ day: 'Wed', hours: 62, barPx: 54, isToday: false, ...fields });

/* ------------------------------------------------------------------------ */
/* I/O matrix: Full, Small, All-good                                         */
/* ------------------------------------------------------------------------ */

describe('Fan activity per Dashboard state (FR-78, FR-79, FR-82, FR-94)', () => {
  it.each(['full', 'small', 'allgood'])('%s: header Fan activity / All storage fans; tiles verbatim (Q-N1 kept); no links', async (state) => {
    await openDashboard(state);
    const card = within(slot());
    expect(card.getByRole('heading', { level: 2 }).textContent).toBe('Fan activity');
    expect(card.getByText('All storage fans').tagName).toBe('P');
    expect(tiles().map(tileText)).toEqual(TILES[state]);
    expect(card.queryAllByRole('link')).toHaveLength(0);
    expect(slot().querySelectorAll('a, button, [tabindex], [title]')).toHaveLength(0);
  });

  it.each(['full', 'small', 'allgood'])('%s: the chart is identical: bars exactly 54/61/66/72/68/79/76 px at the FR-80 offsets; 62h–86h; Today bold', async (state) => {
    await openDashboard(state);
    expect(barHeights()).toEqual(BAR_PX.map((px) => `${px}px`));
    columns().forEach((column, i) => expect(Math.abs(columnX(column) - X_OFFSETS[i])).toBeLessThanOrEqual(0.005));
    expect(columns().map(columnText)).toEqual(DAYS.map((day, i) => [VALUE_LABELS[i], day]));
    const today = columns().map((column) => part(column, 'bar').classList.contains(cardStyles.todayBar));
    expect(today).toEqual(DAYS.map((day) => day === 'Today'));
    const todayDay = columns().map((column) => part(column, 'day').classList.contains(cardStyles.todayDay));
    expect(todayDay).toEqual(today);
    expect(body().dataset.fanBody).toBe(state);
  });

  it.each(['full', 'small', 'allgood'])('%s: the caption verbatim (FR-82)', async (state) => {
    await openDashboard(state);
    expect(part(slot(), 'caption').textContent).toBe(CAPTION);
    expect(part(slot(), 'caption').tagName).toBe('P');
  });

  it.each(['full', 'small', 'allgood'])('%s: the card holds only the header, the tiles, the chart labels and the caption, verbatim', async (state) => {
    await openDashboard(state);
    const doc = DOCS[state].fanActivity;
    expect(slot().textContent).toBe(
      [
        'Fan activity',
        'All storage fans',
        ...TILES[state].flat(),
        ...DAYS.flatMap((day, i) => [VALUE_LABELS[i], day]),
        CAPTION,
      ].join(''),
    );
    // The PRD transcription and the state document agree.
    expect([doc.title, doc.subtitle, doc.caption, doc.chartLabel]).toEqual(['Fan activity', 'All storage fans', CAPTION, CHART_LABEL]);
  });

  it('the tiles are a list of three; each tile is value over label', async () => {
    await openDashboard('full');
    const list = within(slot()).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toEqual(tiles());
    expect(MAX_FAN_TILES).toBe(3);
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: accessibility                                                 */
/* ------------------------------------------------------------------------ */

describe('Runtime chart accessibility (FR-80)', () => {
  it('the chart is one image named by fanActivity.chartLabel; its labels are hidden from assistive technology', async () => {
    await openDashboard('full');
    const img = within(slot()).getByRole('img', { name: CHART_LABEL });
    expect(img).toBe(chart());
    // The 14 drawn labels are not announced as loose text (the image's name covers them).
    expect(img.firstElementChild.getAttribute('aria-hidden')).toBe('true');
    const labels = img.querySelectorAll('[data-fan-part="hours"], [data-fan-part="day"]');
    expect(labels).toHaveLength(14);
    for (const label of labels) expect(isInaccessible(label), label.textContent).toBe(true);
    // The tiles and caption stay readable.
    for (const el of slot().querySelectorAll('[data-fan-part="value"], [data-fan-part="label"], [data-fan-part="caption"]')) {
      expect(isInaccessible(el), el.textContent).toBe(false);
    }
    expect(within(slot()).queryAllByRole('img')).toEqual([img]);
  });

  /** The chart is a list of its columns, each day read with its hours; no image role, no name. */
  const expectColumnList = (count) => {
    expect(screen.queryByRole('img')).toBeNull();
    expect(chart().hasAttribute('aria-label')).toBe(false);
    const list = within(chart()).getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toEqual(columns());
    expect(items).toHaveLength(count);
    for (const item of items) {
      expect(isInaccessible(item)).toBe(false);
      // Each item holds its hours label and its day label together.
      expect(item.textContent).toBe(columnText(item).map((text) => text ?? '').join(''));
    }
  };

  it('without a usable chartLabel the chart is not an unnamed image: its columns are a list, each day with its hours', () => {
    for (const chartLabel of [undefined, null, '', '   ', Number.NaN, { x: 1 }, ['label']]) {
      renderCard({ ...DOCS.full.fanActivity, chartLabel });
      expectColumnList(7);
      expect(columns().map((item) => item.textContent)).toEqual(DAYS.map((day, i) => `${VALUE_LABELS[i]}${day}`));
      cleanup();
    }
  });

  it('with fewer than 7 drawn bars the chartLabel would not describe the chart: no image, a list', () => {
    renderCard({ ...DOCS.full.fanActivity, chart: DOCS.full.fanActivity.chart.slice(0, 5) });
    expectColumnList(5);
    cleanup();
    // More than 7 entries draw the last 7: then the name applies again.
    renderCard({ ...DOCS.full.fanActivity, chart: [entry({ day: 'Tue' }), ...DOCS.full.fanActivity.chart] });
    expect(screen.getByRole('img', { name: CHART_LABEL })).toBe(chart());
    expect(within(chart()).queryByRole('list')).toBeNull();
  });

  it('a usable chartLabel is used verbatim (no trimming); a finite number is its String()', () => {
    renderCard({ ...DOCS.full.fanActivity, chartLabel: ' Runtime  ' });
    expect(chart().getAttribute('aria-label')).toBe(' Runtime  ');
    cleanup();
    renderCard({ ...DOCS.full.fanActivity, chartLabel: 7 });
    expect(screen.getByRole('img', { name: '7' })).toBe(chart());
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: fallback formula                                              */
/* ------------------------------------------------------------------------ */

describe('bar heights: barPx exactly, fallback round(hours / max × 79) (FR-80, AD-8, AD-14)', () => {
  it('without barPx the bars follow the formula (Fri 65, Sat 71, Today 75)', () => {
    const chartData = DOCS.full.fanActivity.chart.map(({ barPx: _barPx, ...rest }) => rest);
    renderCard({ ...DOCS.full.fanActivity, chart: chartData });
    expect(barHeights()).toEqual(['54px', '61px', '65px', '71px', '68px', '79px', '75px']);
  });

  it('max 0 or non-finite hours → 0 px bars; no NaN anywhere', () => {
    renderCard({ tiles: [], chart: [{ day: 'Wed', hours: 0 }, { day: 'Thu', hours: 0 }, { day: 'Fri', hours: Number.NaN, barPx: 0 }] });
    expect(barHeights()).toEqual(['0px', '0px', '0px']);
    expect(columns().map(columnText)).toEqual([
      ['0h', 'Wed'],
      ['0h', 'Thu'],
      [null, 'Fri'],
    ]);
    expect(document.body.innerHTML).not.toMatch(/NaN|Infinity|undefined|\[object Object\]/);
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: loading and error (AD-18)                                     */
/* ------------------------------------------------------------------------ */

describe('Fan activity loading and error (FR-95, FR-96, AD-18)', () => {
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
    expect(columns()).toHaveLength(7);
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
    expect(tiles()).toHaveLength(3);
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['no tiles and no chart', { title: 'Fan activity', subtitle: 'All storage fans', caption: CAPTION }],
    ['empty tiles and chart', { ...DOCS.full.fanActivity, tiles: [], chart: [] }],
    ['tiles and chart not arrays', { ...DOCS.full.fanActivity, tiles: { 0: { value: '7' } }, chart: 'Wed 62' }],
    ['only unusable tiles and chart entries', { ...DOCS.full.fanActivity, tiles: [null, '7', { value: {}, label: '  ' }], chart: [null, { day: 'Wed' }, { hours: '62' }] }],
    ['only invisible chart entries (no day or hours label) and no tiles', { ...DOCS.full.fanActivity, tiles: [{ value: ' ', label: '\t' }], chart: [{ barPx: 50 }, { barPx: 60, day: '  ' }, { barPx: 70, day: {} }] }],
    ['only negative-hours chart entries', { ...DOCS.full.fanActivity, tiles: [], chart: [{ day: 'Wed', hours: -5 }, { day: 'Thu', hours: -1, barPx: 10 }] }],
    ['a string slice', 'fanActivity'],
  ])('ready with %s → the section shows the Story 2.2 error state, not a blank card', async (_name, slice) => {
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS.full, fanActivity: slice });
    signInAs('demo');
    await renderAt(paths.dashboard('full'));
    await waitFor(() => expect(document.querySelector('[data-section="kpi"]').dataset.status).toBe('ready'));
    expect(slot().dataset.status).toBe('error');
    expect(within(slot()).getByText(copy.dashboard.sectionError)).toBeTruthy();
    expect(within(slot()).getByRole('button', { name: copy.dashboard.retry })).toBeTruthy();
    expect(body()).toBeNull();
    expect(document.querySelector('[data-section="recentAlerts"]').dataset.status).toBe('ready');
  });

  it('the shared rule: hasFanContent agrees with what the card draws', () => {
    expect(hasFanContent(DOCS.full.fanActivity)).toBe(true);
    expect(hasFanContent({ tiles: [{ value: '7' }] })).toBe(true);
    expect(hasFanContent({ tiles: [{ label: 'Running Now' }] })).toBe(true);
    expect(hasFanContent({ chart: [{ hours: 0 }] })).toBe(true);
    expect(hasFanContent({ chart: [{ barPx: 12, day: 'Wed' }] })).toBe(true);
    // Bars with no visible day or hours label are not content.
    for (const invisible of [{ chart: [{ barPx: 12 }] }, { chart: [{ barPx: 12, day: '  ' }, { barPx: 5, day: null }] }]) {
      expect(hasFanContent(invisible), JSON.stringify(invisible)).toBe(false);
    }
    for (const bad of [
      null,
      undefined,
      [],
      'x',
      7,
      {},
      { tiles: null, chart: null },
      { tiles: [], chart: [] },
      { tiles: [null, 1, {}, { value: ' ', label: '' }, { value: [], label: { x: 1 } }], chart: [{ day: 'Wed' }, { hours: 'x' }] },
      { caption: CAPTION, chartLabel: CHART_LABEL },
    ]) {
      expect(hasFanContent(bad), JSON.stringify(bad)).toBe(false);
      renderCard(bad);
      expect(tiles(), JSON.stringify(bad)).toHaveLength(0);
      expect(columns(), JSON.stringify(bad)).toHaveLength(0);
      cleanup();
    }
  });

  it('a slice with only tiles, or only a chart, is drawn (not the error); the missing part keeps its space', async () => {
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS.full, fanActivity: { ...DOCS.full.fanActivity, chart: [] } });
    await openDashboard('full');
    expect(tiles()).toHaveLength(3);
    expect(columns()).toHaveLength(0);
    // An empty chart is not an (unnamed) image.
    expect(within(slot()).queryByRole('img')).toBeNull();
    cleanup();
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS.full, fanActivity: { ...DOCS.full.fanActivity, tiles: [] } });
    await openDashboard('full');
    expect(tiles()).toHaveLength(0);
    expect(document.querySelector('[data-fan-tiles]')).not.toBeNull();
    expect(columns()).toHaveLength(7);
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: bad data; verbatim readings (AD-7, FR-94)                     */
/* ------------------------------------------------------------------------ */

describe('bad data and verbatim readings (AD-7, AD-8)', () => {
  it('negative hours: the entry is dropped, so no "-5h" label can render and no height is negative', () => {
    renderCard({ chart: [{ day: 'Wed', hours: 10 }, { day: 'Thu', hours: -5 }, { day: 'Fri', hours: 5 }] });
    expect(columns().map(columnText)).toEqual([
      ['10h', 'Wed'],
      ['5h', 'Fri'],
    ]);
    expect(barHeights()).toEqual(['79px', '40px']);
    expect(document.body.textContent).not.toMatch(/-\d/);
  });

  it('whitespace-only tile values or labels render as empty parts; a tile with neither visible is not drawn', () => {
    renderCard({
      tiles: [
        { value: '   ', label: 'Running Now' },
        { value: '86 h', label: '\t' },
        { value: ' ', label: '  ' },
        { value: 0, label: 'Zero' },
      ],
    });
    expect(tiles().map(tileText)).toEqual([
      ['', 'Running Now'],
      ['86 h', ''],
      ['0', 'Zero'],
    ]);
    for (const tile of tiles()) expect(tile.textContent.trim()).not.toBe('');
  });

  it('whitespace-only day labels render nothing', () => {
    renderCard({ chart: [entry({ day: '   ' }), entry({ day: 'Thu' })] });
    expect(columns().map(columnText)).toEqual([
      ['62h', ''],
      ['62h', 'Thu'],
    ]);
  });

  it('fewer than 7 chart entries → that many bars, in slots from the left, no crash', () => {
    renderCard({ chart: DOCS.full.fanActivity.chart.slice(0, 3) });
    expect(barHeights()).toEqual(['54px', '61px', '66px']);
    columns().forEach((column, i) => expect(Math.abs(columnX(column) - X_OFFSETS[i])).toBeLessThanOrEqual(0.005));
  });

  it('more than 7 chart entries → the last 7 (ending today), at the 7 FR-80 offsets', () => {
    renderCard({ chart: [entry({ day: 'Mon', hours: 1 }), entry({ day: 'Tue', hours: 2 }), ...DOCS.full.fanActivity.chart] });
    expect(columns().map(columnText)).toEqual(DAYS.map((day, i) => [VALUE_LABELS[i], day]));
    expect(barHeights()).toEqual(BAR_PX.map((px) => `${px}px`));
  });

  it('more than 3 tiles → the first 3 usable ones in file order; unusable tiles are skipped', () => {
    renderCard({
      tiles: [null, 'x', { value: { v: 1 } }, { value: '1', label: 'One' }, { value: 2, label: 'Two' }, { label: 'Three' }, { value: '4', label: 'Four' }],
    });
    expect(tiles().map(tileText)).toEqual([
      ['1', 'One'],
      ['2', 'Two'],
      ['', 'Three'],
    ]);
    expect(fanTiles({ tiles: [{ value: '1' }, { value: '2' }, { value: '3' }, { value: '4' }] })).toHaveLength(3);
  });

  it('object, array, boolean, null, NaN and Infinity readings render nothing (no crash, no "NaN", no "[object Object]")', () => {
    renderCard({
      tiles: [
        { value: { v: 7 }, label: 'Running Now' },
        { value: '86 h', label: ['Runtime Today'] },
        { value: Number.NaN, label: true },
      ],
      chart: [
        entry({ day: { d: 'Wed' }, hours: Infinity }),
        entry({ day: ['Thu'], hours: '70', barPx: 61 }),
        entry({ day: null, hours: Number.NaN, barPx: 66 }),
        entry({ day: 7, hours: 81, barPx: 72 }),
      ],
      caption: { text: CAPTION },
      chartLabel: CHART_LABEL,
    });
    // Unshown parts are left empty; the third tile shows nothing at all, so it is skipped.
    expect(tiles().map(tileText)).toEqual([
      ['', 'Running Now'],
      ['86 h', ''],
    ]);
    expect(columns().map(columnText)).toEqual([
      [null, ''],
      [null, ''],
      [null, ''],
      ['81h', '7'],
    ]);
    expect(barHeights()).toEqual(['54px', '61px', '66px', '72px']);
    expect(document.querySelector('[data-fan-part="caption"]')).toBeNull();
    expect(document.body.textContent).not.toMatch(/NaN|Infinity|\[object Object\]|undefined|true|null/);
    expect(document.body.innerHTML).not.toMatch(/NaN|\[object Object\]|undefined/);
  });

  it('the only text derived from a number is the PRD value label String(hours) + "h"; everything else is the reading as given', () => {
    renderCard({
      tiles: [{ value: 7, label: ' Running  Now ' }, { value: '86 h', label: 'Runtime Today' }, { value: '0410 kWh', label: 'energy today' }],
      chart: [
        entry({ day: 'wed', hours: 62.5, barPx: 54 }),
        entry({ day: ' Thu ', hours: 1e21, barPx: 61 }),
        entry({ day: 'Fri', hours: -0, barPx: 0 }),
        entry({ day: 'Today', hours: 0.1 + 0.2, barPx: 76, isToday: true }),
      ],
      caption: '  runtime hours  ',
    });
    // Numbers are never formatted, rounded or localised: String(hours) + "h" exactly.
    expect(columns().map(columnText)).toEqual([
      [`${String(62.5)}h`, 'wed'],
      [`${String(1e21)}h`, ' Thu '],
      [`${String(-0)}h`, 'Fri'],
      [`${String(0.1 + 0.2)}h`, 'Today'],
    ]);
    expect(columns().map(columnText)[3][0]).toBe('0.30000000000000004h');
    // Every other text node is a reading verbatim (numbers as their String()).
    expect(tiles().map(tileText)).toEqual([
      ['7', ' Running  Now '],
      ['86 h', 'Runtime Today'],
      ['0410 kWh', 'energy today'],
    ]);
    expect(part(body(), 'caption').textContent).toBe('  runtime hours  ');
    // Nothing else is written: the body text is exactly those readings and labels.
    const texts = [...body().querySelectorAll('*')].filter((el) => el.children.length === 0).map((el) => el.textContent);
    const allowed = new Set([
      '7',
      ' Running  Now ',
      '86 h',
      'Runtime Today',
      '0410 kWh',
      'energy today',
      'wed',
      ' Thu ',
      'Fri',
      'Today',
      '62.5h',
      '1e+21h',
      '0h',
      '0.30000000000000004h',
      '  runtime hours  ',
      '',
    ]);
    for (const text of texts) expect(allowed.has(text), JSON.stringify(text)).toBe(true);
  });

  it('isToday styles only the last bar, and only when its isToday is the boolean true', () => {
    const todayOf = () => [
      columns().map((column) => part(column, 'bar').classList.contains(cardStyles.todayBar)),
      columns().map((column) => part(column, 'day').classList.contains(cardStyles.todayDay)),
    ];
    renderCard({ chart: [entry({ isToday: 'true' }), entry({ isToday: 1 }), entry({ isToday: true })] });
    expect(todayOf()).toEqual([
      [false, false, true],
      [false, false, true],
    ]);
    cleanup();
    // isToday on any other entry is ignored.
    renderCard({ chart: [entry({ isToday: true }), entry({ isToday: true }), entry({ isToday: false })] });
    expect(todayOf()).toEqual([
      [false, false, false],
      [false, false, false],
    ]);
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'fan'],
    ['an empty object', {}],
  ])('data %s → an empty body, no crash', (_name, data) => {
    renderCard(data);
    expect(body()).not.toBeNull();
    expect(tiles()).toHaveLength(0);
    expect(columns()).toHaveLength(0);
  });

  // The chart height per variant (Full 119, Small and All-good 120) is CSS:
  // Vitest's CSS-module proxy returns a class name for ANY key, so the heights
  // are asserted on the built app by the Fidelity spec (chart.h per state).
  it('variant selects the layout (data-fan-body); an unknown variant falls back to Full', () => {
    for (const [variant, layout] of [
      ['full', 'full'],
      ['small', 'small'],
      ['allgood', 'allgood'],
      ['nope', 'full'],
      [undefined, 'full'],
      ['__proto__', 'full'],
      ['toString', 'full'],
    ]) {
      const { unmount } = renderCard(DOCS.full.fanActivity, variant);
      expect(body().dataset.fanBody, String(variant)).toBe(layout);
      unmount();
    }
  });

  it('keys are slot positions: re-rendering with new readings reuses every tile and column element', () => {
    const tree = (data) => (
      <MemoryRouter>
        <FanActivityCard data={data} />
      </MemoryRouter>
    );
    const { rerender } = render(tree(DOCS.full.fanActivity));
    const before = [...tiles(), ...columns()];
    rerender(tree(DOCS.allgood.fanActivity));
    expect([...tiles(), ...columns()]).toEqual(before);
    [...tiles(), ...columns()].forEach((el, i) => expect(el).toBe(before[i]));
    expect(tiles().map(tileText)).toEqual(TILES.allgood);
  });

  it('the component sources format nothing: no toLocaleString, Intl, toFixed, Number(), sums, rounding, plural rules or timers', () => {
    for (const source of [SOURCE, CONTENT_SOURCE]) {
      expect(source).not.toMatch(
        /toLocaleString|Intl\.|toFixed|toPrecision|Number\(|parseInt|parseFloat|\.reduce\(|PluralRules|padStart|Math\.|Date|setInterval|setTimeout|\.sort\(|toUpperCase|toLowerCase/,
      );
    }
    // The value label is the copy.js helper for the PRD's `<hours>h` (AD-16), not a template in the component.
    expect(copy.dashboard.runtimeValue).toBe('{hours}h');
  });

  it('no literal text, text attributes, inline data-fid or "/" URLs in the JSX (AD-15, AD-16)', () => {
    expect(jsxLiterals(SOURCE)).toEqual([]);
  });
});
