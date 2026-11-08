// The app shell: "/" redirects to the Login page (Story 1.2) with no console output.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import App from '../../src/app/App.jsx';
import { getConfig } from '../../src/data/api.js';
import { FID } from '../../src/lib/fid.js';
import { fromRoot } from './support/project.js';

vi.mock('../../src/data/api.js', () => ({
  MAX_TIMEOUT_MS: 2147483647,
  getConfig: vi.fn(() => Promise.resolve({ legal: {} })),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('redirects / to /login and logs nothing', async () => {
    const spies = ['error', 'warn', 'log'].map((level) => vi.spyOn(console, level));
    window.history.replaceState(null, '', '/');
    const { container } = render(<App />);
    await waitFor(() => expect(getConfig).toHaveBeenCalled());
    expect(window.location.pathname).toBe('/login');
    expect(container.querySelector(`[data-fid="${FID.frames.login}"]`)).not.toBeNull();
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it('imports react-router (never react-router-dom) and the three global stylesheets once', () => {
    const app = readFileSync(fromRoot('src/app/App.jsx'), 'utf8');
    const main = readFileSync(fromRoot('src/app/main.jsx'), 'utf8');
    expect(app).toMatch(/from 'react-router';/);
    expect(app + main).not.toMatch(/react-router-dom|react-router\/dom/);
    for (const sheet of ['reset', 'fonts', 'tokens']) {
      expect(main.match(new RegExp(`styles/${sheet}\\.css`, 'g'))).toHaveLength(1);
    }
  });

  it('index.html has the SureTrack title, #root and #overlay-root', () => {
    const html = readFileSync(fromRoot('index.html'), 'utf8');
    expect(html).toMatch(/<title>SureTrack<\/title>/);
    expect(html).toMatch(/<div id="root"><\/div>/);
    expect(html).toMatch(/<div id="overlay-root"><\/div>/);
    expect(html).toMatch(/src="\/src\/app\/main\.jsx"/);
  });

  it('package.json pins exactly and bans react-router-dom', () => {
    const pkg = JSON.parse(readFileSync(fromRoot('package.json'), 'utf8'));
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(all).toMatchObject({
      'react-router': '8.5.1',
      '@fontsource/roboto': '5.3.0',
      '@fontsource/inter': '5.3.0',
      vitest: '5.1.0',
      '@testing-library/react': '16.3.3',
      '@testing-library/dom': '10.4.2',
      jsdom: '30.1.3',
      sharp: '0.35.5',
    });
    expect(pkg.engines).toEqual({ node: '>=22.22.0' });
    for (const banned of ['react-router-dom', 'tailwindcss', 'styled-components', '@emotion/react']) {
      expect(all).not.toHaveProperty(banned);
    }
  });
});
