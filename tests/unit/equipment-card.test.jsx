// Story 2.4 — Equipment card with Health bars: every I/O-matrix row except
// Fidelity (FR-66 to FR-72, AD-5, AD-7, AD-8, AD-10, AD-13, AD-15, AD-16,
// AD-18), plus a check that no value is formatted or computed.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import App from '../../src/app/App.jsx';
import { getConfig, getDashboard, getUsers } from '../../src/data/api.js';
import EquipmentCard from '../../src/features/dashboard/equipment/EquipmentCard.jsx';
import cardStyles from '../../src/features/dashboard/equipment/EquipmentCard.module.css';
import chevronRight from '../../src/assets/icons/chevron-right.svg';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { healthSegments } from '../../src/lib/geometry.js';
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
const SOURCE = readText(fromRoot('src/features/dashboard/equipment/EquipmentCard.jsx'));
const CSS_SOURCE = readText(fromRoot('src/features/dashboard/equipment/EquipmentCard.module.css'));
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

async function openDashboard(state) {
  signInAs('demo');
  await renderAt(paths.dashboard(state));
  await waitFor(() => expect(slot().dataset.status).toBe('ready'));
}

const renderCard = (data, variant = 'full') =>
  render(
    <MemoryRouter>
      <EquipmentCard data={data} variant={variant} />
    </MemoryRouter>,
  );

const slot = () => document.querySelector('[data-section="equipmentCard"]');
const list = () => document.querySelector('[data-equipment-list]');
const rows = () => [...document.querySelectorAll('[data-equipment-row]')];
const part = (row, name) => row.querySelector(`[data-row-part="${name}"]`);
const rowText = (row) => ['name', 'count', 'caption'].map((name) => part(row, name).textContent);
const segmentsOf = (row) =>
  [...part(row, 'bar').querySelectorAll('[data-health-segment]')].map((seg) => [
    seg.dataset.healthSegment,
    parseFloat(seg.style.left),
    parseFloat(seg.style.width),
  ]);
/** Exact CSS-module class token check (never a substring match). */
const hasClass = (el, name) => {
  if (typeof cardStyles[name] !== 'string') throw new Error(`no CSS-module class ${name}`);
  return el.classList.contains(cardStyles[name]);
};
const dividerOf = (row) => (hasClass(row, 'item') ? 'item' : hasClass(row, 'divided') ? 'divided' : 'none');
const near = (actual, expected) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.01);
function expectSegments(row, expected) {
  const got = segmentsOf(row);
  expect(got.map(([kind]) => kind)).toEqual(expected.map(([kind]) => kind));
  got.forEach(([, x, w], i) => {
    near(x, expected[i][1]);
    near(w, expected[i][2]);
  });
}

/* ------------------------------------------------------------------------ */
/* I/O matrix: Full, Hatch, Small, All-good                                  */
/* ------------------------------------------------------------------------ */

