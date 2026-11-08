// Story 2.1 — signed-in app shell and Header: every I/O-matrix row except
// Fidelity (FR-50–FR-58, AD-11, AD-12, AD-14, AD-17).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router';
import App from '../../src/app/App.jsx';
import { getConfig, getDashboard, getUsers } from '../../src/data/api.js';
import Header from '../../src/features/shell/Header.jsx';
import { copy } from '../../src/lib/copy.js';
import { DEFAULT_DASHBOARD_STATE, resolveDashboardState } from '../../src/lib/dashboardState.js';
import { FID } from '../../src/lib/fid.js';
import { paths, tabForPath, tabHref } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord, getSession } from '../../src/lib/session.js';
import OverlayProvider from '../../src/ui/overlay/OverlayProvider.jsx';
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
const s = copy.shell;
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

afterEach(() => {
  try {
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
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

const fid = (id) => document.querySelector(`[data-fid="${CSS.escape(id)}"]`);
const header = () => screen.getByRole('banner');
const tab = (name) => within(header()).getByRole('link', { name });
const avatar = () => screen.getByRole('button', { name: s.avatarLabel });
const pageTitle = () => screen.getByRole('heading', { level: 1 });
const badgeText = () => fid(FID.shell.badgeText)?.textContent ?? null;
const menu = () => screen.queryByRole('dialog', { name: s.profileMenuTitle });

async function openMenu() {
  await act(async () => fireEvent.click(avatar()));
  return screen.getByRole('dialog', { name: s.profileMenuTitle });
}

describe('signed in: /dashboard (FR-50–FR-55)', () => {
  it('renders the Header and the title strip, Dashboard tab active, badge 2, empty content area', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    expect(header().getAttribute('data-fid')).toBe(FID.shell.header);
    expect(fid(FID.shell.logo).getAttribute('alt')).toBe(copy.brand.logoAlt);
    expect(within(header()).getAllByRole('link').map((link) => link.textContent)).toEqual([
      s.tabs.dashboard,
      s.tabs.equipment,
      s.tabs.alerts,
    ]);
    expect(tab(s.tabs.dashboard).getAttribute('aria-current')).toBe('page');
    expect(tab(s.tabs.equipment).hasAttribute('aria-current')).toBe(false);
    expect(tab(s.tabs.alerts).hasAttribute('aria-current')).toBe(false);
    expect(tab(s.tabs.dashboard).getAttribute('href')).toBe(paths.dashboard());
    expect(tab(s.tabs.equipment).getAttribute('href')).toBe(paths.equipment());
    expect(tab(s.tabs.alerts).getAttribute('href')).toBe(paths.alerts());
    expect(pageTitle().textContent).toBe(s.pageTitles.dashboard);
    expect(fid(FID.shell.pageTitle)).not.toBeNull();
    await waitFor(() => expect(badgeText()).toBe('2'));
    expect(screen.getByRole('button', { name: s.bellLabel })).toBeTruthy();
    expect(avatar().getAttribute('aria-expanded')).toBe('false');
    // Empty content area until Story 2.2: no placeholder, no cards.
    expect(screen.queryByText(copy.placeholder.comingSoon)).toBeNull();
    expect(screen.getByRole('main').childElementCount).toBe(0);
    // Hidden Figma layers are never rendered (FR-51).
    expect(document.body.textContent).not.toMatch(/Farm Test/);
  });

  it.each([
    ['full', paths.dashboard('full'), 'demo'],
    ['small', paths.dashboard('small'), 'demo'],
    ['allgood', paths.dashboard(), 'allgood'],
    ['small', `${paths.dashboard()}?state=bogus`, 'small'],
    ['full', `${paths.dashboard()}?state=SMALL`, 'demo'],
  ])('loads the %s state document for %s (signed in as %s) and shows its bellBadge verbatim', async (state, url, name) => {
    signInAs(name);
    await renderAt(url);
    await waitFor(() => expect(badgeText()).toBe(String(DOCS[state].header.bellBadge)));
    expect(getDashboard).toHaveBeenLastCalledWith(state);
  });

  it('a failed state document hides the badge; the Header stays usable', async () => {
    vi.mocked(getDashboard).mockRejectedValue({ code: 'FORCED_FAIL', message: 'x' });
    signInAs('demo');
    await renderAt(paths.dashboard());
    await waitFor(() => expect(getDashboard).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(fid(FID.shell.badge)).toBeNull();
    await act(async () => fireEvent.click(tab(s.tabs.alerts)));
    expect(window.location.pathname).toBe(paths.alerts());
    expect(await openMenu()).toBeTruthy();
  });

  it('the badge is hidden while the document loads (never a stale or invented value)', async () => {
    vi.mocked(getDashboard).mockImplementation(() => new Promise(() => {}));
    signInAs('demo');
    await renderAt(paths.dashboard());
    expect(fid(FID.shell.badge)).toBeNull();
    expect(header()).toBeTruthy();
  });
});

describe('Nav (FR-52, FR-57)', () => {
  it.each([
    [s.tabs.equipment, paths.equipment(), 'equipment'],
    [s.tabs.alerts, paths.alerts(), 'alerts'],
  ])('%s opens the Coming soon placeholder inside the shell with that tab active', async (label, path, key) => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    await act(async () => fireEvent.click(tab(label)));
    expect(window.location.pathname).toBe(path);
    expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy();
    expect(tab(label).getAttribute('aria-current')).toBe('page');
    expect(tab(s.tabs.dashboard).hasAttribute('aria-current')).toBe(false);
    expect(pageTitle().textContent).toBe(s.pageTitles[key]);
    expect(header().getAttribute('data-fid')).toBe(
      key === 'equipment' ? FID.shell.headerVariantEquipment : FID.shell.headerVariantAlerts,
    );
    await waitFor(() => expect(badgeText()).toBe('2'));
    // And back to the Dashboard.
    await act(async () => fireEvent.click(tab(s.tabs.dashboard)));
    expect(window.location.pathname).toBe(paths.dashboard());
    expect(screen.queryByText(copy.placeholder.comingSoon)).toBeNull();
  });

  it.each([
    [paths.equipment({ type: 'bins' }), s.tabs.equipment],
    [paths.equipment({ status: 'offline' }), s.tabs.equipment],
    [paths.equipmentDetail('759'), s.tabs.equipment],
    [paths.alertAction('759', 'hotspot'), s.tabs.equipment],
    [paths.alerts(), s.tabs.alerts],
  ])('%s renders the placeholder in the shell with %s active', async (url, label) => {
    signInAs('demo');
    await renderAt(url);
    expect(screen.getByText(copy.placeholder.comingSoon)).toBeTruthy();
    expect(tab(label).getAttribute('aria-current')).toBe('page');
  });

  it('the Dashboard link keeps a valid ?state= (AD-10)', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard('small'));
    expect(tab(s.tabs.dashboard).getAttribute('href')).toBe(paths.dashboard('small'));
    expect(tab(s.tabs.equipment).getAttribute('href')).toBe(paths.equipment());
  });
});

