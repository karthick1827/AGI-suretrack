// Story 1.2 / 1.3 — Login route, legal links and copy discipline (FR-11, FR-20, AD-16).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { parse } from '@babel/parser';
import { readFileSync } from 'node:fs';
import App from '../../src/app/App.jsx';
import { getConfig, getUsers } from '../../src/data/api.js';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { fromRoot } from './support/project.js';

vi.mock('../../src/data/api.js', () => ({ getConfig: vi.fn(), getUsers: vi.fn() }));

const config = JSON.parse(readFileSync(fromRoot('public/app-config.json'), 'utf8'));
const t = copy.login;
let consoleSpies;

beforeEach(() => {
  localStorage.clear();
  consoleSpies = ['error', 'warn', 'log', 'info'].map((level) => vi.spyOn(console, level));
  vi.mocked(getConfig).mockResolvedValue(config);
});

afterEach(() => {
  try {
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  } finally {
    cleanup();
    vi.restoreAllMocks();
  }
});

async function renderAt(url) {
  window.history.replaceState(null, '', url);
  const view = render(<App />);
  // Let the config promise settle so no update happens outside act().
  await waitFor(() => expect(getConfig).toHaveBeenCalled());
  await Promise.resolve();
  return view;
}

const legalAnchors = () => document.querySelector(`[data-fid="${FID.login.legalText}"]`).querySelectorAll('a');

describe('routing (FR-11)', () => {
  it.each(['/', '/dashboard', '/dashboard?state=small', '/xyz', '/equipment/759'])('%s redirects to /login', async (url) => {
    await renderAt(url);
    expect(window.location.pathname).toBe(paths.login());
    expect(document.querySelector(`[data-fid="${FID.frames.login}"]`)).not.toBeNull();
  });

  it('/login renders the Login page with its title, labelled inputs and buttons', async () => {
    await renderAt(paths.login());
    expect(screen.getByRole('heading', { name: t.title })).toBeTruthy();
    expect(screen.getByLabelText(t.usernameLabel).getAttribute('autocomplete')).toBe('username');
    expect(screen.getByLabelText(t.passwordLabel).getAttribute('type')).toBe('password');
    expect(screen.getByLabelText(t.passwordLabel).getAttribute('autocomplete')).toBe('current-password');
    expect(screen.getByRole('button', { name: t.submit }).getAttribute('type')).toBe('submit');
    expect(screen.getByRole('button', { name: t.forgotLink }).getAttribute('type')).toBe('button');
    expect(screen.getByRole('img', { name: copy.brand.logoAlt })).toBeTruthy();
  });

  it('image width/height attributes are integers (exact px live in CSS)', async () => {
    await renderAt(paths.login());
    const images = document.querySelectorAll('img[width], img[height]');
    expect(images.length).toBeGreaterThanOrEqual(3);
    for (const img of images) {
      for (const attr of ['width', 'height']) expect(img.getAttribute(attr)).toMatch(/^\d+$/);
    }
  });
});