describe('Equipment card per Dashboard state (FR-66 to FR-71, FR-94)', () => {
  it('Full: Equipment (20) / Health by type + View All; Bins 7, Piles 3, Flats 2, Tanks 6, Dryers 2 with FR-69 widths and verbatim captions', async () => {
    await openDashboard('full');
    const card = within(slot());
    expect(card.getByRole('heading', { level: 2 }).textContent).toBe('Equipment (20)');
    expect(card.getByText('Health by type').tagName).toBe('P');
    expect(card.getAllByRole('link')[0].textContent).toBe('View All');
    expect(list().dataset.equipmentList).toBe('full');
    expect(hasClass(list(), 'full')).toBe(true);
    expect(rows().map(rowText)).toEqual([
      ['Bins', '7', '3 alerts · 1 offline · 3 healthy'],
      ['Piles', '3', '1 alert · 2 healthy'],
      ['Flats', '2', '2 healthy'],
      ['Tanks', '6', '1 alert · 5 healthy'],
      ['Dryers', '2', '2 healthy'],
    ]);
    const [bins, piles, flats, tanks, dryers] = rows();
    expectSegments(bins, [['alerts', 0, 201.43], ['offline', 203.43, 67.14], ['healthy', 272.57, 201.43]]);
    expectSegments(piles, [['alerts', 0, 157.33], ['healthy', 159.33, 314.67]]);
    expectSegments(flats, [['healthy', 0, 474]]);
    expectSegments(tanks, [['alerts', 0, 78.67], ['healthy', 80.67, 393.33]]);
    expectSegments(dryers, [['healthy', 0, 474]]);
    // FR-68: no divider on the first row; rows 2–4 are Figma Items; row 5 a plain bordered row.
    expect(rows().map(dividerOf)).toEqual(['none', 'item', 'item', 'item', 'divided']);
  });

  it('Hatch: Full Bins has the only offline segment, at x 203.43, width 67.14, with the hatch class', async () => {
    await openDashboard('full');
    const offline = document.querySelectorAll('[data-health-segment="offline"]');
    expect(offline).toHaveLength(1);
    expect(offline[0].closest('[data-equipment-row]').dataset.equipmentRow).toBe('bins');
    near(parseFloat(offline[0].style.left), 203.43);
    near(parseFloat(offline[0].style.width), 67.14);
    expect(hasClass(offline[0], 'offline')).toBe(true);
    expect(hasClass(offline[0], 'segment')).toBe(true);
  });

  it('Small: Equipment (2); Bin 1 all alert (474) "1 alert"; Dryer 1 all healthy (474) "1 healthy"', async () => {
    await openDashboard('small');
    expect(within(slot()).getByRole('heading', { level: 2 }).textContent).toBe('Equipment (2)');
    expect(list().dataset.equipmentList).toBe('small');
    expect(rows().map(rowText)).toEqual([
      ['Bin', '1', '1 alert'],
      ['Dryer', '1', '1 healthy'],
    ]);
    expectSegments(rows()[0], [['alerts', 0, 474]]);
    expectSegments(rows()[1], [['healthy', 0, 474]]);
    expect(rows().map(dividerOf)).toEqual(['none', 'divided']);
  });

  it('All-good: Equipment (1); Bin 1 all healthy "1 healthy"; its only row has the top divider', async () => {
    await openDashboard('allgood');
    expect(within(slot()).getByRole('heading', { level: 2 }).textContent).toBe('Equipment (1)');
    expect(list().dataset.equipmentList).toBe('allgood');
    expect(rows().map(rowText)).toEqual([['Bin', '1', '1 healthy']]);
    expectSegments(rows()[0], [['healthy', 0, 474]]);
    expect(rows().map(dividerOf)).toEqual(['divided']);
  });

  it.each(['full', 'small', 'allgood'])('%s: the card holds only the header and the rows, verbatim from the document', async (state) => {
    await openDashboard(state);
    const card = DOCS[state].equipmentCard;
    expect(slot().textContent).toBe(
      [card.title, card.subtitle, card.link, ...card.rows.flatMap((row) => [row.type, String(row.count), row.caption])].join(''),
    );
  });

  it('caption digit runs are wrapped in the Bold #111827 span; words and " · " stay in the caption (FR-71)', async () => {
    await openDashboard('full');
    const caption = part(rows()[0], 'caption');
    expect(hasClass(caption, 'caption')).toBe(true);
    const nums = [...caption.children];
    expect(nums.map((n) => n.textContent)).toEqual(['3', '1', '3']);
    for (const n of nums) expect(hasClass(n, 'num')).toBe(true);
    expect([...caption.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent)).toEqual([
      ' alerts · ',
      ' offline · ',
      ' healthy',
    ]);
  });

  it('row chevrons are the 12×16 chevron-right SVG with explicit width/height, alt "" and the row-chevron fid (AD-5, AD-15)', async () => {
    await openDashboard('full');
    for (const row of rows()) {
      const img = part(row, 'chevron');
      expect(img.tagName).toBe('IMG');
      expect(img.getAttribute('src')).toBe(chevronRight);
      expect([img.getAttribute('width'), img.getAttribute('height'), img.getAttribute('alt')]).toEqual(['12', '16', '']);
      expect(img.dataset.fid).toBe(FID.equipmentCard.rowChevron);
      expect(hasClass(img.parentElement, 'chevronBox')).toBe(true);
    }
    for (const img of slot().querySelectorAll('img')) {
      expect(img.hasAttribute('width') && img.hasAttribute('height')).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: navigation (FR-72)                                            */
/* ------------------------------------------------------------------------ */

describe('Equipment links (FR-72, AD-10)', () => {
  const FULL_ROWS = ['bins', 'piles', 'flats', 'tanks', 'dryers'];

  it('View All then every row is its own <a>, in top-to-bottom (Tab) order; no tabindex, no nested links', async () => {
    await openDashboard('full');
    const links = [...slot().querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      paths.equipment(),
      ...FULL_ROWS.map((type) => paths.equipment({ type })),
    ]);
    expect(rows().every((row) => row.tagName === 'A')).toBe(true);
    for (const a of links) {
      expect(a.hasAttribute('tabindex')).toBe(false);
      expect(a.querySelector('a')).toBeNull();
    }
    expect(slot().querySelectorAll('[tabindex]')).toHaveLength(0);
    for (const row of rows()) expect(hasClass(row, 'link')).toBe(true);
  });

  it('each row is named in the FR-72 format: "<type>, <count>: <caption with · → ,>"', async () => {
    await openDashboard('full');
    expect(rows().map((row) => row.getAttribute('aria-label'))).toEqual([
      'Bins, 7: 3 alerts, 1 offline, 3 healthy',
      'Piles, 3: 1 alert, 2 healthy',
      'Flats, 2: 2 healthy',
      'Tanks, 6: 1 alert, 5 healthy',
      'Dryers, 2: 2 healthy',
    ]);
    cleanup();
    await openDashboard('small');
    expect(within(slot()).getByRole('link', { name: 'Bin, 1: 1 alert' })).toBe(rows()[0]);
    expect(within(slot()).getByRole('link', { name: 'Dryer, 1: 1 healthy' })).toBe(rows()[1]);
  });

  it.each(FULL_ROWS)('clicking the %s row opens /equipment?type=<typeKey>, which renders the placeholder', async (type) => {
    await openDashboard('full');
    await act(async () => fireEvent.click(slot().querySelector(`[data-equipment-row="${type}"]`)));
    expect(`${window.location.pathname}${window.location.search}`).toBe(paths.equipment({ type }));
    await waitFor(() => expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy());
  });

  it('clicking View All opens /equipment (placeholder)', async () => {
    await openDashboard('small');
    await act(async () => fireEvent.click(within(slot()).getByRole('link', { name: 'View All' })));
    expect(`${window.location.pathname}${window.location.search}`).toBe(paths.equipment());
    await waitFor(() => expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy());
  });

  it('a row is a focusable <a>, and clicking inside it (bar, caption) navigates (Enter is covered by the Fidelity spec)', async () => {
    function Where() {
      return <span data-testid="where">{useLocation().pathname + useLocation().search}</span>;
    }
    render(
      <MemoryRouter initialEntries={[paths.dashboard()]}>
        <Routes>
          <Route path="*" element={<><EquipmentCard data={DOCS.small.equipmentCard} variant="small" /><Where /></>} />
        </Routes>
      </MemoryRouter>,
    );
    const dryer = rows()[1];
    dryer.focus();
    expect(document.activeElement).toBe(dryer);
    await act(async () => fireEvent.click(part(dryer, 'bar')));
    expect(screen.getByTestId('where').textContent).toBe(paths.equipment({ type: 'dryers' }));
    await act(async () => fireEvent.click(part(rows()[0], 'caption')));
    expect(screen.getByTestId('where').textContent).toBe(paths.equipment({ type: 'bins' }));
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: loading and error (AD-18)                                     */
/* ------------------------------------------------------------------------ */

describe('Equipment loading and error (FR-95, FR-96, AD-18)', () => {
  it('loading: the Story 2.2 placeholder at the card size; no rows yet; same size when ready', async () => {
    let release;
    vi.mocked(getDashboard).mockImplementation(
      (state) => new Promise((resolve) => (release = () => resolve(DOCS[state]))),
    );
    signInAs('demo');
    await renderAt(paths.dashboard('full'));
    expect(slot().dataset.status).toBe('loading');
    expect([slot().style.width, slot().style.height]).toEqual(['649px', '444px']);
    expect(list()).toBeNull();
    expect(slot().querySelector('[aria-hidden="true"]')).not.toBeNull();
    await act(async () => release());
    await waitFor(() => expect(slot().dataset.status).toBe('ready'));
    expect([slot().style.width, slot().style.height]).toEqual(['649px', '444px']);
    expect(rows()).toHaveLength(5);
  });

  it('error (?__fail=dashboard → rejected load): Couldn’t load this section. + Retry at the card size; Retry reloads through the layout', async () => {
    let fail = true;
    vi.mocked(getDashboard).mockImplementation((state) =>
      fail ? Promise.reject({ code: 'FORCED_FAIL', message: 'forced' }) : Promise.resolve(DOCS[state]),
    );
    signInAs('demo');
    await renderAt(paths.dashboard('small'));
    await waitFor(() => expect(slot().dataset.status).toBe('error'));
    expect([slot().style.width, slot().style.height]).toEqual(['649px', '240px']);
    expect(within(slot()).getByText(copy.dashboard.sectionError)).toBeTruthy();
    expect(list()).toBeNull();
    fail = false;
    await act(async () => fireEvent.click(within(slot()).getByRole('button', { name: copy.dashboard.retry })));
    await waitFor(() => expect(slot().dataset.status).toBe('ready'));
    expect(rows().map(rowText)).toEqual([
      ['Bin', '1', '1 alert'],
      ['Dryer', '1', '1 healthy'],
    ]);
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });

  it('a state change re-renders the same card section (one stable component, no remount)', async () => {
    await openDashboard('full');
    const section = slot().firstElementChild;
    await act(async () => {
      window.history.pushState(null, '', paths.dashboard('small'));
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await waitFor(() => expect(list()?.dataset.equipmentList).toBe('small'));
    expect(slot().firstElementChild).toBe(section);
  });
});

/* ------------------------------------------------------------------------ */
/* Verbatim readings: nothing formatted or computed (AD-7, FR-94)            */
/* ------------------------------------------------------------------------ */

describe('verbatim readings and robustness (AD-7, AD-8)', () => {
  it('renders type, count and caption as given: no pluralising, summing, padding or trimming', () => {
    renderCard({
      rows: [
        { type: '  Bins ', typeKey: 'bins', count: 1234567, alerts: 1, offline: 0, healthy: 0, caption: '1 alerts ·  0007 healthy ' },
        { type: 'Tank', typeKey: 'tanks', count: '06', alerts: 0, offline: 0, healthy: 1, caption: '99 healthy' },
      ],
    });
    expect(rows().map(rowText)).toEqual([
      ['  Bins ', '1234567', '1 alerts ·  0007 healthy '],
      ['Tank', '06', '99 healthy'],
    ]);
    expect([...part(rows()[0], 'caption').children].map((n) => n.textContent)).toEqual(['1', '0007']);
  });

  it('bar widths come only from alerts / offline / healthy, never from the caption or count', () => {
    renderCard({
      rows: [{ type: 'Bins', typeKey: 'bins', count: 99, alerts: 0, offline: 3, healthy: 1, caption: '9 alerts · 9 offline · 9 healthy' }],
    });
    expectSegments(rows()[0], healthSegments({ alerts: 0, offline: 3, healthy: 1 }).map((s) => [s.kind, s.x, s.width]));
    expect(segmentsOf(rows()[0]).map(([kind]) => kind)).toEqual(['offline', 'healthy']);
  });

  it('keeps the Q-E mismatches: the KPI counts and the card title are not derived from the rows', async () => {
    const doc = structuredClone(DOCS.full);
    doc.equipmentCard.rows[0].alerts = 0;
    doc.equipmentCard.rows[0].offline = 0;
    vi.mocked(getDashboard).mockResolvedValue(doc);
    await openDashboard('full');
    expect(within(slot()).getByRole('heading', { level: 2 }).textContent).toBe('Equipment (20)');
    expect(rowText(rows()[0])).toEqual(['Bins', '7', '3 alerts · 1 offline · 3 healthy']);
    expect(segmentsOf(rows()[0])).toEqual([['healthy', 0, 474]]);
  });

  it('a total of 0 draws an empty bar (no segments, no NaN)', () => {
    renderCard({ rows: [{ type: 'Bins', typeKey: 'bins', count: 0, alerts: 0, offline: 0, healthy: 0, caption: '0 healthy' }] });
    expect(part(rows()[0], 'bar').children).toHaveLength(0);
    expect(document.body.innerHTML).not.toContain('NaN');
  });

  it('non-integer counts draw nothing for that segment (counts are non-negative integers)', () => {
    renderCard({ rows: [{ type: 'Bins', typeKey: 'bins', count: 1, alerts: 1.5, offline: 0, healthy: 2, caption: '2 healthy' }] });
    expect(segmentsOf(rows()[0])).toEqual([['healthy', 0, 474]]);
  });

  it('a numeric caption renders as its string, digit runs bolded (consistent with shown())', () => {
    renderCard({ rows: [{ type: 'Bins', typeKey: 'bins', count: 7, alerts: 0, offline: 0, healthy: 7, caption: 42 }] });
    const caption = part(rows()[0], 'caption');
    expect(caption.textContent).toBe('42');
    expect([...caption.children].map((n) => [n.textContent, hasClass(n, 'num')])).toEqual([['42', true]]);
    expect(rows()[0].getAttribute('aria-label')).toBe('Bins, 7: 42');
  });

  it('the caption is styled by digit runs only: text between runs is kept verbatim, nothing is parsed', () => {
    renderCard({ rows: [{ type: 'Bins', typeKey: 'bins', count: 1, alerts: 0, offline: 0, healthy: 1, caption: 'a1b22 · c333' }] });
    const caption = part(rows()[0], 'caption');
    expect([...caption.childNodes].map((n) => [n.nodeType === Node.TEXT_NODE ? 'text' : 'num', n.textContent])).toEqual([
      ['text', 'a'],
      ['num', '1'],
      ['text', 'b'],
      ['num', '22'],
      ['text', ' · c'],
      ['num', '333'],
    ]);
  });

  it('object, array, boolean and null values render nothing (no crash); a row without a complete name is not a link', () => {
    renderCard({
      rows: [
        { type: { x: 1 }, typeKey: 'bins', count: [7], alerts: 'x', offline: null, healthy: true, caption: false },
        { type: 'Piles', typeKey: 'piles', count: Number.NaN, alerts: -1, offline: Infinity, healthy: 2, caption: null },
        { type: 'Flats', typeKey: 'flats', count: 2, alerts: 0, offline: 0, healthy: 2, caption: '2 healthy' },
      ],
    });
    expect(rows().map(rowText)).toEqual([
      ['', '', ''],
      ['Piles', '', ''],
      ['Flats', '2', '2 healthy'],
    ]);
    expect(segmentsOf(rows()[0])).toEqual([]);
    expect(segmentsOf(rows()[1])).toEqual([['healthy', 0, 474]]);
    // Known typeKey but no usable name → a plain row, never an unnamed link.
    expect(rows().map((row) => [row.tagName, row.getAttribute('href'), row.getAttribute('aria-label')])).toEqual([
      ['DIV', null, null],
      ['DIV', null, null],
      ['A', paths.equipment({ type: 'flats' }), 'Flats, 2: 2 healthy'],
    ]);
    expect(hasClass(rows()[0], 'link')).toBe(false);
    expect(document.body.innerHTML).not.toContain('NaN');
  });

  it.each([
    ['an empty type', { type: '', count: 1, caption: '1 healthy' }],
    ['an empty caption', { type: 'Bins', count: 1, caption: '' }],
    ['no count', { type: 'Bins', caption: '1 healthy' }],
  ])('a known-typeKey row with %s is not a link', (_name, fields) => {
    renderCard({ rows: [{ typeKey: 'bins', alerts: 0, offline: 0, healthy: 1, ...fields }] });
    expect(rows()[0].tagName).toBe('DIV');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('rows: non-objects and rows without a string typeKey are skipped; the first of a duplicate typeKey wins; an unknown typeKey is not a link', () => {
    renderCard({
      rows: [
        null,
        'Bins',
        [1, 2],
        { type: 'Silos', typeKey: 'silos', count: 1, alerts: 1, offline: 0, healthy: 0, caption: '1 alert' },
        { type: 'Nameless', count: 1, alerts: 0, offline: 0, healthy: 1, caption: '1 healthy' },
        { type: 'Numeric', typeKey: 7, count: 1, alerts: 0, offline: 0, healthy: 1, caption: '1 healthy' },
        { type: 'Bins', typeKey: 'bins', count: 1, alerts: 0, offline: 0, healthy: 1, caption: '1 healthy' },
        { type: 'Bins again', typeKey: 'bins', count: 9, alerts: 9, offline: 0, healthy: 0, caption: '9 alerts' },
      ],
    });
    expect(rows().map((row) => [row.tagName, row.dataset.equipmentRow, row.getAttribute('href'), rowText(row)[0]])).toEqual([
      ['DIV', 'silos', null, 'Silos'],
      ['A', 'bins', paths.equipment({ type: 'bins' }), 'Bins'],
    ]);
    expect(rows().map(dividerOf)).toEqual(['none', 'divided']);
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'rows'],
    ['no rows', { title: 'Equipment (0)' }],
    ['rows not an array', { rows: { 0: {} } }],
  ])('data %s → an empty list, no crash', (_name, data) => {
    renderCard(data);
    expect(list()).not.toBeNull();
    expect(rows()).toHaveLength(0);
  });

  it.each([
    ['an empty rows array', []],
    ['only unusable rows', [null, { type: 'Nameless', count: 1 }]],
  ])('ready with %s → the section shows the Story 2.2 error state, not a blank card', async (_name, badRows) => {
    const doc = structuredClone(DOCS.full);
    doc.equipmentCard.rows = badRows;
    vi.mocked(getDashboard).mockResolvedValue(doc);
    signInAs('demo');
    await renderAt(paths.dashboard('full'));
    await waitFor(() => expect(document.querySelector('[data-section="kpi"]').dataset.status).toBe('ready'));
    expect(slot().dataset.status).toBe('error');
    expect(within(slot()).getByText(copy.dashboard.sectionError)).toBeTruthy();
    expect(within(slot()).getByRole('button', { name: copy.dashboard.retry })).toBeTruthy();
    expect(list()).toBeNull();
    expect(document.querySelector('[data-section="recentAlerts"]').dataset.status).toBe('ready');
  });

  it('an unknown variant falls back to full; small and all-good have their own list class; dividers follow the row count (FR-68)', () => {
    const one = { rows: [DOCS.full.equipmentCard.rows[0]] };
    for (const variant of ['nope', undefined, 'toString', '__proto__']) {
      const { unmount } = renderCard(one, variant);
      expect(list().dataset.equipmentList).toBe('full');
      expect(hasClass(list(), 'full')).toBe(true);
      expect(rows().map(dividerOf)).toEqual(['divided']);
      unmount();
    }
    for (const variant of ['small', 'allgood']) {
      const { unmount } = renderCard(DOCS.full.equipmentCard, variant);
      expect(list().dataset.equipmentList).toBe(variant);
      expect(hasClass(list(), variant)).toBe(true);
      expect(hasClass(list(), 'full')).toBe(false);
      expect(rows().map(dividerOf)).toEqual(['none', 'divided', 'divided', 'divided', 'divided']);
      unmount();
    }
  });

  it('overflow: 7 Full rows are all drawn (no data dropped) inside the one clipped list', () => {
    const extra = (type, typeKey) => ({ type, typeKey, count: 1, alerts: 0, offline: 0, healthy: 1, caption: '1 healthy' });
    renderCard({ rows: [...DOCS.full.equipmentCard.rows, extra('Silos', 'silos'), extra('Augers', 'augers')] }, 'full');
    expect(rows()).toHaveLength(7);
    for (const row of rows()) expect(row.parentElement).toBe(list());
    expect(hasClass(list(), 'list')).toBe(true);
    expect(hasClass(list(), 'full')).toBe(true);
    // The list is the clipping box (CSS checks below; the Fidelity spec measures it).
  });

  it('the component source formats nothing: no toLocaleString, Intl, toFixed, Number(), sums or plural rules', () => {
    expect(SOURCE).not.toMatch(/toLocaleString|Intl\.|toFixed|toPrecision|Number\(|parseInt|parseFloat|\.reduce\(|PluralRules|padStart|Math\./);
  });
});

/* ------------------------------------------------------------------------ */
/* Source and CSS rules                                                      */
/* ------------------------------------------------------------------------ */

describe('EquipmentCard source and CSS (AD-2, AD-4, AD-5, AD-8, AD-10, AD-13, AD-15, AD-16)', () => {
  const COMMENTLESS = CSS_SOURCE.replace(/\/\*[\s\S]*?\*\//g, '');
  /** Every declaration that applies to `selector` alone (from each rule whose selector list names it). */
  const rule = (selector) => {
    const bodies = [...COMMENTLESS.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter(([, selectors]) => selectors.split(',').map((s) => s.trim()).includes(selector))
      .map(([, , body]) => body.trim());
    if (bodies.length === 0) throw new Error(`no rule ${selector}`);
    return bodies.join('\n');
  };
  /** One declaration's value for `selector` (the last one wins, as in CSS). */
  const decl = (selector, property) => {
    const values = [...rule(selector).matchAll(new RegExp(`(?:^|[;\\s])${property}\\s*:\\s*([^;]+);`, 'g'))].map(([, v]) => v.trim().replace(/\s+/g, ' '));
    return values.at(-1);
  };
  const atRest = CSS_SOURCE.slice(0, CSS_SOURCE.indexOf('/* states */'));
  const states = CSS_SOURCE.slice(CSS_SOURCE.indexOf('/* states */'));

  it('no literal text, text attributes, data-fid or "/" URLs in JSX', () => {
    expect(jsxLiterals(SOURCE)).toEqual([]);
  });

  it('routes only through paths.js; geometry only through geometry.js; react-router only; no data port, JSON or fetch', () => {
    expect(SOURCE).toMatch(/from '\.\.\/\.\.\/\.\.\/lib\/paths\.js'/);
    expect(SOURCE).toMatch(/from '\.\.\/\.\.\/\.\.\/lib\/geometry\.js'/);
    expect(SOURCE).toMatch(/from 'react-router'/);
    expect(SOURCE).not.toMatch(/react-router-dom|data\/api|\.json|fetch\(|features\/(?!dashboard)|kpi\//);
    expect(SOURCE).not.toMatch(/['"`]\/(alerts|equipment)/);
    expect(SOURCE).toContain("assets/icons/chevron-right.svg'");
  });

  it('row: flex, space-between, centre, min-height 58, height 68, padding 12 0 8; divider 1px #E6E8EB, 69 high', () => {
    expect(decl('.row', 'display')).toBe('flex');
    expect(decl('.row', 'align-items')).toBe('center');
    expect(decl('.row', 'justify-content')).toBe('space-between');
    expect(decl('.row', 'min-height')).toBe('58px');
    expect(decl('.row', 'height')).toBe('68px');
    expect(decl('.row', 'padding')).toBe('12px 0 8px');
    for (const sel of ['.divided', '.item']) {
      expect(decl(sel, 'height')).toBe('69px');
      expect(decl(sel, 'border-top')).toBe('var(--border-width-hairline) solid var(--raw-e6e8eb)');
    }
  });

  it('per-row offsets matching the frames: .item padding 10 / 10; .divided padding-right 1px', () => {
    expect(decl('.item', 'padding-top')).toBe('10px');
    expect(decl('.item', 'padding-bottom')).toBe('10px');
    expect(decl('.divided', 'padding-right')).toBe('1px');
    expect(decl('.divided', 'padding-top')).toBeUndefined();
    expect(decl('.item', 'padding-right')).toBeUndefined();
  });

  it('list: Figma-matching -1px margins; shrinks to the card body and clips its rows (4 px clip margin for the focus ring); Full 344 with safe centring', () => {
    expect(decl('.list', 'margin')).toBe('-1px -1px 0');
    expect(decl('.list', 'min-height')).toBe('0');
    expect(decl('.list', 'flex')).toBe('0 1 auto');
    expect(decl('.list', 'overflow')).toBe('clip');
    expect(decl('.list', 'overflow-clip-margin')).toBe('4px');
    expect(decl('.full', 'height')).toBe('344px');
    expect(decl('.full', 'flex')).toBe('none');
    expect(decl('.full', 'justify-content')).toBe('safe center');
    for (const sel of ['.small', '.allgood']) expect(decl(sel, 'justify-content')).toBe('flex-start');
  });

  it('columns: left 74 (column, gap 1, pb 1); right 523 (gap 32); bar block 474 (column, gap 6); chevron box 18×18, glyph at 3,1, 12×16', () => {
    expect([decl('.left', 'flex-direction'), decl('.left', 'gap'), decl('.left', 'width'), decl('.left', 'padding-bottom')]).toEqual(['column', '1px', '74px', '1px']);
    expect([decl('.right', 'gap'), decl('.right', 'width')]).toEqual(['32px', '523px']);
    expect([decl('.barBlock', 'flex-direction'), decl('.barBlock', 'gap'), decl('.barBlock', 'width')]).toEqual(['column', '6px', '474px']);
    expect([decl('.chevronBox', 'width'), decl('.chevronBox', 'height'), decl('.chevronBox', 'padding')]).toEqual(['18px', '18px', '1px 0 0 3px']);
    expect([decl('.chevron', 'width'), decl('.chevron', 'height')]).toEqual(['12px', '16px']);
  });

  it('Health bar 474×8, radius 4, overflow hidden; square segments; #C62828 / #15803D; the verbatim 17-stripe FR-70 hatch', () => {
    expect([decl('.bar', 'width'), decl('.bar', 'height'), decl('.bar', 'overflow'), decl('.bar', 'border-radius')]).toEqual(['474px', '8px', 'hidden', '4px']);
    expect(decl('.segment', 'border-radius')).toBeUndefined();
    expect(decl('.alerts', 'background')).toBe('var(--raw-c62828)');
    expect(decl('.healthy', 'background')).toBe('var(--raw-15803d)');
    const hatch = decl('.offline', 'background');
    expect(hatch.startsWith('linear-gradient( 43.841deg,')).toBe(true);
    const stops = [...hatch.matchAll(/var\(--raw-(9ca3af|d1d5db)\) ([\d.]+)%/g)].map(([, colour, at]) => [colour, Number(at)]);
    const expected = [];
    for (let i = 0; i < 17; i += 1) {
      const colour = i % 2 === 0 ? '9ca3af' : 'd1d5db';
      expected.push([colour, Number((i * 5.8535).toFixed(4))], [colour, Number(((i + 1) * 5.8535).toFixed(4))]);
    }
    expected.push(['d1d5db', 99.5095], ['d1d5db', 100]);
    expect(stops).toEqual(expected);
    expect(CSS_SOURCE).not.toContain('repeating-linear-gradient');
  });

  it('type: name SF 590 16/1.5 #1F2937; count SF 400 14/1.25 #374151; caption Roboto 400 14/normal #4B5563; digits 700 #111827 (weights via tokens where one exists)', () => {
    expect(['font-family', 'font-weight', 'font-size', 'line-height', 'color'].map((p) => decl('.name', p))).toEqual([
      'var(--font-stack-sf-pro)', 'var(--font-weight-semibold)', '16px', '1.5', 'var(--raw-1f2937)',
    ]);
    expect(['font-family', 'font-weight', 'font-size', 'line-height', 'color'].map((p) => decl('.count', p))).toEqual([
      'var(--font-stack-sf-pro)', 'var(--font-weight-regular)', '14px', '1.25', 'var(--raw-374151)',
    ]);
    expect(['font-family', 'font-weight', 'font-size', 'line-height', 'color'].map((p) => decl('.caption', p))).toEqual([
      'var(--font-stack-roboto)', 'var(--font-weight-regular)', '14px', 'normal', 'var(--raw-4b5563)',
    ]);
    // tokens.css has no 700 weight token (adding one is an Ask First token change).
    expect(decl('.num', 'font-weight')).toBe('700');
    expect(decl('.num', 'color')).toBe('var(--raw-111827)');
    expect(COMMENTLESS).not.toMatch(/font-weight:\s*400/);
  });

  it('pointer only on <a>; hover (inset inside the content box) and focus only under /* states */ (AD-13); no overlays, responsive sizing or animation (AD-4)', () => {
    expect(decl('.link', 'cursor')).toBe('pointer');
    for (const sel of ['.row', '.left', '.right', '.bar', '.segment']) expect(rule(sel)).not.toMatch(/cursor|z-index/);
    expect(CSS_SOURCE).not.toMatch(/::after|::before/);
    expect(atRest).not.toMatch(/:hover|:focus/);
    const stateRule = (selector) => {
      const m = states.replace(/\/\*[\s\S]*?\*\//g, '').match(new RegExp(`${selector.replace(/[.:]/g, (c) => `\\${c}`)}\\s*\\{([^}]*)\\}`));
      return m ? m[1].replace(/\s+/g, ' ') : '';
    };
    expect(stateRule('.link:hover')).toContain('background: var(--raw-f0fff8);');
    expect(stateRule('.link:hover')).toContain(
      'box-shadow: inset 1px 0 0 var(--primitives-color-base-white), inset -1px 0 0 var(--primitives-color-base-white);',
    );
    expect(stateRule('.link:focus-visible')).toContain('outline: var(--border-width-md) solid var(--raw-006a36);');
    expect(stateRule('.link:focus-visible')).toContain('outline-offset: 2px;');
    const css = COMMENTLESS.replace(/linear-gradient\([\s\S]*?\);/, '');
    expect(css).not.toMatch(/@media|\dvw|\dvh|clamp\(|animation|transition|\d%/);
  });
});
