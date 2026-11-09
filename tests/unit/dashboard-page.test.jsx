// Story 2.2 — Dashboard page, Dashboard states and card shells: every I/O-matrix
// row except Fidelity (FR-50, FR-65, FR-93–FR-96, AD-7, AD-11, AD-18).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';
import App from '../../src/app/App.jsx';
import { getConfig, getDashboard, getUsers } from '../../src/data/api.js';
import { copy } from '../../src/lib/copy.js';
import {
  CANVAS_WIDTH,
  CONTENT_TOP,
  FRAME,
  SECTION_KEYS,
  lastRowBottom,
  pageHeight,
} from '../../src/lib/dashboardLayout.js';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
import DashboardPage from '../../src/pages/Dashboard/DashboardPage.jsx';
import { jsxLiterals } from './support/jsx-literals.js';
import { fromRoot } from './support/project.js';

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
const STATES = ['full', 'small', 'allgood'];
const TTL = usersData.policy.sessionTtlMinutes;
const user = (name) => usersData.users.find((entry) => entry.username === name);
const CARD_KEYS = SECTION_KEYS.filter((key) => key !== 'kpi');
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

const section = (key) => document.querySelector(`[data-section="${key}"]`);
const sections = () => [...document.querySelectorAll('[data-section]')];
const page = () => section('kpi').parentElement;
const fid = (id) => document.querySelector(`[data-fid="${CSS.escape(id)}"]`);
/** A slot's box in page coordinates, from its inline style (the page starts at CONTENT_TOP). */
const boxOf = (el) => ({
  x: parseFloat(el.style.left),
  y: parseFloat(el.style.top) + CONTENT_TOP,
  w: parseFloat(el.style.width),
  h: parseFloat(el.style.height),
});
/** getDashboard that never settles until releaseAll(): resolves EVERY pending call. */
function gateDashboard() {
  const pending = [];
  vi.mocked(getDashboard).mockImplementation(
    (state) => new Promise((resolve) => pending.push(() => resolve(DOCS[state]))),
  );
  return {
    pending,
    releaseAll: () => act(async () => {
      for (const release of pending.splice(0)) release();
    }),
  };
}
const statuses = () => sections().map((el) => el.dataset.status);
const layoutSnapshot = () => sections().map((el) => `${el.dataset.section} ${el.getAttribute('style')}`);

function expectFrame(state) {
  const frame = FRAME[state];
  expect(sections().map((el) => el.dataset.section)).toEqual(SECTION_KEYS);
  for (const key of SECTION_KEYS) expect(boxOf(section(key))).toEqual(frame.sections[key]);
  expect(CONTENT_TOP + parseFloat(page().style.height)).toBe(frame.height);
}

/* ------------------------------------------------------------------------ */
/* dashboardLayout.js — FRAME pinned to the PRD                              */
/* ------------------------------------------------------------------------ */