describe('avatar menu (FR-54, AD-12, AD-14)', () => {
  it('opens the profile panel with only My Profile and Logout; focus moves inside', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    const panel = await openMenu();
    expect(overlayRoot.contains(panel)).toBe(true);
    expect(panel.closest('[data-overlay-kind]').getAttribute('data-overlay-kind')).toBe('menu');
    expect(panel.getAttribute('data-fid')).toBe(FID.frames.profileMenu);
    expect(within(panel).getByRole('heading', { level: 2 }).textContent).toBe(s.profileMenuTitle);
    const logout = within(panel).getByRole('button', { name: s.logout });
    expect(within(panel).getAllByRole('button')).toEqual([logout]);
    expect(within(panel).queryAllByRole('link')).toEqual([]);
    expect(panel.textContent).toBe(`${s.profileMenuTitle}${s.logout}`);
    expect(document.activeElement).toBe(logout);
    expect(avatar().getAttribute('aria-expanded')).toBe('true');
  });

  it('Esc closes it and returns focus to the avatar', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    await openMenu();
    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(avatar());
    expect(avatar().getAttribute('aria-expanded')).toBe('false');
  });

  it('a click outside closes it and returns focus to the avatar; a click inside does not', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    const panel = await openMenu();
    await act(async () => fireEvent.click(within(panel).getByRole('heading', { level: 2 })));
    expect(menu()).not.toBeNull();
    await act(async () => fireEvent.click(pageTitle()));
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(avatar());
  });

  it('a second avatar activation closes it', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    await openMenu();
    await act(async () => fireEvent.click(avatar()));
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(avatar());
  });

  it('a route change closes it', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard());
    await openMenu();
    await act(async () => fireEvent.click(tab(s.tabs.alerts)));
    expect(window.location.pathname).toBe(paths.alerts());
    expect(menu()).toBeNull();
  });
});

