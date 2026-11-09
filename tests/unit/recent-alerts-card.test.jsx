// Story 2.5 — Recent Alerts card: every I/O-matrix row except Fidelity
// (FR-73 to FR-77, AD-5, AD-7, AD-10, AD-14, AD-15, AD-16, AD-18), plus a
// check that no value is formatted or computed.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import App from '../../src/app/App.jsx';
import { getConfig, getDashboard, getUsers } from '../../src/data/api.js';
import RecentAlertsCard from '../../src/features/dashboard/alerts/RecentAlertsCard.jsx';
import cardStyles from '../../src/features/dashboard/alerts/RecentAlertsCard.module.css';
import { ALERT_ROWS, MAX_ALERT_ROWS, alertItems, hasAlertContent } from '../../src/features/dashboard/alerts/alertItems.js';
import alertCrit from '../../src/assets/icons/alert_crit.svg';
import alertWarn from '../../src/assets/icons/alert_warn.svg';
import arrowRight from '../../src/assets/icons/arrow_right.svg';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
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
const SOURCE = readText(fromRoot('src/features/dashboard/alerts/RecentAlertsCard.jsx'));
const ITEMS_SOURCE = readText(fromRoot('src/features/dashboard/alerts/alertItems.js'));
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

function Where() {
  const location = useLocation();
  return <span data-testid="where">{location.pathname + location.search}</span>;
}

