// Data port behaviour — the spec's I/O & edge-case matrix (AD-7).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fromRoot } from './support/project.js';

// Serve fetch() from disk: Vite's `?url` gives a root-relative path for
// src/ files, and public/ files are served from the web root.
function fileForUrl(url) {
  const pathname = decodeURIComponent(new URL(String(url), 'http://localhost/').pathname);
  const candidates = [fromRoot(pathname.replace(/^\//, '')), fromRoot('public', pathname.replace(/^\//, ''))];
  return candidates.find((file) => existsSync(file));
}

function diskFetch(url) {
  const file = fileForUrl(url);
  if (!file) return Promise.resolve(new Response('not found', { status: 404 }));
  return Promise.resolve(new Response(readFileSync(file), { status: 200, headers: { 'Content-Type': 'application/json' } }));
}

const readJson = (file) => JSON.parse(readFileSync(fromRoot(file), 'utf8'));

async function loadApi() {
  vi.resetModules();
  return import('../../src/data/api.js');
}

beforeEach(() => {
  vi.stubEnv('VITE_DATA_LATENCY_MS', '0');
  vi.stubGlobal('fetch', vi.fn(diskFetch));
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});

describe('getDashboard', () => {
  it.each(['full', 'small', 'allgood'])("getDashboard('%s') resolves the exact JSON object", async (state) => {
    const { getDashboard } = await loadApi();
    await expect(getDashboard(state)).resolves.toEqual(readJson(`src/data/json/dashboard.${state}.json`));
  });

  it('loads through a real fetch request (interceptable)', async () => {
    const { getDashboard } = await loadApi();
    await getDashboard('small');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0][0])).toMatch(/dashboard\.small\.json/);
  });

  it("getDashboard('xyz') rejects with NOT_FOUND and does not throw", async () => {
    const { getDashboard } = await loadApi();
    let promise;
    expect(() => {
      promise = getDashboard('xyz');
    }).not.toThrow();
    await expect(promise).rejects.toEqual({ code: 'NOT_FOUND', message: expect.any(String) });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('?__fail=dashboard forces getDashboard() to reject with FORCED_FAIL', async () => {
    window.history.replaceState(null, '', '/dashboard?__fail=dashboard');
    const { getDashboard, getNotifications } = await loadApi();
    await expect(getDashboard()).rejects.toEqual({ code: 'FORCED_FAIL', message: expect.any(String) });
    await expect(getNotifications()).resolves.toEqual(readJson('src/data/json/notifications.json'));
  });

  it('?__fail accepts a comma-separated list', async () => {
    window.history.replaceState(null, '', '/?__fail=users,notifications');
    const { getUsers, getNotifications } = await loadApi();
    await expect(getUsers()).rejects.toMatchObject({ code: 'FORCED_FAIL' });
    await expect(getNotifications()).rejects.toMatchObject({ code: 'FORCED_FAIL' });
  });

  it('?__fail is ignored in production builds', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    window.history.replaceState(null, '', '/dashboard?__fail=dashboard');
    const { getDashboard } = await loadApi();
    await expect(getDashboard('full')).resolves.toEqual(readJson('src/data/json/dashboard.full.json'));
  });

  it('rejects with LOAD_FAILED on a non-OK response or a network error', async () => {
    const { getDashboard } = await loadApi();
    fetch.mockResolvedValueOnce(new Response('', { status: 500 }));
    await expect(getDashboard('full')).rejects.toMatchObject({ code: 'LOAD_FAILED' });
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(getDashboard('full')).rejects.toMatchObject({ code: 'LOAD_FAILED' });
    fetch.mockResolvedValueOnce(new Response('{not json', { status: 200 }));
    await expect(getDashboard('full')).rejects.toMatchObject({ code: 'LOAD_FAILED' });
  });

  it.each([['null'], ['[]'], ['[{"state":"full"}]'], ['42'], ['"text"']])(
    'rejects with LOAD_FAILED when the body is %s (not a JSON object)',
    async (body) => {
      const { getDashboard } = await loadApi();
      fetch.mockResolvedValueOnce(new Response(body, { status: 200 }));
      await expect(getDashboard('full')).rejects.toEqual({ code: 'LOAD_FAILED', message: expect.any(String) });
    },
  );

  it('?__fail is case-insensitive and trims entries', async () => {
    window.history.replaceState(null, '', '/?__fail=%20Dashboard%20,NOTIFICATIONS');
    const { getDashboard, getNotifications } = await loadApi();
    await expect(getDashboard('full')).rejects.toMatchObject({ code: 'FORCED_FAIL' });
    await expect(getNotifications()).rejects.toMatchObject({ code: 'FORCED_FAIL' });
  });

  it('forced failure wins over NOT_FOUND (one order for every call)', async () => {
    window.history.replaceState(null, '', '/?__fail=dashboard');
    const { getDashboard } = await loadApi();
    await expect(getDashboard('xyz')).rejects.toMatchObject({ code: 'FORCED_FAIL' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('getUsers / getNotifications', () => {
  it('resolve the exact JSON objects', async () => {
    const { getUsers, getNotifications } = await loadApi();
    await expect(getUsers()).resolves.toEqual(readJson('src/data/json/users.json'));
    await expect(getNotifications()).resolves.toEqual(readJson('src/data/json/notifications.json'));
  });
});

describe('getConfig', () => {
  it('resolves public/app-config.json', async () => {
    const { getConfig } = await loadApi();
    const config = await getConfig();
    expect(config).toEqual(readJson('public/app-config.json'));
    expect(String(fetch.mock.calls[0][0])).toMatch(/\/app-config\.json$/);
  });

  it('rejects { code: LOAD_FAILED } on a non-OK fetch', async () => {
    const { getConfig } = await loadApi();
    fetch.mockResolvedValueOnce(new Response('missing', { status: 404 }));
    await expect(getConfig()).rejects.toEqual({ code: 'LOAD_FAILED', message: expect.any(String) });
  });
});

describe('latency (VITE_DATA_LATENCY_MS)', () => {
  it('waits the configured delay before requesting', async () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_DATA_LATENCY_MS', '300');
    const { getNotifications } = await loadApi();
    const pending = getNotifications();
    await vi.advanceTimersByTimeAsync(299);
    expect(fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ title: 'Notifications' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('defaults to 0 under Vitest when unset', async () => {
    vi.stubEnv('VITE_DATA_LATENCY_MS', undefined);
    vi.useFakeTimers();
    const { getUsers } = await loadApi();
    const pending = getUsers();
    await vi.advanceTimersByTimeAsync(0);
    await expect(pending).resolves.toMatchObject({ version: 1 });
  });

  it.each([[undefined], ['500']])('production build (DEV=false) never waits, VITE_DATA_LATENCY_MS=%s', async (value) => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('VITE_DATA_LATENCY_MS', value);
    vi.useFakeTimers();
    const { getUsers } = await loadApi();
    const pending = getUsers();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    await expect(pending).resolves.toMatchObject({ version: 1 });
  });

  it.each([[undefined], ['   ']])('npm run dev (DEV=true, MODE=development) defaults to 300 ms when %j', async (value) => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITE_DATA_LATENCY_MS', value);
    vi.useFakeTimers();
    const { getUsers } = await loadApi();
    const pending = getUsers();
    await vi.advanceTimersByTimeAsync(299);
    expect(fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ version: 1 });
  });

  it.each([['-5'], ['abc'], ['Infinity']])('ignores an invalid value (%s) and uses the mode default', async (value) => {
    vi.stubEnv('VITE_DATA_LATENCY_MS', value);
    vi.useFakeTimers();
    const { getUsers } = await loadApi();
    const pending = getUsers();
    await vi.advanceTimersByTimeAsync(0);
    await expect(pending).resolves.toMatchObject({ version: 1 });
  });

  it('clamps a huge value to the setTimeout maximum instead of firing at once', async () => {
    vi.stubEnv('VITE_DATA_LATENCY_MS', '99999999999');
    vi.useFakeTimers();
    const { getUsers } = await loadApi();
    const pending = getUsers();
    pending.catch(() => {});
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('sign-in latency (users.json policy, AD-14)', () => {
  it.each([
    ['development', true],
    ['production', false],
  ])('getUsers({ signIn: true }) waits policy.simulatedLatencyMs after loading (%s build)', async (mode, dev) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('PROD', !dev);
    vi.stubEnv('MODE', mode);
    vi.stubEnv('VITE_DATA_LATENCY_MS', '0');
    vi.useFakeTimers();
    const { getUsers } = await loadApi();
    const latency = readJson('src/data/json/users.json').policy.simulatedLatencyMs;
    expect(latency).toBe(800);
    let settled = false;
    const pending = getUsers({ signIn: true }).then((value) => {
      settled = true;
      return value;
    });
    await vi.advanceTimersByTimeAsync(latency - 1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toEqual(readJson('src/data/json/users.json'));
  });

  it("an account's own simulatedLatencyMs overrides the policy (slow: 16 s), matched trimmed and case-insensitive", async () => {
    vi.useFakeTimers();
    const { getUsers } = await loadApi();
    const slow = readJson('src/data/json/users.json').users.find((user) => user.username === 'slow');
    let settled = false;
    const pending = getUsers({ signIn: true, username: ' SLOW ' }).then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(slow.simulatedLatencyMs - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toBe(true);
  });

  it('calls onLoaded with users.json before the sign-in latency', async () => {
    vi.useFakeTimers();
    const { getUsers } = await loadApi();
    const onLoaded = vi.fn();
    const pending = getUsers({ signIn: true, username: 'demo', onLoaded });
    await vi.advanceTimersByTimeAsync(0);
    expect(onLoaded).toHaveBeenCalledWith(readJson('src/data/json/users.json'));
    await vi.advanceTimersByTimeAsync(800);
    await pending;
  });

  it('aborting the signal during the latency rejects with ABORTED', async () => {
    vi.useFakeTimers();
    const { getUsers } = await loadApi();
    const controller = new AbortController();
    const pending = getUsers({ signIn: true, username: 'slow', signal: controller.signal });
    pending.catch(() => {});
    await vi.advanceTimersByTimeAsync(15_000);
    controller.abort();
    await expect(pending).rejects.toEqual({ code: 'ABORTED', message: expect.any(String) });
  });

  it('an already-aborted signal rejects with ABORTED before any fetch', async () => {
    const { getUsers } = await loadApi();
    const controller = new AbortController();
    controller.abort();
    await expect(getUsers({ signIn: true, signal: controller.signal })).rejects.toMatchObject({ code: 'ABORTED' });
  });

  it('getConfig({ signal }) rejects with ABORTED when aborted', async () => {
    const { getConfig } = await loadApi();
    const controller = new AbortController();
    controller.abort();
    await expect(getConfig({ signal: controller.signal })).rejects.toMatchObject({ code: 'ABORTED' });
  });

  it('plain getUsers() does not add the sign-in latency', async () => {
    vi.useFakeTimers();
    const { getUsers } = await loadApi();
    const pending = getUsers();
    await vi.advanceTimersByTimeAsync(0);
    await expect(pending).resolves.toMatchObject({ version: 1 });
  });
});

describe('data access boundary', () => {
  it('only src/data/api.js references src/data/json', async () => {
    const { readdirSync, statSync } = await import('node:fs');
    const path = await import('node:path');
    const offenders = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (
          /\.(jsx?|mjs|cjs|tsx?)$/.test(name) &&
          /data[\\/]json|\.\/json|\.\.\/json/.test(readFileSync(full, 'utf8'))
        ) {
          offenders.push(path.relative(fromRoot(), full).replace(/\\/g, '/'));
        }
      }
    };
    walk(fromRoot('src'));
    expect(offenders).toEqual(['src/data/api.js']);
  });
});
