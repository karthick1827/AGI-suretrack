// Story 1.2 — Login route, legal links and copy discipline (FR-11, FR-20, AD-16).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import App from '../../src/app/App.jsx';
import { getConfig } from '../../src/data/api.js';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { fromRoot } from './support/project.js';

vi.mock('../../src/data/api.js', () => ({ getConfig: vi.fn() }));

const config = JSON.parse(readFileSync(fromRoot('public/app-config.json'), 'utf8'));
const t = copy.login;
let consoleSpies;

beforeEach(() => {
  consoleSpies = ['error', 'warn', 'log', 'info'].map((level) => vi.spyOn(console, level));
  vi.mocked(getConfig).mockResolvedValue(config);
});

afterEach(() => {
  for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  cleanup();
  vi.restoreAllMocks();
});

async function renderAt(url) {
  window.history.replaceState(null, '', url);
  const view = render(<App />);
  // Let the config promise settle so no update happens outside act().
  await waitFor(() => expect(getConfig).toHaveBeenCalled());
  await Promise.resolve();
  return view;
}

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
    const legal = document.querySelector(`[data-fid="${FID.login.legalText}"]`);
    const anchors = legal.querySelectorAll('a');
    expect(anchors).toHaveLength(2);
    for (const anchor of anchors) expect(anchor.hasAttribute('href')).toBe(false);
  });

  it('the legal line reads the verbatim copy', async () => {
    await renderAt(paths.login());
    const legal = document.querySelector(`[data-fid="${FID.login.legalText}"]`);
    expect(legal.textContent).toBe(`${t.legalLead}${t.privacyPolicy}${t.legalSeparator}${t.termsOfService}`);
    expect(legal.querySelector('br')).not.toBeNull();
  });
});

describe('copy and Figma ids are never literal in JSX (AD-15, AD-16)', () => {
  const files = ['src/pages/Login/LoginPage.jsx', 'src/features/auth/LoginForm.jsx', 'src/app/App.jsx'];

  it.each(files)('%s has no literal text nodes or text attributes', (file) => {
    const source = readFileSync(fromRoot(file), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    // Text between a closing ">" of a tag and the next "<" that is not only whitespace or {expressions}.
    const textNodes = [...source.matchAll(/>([^<>{}]*)</g)]
      .map((m) => m[1])
      .filter((text) => text.trim() !== '' && !/^[\s)=;,&|?:]*$/.test(text));
    expect(textNodes).toEqual([]);
    expect(source).not.toMatch(/\b(alt|aria-label|title|placeholder)="[^"]+"/);
    expect(source).not.toMatch(/data-fid="/);
    expect(source).not.toMatch(/(to|href)="\//);
  });
});