/** The card alone, inside a router that reports where a link went. */
const renderCard = (data, variant = 'full') =>
  render(
    <MemoryRouter initialEntries={[paths.dashboard()]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <RecentAlertsCard data={data} variant={variant} />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

const slot = () => {
  const el = document.querySelector('[data-section="recentAlerts"]');
  if (!el) throw new Error('the Recent Alerts section [data-section="recentAlerts"] is not rendered');
  return el;
};
const rows = () => [...document.querySelectorAll('[data-alert-row]')];
const part = (row, name) => {
  const el = row.querySelector(`[data-alert-part="${name}"]`);
  if (!el) throw new Error(`row ${row.dataset.alertRow} has no [data-alert-part="${name}"]`);
  return el;
};
const rowLink = (row) => row.querySelector('[data-alert-link="row"]');
const actionLink = (row) => row.querySelector('[data-alert-link="action"]');
/** Title, meta, severity, time and the Action label (null when no Action is drawn). */
const rowText = (row) => [
  ...['title', 'meta', 'severity', 'time'].map((name) => part(row, name).textContent),
  row.querySelector('[data-alert-part="action-label"]')?.textContent ?? null,
];
const hasSeparator = (row) => row.querySelector('[data-alert-part="separator"]') !== null;
const iconOf = (row) => row.querySelector('[data-alert-part="icon"] img');
const where = () => screen.getByTestId('where').textContent;
const alert = (fields) => ({
  id: 'x1',
  title: 'HotSpot Detected',
  deviceId: '759',
  location: 'Wheat Storage',
  severity: 'Critical',
  time: '30 mins ago',
  action: 'View Hotspot',
  actionKey: 'hotspot',
  ...fields,
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: Full, Small, All-good                                         */
/* ------------------------------------------------------------------------ */

describe('Recent Alerts per Dashboard state (FR-73 to FR-77, FR-94)', () => {
  it('Full: header + View All; four rows in file order with severity, time and Action verbatim (typo kept)', async () => {
    await openDashboard('full');
    const card = within(slot());
    expect(card.getByRole('heading', { level: 2 }).textContent).toBe('Recent Alerts');
    expect(card.getByText('Most urgent first. Each item links to what to do next.').tagName).toBe('P');
    expect(card.getAllByRole('link')[0].textContent).toBe('View All');
    expect(rows().map((row) => row.dataset.alertRow)).toEqual(['a1', 'a2', 'a3', 'a4']);
    expect(rows().map(rowText)).toEqual([
      ['HotSpot Detected', '759 | Wheat Storage', 'Critical', '30 mins ago', 'View Hotspot'],
      ['Static Pressure', '757 | Oat Silo', 'Critical', '2 hours ago', 'Check Fans'],
      ['No Communication', '18086 | Pinto Storage', 'Warning', '3 hours ago', 'Check Connection'],
      ['Missing Fan Switched', '753 | Canola East', 'Warning', '1 day ago', 'Check Fan Switches'],
    ]);
    // FR-76: rows 1–3 have the separator, the last of 2+ rows has none.
    expect(rows().map(hasSeparator)).toEqual([true, true, true, false]);
    expect(document.querySelector('[data-alert-empty]')).toBeNull();
  });

  it('severity selects the icon: Critical → alert_crit.svg 15×15, Warning → alert_warn.svg (14 in HTML, 13.846 in CSS) (AD-5, AD-15)', async () => {
    await openDashboard('full');
    expect(
      rows().map((row) => {
        const img = iconOf(row);
        return [img.getAttribute('src'), img.getAttribute('width'), img.getAttribute('height'), img.getAttribute('alt'), img.dataset.fid];
      }),
    ).toEqual([
      [alertCrit, '15', '15', '', FID.recentAlerts.criticalGlyph],
      [alertCrit, '15', '15', '', FID.recentAlerts.criticalGlyph],
      [alertWarn, '14', '14', '', FID.recentAlerts.warningGlyph],
      [alertWarn, '14', '14', '', FID.recentAlerts.warningGlyph],
    ]);
    for (const row of rows()) {
      const arrow = actionLink(row).querySelector('img');
      expect([arrow.getAttribute('src'), arrow.getAttribute('width'), arrow.getAttribute('height'), arrow.getAttribute('alt')]).toEqual([
        arrowRight,
        '16',
        '16',
        '',
      ]);
      expect(arrow.dataset.fid).toBe(FID.recentAlerts.actionArrow);
    }
    // HTML width/height are integers (the exact 13.846 px is CSS).
    for (const img of slot().querySelectorAll('img')) {
      for (const name of ['width', 'height']) expect(img.getAttribute(name)).toMatch(/^\d+$/);
    }
  });

  it('Small: only the HotSpot Detected · 759 | Wheat Storage row, keeping its separator', async () => {
    await openDashboard('small');
    expect(rows().map(rowText)).toEqual([['HotSpot Detected', '759 | Wheat Storage', 'Critical', '30 mins ago', 'View Hotspot']]);
    expect(rows().map(hasSeparator)).toEqual([true]);
  });

  it('All-good: the FR-77 Empty state (U+2019 kept); the header and View All remain; no rows', async () => {
    await openDashboard('allgood');
    const empty = slot().querySelector('[data-alert-empty]');
    expect(empty.dataset.fid).toBe(FID.recentAlerts.empty);
    expect(within(empty).getByRole('heading', { level: 3 }).textContent).toBe('No Alerts Right Now');
    expect(part(empty, 'empty-body').textContent).toBe(
      'Everything is on track with your storage, dryers, and tanks. We’ll notify you as soon as anything needs attention.',
    );
    expect(rows()).toHaveLength(0);
    expect(within(slot()).getByRole('heading', { level: 2 }).textContent).toBe('Recent Alerts');
    expect(within(slot()).getAllByRole('link').map((a) => a.textContent)).toEqual(['View All']);
  });

  it.each(['full', 'small', 'allgood'])('%s: the card holds only the header and the rows or Empty state, verbatim from the document', async (state) => {
    await openDashboard(state);
    const card = DOCS[state].recentAlerts;
    const meta = (item) => `${item.deviceId} | ${item.location}`;
    expect(slot().textContent).toBe(
      [
        card.title,
        card.subtitle,
        card.link,
        ...card.items.flatMap((item) => [item.title, meta(item), item.severity, item.time, item.action]),
        ...(card.empty ? [card.empty.title, card.empty.body] : []),
      ].join(''),
    );
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: navigation (FR-75, FR-76, AD-10)                              */
/* ------------------------------------------------------------------------ */

describe('Recent Alerts links (FR-75, FR-76, AD-10)', () => {
  it('View All, then each row link and its Action link, in Tab order; sibling <a>s, never nested; no tabindex', async () => {
    await openDashboard('full');
    const links = [...slot().querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      paths.alerts(),
      ...DOCS.full.recentAlerts.items.flatMap((item) => [paths.equipmentDetail(item.deviceId), paths.alertAction(item.deviceId, item.actionKey)]),
    ]);
    for (const row of rows()) {
      expect(rowLink(row).parentElement).toBe(row);
      expect(actionLink(row).parentElement).toBe(row);
      expect(rowLink(row).nextElementSibling).toBe(actionLink(row));
    }
    for (const a of links) {
      expect(a.querySelector('a')).toBeNull();
      expect(a.hasAttribute('tabindex')).toBe(false);
    }
    expect(slot().querySelectorAll('[tabindex]')).toHaveLength(0);
  });

  it('every link has a usable accessible name: the row by its own texts, the Action by its label', async () => {
    await openDashboard('full');
    const card = within(slot());
    expect(card.getByRole('link', { name: 'HotSpot Detected 759 | Wheat Storage Critical 30 mins ago' })).toBe(rowLink(rows()[0]));
    expect(card.getByRole('link', { name: 'View Hotspot' })).toBe(actionLink(rows()[0]));
    expect(card.getByRole('link', { name: 'Missing Fan Switched 753 | Canola East Warning 1 day ago' })).toBe(rowLink(rows()[3]));
    expect(card.getByRole('link', { name: 'Check Fan Switches' })).toBe(actionLink(rows()[3]));
  });

  it('clicking View Hotspot opens /equipment/759/hotspot (placeholder), not the row target', async () => {
    await openDashboard('full');
    await act(async () => fireEvent.click(within(slot()).getByRole('link', { name: 'View Hotspot' })));
    expect(window.location.pathname).toBe('/equipment/759/hotspot');
    expect(window.location.pathname).toBe(paths.alertAction('759', 'hotspot'));
    await waitFor(() => expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy());
  });

  it('clicking the row outside the Action link (title, time, icon) opens /equipment/759 (placeholder)', async () => {
    for (const name of ['title', 'time', 'icon']) {
      await openDashboard('full');
      await act(async () => fireEvent.click(part(rows()[0], name)));
      expect(window.location.pathname, name).toBe('/equipment/759');
      await waitFor(() => expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy());
      cleanup();
    }
  });

  it.each(DOCS.full.recentAlerts.items.map((item) => [item.action, item]))('the %s Action link opens its alertAction target', async (_, item) => {
    renderCard(DOCS.full.recentAlerts);
    const row = document.querySelector(`[data-alert-row="${item.id}"]`);
    await act(async () => fireEvent.click(part(row, 'action-label')));
    expect(where()).toBe(paths.alertAction(item.deviceId, item.actionKey));
    await act(async () => fireEvent.click(part(row, 'meta')));
    expect(where()).toBe(paths.equipmentDetail(item.deviceId));
  });

  it('clicking View All opens /alerts (placeholder)', async () => {
    await openDashboard('allgood');
    await act(async () => fireEvent.click(within(slot()).getByRole('link', { name: 'View All' })));
    expect(window.location.pathname).toBe(paths.alerts());
    await waitFor(() => expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy());
  });

  it('both links are focusable (Enter activation is covered by the Fidelity spec)', () => {
    renderCard(DOCS.small.recentAlerts);
    for (const link of [rowLink(rows()[0]), actionLink(rows()[0])]) {
      link.focus();
      expect(document.activeElement).toBe(link);
    }
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: loading and error (AD-18)                                     */
/* ------------------------------------------------------------------------ */

describe('Recent Alerts loading and error (FR-95, FR-96, AD-18)', () => {
  it('loading: the Story 2.2 placeholder at the card size; no rows yet; same size when ready', async () => {
    let release;
    vi.mocked(getDashboard).mockImplementation((state) => new Promise((resolve) => (release = () => resolve(DOCS[state]))));
    signInAs('demo');
    await renderAt(paths.dashboard('full'));
    expect(slot().dataset.status).toBe('loading');
    expect([slot().style.width, slot().style.height]).toEqual(['649px', '444px']);
    expect(rows()).toHaveLength(0);
    expect(slot().querySelector('[aria-hidden="true"]')).not.toBeNull();
    await act(async () => release());
    await waitFor(() => expect(slot().dataset.status).toBe('ready'));
    expect([slot().style.width, slot().style.height]).toEqual(['649px', '444px']);
    expect(rows()).toHaveLength(4);
  });

  it('error (rejected load, as ?__fail=dashboard): Couldn’t load this section. + Retry at the card size; Retry reloads through the layout', async () => {
    let fail = true;
    vi.mocked(getDashboard).mockImplementation((state) =>
      fail ? Promise.reject({ code: 'FORCED_FAIL', message: 'forced' }) : Promise.resolve(DOCS[state]),
    );
    await openDashboard('allgood', 'error');
    expect([slot().style.width, slot().style.height]).toEqual(['649px', '240px']);
    expect(within(slot()).getByText(copy.dashboard.sectionError)).toBeTruthy();
    expect(slot().querySelector('[data-alert-empty]')).toBeNull();
    fail = false;
    await act(async () => fireEvent.click(within(slot()).getByRole('button', { name: copy.dashboard.retry })));
    await waitFor(() => expect(slot().dataset.status).toBe('ready'));
    expect(slot().querySelector('[data-alert-empty]')).not.toBeNull();
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['no items array', { title: 'Recent Alerts', subtitle: 's', link: 'View All', empty: null }],
    ['items not an array', { ...DOCS.full.recentAlerts, items: { 0: DOCS.full.recentAlerts.items[0] } }],
    ['only unusable items', { ...DOCS.full.recentAlerts, items: [null, 'a1', { title: 'No id' }] }],
    ['a string slice', 'recentAlerts'],
  ])('ready with %s → the section shows the Story 2.2 error state, not a blank card', async (_name, slice) => {
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS.full, recentAlerts: slice });
    signInAs('demo');
    await renderAt(paths.dashboard('full'));
    await waitFor(() => expect(document.querySelector('[data-section="kpi"]').dataset.status).toBe('ready'));
    expect(slot().dataset.status).toBe('error');
    expect(within(slot()).getByText(copy.dashboard.sectionError)).toBeTruthy();
    expect(within(slot()).getByRole('button', { name: copy.dashboard.retry })).toBeTruthy();
    expect(rows()).toHaveLength(0);
    expect(document.querySelector('[data-section="equipmentCard"]').dataset.status).toBe('ready');
  });

  it('ready with an empty items array → the FR-77 Empty state (not the error), even in the Full layout', async () => {
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS.full, recentAlerts: DOCS.allgood.recentAlerts });
    await openDashboard('full');
    expect(slot().querySelector('[data-alert-empty]')).not.toBeNull();
  });

  it('the shared rule: hasAlertContent / alertItems agree with what the card draws', () => {
    expect(hasAlertContent({ items: [], empty: { title: 'No Alerts Right Now', body: null } })).toBe(true);
    expect(hasAlertContent({ items: [], empty: { title: '  ', body: 'Body' } })).toBe(true);
    expect(hasAlertContent({ items: [alert()] })).toBe(true);
    for (const bad of [
      null,
      undefined,
      [],
      'x',
      7,
      {},
      { items: null },
      { items: {} },
      { items: [null, 1, {}] },
      { items: [] },
      { items: [], empty: null },
      { items: [], empty: { title: ' ', body: '' } },
      { items: [], empty: { title: {}, body: [] } },
    ]) {
      expect(hasAlertContent(bad), JSON.stringify(bad)).toBe(false);
      expect(alertItems(bad)).toEqual([]);
    }
    expect(MAX_ALERT_ROWS).toBe(4);
    expect(ALERT_ROWS).toEqual({ full: 4, small: 1, allgood: 1 });
  });

  it('ready with an empty items array but no usable Empty-state title or body → the section error, never a blank block', async () => {
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS.allgood, recentAlerts: { ...DOCS.allgood.recentAlerts, empty: { title: ' ', body: null } } });
    await openDashboard('allgood', 'error');
    expect(within(slot()).getByText(copy.dashboard.sectionError)).toBeTruthy();
    expect(slot().querySelector('[data-alert-empty]')).toBeNull();
  });

  it.each([
    ['small', 1],
    ['allgood', 1],
    ['full', 4],
  ])('%s with four items renders exactly %i row(s): rows the frame cannot show (and their links) are never rendered', async (state, count) => {
    vi.mocked(getDashboard).mockResolvedValue({ ...DOCS[state], recentAlerts: DOCS.full.recentAlerts });
    await openDashboard(state);
    expect(rows().map((row) => row.dataset.alertRow)).toEqual(['a1', 'a2', 'a3', 'a4'].slice(0, count));
    // View All plus the row link and Action link of each rendered row; nothing else is focusable.
    expect(slot().querySelectorAll('a')).toHaveLength(1 + 2 * count);
    expect(rows().map(hasSeparator)).toEqual(count === 1 ? [true] : [true, true, true, false]);
  });

  it('an unknown variant falls back to Full (4 rows)', () => {
    for (const variant of ['nope', undefined, '__proto__', 'toString']) {
      const { unmount } = renderCard(DOCS.full.recentAlerts, variant);
      expect(rows()).toHaveLength(4);
      unmount();
    }
  });
});

/* ------------------------------------------------------------------------ */
/* I/O matrix: bad data; verbatim readings (AD-7, FR-94)                     */
/* ------------------------------------------------------------------------ */

describe('bad data and verbatim readings (AD-7, AD-14)', () => {
  it('more than 4 items → the first 4 in file order; a duplicate id keeps the first; items without a string id are skipped', () => {
    renderCard({
      items: [
        null,
        'a0',
        [1],
        alert({ id: 'a1', title: 'One' }),
        alert({ id: 'a1', title: 'One again' }),
        alert({ id: '', title: 'Empty id' }),
        alert({ id: 7, title: 'Numeric id' }),
        alert({ id: 'a2', title: 'Two' }),
        alert({ id: 'a3', title: 'Three' }),
        alert({ id: 'a4', title: 'Four' }),
        alert({ id: 'a5', title: 'Five' }),
      ],
    });
    expect(rows().map((row) => [row.dataset.alertRow, part(row, 'title').textContent])).toEqual([
      ['a1', 'One'],
      ['a2', 'Two'],
      ['a3', 'Three'],
      ['a4', 'Four'],
    ]);
    expect(rows().map(hasSeparator)).toEqual([true, true, true, false]);
  });

  it('an unknown severity renders no icon and no severity colour class; the text is verbatim; never crashes', () => {
    const toneClasses = [cardStyles.criticalText, cardStyles.warningText, cardStyles.critical, cardStyles.warning];
    expect(toneClasses.every((name) => typeof name === 'string' && name !== '')).toBe(true);
    for (const severity of ['Info', 'critical', '__proto__', 'toString', 7, null]) {
      renderCard({ items: [alert({ id: 'u', severity })] });
      const [row] = rows();
      expect(iconOf(row), String(severity)).toBeNull();
      expect(row.querySelector('[data-alert-part="icon"]')).toBeNull();
      for (const name of toneClasses) expect(row.querySelector(`.${CSS.escape(name)}`), `${severity}: ${name}`).toBeNull();
      expect(part(row, 'severity').textContent).toBe(severity === null ? '' : String(severity));
      expect(rowLink(row)).not.toBeNull();
      cleanup();
    }
    // The known severities do carry them.
    renderCard({ items: [alert({ id: 'c' }), alert({ id: 'w', severity: 'Warning' })] });
    const [c, w] = rows();
    expect(part(c, 'severity').classList.contains(cardStyles.criticalText)).toBe(true);
    expect(part(w, 'severity').classList.contains(cardStyles.warningText)).toBe(true);
  });

  it('a missing or unusable deviceId → the row is drawn but not a link, and no Action is drawn at all', () => {
    renderCard({
      items: [
        alert({ id: 'none', deviceId: undefined }),
        alert({ id: 'blank', deviceId: '  ' }),
        alert({ id: 'dot', deviceId: '..' }),
        alert({ id: 'obj', deviceId: { id: 759 } }),
      ],
    });
    for (const row of rows()) {
      expect(rowLink(row), row.dataset.alertRow).toBeNull();
      expect(actionLink(row), row.dataset.alertRow).toBeNull();
      expect(row.querySelector('[data-alert-part="action-label"]')).toBeNull();
      expect(row.querySelectorAll(`[data-fid="${FID.recentAlerts.actionArrow}"]`)).toHaveLength(0);
    }
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('a numeric deviceId is used as its String(): the meta line and both links work', async () => {
    renderCard({ items: [alert({ id: 'num', deviceId: 759 })] });
    const [row] = rows();
    expect(part(row, 'meta').textContent).toBe('759 | Wheat Storage');
    expect(rowLink(row).getAttribute('href')).toBe(paths.equipmentDetail('759'));
    expect(actionLink(row).getAttribute('href')).toBe(paths.alertAction('759', 'hotspot'));
    await act(async () => fireEvent.click(part(row, 'action-label')));
    expect(where()).toBe(paths.alertAction('759', 'hotspot'));
  });

  it('an unknown actionKey or an empty Action label → no Action at all (no label, no lone arrow); the row is still a link', () => {
    renderCard({
      items: [
        alert({ id: 'k', actionKey: 'reboot' }),
        alert({ id: 'e', action: '  ' }),
        alert({ id: 'o', action: { x: 1 } }),
        alert({ id: 'n', actionKey: undefined }),
      ],
    });
    for (const row of rows()) {
      expect(actionLink(row)).toBeNull();
      expect(row.querySelector('[data-alert-part="action-label"]')).toBeNull();
      expect(row.querySelectorAll(`[data-fid="${FID.recentAlerts.actionArrow}"]`)).toHaveLength(0);
      expect(rowLink(row).getAttribute('href')).toBe(paths.equipmentDetail('759'));
    }
  });

  it('each Action link is described by its row title (aria-describedby), so duplicate Action names keep context', () => {
    renderCard({ items: [alert({ id: 'a', title: 'Static Pressure', action: 'Check Fans' }), alert({ id: 'b', title: 'Fan Stalled', action: 'Check Fans' })] });
    for (const row of rows()) {
      const describedBy = actionLink(row).getAttribute('aria-describedby');
      expect(describedBy).toBe(part(row, 'title').id);
      expect(document.getElementById(describedBy)).toBe(part(row, 'title'));
    }
    cleanup();
    renderCard({ items: [alert({ id: 'blank', title: '   ' })] });
    expect(actionLink(rows()[0]).hasAttribute('aria-describedby')).toBe(false);
  });

  it('list semantics: the rows are a role="list" of role="listitem" row containers', async () => {
    await openDashboard('full');
    const list = within(slot()).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toEqual(rows());
  });

  it('the row link is named only by its visible texts (aria-labelledby); blank or unshown readings add nothing', () => {
    renderCard({
      items: [
        alert({ id: 'mute', title: null, location: [], severity: {}, time: Number.NaN }),
        alert({ id: 'title', location: null, severity: null, time: null }),
        alert({ id: 'space', title: '   ', severity: ' ', time: '\t' }),
      ],
    });
    const [mute, titled, space] = rows();
    // The deviceId alone still shows in the meta line, so it names the row.
    expect(part(mute, 'meta').textContent).toBe('759');
    expect(within(mute).getByRole('link', { name: '759' })).toBe(rowLink(mute));
    expect(within(titled).getByRole('link', { name: 'HotSpot Detected 759' })).toBe(rowLink(titled));
    // Whitespace-only texts are not referenced.
    expect(rowLink(space).getAttribute('aria-labelledby')).toBe(part(space, 'meta').id);
    for (const link of screen.getAllByRole('link')) {
      for (const id of (link.getAttribute('aria-labelledby') ?? '').split(' ').filter(Boolean)) {
        expect(document.getElementById(id)?.textContent.trim()).toBeTruthy();
      }
    }
  });

  it('object, array, boolean, null and NaN readings render nothing (no crash, no "NaN", no "[object Object]")', () => {
    renderCard({
      items: [
        alert({ id: 'b', title: { t: 1 }, location: true, severity: ['Critical'], time: Infinity, action: null }),
        alert({ id: 'n', title: 42, time: 0 }),
      ],
    });
    const [bad, numeric] = rows();
    expect(rowText(bad)).toEqual(['', '759', '', '', null]);
    expect(rowText(numeric)).toEqual(['42', '759 | Wheat Storage', 'Critical', '0', 'View Hotspot']);
    expect(document.body.textContent).not.toMatch(/NaN|Infinity|\[object Object\]|undefined|true/);
    expect(document.body.innerHTML).not.toMatch(/NaN|\[object Object\]|undefined/);
  });

  it('renders every reading verbatim: no trimming, re-casing, pluralising, re-sorting or time refresh (Q-A2, Q-A3)', () => {
    vi.useFakeTimers();
    try {
      renderCard({
        items: [
          alert({ id: 'w', severity: 'Warning', title: '  Missing Fan Switched ', deviceId: '18086', location: 'Pinto  Storage', time: '1 mins ago' }),
          alert({ id: 'c', severity: 'Critical', title: 'later critical', time: '0 hours ago' }),
        ],
      });
      act(() => vi.advanceTimersByTime(5 * 60 * 1000));
      expect(rows().map(rowText)).toEqual([
        ['  Missing Fan Switched ', '18086 | Pinto  Storage', 'Warning', '1 mins ago', 'View Hotspot'],
        ['later critical', '759 | Wheat Storage', 'Critical', '0 hours ago', 'View Hotspot'],
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a Dryer alert renders as an ordinary Alert row (AD-14)', () => {
    renderCard({ items: [alert({ id: 'd', title: 'Dryer Fault', location: 'B Dryer', actionKey: 'fans', action: 'Check Fans' })] });
    expect(rowText(rows()[0])).toEqual(['Dryer Fault', '759 | B Dryer', 'Critical', '30 mins ago', 'Check Fans']);
    expect(actionLink(rows()[0]).getAttribute('href')).toBe(paths.alertAction('759', 'fans'));
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'items'],
    ['no items', { title: 'Recent Alerts' }],
  ])('data %s → an empty list, no crash', (_name, data) => {
    renderCard(data);
    expect(document.querySelector('[data-alert-list]')).not.toBeNull();
    expect(rows()).toHaveLength(0);
  });

  it('the Empty state draws only the shown parts: never an empty <h3> or <p>; nothing at all without copy', () => {
    renderCard({ items: [], empty: { title: 7, body: { x: 1 } } });
    let empty = document.querySelector('[data-alert-empty]');
    expect(part(empty, 'empty-title').textContent).toBe('7');
    expect(empty.querySelector('p')).toBeNull();
    cleanup();
    renderCard({ items: [], empty: { title: '  ', body: 'Body only' } });
    empty = document.querySelector('[data-alert-empty]');
    expect(empty.querySelector('h3')).toBeNull();
    expect(part(empty, 'empty-body').textContent).toBe('Body only');
    cleanup();
    for (const emptyValue of [null, undefined, { title: '', body: ' ' }, 'No Alerts']) {
      renderCard({ items: [], empty: emptyValue });
      expect(document.querySelector('[data-alert-empty]')).toBeNull();
      expect(document.querySelector('h3, p')).toBeNull();
      cleanup();
    }
  });

  it('keys are stable (the item id): re-rendering reuses each row element, also when the order changes', () => {
    const items = DOCS.full.recentAlerts.items;
    const tree = (list) => (
      <MemoryRouter>
        <RecentAlertsCard data={{ items: list }} />
      </MemoryRouter>
    );
    const { rerender } = render(tree(items));
    const before = rows();
    rerender(tree(items.map((item) => ({ ...item }))));
    rows().forEach((row, i) => expect(row).toBe(before[i]));
    rerender(tree([items[1], items[0], items[2], items[3]]));
    expect(rows()[0]).toBe(before[1]);
    expect(rows()[1]).toBe(before[0]);
  });

  it('the component sources format nothing: no toLocaleString, Intl, toFixed, Number(), sums, plural rules or timers', () => {
    for (const source of [SOURCE, ITEMS_SOURCE]) {
      expect(source).not.toMatch(
        /toLocaleString|Intl\.|toFixed|toPrecision|Number\(|parseInt|parseFloat|\.reduce\(|PluralRules|padStart|Math\.|Date|setInterval|setTimeout|\.sort\(|toUpperCase|toLowerCase/,
      );
    }
  });

  it('no literal text, text attributes, inline data-fid or "/" URLs in the JSX (AD-15, AD-16)', () => {
    expect(jsxLiterals(SOURCE)).toEqual([]);
  });
});
