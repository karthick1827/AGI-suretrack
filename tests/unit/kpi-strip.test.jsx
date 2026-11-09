// Story 2.3 — KPI strip: every I/O-matrix row except Fidelity (FR-59 to FR-64,
// AD-7, AD-10, AD-13, AD-15, AD-16, AD-18), plus a check that no value is
// formatted or computed.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import App from '../../src/app/App.jsx';
import { getConfig, getDashboard, getUsers } from '../../src/data/api.js';
import KpiStrip from '../../src/features/dashboard/kpi/KpiStrip.jsx';
import kpiAlert from '../../src/assets/icons/kpi_alert.svg';
import kpiTick from '../../src/assets/icons/kpi_tick.svg';
import kpiEquip from '../../src/assets/icons/kpi_equip.svg';
import kpiOnline from '../../src/assets/icons/kpi_online.svg';
import kpiOffline from '../../src/assets/icons/kpi_offline.svg';
import kpiFans from '../../src/assets/icons/kpi_fans.svg';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
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
const TTL = usersData.policy.sessionTtlMinutes;
const user = (name) => usersData.users.find((entry) => entry.username === name);
const KPI_SOURCE = readFileSync(fromRoot('src/features/dashboard/kpi/KpiStrip.jsx'), 'utf8');
const KPI_CSS = readFileSync(fromRoot('src/features/dashboard/kpi/KpiStrip.module.css'), 'utf8');
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
  await waitFor(() => expect(document.querySelector('[data-section="kpi"]').dataset.status).toBe('ready'));
}

const strip = () => document.querySelector(`[data-fid="${CSS.escape(FID.kpi.strip)}"]`);
const tile = (key) => strip().querySelector(`[data-kpi-tile="${key}"]`);
const reading = (key) => [
  tile(key).querySelector('[data-kpi-value]').textContent,
  tile(key).querySelector('[data-kpi-label]').textContent,
];
const readings = () =>
  Object.fromEntries([...strip().querySelectorAll('[data-kpi-tile]')].map((el) => [el.dataset.kpiTile, reading(el.dataset.kpiTile)]));
const hasClass = (el, name) => [...el.classList].some((c) => c === name || c.startsWith(`_${name}_`) || c.includes(name));
const iconSrc = (key) => tile(key).querySelector('img').getAttribute('src');

/* ------------------------------------------------------------------------ */
/* I/O matrix: Full, Small, All-good                                         */
/* ------------------------------------------------------------------------ */