describe('lib: dashboardLayout.js FRAME (FR-50, AD-18)', () => {
  it('has exactly the three states and the six sections, in visual order', () => {
    expect(Object.keys(FRAME)).toEqual(STATES);
    for (const state of STATES) expect(Object.keys(FRAME[state].sections)).toEqual(SECTION_KEYS);
    expect(SECTION_KEYS).toEqual(['kpi', 'equipmentCard', 'recentAlerts', 'fanActivity', 'grain', 'liquid']);
    expect(Object.isFrozen(FRAME.full.sections.kpi)).toBe(true);
  });

  // PRD prd.md FR-50 (:688-697): KPI 24,136 1318×90; content 24,246; row 1
  // 649 wide, 444 (Full) / 240; row 2 at content y 464 / 260, 426×326, gaps 20.
  // Card positions: prd.md :881 (Equipment), :963 (Recent Alerts), :1028 (Fan),
  // :1082 (Grain), :1143 (Liquid). Bottom space 16 / 28 / 24 → 1052 / 860 / 856.
  it('pins every box to the PRD values', () => {
    const row1 = { full: 444, small: 240, allgood: 240 };
    const row2Y = { full: 710, small: 506, allgood: 506 };
    for (const state of STATES) {
      expect(FRAME[state].sections).toEqual({
        kpi: { x: 24, y: 136, w: 1318, h: 90 },
        equipmentCard: { x: 24, y: 246, w: 649, h: row1[state] },
        recentAlerts: { x: 693, y: 246, w: 649, h: row1[state] },
        fanActivity: { x: 24, y: row2Y[state], w: 426, h: 326 },
        grain: { x: 470, y: row2Y[state], w: 426, h: 326 },
        liquid: { x: 916, y: row2Y[state], w: 426, h: 326 },
      });
    }
  });


  it('the content area sits at 24,246 and the row geometry adds up (FR-50)', () => {
    for (const state of STATES) {
      const s = FRAME[state].sections;
      expect(s.recentAlerts.x).toBe(s.equipmentCard.x + s.equipmentCard.w + 20);
      expect(s.grain.x).toBe(s.fanActivity.x + s.fanActivity.w + 20);
      expect(s.liquid.x).toBe(s.grain.x + s.grain.w + 20);
      expect(s.liquid.x + s.liquid.w).toBe(CANVAS_WIDTH - 24);
      expect(s.fanActivity.y).toBe(s.equipmentCard.y + s.equipmentCard.h + 20);
      expect(s.equipmentCard.y).toBe(s.kpi.y + s.kpi.h + 20);
    }
  });

  it('pageBottomSpacePx and frame heights match the PRD, the Figma frames and each state document', () => {
    expect(STATES.map((state) => FRAME[state].pageBottomSpacePx)).toEqual([16, 28, 24]);
    expect(STATES.map((state) => FRAME[state].height)).toEqual([1052, 860, 856]);
    expect(STATES.map((state) => FRAME[state].figmaFrame)).toEqual([
      FID.frames.dashboardFull,
      FID.frames.dashboardSmall,
      FID.frames.dashboardAllgood,
    ]);
    for (const state of STATES) {
      expect(FRAME[state].pageBottomSpacePx).toBe(DOCS[state].pageBottomSpacePx);
      expect(FRAME[state].figmaFrame).toBe(DOCS[state].figmaFrame);
      expect(pageHeight(FRAME[state])).toBe(FRAME[state].height);
      expect(lastRowBottom(FRAME[state]) + DOCS[state].pageBottomSpacePx).toBe(FRAME[state].height);
    }
    expect(CONTENT_TOP).toBe(64 + 68);
  });

  it('lastRowBottom() is 0 with no sections; pageHeight() treats a missing pageBottomSpacePx as 0', () => {
    expect(lastRowBottom({ sections: {} })).toBe(0);
    expect(lastRowBottom({})).toBe(0);
    expect(lastRowBottom(undefined)).toBe(0);
    expect(pageHeight({ sections: {} })).toBe(0);
    expect(pageHeight({ sections: {}, pageBottomSpacePx: 16 })).toBe(16);
    expect(pageHeight({ sections: FRAME.full.sections })).toBe(1036);
    expect(pageHeight({ sections: FRAME.full.sections, pageBottomSpacePx: null })).toBe(1036);
    expect(pageHeight({ sections: FRAME.full.sections, pageBottomSpacePx: Number.NaN })).toBe(1036);
  });

  it('is pure: no React, DOM or storage', () => {
    const source = readFileSync(fromRoot('src/lib/dashboardLayout.js'), 'utf8');
    expect(source).not.toMatch(/from 'react|window\.|document\.|localStorage|sessionStorage|^import /m);
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix                                                                */
/* ------------------------------------------------------------------------ */

describe('Dashboard states (FR-50, FR-93)', () => {
  it.each([
    ['full', paths.dashboard(), 'demo'],
    ['full', paths.dashboard('full'), 'demo'],
    ['small', paths.dashboard('small'), 'demo'],
    ['small', paths.dashboard(), 'small'],
    ['allgood', paths.dashboard('allgood'), 'demo'],
    ['allgood', paths.dashboard(), 'allgood'],
  ])('%s: six sections at FRAME positions and the exact frame height (%s as %s)', async (state, url, name) => {
    signInAs(name);
    await renderAt(url);
    await waitFor(() => expect(section('kpi').dataset.status).toBe('ready'));
    expect(page().dataset.state).toBe(state);
    expectFrame(state);
    expect(getDashboard).toHaveBeenCalledTimes(1);
    expect(getDashboard).toHaveBeenLastCalledWith(state);
  });

  it.each([
    ['demo', 'full'],
    ['small', 'small'],
    ['allgood', 'allgood'],
  ])('an unknown ?state falls back to the Session state, then full (AD-11): %s → %s', async (name, state) => {
    signInAs(name);
    await renderAt(`${paths.dashboard()}?state=xyz`);
    await waitFor(() => expect(section('kpi').dataset.status).toBe('ready'));
    expect(getDashboard).toHaveBeenLastCalledWith(state);
    expectFrame(state);
  });

  it('a ready card shows only its shell and the FR-65 header, verbatim from the document', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(section('kpi').dataset.status).toBe('ready'));
    for (const key of CARD_KEYS) {
      const card = within(section(key));
      expect(card.getByRole('heading', { level: 2 }).textContent).toBe(DOCS.full[key].title);
      expect(card.getByText(DOCS.full[key].subtitle).tagName).toBe('P');
    }
    // View All on Equipment and Recent Alerts only, through paths.js (AD-10).
    // Found by its name (the Equipment rows are links too, Story 2.4).
    const viewAll = (key) => within(section(key)).queryByRole('link', { name: DOCS.full.equipmentCard.link });
    expect(viewAll('equipmentCard').textContent).toBe(DOCS.full.equipmentCard.link);
    expect(viewAll('equipmentCard').getAttribute('href')).toBe(paths.equipment());
    expect(viewAll('recentAlerts').textContent).toBe(DOCS.full.recentAlerts.link);
    expect(viewAll('recentAlerts').getAttribute('href')).toBe(paths.alerts());
    for (const key of ['fanActivity', 'grain', 'liquid']) {
      expect(viewAll(key)).toBeNull();
      expect(within(section(key)).queryAllByRole('link')).toHaveLength(0);
    }
    const chevron = section('equipmentCard').querySelector('img');
    expect([chevron.getAttribute('width'), chevron.getAttribute('height'), chevron.getAttribute('alt')]).toEqual(['12', '16', '']);
    // Story 2.3: the KPI strip (its fid on the strip, inside the slot) holds
    // the KPI readings. Story 2.4: the Equipment card adds its rows (covered
    // in equipment-card.test.jsx); Story 2.5: Recent Alerts adds its Alert
    // rows (recent-alerts-card.test.jsx); Story 2.6: Fan activity adds its
    // Stat tiles, Runtime chart and caption (fan-activity-card.test.jsx); Story
    // 2.7: Grain On Hand adds its summary, Fill bar and Legend
    // (grain-card.test.jsx); no Liquid contents yet (2.8).
    expect(section('kpi').querySelector(`[data-fid="${FID.kpi.strip}"]`)).toBe(fid(FID.kpi.strip));
    expect(section('kpi').dataset.fid).toBeUndefined();
    expect(fid(FID.kpi.strip).textContent).toContain(DOCS.full.kpi.attention.label);
    expect(section('equipmentCard').querySelectorAll('[data-equipment-row]')).toHaveLength(DOCS.full.equipmentCard.rows.length);
    expect(section('recentAlerts').querySelectorAll('[data-alert-row]')).toHaveLength(DOCS.full.recentAlerts.items.length);
    expect(section('fanActivity').querySelectorAll('[data-fan-tile]')).toHaveLength(DOCS.full.fanActivity.tiles.length);
    expect(section('fanActivity').querySelectorAll('[data-fan-column]')).toHaveLength(DOCS.full.fanActivity.chart.length);
    expect(section('grain').querySelectorAll('[data-grain-item]')).toHaveLength(DOCS.full.grain.items.length);
    expect(section('grain').querySelectorAll('[data-grain-segment]')).toHaveLength(DOCS.full.grain.items.length);
    for (const key of CARD_KEYS.filter((k) => !['equipmentCard', 'recentAlerts', 'fanActivity', 'grain'].includes(k))) {
      expect(section(key).textContent).toBe(`${DOCS.full[key].title}${DOCS.full[key].subtitle}${DOCS.full[key].link ?? ''}`);
    }
    expect(screen.queryByText(copy.dashboard.sectionError)).toBeNull();
  });

  it('View All navigates to the placeholder route', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(section('kpi').dataset.status).toBe('ready'));
    await act(async () => fireEvent.click(within(section('equipmentCard')).getByRole('link', { name: DOCS.full.equipmentCard.link })));
    expect(window.location.pathname).toBe(paths.equipment());
    expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy();
  });
});

describe('Loading (FR-95)', () => {
  it('every section shows the placeholder at its final size; no header, no text', async () => {
    const gate = gateDashboard();
    signInAs('small');
    await renderAt(paths.dashboard());
    expectFrame('small');
    for (const el of sections()) {
      expect(el.dataset.status).toBe('loading');
      expect(el.getAttribute('aria-busy')).toBe('true');
      expect(el.textContent).toBe('');
      expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();
    }
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    // Header and title strip render immediately; the badge waits for the data.
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(copy.shell.pageTitles.dashboard);
    expect(fid(FID.shell.badge)).toBeNull();

    // No layout shift: every slot keeps its box when the data arrives.
    const before = [layoutSnapshot(), page().getAttribute('style')];
    await gate.releaseAll();
    expect(section('kpi').dataset.status).toBe('ready');
    expect([layoutSnapshot(), page().getAttribute('style')]).toEqual(before);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5);
  });
});

