// Story 1.3 — sign in and reach the Dashboard, in a real browser against the
// production bundle (FR-21, FR-23, FR-25, FR-33, FR-35).
import { expect, test } from '@playwright/test';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, SIGNOUT_KEY } from '../../src/lib/session.js';

const t = copy.login;
const DEMO = { username: 'demo', password: 'Demo@123' };
const urlOf = (path) => new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

async function signInAs(page, { username, password }) {
  await page.getByLabel(t.usernameLabel).fill(username);
  await page.getByLabel(t.passwordLabel).fill(password);
  await page.getByLabel(t.passwordLabel).press('Enter');
}

const comingSoon = (page) => page.getByText(copy.placeholder.comingSoon);

test.describe('Sign in and reach the Dashboard', () => {
  test('valid sign-in: loading state, then /dashboard; no password in storage', async ({ page }) => {
    await page.goto(paths.login());
    await page.locator(`[data-fid="${FID.frames.login}"]`).waitFor();
    await signInAs(page, DEMO);

    const button = page.getByRole('button', { name: t.submit });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(page).toHaveURL(urlOf(paths.dashboard()), { timeout: 5_000 });
    await expect(comingSoon(page)).toBeVisible();

    const stored = await page.evaluate(() => ({ ...localStorage }));
    expect(JSON.parse(stored[SESSION_KEY])).toMatchObject({ v: 1, username: 'demo', dashboardState: 'full' });
    for (const value of Object.values(stored)) expect(value).not.toContain(DEMO.password);

    // FR-33: /login with a Session goes straight to /dashboard.
    await page.goto(paths.login());
    await expect(page).toHaveURL(urlOf(paths.dashboard()));
    await expect(page.getByLabel(t.usernameLabel)).toHaveCount(0);
  });

  test('a guarded page is remembered and reached after sign-in, replacing /login', async ({ page }) => {
    await page.goto(paths.root());
    await page.goto(paths.equipment({ type: 'bins' }));
    await expect(page).toHaveURL(urlOf(paths.login()));
    await signInAs(page, { username: '  DEMO ', password: DEMO.password });
    await expect(page).toHaveURL(urlOf(paths.equipment({ type: 'bins' })), { timeout: 5_000 });

    // Back skips the replaced Login page (it lands on the earlier entry,
    // which with a Session resolves to /dashboard, not the filled form).
    await page.goBack();
    await expect(page).toHaveURL(urlOf(paths.dashboard()));
    await expect(page.getByLabel(t.usernameLabel)).toHaveCount(0);
  });

  test('keyboard: Tab order is Username → Password → Login → Forgot → Privacy → Terms; Enter submits', async ({ page }) => {
    await page.goto(paths.login());
    await page.locator(`[data-fid="${FID.frames.login}"]`).waitFor();
    const order = [
      page.getByLabel(t.usernameLabel),
      page.getByLabel(t.passwordLabel),
      page.getByRole('button', { name: t.submit }),
      page.getByRole('button', { name: t.forgotLink }),
      page.getByRole('link', { name: t.privacyPolicy }),
      page.getByRole('link', { name: t.termsOfService }),
    ];
    await page.locator('body').click({ position: { x: 1000, y: 400 } });
    for (const control of order) {
      await page.keyboard.press('Tab');
      await expect(control).toBeFocused();
    }

    // Enter with empty fields: required messages, focus on the first empty field.
    await order[0].focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(t.errors.usernameRequired)).toBeVisible();
    await expect(page.getByText(t.errors.passwordRequired)).toBeVisible();
    await expect(order[0]).toBeFocused();

    await page.keyboard.type(DEMO.username);
    await page.keyboard.press('Tab');
    await page.keyboard.type(DEMO.password);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(urlOf(paths.dashboard()), { timeout: 5_000 });
  });

  test('cross-tab sign-out: the other tab shows /login within 1 s and Back does not show /dashboard', async ({
    context,
  }) => {
    const first = await context.newPage();
    await first.goto(paths.login());
    await signInAs(first, DEMO);
    await expect(first).toHaveURL(urlOf(paths.dashboard()), { timeout: 5_000 });

    const second = await context.newPage();
    await second.goto(paths.dashboard());
    await second.goto(paths.alerts());
    await expect(comingSoon(second)).toBeVisible();

    // What session.signOut() does in the signing-out tab.
    await first.evaluate(
      ({ sessionKey, signoutKey }) => {
        localStorage.removeItem(sessionKey);
        localStorage.setItem(signoutKey, String(Date.now()));
      },
      { sessionKey: SESSION_KEY, signoutKey: SIGNOUT_KEY },
    );

    await expect(second).toHaveURL(urlOf(paths.login()), { timeout: 1_000 });
    await expect(second.getByLabel(t.usernameLabel)).toHaveValue('');

    await second.goBack();
    await expect(second).toHaveURL(urlOf(paths.login()));
    await expect(comingSoon(second)).toHaveCount(0);
  });
});