describe('Logout (FR-35, FR-54)', () => {
  it('ends the Session and shows /login with empty fields, no banner and no return path', async () => {
    signInAs('demo');
    await renderAt(paths.dashboard('small'));
    const panel = await openMenu();
    const historyLength = window.history.length;
    await act(async () => fireEvent.click(within(panel).getByRole('button', { name: s.logout })));
    await waitFor(() => expect(window.location.pathname).toBe(paths.login()));
    expect(window.location.search).toBe('');
    expect(getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(window.history.state?.usr ?? null).toBeNull();
    // The Dashboard entry is replaced, so Back cannot return to it.
    expect(window.history.length).toBe(historyLength);
    expect(screen.getByLabelText(copy.login.usernameLabel).value).toBe('');
    expect(screen.getByLabelText(copy.login.passwordLabel).value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('banner')).toBeNull();
    expect(menu()).toBeNull();
  });
});

describe('signed out (FR-56)', () => {
  it.each([paths.dashboard(), paths.dashboard('small'), paths.equipment(), paths.alerts()])(
    '%s redirects to /login without rendering the shell',
    async (url) => {
      await renderAt(url);
      expect(window.location.pathname).toBe(paths.login());
      expect(screen.queryByRole('banner')).toBeNull();
      expect(getDashboard).not.toHaveBeenCalled();
    },
  );
});

describe('Header props contract (AD-17)', () => {
  const renderHeader = (props) =>
    render(
      <MemoryRouter initialEntries={[paths.dashboard()]}>
        <OverlayProvider routeKey="x">
          <Header {...props} />
        </OverlayProvider>
      </MemoryRouter>,
    );

  it('renders the badge it is given verbatim and calls onBellClick on activation', () => {
    const onBellClick = vi.fn();
    renderHeader({ activeTab: 'dashboard', badge: 2, onBellClick });
    expect(badgeText()).toBe('2');
    fireEvent.click(screen.getByRole('button', { name: s.bellLabel }));
    expect(onBellClick).toHaveBeenCalledTimes(1);
  });

  it('hides the badge when there is none', () => {
    renderHeader({ activeTab: 'alerts', badge: null });
    expect(fid(FID.shell.badge)).toBeNull();
    expect(tab(s.tabs.alerts).getAttribute('aria-current')).toBe('page');
  });

  it('features/shell holds no data: no data-port or JSON imports, no literal UI text', () => {
    for (const file of ['Header', 'NavTabs', 'BellButton', 'AvatarButton', 'ProfileMenu']) {
      const source = readFileSync(fromRoot(`src/features/shell/${file}.jsx`), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      expect(source).not.toMatch(/data\/api|\.json|fetch\(/);
      expect(source).not.toMatch(/>\s*[A-Za-z][^<{}();=]*<\//); // JSX text before a closing tag
      expect(source).not.toMatch(/react-router-dom/);
    }
  });
});

describe('lib: dashboardState.js (AD-11) and the tab helpers', () => {
  it.each([
    ['?state=small', null, 'small'],
    ['state=allgood', { dashboardState: 'small' }, 'allgood'],
    ['?state=bogus', { dashboardState: 'small' }, 'small'],
    ['?state=', { dashboardState: 'allgood' }, 'allgood'],
    ['', { dashboardState: 'nope' }, 'full'],
    ['', null, 'full'],
    [undefined, undefined, 'full'],
    [new URLSearchParams('state=small'), null, 'small'],
  ])('resolveDashboardState(%j, %j) → %s', (search, session, expected) => {
    expect(resolveDashboardState(search, session)).toBe(expected);
  });

  it('defaults to full and is pure', () => {
    expect(DEFAULT_DASHBOARD_STATE).toBe('full');
    const source = readFileSync(fromRoot('src/lib/dashboardState.js'), 'utf8');
    expect(source).not.toMatch(/from 'react|window\.|document\.|localStorage|sessionStorage/);
  });

  it.each([
    ['/dashboard', 'dashboard'],
    ['/equipment', 'equipment'],
    ['/equipment/759/hotspot', 'equipment'],
    ['/alerts', 'alerts'],
    ['/equipmentx', 'dashboard'],
    [undefined, 'dashboard'],
  ])('tabForPath(%j) → %s', (pathname, expected) => {
    expect(tabForPath(pathname)).toBe(expected);
  });

  it('tabHref keeps only a valid Dashboard state', () => {
    expect(tabHref('dashboard', 'small')).toBe('/dashboard?state=small');
    expect(tabHref('dashboard', 'bogus')).toBe('/dashboard');
    expect(tabHref('equipment', 'small')).toBe('/equipment');
    expect(tabHref('alerts')).toBe('/alerts');
  });
});