describe('KPI readings per Dashboard state (FR-59 to FR-63, FR-94)', () => {
  it('Full: 7 · Need attention · 2 critical (red); 20 Equipment with 5 Regular sub-counts; 16 / 4 / 7 of 24', async () => {
    await openDashboard('full');
    expect(readings()).toEqual({
      attention: ['7', 'Need attention · 2 critical'],
      equipment: ['20', 'Equipment'],
      'equipment:bins': ['7', 'Bins'],
      'equipment:piles': ['3', 'Piles'],
      'equipment:flats': ['2', 'Flats'],
      'equipment:tanks': ['6', 'Tanks'],
      'equipment:dryers': ['2', 'Dryers'],
      online: ['16', 'Online'],
      offline: ['4', 'Offline'],
      fans: ['7 of 24', 'Fans running now'],
    });
    expect(strip().dataset.variant).toBe('full');
    expect(hasClass(tile('attention').querySelector('[data-kpi-label]'), 'critical')).toBe(true);
    expect(tile('attention').querySelector(`[data-fid="${FID.kpi.iconAttention}"]`)).not.toBeNull();
    expect(strip().querySelector(`[data-fid="${FID.kpi.iconAllGood}"]`)).toBeNull();
    for (const el of strip().querySelectorAll('[data-kpi-tile^="equipment:"] [data-kpi-value]')) {
      expect(hasClass(el, 'regular')).toBe(true);
    }
    expect(strip().querySelector(`[data-fid="${FID.kpi.statusGroupAllGood}"]`)).toBeNull();
  });

  it('Small: 1 · Need attention · 1 critical; 2 Equipment with Bold 1 Bin, 1 Dryer; 2 / 0 / 2 of 3', async () => {
    await openDashboard('small');
    expect(readings()).toEqual({
      attention: ['1', 'Need attention · 1 critical'],
      equipment: ['2', 'Equipment'],
      'equipment:bins': ['1', 'Bin'],
      'equipment:dryers': ['1', 'Dryer'],
      online: ['2', 'Online'],
      offline: ['0', 'Offline'],
      fans: ['2 of 3', 'Fans running now'],
    });
    expect(strip().dataset.variant).toBe('small');
    expect(hasClass(tile('attention').querySelector('[data-kpi-label]'), 'critical')).toBe(true);
    for (const el of strip().querySelectorAll('[data-kpi-tile^="equipment:"] [data-kpi-value]')) {
      expect(hasClass(el, 'regular')).toBe(false);
    }
  });

  it('All-good: 0 · Need attention · all good with the 20 px green tick and a grey label; 1 Bin Bold; 1 / 0 / 2 of 3', async () => {
    await openDashboard('allgood');
    expect(readings()).toEqual({
      attention: ['0', 'Need attention · all good'],
      equipment: ['1', 'Equipment'],
      'equipment:bins': ['1', 'Bin'],
      online: ['1', 'Online'],
      offline: ['0', 'Offline'],
      fans: ['2 of 3', 'Fans running now'],
    });
    expect(strip().dataset.variant).toBe('allgood');
    const tick = tile('attention').querySelector('img');
    expect(tick.dataset.fid).toBe(FID.kpi.iconAllGood);
    expect([tick.getAttribute('width'), tick.getAttribute('height')]).toEqual(['20', '20']);
    expect(iconSrc('attention')).toBe(kpiTick);
    expect(hasClass(tick.parentElement, 'toneGood')).toBe(true);
    expect(hasClass(tile('attention').querySelector('[data-kpi-label]'), 'critical')).toBe(false);
    expect(strip().querySelector(`[data-fid="${FID.kpi.iconAttention}"]`)).toBeNull();
    for (const el of strip().querySelectorAll('[data-kpi-tile^="equipment:"] [data-kpi-value]')) {
      expect(hasClass(el, 'regular')).toBe(false);
    }
    // Online, Offline and Fans are wrapped in the 766 px group 6916:11719.
    const group = strip().querySelector(`[data-fid="${FID.kpi.statusGroupAllGood}"]`);
    expect([...group.querySelectorAll('[data-kpi-tile]')].map((el) => el.dataset.kpiTile)).toEqual(['online', 'offline', 'fans']);
  });

  it.each(['full', 'small', 'allgood'])('%s: the six exported KPI SVGs as <img alt=""> at their PRD sizes, with icon fids', async (state) => {
    await openDashboard(state);
    const allGood = state === 'allgood';
    const icons = {
      attention: [allGood ? kpiTick : kpiAlert, allGood ? FID.kpi.iconAllGood : FID.kpi.iconAttention, allGood ? '20' : '22'],
      equipment: [kpiEquip, FID.kpi.iconEquipment, '22'],
      online: [kpiOnline, FID.kpi.iconOnline, '22'],
      offline: [kpiOffline, FID.kpi.iconOffline, '22'],
      fans: [kpiFans, FID.kpi.iconFans, '22'],
    };
    expect(new Set(Object.values(icons).map(([src]) => src)).size).toBe(5);
    for (const [key, [src, fid, size]] of Object.entries(icons)) {
      const img = tile(key).querySelector('img');
      expect(img.getAttribute('src')).toBe(src);
      expect(img.dataset.fid).toBe(fid);
      expect([img.getAttribute('width'), img.getAttribute('height'), img.getAttribute('alt')]).toEqual([size, size, '']);
    }
    expect(strip().querySelectorAll('img')).toHaveLength(5);
  });

  it('FID.kpi.strip sits on the strip element inside the slot, once', async () => {
    await openDashboard('full');
    const slot = document.querySelector('[data-section="kpi"]');
    expect(slot.dataset.fid).toBeUndefined();
    expect(document.querySelectorAll(`[data-fid="${CSS.escape(FID.kpi.strip)}"]`)).toHaveLength(1);
    expect(strip().parentElement).toBe(slot);
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: navigation and keyboard (FR-64)                               */
/* ------------------------------------------------------------------------ */

describe('KPI links (FR-64, AD-10)', () => {
  const FULL_LINKS = [
    ['attention', paths.alerts()],
    ['equipment', paths.equipment()],
    ['equipment:bins', paths.equipment({ type: 'bins' })],
    ['equipment:piles', paths.equipment({ type: 'piles' })],
    ['equipment:flats', paths.equipment({ type: 'flats' })],
    ['equipment:tanks', paths.equipment({ type: 'tanks' })],
    ['equipment:dryers', paths.equipment({ type: 'dryers' })],
    ['online', paths.equipment({ status: 'online' })],
    ['offline', paths.equipment({ status: 'offline' })],
    ['fans', paths.equipment()],
  ];

  it('every tile and sub-count block is its own <a>, in visual left-to-right (Tab) order', async () => {
    await openDashboard('full');
    const links = [...strip().querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(FULL_LINKS.map(([, href]) => href));
    // Natural Tab order: no tabindex anywhere, no nested links.
    for (const a of links) {
      expect(a.hasAttribute('tabindex')).toBe(false);
      expect(a.querySelector('a')).toBeNull();
    }
    expect(strip().querySelectorAll('[tabindex]')).toHaveLength(0);
    // The Equipment tile's link is its total block; the sub-counts are siblings.
    expect(tile('equipment').tagName).toBe('DIV');
    expect(tile('equipment').querySelector('[data-kpi-link="equipment"]').getAttribute('href')).toBe(paths.equipment());
  });

  it('Small and All-good sub-counts use the breakdown typeKey (Bin → bins, Dryer → dryers)', async () => {
    await openDashboard('small');
    expect(tile('equipment:bins').getAttribute('href')).toBe(paths.equipment({ type: 'bins' }));
    expect(tile('equipment:dryers').getAttribute('href')).toBe(paths.equipment({ type: 'dryers' }));
    cleanup();
    await openDashboard('allgood');
    expect([...strip().querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
      paths.alerts(),
      paths.equipment(),
      paths.equipment({ type: 'bins' }),
      paths.equipment({ status: 'online' }),
      paths.equipment({ status: 'offline' }),
      paths.equipment(),
    ]);
  });

  it.each(FULL_LINKS)('clicking %s opens %s, which renders the FR-57 placeholder', async (key, href) => {
    await openDashboard('full');
    const link = key === 'equipment' ? tile('equipment').querySelector('a') : tile(key);
    await act(async () => fireEvent.click(link));
    expect(`${window.location.pathname}${window.location.search}`).toBe(href);
    await waitFor(() => expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy());
  });

  it('Enter on a focused tile activates the link (a real <a href>, so the browser follows it)', async () => {
    // jsdom does not synthesise a click from Enter; Chromium does for <a href>
    // (covered by the Fidelity spec). Here: focusable, and click navigates.
    function Where() {
      return <span data-testid="where">{useLocation().pathname + useLocation().search}</span>;
    }
    render(
      <MemoryRouter initialEntries={[paths.dashboard()]}>
        <Routes>
          <Route path="*" element={<><KpiStrip kpi={DOCS.full.kpi} variant="full" /><Where /></>} />
        </Routes>
      </MemoryRouter>,
    );
    const online = tile('online');
    online.focus();
    expect(document.activeElement).toBe(online);
    expect(online.tagName).toBe('A');
    await act(async () => fireEvent.click(online));
    expect(screen.getByTestId('where').textContent).toBe(paths.equipment({ status: 'online' }));
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: loading and error (AD-18)                                     */
/* ------------------------------------------------------------------------ */

describe('KPI loading and error (FR-95, FR-96, AD-18)', () => {
  it('loading: the Story 2.2 placeholder in the white shell at the slot size; no strip yet', async () => {
    let release;
    vi.mocked(getDashboard).mockImplementation(
      (state) => new Promise((resolve) => (release = () => resolve(DOCS[state]))),
    );
    signInAs('demo');
    await renderAt(paths.dashboard('full'));
    const slot = document.querySelector('[data-section="kpi"]');
    expect(slot.dataset.status).toBe('loading');
    expect([slot.style.width, slot.style.height]).toEqual(['1318px', '90px']);
    expect(strip()).toBeNull();
    expect(slot.querySelector('[aria-hidden="true"]')).not.toBeNull();
    await act(async () => release());
    await waitFor(() => expect(slot.dataset.status).toBe('ready'));
    expect([slot.style.width, slot.style.height]).toEqual(['1318px', '90px']);
    expect(strip()).not.toBeNull();
  });

  it('error: Couldn’t load this section. + Retry at 1318×90; Retry reloads through the layout', async () => {
    let fail = true;
    vi.mocked(getDashboard).mockImplementation((state) =>
      fail ? Promise.reject({ code: 'forced', message: 'forced' }) : Promise.resolve(DOCS[state]),
    );
    signInAs('demo');
    await renderAt(paths.dashboard('small'));
    const slot = document.querySelector('[data-section="kpi"]');
    await waitFor(() => expect(slot.dataset.status).toBe('error'));
    expect([slot.style.width, slot.style.height]).toEqual(['1318px', '90px']);
    expect(within(slot).getByText(copy.dashboard.sectionError)).toBeTruthy();
    expect(strip()).toBeNull();
    fail = false;
    await act(async () => fireEvent.click(within(slot).getByRole('button', { name: copy.dashboard.retry })));
    await waitFor(() => expect(slot.dataset.status).toBe('ready'));
    expect(reading('fans')).toEqual(['2 of 3', 'Fans running now']);
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });
});

/* ------------------------------------------------------------------------ */
/* Verbatim readings: nothing formatted or computed (AD-7, FR-94)            */
/* ------------------------------------------------------------------------ */

describe('verbatim readings (AD-7)', () => {
  const renderStrip = (kpi, variant = 'full') =>
    render(
      <MemoryRouter>
        <KpiStrip kpi={kpi} variant={variant} />
      </MemoryRouter>,
    );

  it('renders every value and label as given: no thousands separator, padding, pluralising, summing or trimming', () => {
    const kpi = {
      attention: { value: 1234567, label: '  Need  attention ·  9 critical ', critical: 2, allGood: false },
      equipment: {
        value: 99,
        label: 'Equipment',
        subCountWeight: 700,
        breakdown: [
          { value: 1, label: 'Bins', typeKey: 'bins' },
          { value: 1000, label: 'Tank', typeKey: 'tanks' },
        ],
      },
      online: { value: 0, label: 'Online' },
      offline: { value: 41, label: 'Offline' },
      fans: { value: '07 of 024', running: 3, total: 9, label: 'Fans running now' },
    };
    renderStrip(kpi);
    expect(readings()).toEqual({
      attention: ['1234567', '  Need  attention ·  9 critical '],
      equipment: ['99', 'Equipment'],
      'equipment:bins': ['1', 'Bins'],
      'equipment:tanks': ['1000', 'Tank'],
      online: ['0', 'Online'],
      offline: ['41', 'Offline'],
      fans: ['07 of 024', 'Fans running now'],
    });
  });

  it('keeps the Q-K1 mismatches: Full "7" attention, Offline 4 and 20 Equipment are not derived from other data', async () => {
    const doc = structuredClone(DOCS.full);
    // Change the info / chart fields only: the shown readings must not move.
    doc.kpi.attention.critical = 99;
    doc.kpi.fans.running = 1;
    doc.kpi.fans.total = 2;
    doc.equipmentCard.rows = [];
    vi.mocked(getDashboard).mockResolvedValue(doc);
    await openDashboard('full');
    expect(reading('attention')).toEqual(['7', 'Need attention · 2 critical']);
    expect(reading('equipment')).toEqual(['20', 'Equipment']);
    expect(reading('offline')).toEqual(['4', 'Offline']);
    expect(reading('fans')).toEqual(['7 of 24', 'Fans running now']);
  });

  it('the component source formats nothing: no toLocaleString, Intl, toFixed, Number(), sums or plural rules', () => {
    expect(KPI_SOURCE).not.toMatch(/toLocaleString|Intl\.|toFixed|toPrecision|Number\(|parseInt|parseFloat|\.reduce\(|PluralRules|padStart/);
    expect(KPI_SOURCE).not.toMatch(/\b(?:attention\.critical|fans\.running|fans\.total)\b/);
  });

  it('a missing slice field renders empty, never throws; an unknown typeKey links to /equipment', () => {
    renderStrip({ equipment: { breakdown: [{ value: 3, label: 'Silos', typeKey: 'silos' }] } }, 'nope');
    expect(strip().dataset.variant).toBe('full');
    expect(reading('attention')).toEqual(['', '']);
    expect(tile('equipment:silos').getAttribute('href')).toBe(paths.equipment());
  });
});

/* ------------------------------------------------------------------------ */
/* Source and CSS rules                                                      */
/* ------------------------------------------------------------------------ */

describe('KpiStrip source and CSS (AD-2, AD-4, AD-5, AD-10, AD-13, AD-15, AD-16)', () => {
  const rule = (selector) => {
    const match = KPI_CSS.match(new RegExp(`(?:^|\\n)${selector.replace(/\./g, '\\.')} \\{([^}]*)\\}`));
    if (!match) throw new Error(`no rule ${selector}`);
    return match[1];
  };
  const atRest = KPI_CSS.slice(0, KPI_CSS.indexOf('/* states */'));

  it('no literal text, text attributes, data-fid or "/" URLs in JSX', () => {
    expect(jsxLiterals(KPI_SOURCE)).toEqual([]);
  });

  it('routes only through paths.js; react-router only; no data port, JSON or fetch', () => {
    expect(KPI_SOURCE).toMatch(/from '\.\.\/\.\.\/\.\.\/lib\/paths\.js'/);
    expect(KPI_SOURCE).not.toMatch(/react-router-dom|data\/api|\.json|fetch\(|features\/(?!dashboard)/);
    expect(KPI_SOURCE).not.toMatch(/['"`]\/(alerts|equipment)/);
  });

  it('icons are the six exported KPI SVGs, imported unmodified', () => {
    for (const name of ['kpi_alert', 'kpi_tick', 'kpi_equip', 'kpi_online', 'kpi_offline', 'kpi_fans']) {
      expect(KPI_SOURCE).toContain(`assets/icons/${name}.svg'`);
    }
  });

  it('strip: radius 12, KPI box-shadow, padding-y 6; container padding-y 4, flex-start; justify center (Full, Small), gap 20 (All-good)', () => {
    for (const decl of ['padding: 6px 0;', 'border-radius: 12px;', 'background: var(--primitives-color-base-white);', 'box-shadow: var(--shadow-kpi);']) {
      expect(rule('.strip')).toContain(decl);
    }
    for (const decl of ['display: flex;', 'align-items: flex-start;', 'padding: 4px 0;']) expect(rule('.container')).toContain(decl);
    expect(KPI_CSS).toMatch(/\.full,\n\.small \{\n {2}justify-content: center;/);
    expect(rule('.allgood')).toContain('gap: 20px;');
  });

  it('tiles: padding 12/20, gap 14, #E6E8EB divider on all but the first; per-state widths', () => {
    for (const decl of ['display: flex;', 'align-items: center;', 'gap: 14px;', 'padding: 12px 20px;', 'cursor: pointer;']) {
      expect(rule('.tile')).toContain(decl);
    }
    expect(KPI_CSS).toMatch(/\.equipment,\n\.online,\n\.offline,\n\.fans \{\n {2}border-left: 1px solid var\(--raw-e6e8eb\);/);
    expect(rule('.attention')).toContain('width: 264px;');
    expect(rule('.full .equipment')).toContain('width: 500px;');
    expect(KPI_CSS).toMatch(/\.full \.online,\n\.full \.offline \{\n {2}flex: none;\n {2}width: 173px;/);
    expect(rule('.equipment')).toContain('gap: 20px;');
    expect(rule('.equipmentTotal')).toContain('width: 147px;');
    expect(rule('.sub')).toContain('width: 40px;');
    expect(rule('.subWide')).toContain('width: 50px;');
    expect(rule('.group')).toContain('gap: 20px;');
  });

  it('icon tile 44×44 radius 12 in a 44×46 wrapper (padding-top 2); per-tile colours', () => {
    for (const decl of ['width: 44px;', 'height: 46px;', 'padding-top: 2px;']) expect(rule('.iconWrap')).toContain(decl);
    for (const decl of ['width: 44px;', 'height: 44px;', 'border-radius: 12px;']) expect(rule('.iconTile')).toContain(decl);
    expect(rule('.toneAlert')).toContain('var(--raw-fdecec)');
    expect(KPI_CSS).toMatch(/\.toneGood,\n\.toneOnline \{\n {2}background: var\(--raw-eaf8ef\);/);
    expect(rule('.toneEquip')).toContain('var(--raw-ede9fe)');
    expect(rule('.toneOffline')).toContain('var(--raw-f4f5f6)');
    expect(rule('.toneFans')).toContain('var(--raw-eff6ff)');
  });

  it('type: number Roboto 700 22/25.3 #111827; label 400 13.5/normal #4B5563; critical 700 #C62828; Full sub-counts 400', () => {
    for (const decl of ['font-family: var(--font-stack-roboto);', 'font-weight: 700;', 'font-size: 22px;', 'line-height: 25.3px;', 'color: var(--raw-111827);']) {
      expect(rule('.value')).toContain(decl);
    }
    for (const decl of ['font-family: var(--font-stack-roboto);', 'font-weight: 400;', 'font-size: 13.5px;', 'line-height: normal;', 'color: var(--raw-4b5563);']) {
      expect(rule('.label')).toContain(decl);
    }
    expect(rule('.critical')).toContain('font-weight: 700;');
    expect(rule('.critical')).toContain('color: var(--raw-c62828);');
    expect(rule('.regular')).toContain('font-weight: 400;');
    expect(rule('.text')).toContain('gap: 2px;');
  });

  it('focus ring only under /* states */ (AD-13); no responsive sizing or animation (AD-4)', () => {
    expect(atRest).not.toMatch(/:hover|:focus/);
    expect(KPI_CSS.slice(KPI_CSS.indexOf('/* states */'))).toMatch(/:focus-visible \{\n {2}outline: var\(--border-width-md\) solid var\(--raw-006a36\);\n {2}outline-offset: 2px;/);
    const css = KPI_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/@media|\dvw|\dvh|clamp\(|animation|transition|\d%|:hover/);
  });
});