describe('legal links (FR-20, SCRUM-31)', () => {
  it('open the config URLs in a new tab without an opener', async () => {
    await renderAt(paths.login());
    const privacy = await screen.findByRole('link', { name: t.privacyPolicy });
    await waitFor(() => expect(privacy.getAttribute('href')).toBe(config.legal.privacyPolicyUrl));
    const terms = screen.getByRole('link', { name: t.termsOfService });
    expect(terms.getAttribute('href')).toBe(config.legal.termsOfServiceUrl);
    for (const link of [privacy, terms]) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('render without href, and log nothing, when the config fails to load', async () => {
    vi.mocked(getConfig).mockRejectedValue({ code: 'LOAD_FAILED', message: 'x' });
    await renderAt(paths.login());
    await Promise.resolve();
    expect(legalAnchors()).toHaveLength(2);
    for (const anchor of legalAnchors()) expect(anchor.hasAttribute('href')).toBe(false);
  });

  it.each([
    ['javascript:alert(1)', 'mailto:legal@example.com'],
    ['/privacy', 'example.com/terms'],
    [42, null],
  ])('drop non-http(s) URLs (%s, %s): no href, nothing logged', async (privacyPolicyUrl, termsOfServiceUrl) => {
    vi.mocked(getConfig).mockResolvedValue({ legal: { privacyPolicyUrl, termsOfServiceUrl } });
    await renderAt(paths.login());
    await Promise.resolve();
    expect(legalAnchors()).toHaveLength(2);
    for (const anchor of legalAnchors()) expect(anchor.hasAttribute('href')).toBe(false);
  });

  it('the legal line reads the verbatim copy', async () => {
    await renderAt(paths.login());
    const legal = document.querySelector(`[data-fid="${FID.login.legalText}"]`);
    expect(legal.textContent).toBe(`${t.legalLead}${t.privacyPolicy}${t.legalSeparator}${t.termsOfService}`);
    expect(legal.querySelector('br')).not.toBeNull();
  });
});

describe('typed values are preserved after a non-success submit (messages arrive in Story 1.4)', () => {
  const usersData = JSON.parse(readFileSync(fromRoot('src/data/json/users.json'), 'utf8'));

  it('uses the real users.json shape (policy and a per-account simulatedLatencyMs)', () => {
    expect(usersData.policy).toMatchObject({ simulatedLatencyMs: 800, sessionTtlMinutes: 480 });
    expect(usersData.users.some((user) => typeof user.simulatedLatencyMs === 'number')).toBe(true);
  });

  it.each([
    ['unknown username', 'farmer', 'secret'],
    ['wrong password', 'demo', 'Demo@1234'],
    ['locked account', 'locked', 'Locked@123'],
  ])('%s: Enter and the Login button keep /login and both typed values', async (_, user, pass) => {
    vi.mocked(getUsers).mockResolvedValue(usersData);
    await renderAt(paths.login());
    const username = screen.getByLabelText(t.usernameLabel);
    const password = screen.getByLabelText(t.passwordLabel);
    fireEvent.change(username, { target: { value: user } });
    fireEvent.change(password, { target: { value: pass } });
    fireEvent.submit(password.form);
    fireEvent.click(screen.getByRole('button', { name: t.submit }));
    await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: t.submit }).hasAttribute('aria-busy')).toBe(false));
    expect(window.location.pathname).toBe(paths.login());
    expect(window.location.search).toBe('');
    expect(username.value).toBe(user);
    expect(password.value).toBe(pass);
  });
});

describe('copy and Figma ids are never literal in JSX (AD-15, AD-16)', () => {
  const files = [
    'src/pages/Login/LoginPage.jsx',
    'src/features/auth/LoginForm.jsx',
    'src/app/App.jsx',
    'src/app/RequireSession.jsx',
    'src/pages/Placeholder/Placeholder.jsx',
  ];
  const TEXT_ATTRIBUTES = new Set(['alt', 'aria-label', 'title', 'placeholder']);

  /**
   * Every JSX literal that would put user-visible text on screen. Parsing the
   * JSX means {expressions} are set aside exactly, so text written next to an
   * expression (`Hello {name}`) is still caught.
   */
  function jsxLiterals(source) {
    const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
    const found = [];
    const stringOf = (node) => (node?.type === 'StringLiteral' ? node.value : null);
    const visit = (node, parent) => {
      if (!node || typeof node.type !== 'string') return;
      if (node.type === 'JSXText' && node.value.trim() !== '') found.push(`text: ${node.value.trim()}`);
      if (node.type === 'JSXExpressionContainer' && parent?.type === 'JSXElement') {
        const e = node.expression;
        if (e.type === 'StringLiteral' || e.type === 'TemplateLiteral') {
          found.push(`child expression: ${source.slice(e.start, e.end)}`);
        }
      }
      if (node.type === 'JSXAttribute') {
        const name = node.name.name;
        const value = node.value?.type === 'JSXExpressionContainer' ? node.value.expression : node.value;
        const literal = stringOf(value);
        if (literal && TEXT_ATTRIBUTES.has(name)) found.push(`${name}="${literal}"`);
        if (literal !== null && name === 'data-fid') found.push(`data-fid="${literal}"`);
        if (literal !== null && (name === 'to' || name === 'href') && literal.startsWith('/')) {
          found.push(`${name}="${literal}"`);
        }
      }
      for (const [key, value] of Object.entries(node)) {
        if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra') continue;
        if (Array.isArray(value)) for (const child of value) visit(child, node);
        else if (value && typeof value === 'object') visit(value, node);
      }
    };
    visit(ast.program, null);
    return found;
  }

  it('the checker catches literals, including text next to an expression', () => {
    const sample = [
      'export const A = () => (',
      '  <p title="Hi" data-fid="1:2">',
      "    Hello {name} world{' x'}",
      '    <a href="/login">{name}</a>',
      '  </p>',
      ');',
    ].join('\n');
    expect(jsxLiterals(sample)).toEqual([
      'title="Hi"',
      'data-fid="1:2"',
      'text: Hello',
      'text: world',
      "child expression: ' x'",
      'href="/login"',
    ]);
  });

  it.each(files)('%s has no literal text, text attributes, data-fid or "/" URLs', (file) => {
    expect(jsxLiterals(readFileSync(fromRoot(file), 'utf8'))).toEqual([]);
  });
});
