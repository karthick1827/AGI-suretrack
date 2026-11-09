// Story 2.2 — Dashboard page, Dashboard states and card shells: every I/O-matrix
// row except Fidelity (FR-50, FR-65, FR-93–FR-96, AD-7, AD-11, AD-18).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
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
import { jsxLiterals } from './support/jsx-literals.js';
import { BRIEF_DIR, PRD_DIR, fromRoot, readText } from './support/project.js';

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
  const prd = readText(`${PRD_DIR}/prd.md`);
  const prdAddendum = readText(`${PRD_DIR}/addendum.md`);
  const design = readText(`${BRIEF_DIR}/addendum.md`);

  it('has exactly the three states and the six sections, in visual order', () => {
    expect(Object.keys(FRAME)).toEqual(STATES);
    for (const state of STATES) expect(Object.keys(FRAME[state].sections)).toEqual(SECTION_KEYS);
    expect(SECTION_KEYS).toEqual(['kpi', 'equipmentCard', 'recentAlerts', 'fanActivity', 'grain', 'liquid']);
    expect(Object.isFrozen(FRAME.full.sections.kpi)).toBe(true);
  });

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

  it('the PRD and design spec state those values', () => {
    expect(prd).toContain('KPI strip 24, 136, 1318×90');
    expect(prd).toContain('content area 24, 246');
    expect(prd).toContain('two cards, each 649 px wide, column gap 20 px');
    expect(prd).toContain('height 444 px in Full, 240 px in Small and All-good');
    expect(prd).toContain('Content row 2 at y 464 (Full) / 260 (Small, All-good) relative to the content area');
    expect(prd).toContain('three cards, each 426×326, column gap 20 px');
    expect(prd).toContain('Card size 649×444 (Full), 649×240 (Small, All-good); position x 24, y 246.');
    expect(prd).toContain('Card at x 693 (24 + 649 + 20), y 246');
    expect(prd).toContain('Card 426×326 at x 24, y 710 (Full) / y 506 (Small, All-good) in page coordinates');
    expect(prd).toContain('Card 426×326 at x 470 (24 + 426 + 20) in page coordinates, same y as Fan activity');
    expect(prd).toContain('Card 426×326 at x 916 (24 + 2×(426 + 20)) in page coordinates');
    expect(prd).toContain('Full 16 px, Small 28 px, All-good 24 px');
    expect(prd).toContain('Full 1052 px, Small 860 px, All-good 856 px');
    expect(prdAddendum).toContain('(Full 16, Small 28, All-good 24) so the page height equals the Figma frame (1052 / 860 / 856)');
    expect(design).toContain('| KPI strip (6337:55041) | 24 | 136 | 1318×90 |');
    expect(design).toContain('| Content (6227:66459) | 24 | 246 |');
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
    const viewAll = (key) => within(section(key)).queryByRole('link');
    expect(viewAll('equipmentCard').textContent).toBe(DOCS.full.equipmentCard.link);
    expect(viewAll('equipmentCard').getAttribute('href')).toBe(paths.equipment());
    expect(viewAll('recentAlerts').textContent).toBe(DOCS.full.recentAlerts.link);
    expect(viewAll('recentAlerts').getAttribute('href')).toBe(paths.alerts());
    for (const key of ['fanActivity', 'grain', 'liquid']) expect(viewAll(key)).toBeNull();
    const chevron = section('equipmentCard').querySelector('img');
    expect([chevron.getAttribute('width'), chevron.getAttribute('height'), chevron.getAttribute('alt')]).toEqual(['12', '16', '']);
    // The KPI strip is an empty shell until Story 2.3; no card contents yet (2.4–2.8).
    expect(fid(FID.kpi.strip).textContent).toBe('');
    expect(fid(FID.kpi.strip).childElementCount).toBe(0);
    for (const key of CARD_KEYS) {
      expect(section(key).textContent).toBe(`${DOCS.full[key].title}${DOCS.full[key].subtitle}${DOCS.full[key].link ?? ''}`);
    }
    expect(screen.queryByText(copy.dashboard.sectionError)).toBeNull();
  });

  it('View All navigates to the placeholder route', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(section('kpi').dataset.status).toBe('ready'));
    await act(async () => fireEvent.click(within(section('equipmentCard')).getByRole('link')));
    expect(window.location.pathname).toBe(paths.equipment());
    expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy();
  });
});

describe('Loading (FR-95)', () => {
  it('every section shows the placeholder at its final size; no header, no text', async () => {
    let release;
    vi.mocked(getDashboard).mockImplementation((state) => new Promise((resolve) => (release = () => resolve(DOCS[state]))));
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
    await act(async () => release());
    expect(section('kpi').dataset.status).toBe('ready');
    expect([layoutSnapshot(), page().getAttribute('style')]).toEqual(before);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5);
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

    let release;
    vi.mocked(getDashboard).mockImplementationOnce(
      (state) => new Promise((resolve) => (release = () => resolve(DOCS[state]))),
    );
    const before = layoutSnapshot();
    await act(async () => fireEvent.click(within(section('grain')).getByRole('button', { name: copy.dashboard.retry })));
    expect(getDashboard).toHaveBeenCalledTimes(2);
    expect(getDashboard).toHaveBeenLastCalledWith('full');
    for (const el of sections()) expect(el.dataset.status).toBe('loading');
    expect(layoutSnapshot()).toEqual(before);

    await act(async () => release());
    for (const el of sections()) expect(el.dataset.status).toBe('ready');
    expect(screen.queryByText(copy.dashboard.sectionError)).toBeNull();
    await waitFor(() => expect(fid(FID.shell.badgeText)?.textContent).toBe(String(DOCS.full.header.bellBadge)));
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });
});

/* ------------------------------------------------------------------------ */
/* Contract and source rules                                                 */
/* ------------------------------------------------------------------------ */

describe('section contract and source rules (AD-7, AD-15, AD-16, AD-18)', () => {
  const pageSource = readFileSync(fromRoot('src/pages/Dashboard/DashboardPage.jsx'), 'utf8');

  it('the page reads the Outlet context and never fetches (one document per state)', () => {
    expect(pageSource).toMatch(/useOutletContext\(\)/);
    expect(pageSource).toMatch(/const \{ state, status, doc, retry \} = useOutletContext\(\);/);
    expect(pageSource).not.toMatch(/data\/api|\.json'|fetch\(|getDashboard/);
    expect(pageSource).toMatch(/<Section status=\{status\} data=\{doc\?\.\[key\] \?\? null\} onRetry=\{retry\} \/>/);
  });

  it('every section component takes exactly { status, data, onRetry }', () => {
    expect(pageSource).toMatch(/function KpiSection\(\{ status, onRetry \}\)/);
    expect(pageSource).toMatch(/function CardSection\(\{ status, data, onRetry \}\)/);
  });

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