describe('same-mount state changes (AD-11, AD-18)', () => {
  it('a ?state change goes back to loading at the NEW frame, then shows it', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(section('kpi').dataset.status).toBe('ready'));
    expectFrame('full');
    const gate = gateDashboard();
    await act(async () => {
      window.history.pushState(null, '', paths.dashboard('small'));
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(getDashboard).toHaveBeenLastCalledWith('small');
    expectFrame('small');
    expect(statuses()).toEqual(Array(6).fill('loading'));
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    await gate.releaseAll();
    expect(statuses()).toEqual(Array(6).fill('ready'));
    expectFrame('small');
    expect(page().dataset.state).toBe('small');
  });

  it("a change of the Session's dashboardState (storage event) does the same", async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(section('kpi').dataset.status).toBe('ready'));
    const gate = gateDashboard();
    await act(async () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(createSessionRecord(user('small'), { now: Date.now(), ttlMinutes: TTL })));
      window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY, newValue: localStorage.getItem(SESSION_KEY) }));
    });
    await waitFor(() => expect(getDashboard).toHaveBeenLastCalledWith('small'));
    expectFrame('small');
    expect(statuses()).toEqual(Array(6).fill('loading'));
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    await gate.releaseAll();
    expect(statuses()).toEqual(Array(6).fill('ready'));
    expectFrame('small');
  });
});

describe('Error (FR-96)', () => {
  it('each section shows the error and Retry; the badge is hidden; the Header stays usable', async () => {
    vi.mocked(getDashboard).mockRejectedValue({ code: 'FORCED_FAIL', message: 'x' });
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(section('kpi').dataset.status).toBe('error'));
    expectFrame('full');
    for (const el of sections()) {
      expect(el.dataset.status).toBe('error');
      expect(within(el).getByText(copy.dashboard.sectionError).tagName).toBe('P');
      expect(within(el).getByRole('button', { name: copy.dashboard.retry }).getAttribute('type')).toBe('button');
      expect(el.querySelector('h2')).toBeNull();
    }
    expect(screen.getAllByText(copy.dashboard.sectionError)).toHaveLength(6);
    expect(fid(FID.shell.badge)).toBeNull();
    await act(async () => fireEvent.click(within(screen.getByRole('banner')).getByRole('link', { name: copy.shell.tabs.alerts })));
    expect(window.location.pathname).toBe(paths.alerts());
  });

  it('Retry reloads the document once through the layout, shows placeholders, then the content', async () => {
    vi.mocked(getDashboard).mockRejectedValueOnce({ code: 'FORCED_FAIL', message: 'x' });
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(section('kpi').dataset.status).toBe('error'));
    expect(getDashboard).toHaveBeenCalledTimes(1);

    const gate = gateDashboard();
    const before = layoutSnapshot();
    await act(async () => fireEvent.click(within(section('grain')).getByRole('button', { name: copy.dashboard.retry })));
    expect(getDashboard).toHaveBeenCalledTimes(2);
    expect(getDashboard).toHaveBeenLastCalledWith('full');
    for (const el of sections()) expect(el.dataset.status).toBe('loading');
    expect(layoutSnapshot()).toEqual(before);

    await gate.releaseAll();
    for (const el of sections()) expect(el.dataset.status).toBe('ready');
    expect(screen.queryByText(copy.dashboard.sectionError)).toBeNull();
    await waitFor(() => expect(fid(FID.shell.badgeText)?.textContent).toBe(String(DOCS.full.header.bellBadge)));
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });
});

/* ------------------------------------------------------------------------ */
/* Contract and source rules                                                 */
/* ------------------------------------------------------------------------ */

/** Render DashboardPage alone under a parent route that supplies `context` (or none). */
function renderPage(context, { withOutlet = true } = {}) {
  const Layout = () => (withOutlet ? <Outlet context={context} /> : <Outlet />);
  return render(
    <MemoryRouter initialEntries={[paths.dashboard()]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path={paths.dashboard()} element={<DashboardPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}
const readyContext = (doc, extra = {}) => ({ state: 'full', status: 'ready', doc, retry: vi.fn(), ...extra });

describe('robustness (AD-18)', () => {
  it('no Outlet context: every section shows the error, Retry is disabled, the full frame is used', () => {
    renderPage(undefined, { withOutlet: false });
    expect(statuses()).toEqual(Array(6).fill('error'));
    expectFrame('full');
    expect(page().dataset.state).toBe('full');
    for (const button of screen.getAllByRole('button', { name: copy.dashboard.retry })) {
      expect(button.disabled).toBe(true);
      fireEvent.click(button); // never throws
    }
  });

  it('a context without retry disables Retry', () => {
    renderPage({ state: 'small', status: 'error', doc: null });
    expectFrame('small');
    for (const button of screen.getAllByRole('button', { name: copy.dashboard.retry })) expect(button.disabled).toBe(true);
  });

  it('an unknown status is an error (never a loading look-alike); an unknown state uses full', () => {
    renderPage({ state: 'xyz', status: 'pending', doc: DOCS.full, retry: vi.fn() });
    expect(statuses()).toEqual(Array(6).fill('error'));
    expect(document.querySelectorAll('[data-section] [aria-hidden="true"]')).toHaveLength(0);
    expect(page().dataset.state).toBe('full');
    expectFrame('full');
  });

  it('ready without a document, or without a section slice, shows that section as an error', () => {
    const { unmount } = renderPage(readyContext(null));
    expect(statuses()).toEqual(Array(6).fill('error'));
    unmount();
    const { kpi: _kpi, ...rest } = DOCS.full;
    renderPage(readyContext({ ...rest, grain: null }));
    expect(section('kpi').dataset.status).toBe('error');
    expect(section('grain').dataset.status).toBe('error');
    expect(within(section('grain')).getByText(copy.dashboard.sectionError)).toBeTruthy();
    for (const key of ['equipmentCard', 'recentAlerts', 'fanActivity', 'liquid']) expect(section(key).dataset.status).toBe('ready');
  });

  it('the KPI section receives { status, data, onRetry }: ready with data draws the strip, Retry calls onRetry', () => {
    const retry = vi.fn();
    const { unmount } = renderPage(readyContext(DOCS.full, { retry }));
    expect(section('kpi').dataset.status).toBe('ready');
    // Five tiles plus one block per breakdown type, from the document.
    expect(fid(FID.kpi.strip).querySelectorAll('[data-kpi-tile]')).toHaveLength(5 + DOCS.full.kpi.equipment.breakdown.length);
    unmount();
    renderPage({ state: 'full', status: 'error', doc: null, retry });
    fireEvent.click(within(section('kpi')).getByRole('button', { name: copy.dashboard.retry }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('no header block without both title and subtitle; no View All for an empty or blank link', () => {
    const doc = {
      ...DOCS.full,
      equipmentCard: { ...DOCS.full.equipmentCard, link: '   ' },
      recentAlerts: { ...DOCS.full.recentAlerts, link: '' },
      fanActivity: { ...DOCS.full.fanActivity, title: '' },
      grain: { ...DOCS.full.grain, subtitle: undefined },
    };
    renderPage(readyContext(doc));
    // No header link at all (the card's own row links are not header links).
    expect(section('equipmentCard').querySelector(`a[href="${paths.equipment()}"]`)).toBeNull();
    expect(section('recentAlerts').querySelector(`a[href="${paths.alerts()}"]`)).toBeNull();
    // Every link that is drawn has a non-blank accessible name.
    for (const key of ['equipmentCard', 'recentAlerts']) {
      const links = within(section(key)).queryAllByRole('link');
      expect(within(section(key)).queryAllByRole('link', { name: /\S/ })).toEqual(links);
      expect(links.length).toBeGreaterThan(0);
    }
    // Fan activity (Story 2.6) still draws its body without the header block.
    expect(section('fanActivity').querySelector('h2')).toBeNull();
    expect(section('fanActivity').firstElementChild.hasAttribute('aria-labelledby')).toBe(false);
    expect(section('fanActivity').querySelectorAll('[data-fan-tile]')).toHaveLength(DOCS.full.fanActivity.tiles.length);
    // So does Grain On Hand (Story 2.7).
    expect(section('grain').querySelector('h2')).toBeNull();
    expect(section('grain').firstElementChild.hasAttribute('aria-labelledby')).toBe(false);
    expect(section('grain').firstElementChild.firstElementChild).toBe(section('grain').querySelector('[data-grain-body]'));
    expect(section('grain').querySelectorAll('[data-grain-item]')).toHaveLength(DOCS.full.grain.items.length);
  });

  it('each card <section> is labelled by its title h2', () => {
    renderPage(readyContext(DOCS.full));
    for (const key of CARD_KEYS) {
      const card = section(key).firstElementChild;
      const title = card.querySelector('h2');
      expect(card.tagName).toBe('SECTION');
      expect(title.id).not.toBe('');
      expect(card.getAttribute('aria-labelledby')).toBe(title.id);
      expect(screen.getByRole('region', { name: DOCS.full[key].title })).toBe(card);
    }
  });
});

describe('Retry focus and de-duplication (FR-96)', () => {
  it('a focused Retry hands focus to the page region (tabindex -1 while focused) before it unmounts', async () => {
    vi.mocked(getDashboard).mockRejectedValueOnce({ code: 'FORCED_FAIL', message: 'x' });
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(section('kpi').dataset.status).toBe('error'));
    const gate = gateDashboard();
    const button = within(section('fanActivity')).getByRole('button', { name: copy.dashboard.retry });
    // At rest the page region is not focusable (a pointer press on it never takes focus).
    expect(page().hasAttribute('tabindex')).toBe(false);
    button.focus();
    expect(document.activeElement).toBe(button);
    await act(async () => fireEvent.click(button));
    expect(statuses()).toEqual(Array(6).fill('loading'));
    expect(document.activeElement).toBe(page());
    expect(page().getAttribute('tabindex')).toBe('-1');
    expect(screen.getByRole('main').contains(document.activeElement)).toBe(true);
    await gate.releaseAll();
    expect(document.activeElement).toBe(page());
    // Once focus moves on, the page drops tabindex again.
    act(() => screen.getByRole('button', { name: copy.shell.bellLabel }).focus());
    expect(page().hasAttribute('tabindex')).toBe(false);
  });

  it('a Retry clicked without focus (focus elsewhere) does not steal focus', async () => {
    vi.mocked(getDashboard).mockRejectedValueOnce({ code: 'FORCED_FAIL', message: 'x' });
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(section('kpi').dataset.status).toBe('error'));
    gateDashboard();
    const bell = screen.getByRole('button', { name: copy.shell.bellLabel });
    bell.focus();
    await act(async () => fireEvent.click(within(section('grain')).getByRole('button', { name: copy.dashboard.retry })));
    expect(document.activeElement).toBe(bell);
  });

  it('several Retry activations in a row reload the document once', async () => {
    vi.mocked(getDashboard).mockRejectedValueOnce({ code: 'FORCED_FAIL', message: 'x' });
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(section('kpi').dataset.status).toBe('error'));
    const gate = gateDashboard();
    const buttons = screen.getAllByRole('button', { name: copy.dashboard.retry });
    await act(async () => {
      for (const button of buttons) fireEvent.click(button);
    });
    expect(getDashboard).toHaveBeenCalledTimes(2);
    expect(gate.pending).toHaveLength(1);
    await gate.releaseAll();
    expect(statuses()).toEqual(Array(6).fill('ready'));
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });
});

describe('section contract and source rules (AD-7, AD-15, AD-16, AD-18)', () => {
  const pageSource = readFileSync(fromRoot('src/pages/Dashboard/DashboardPage.jsx'), 'utf8');

  it('positions come only from FRAME[state]; never from content (no measuring)', () => {
    expect(pageSource).toMatch(/FRAME\[state\]/);
    expect(pageSource).not.toMatch(/getBoundingClientRect|offsetHeight|ResizeObserver|useLayoutEffect/);
  });

  it.each([
    'src/pages/Dashboard/DashboardPage.jsx',
    'src/ui/CardShell.jsx',
    'src/ui/SectionState.jsx',
  ])('%s has no literal text, text attributes, data-fid or "/" URLs', (file) => {
    expect(jsxLiterals(readFileSync(fromRoot(file), 'utf8'))).toEqual([]);
  });

  it('no react-router-dom, no responsive CSS, no animation', () => {
    for (const file of [
      'src/pages/Dashboard/DashboardPage.jsx',
      'src/ui/CardShell.jsx',
      'src/ui/SectionState.jsx',
    ]) {
      expect(readFileSync(fromRoot(file), 'utf8')).not.toMatch(/react-router-dom/);
    }
    for (const file of [
      'src/pages/Dashboard/DashboardPage.module.css',
      'src/ui/CardShell.module.css',
      'src/ui/SectionState.module.css',
    ]) {
      const css = readFileSync(fromRoot(file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(css).not.toMatch(/@media|\dvw|\dvh|clamp\(|animation|transition|\d%/);
    }
  });

  it('copy: the error text and Retry are the PRD strings', () => {
    expect(copy.dashboard.sectionError).toBe('Couldn’t load this section.');
    expect(copy.dashboard.retry).toBe('Retry');
  });
});

describe('card shell and state styles (FR-65, FR-95, FR-96)', () => {
  const card = readFileSync(fromRoot('src/ui/CardShell.module.css'), 'utf8');
  const state = readFileSync(fromRoot('src/ui/SectionState.module.css'), 'utf8');
  const pageCss = readFileSync(fromRoot('src/pages/Dashboard/DashboardPage.module.css'), 'utf8');
  const rule = (css, selector) => {
    const match = css.match(new RegExp(`(?:^|\\n)${selector.replace('.', '\\.')} \\{([^}]*)\\}`));
    if (!match) throw new Error(`no rule ${selector}`);
    return match[1];
  };
  const atRest = (css) => css.slice(0, css.indexOf('/* states */'));

  it('card: white, 1px #D1D5DB border, radius 12, padding 20, drop-shadow(0 2px 2px rgba(39,39,39,0.1))', () => {
    const r = rule(card, '.card');
    expect(r).toContain('padding: 20px;');
    expect(r).toContain('border: var(--border-width-hairline) solid var(--raw-d1d5db);');
    expect(r).toContain('border-radius: 12px;');
    expect(r).toContain('background: var(--primitives-color-base-white);');
    expect(r).toContain('filter: drop-shadow(var(--shadow-card));');
  });

  it('card header: 56 / 33 high, pb 12; text gap 3; title 590 20/1.25 #1F2937; subtitle 400 12/1.5', () => {
    expect(rule(card, '.header')).toMatch(/height: 56px;[\s\S]*padding-bottom: 12px;/);
    expect(rule(card, '.compact')).toContain('height: 33px;');
    expect(rule(card, '.text')).toContain('gap: 3px;');
    const title = rule(card, '.title');
    for (const decl of ['font-family: var(--font-stack-sf-pro);', 'font-weight: var(--font-weight-semibold);', 'font-size: 20px;', 'line-height: 1.25;', 'color: var(--raw-1f2937);']) {
      expect(title).toContain(decl);
    }
    const subtitle = rule(card, '.subtitle');
    for (const decl of ['font-weight: var(--font-weight-regular);', 'font-size: 12px;', 'line-height: 1.5;', 'color: var(--raw-rgba-0-0-0-0-8);']) {
      expect(subtitle).toContain(decl);
    }
    expect(rule(card, '.muted')).toContain('color: var(--raw-4b5563);');
    const link = rule(card, '.link');
    for (const decl of ['gap: 6px;', 'min-height: 44px;', 'padding: 13.5px 2px;', 'cursor: pointer;']) expect(link).toContain(decl);
    const label = rule(card, '.linkLabel');
    for (const decl of ['font-weight: var(--font-weight-medium);', 'font-size: 14px;', 'line-height: 1.25;', 'color: var(--raw-005c2f);']) {
      expect(label).toContain(decl);
    }
  });

  it('loading: #F4F5F6 radius 8 block; error: Roboto 400 14/20.3 #4B5563 and SF 510 14/1.25 #005C2F', () => {
    const placeholder = rule(state, '.placeholder');
    expect(placeholder).toContain('border-radius: 8px;');
    expect(placeholder).toContain('background: var(--raw-f4f5f6);');
    const message = rule(state, '.message');
    for (const decl of ['font-family: var(--font-stack-roboto);', 'font-weight: 400;', 'font-size: 14px;', 'line-height: 20.3px;', 'color: var(--raw-4b5563);']) {
      expect(message).toContain(decl);
    }
    const retry = rule(state, '.retry');
    for (const decl of ['font-family: var(--font-stack-sf-pro);', 'font-weight: var(--font-weight-medium);', 'font-size: 14px;', 'line-height: 1.25;', 'color: var(--raw-005c2f);']) {
      expect(retry).toContain(decl);
    }
    expect(rule(state, '.error')).toMatch(/align-items: center;[\s\S]*justify-content: center;/);
  });

  it('KPI shell (FR-59): white, radius 12, KPI box-shadow', () => {
    const kpi = rule(pageCss, '.kpiShell');
    expect(kpi).toContain('border-radius: 12px;');
    expect(kpi).toContain('background: var(--primitives-color-base-white);');
    expect(kpi).toContain('box-shadow: var(--shadow-kpi);');
  });

  it('hover and focus styles live only in a trailing /* states */ block (AD-13)', () => {
    for (const css of [card, state]) {
      expect(css).toContain('/* states */');
      expect(atRest(css)).not.toMatch(/:hover|:focus/);
    }
  });
});
