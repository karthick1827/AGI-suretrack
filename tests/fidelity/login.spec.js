// Fidelity check — Login page vs Figma frame 6026:60111 (FR-10–FR-20, AD-15).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import {
  LOGIN_PHOTO_MASK,
  MASK_COLOR,
  MASKED_BASELINE_DIR,
  copyAudit,
  cssColour,
  diffRatio,
  installMask,
  measurementAudit,
  readExpected,
  waitForFonts,
} from './support/fidelity.js';

const BASELINE = 'login-6026-60111.png';
const config = JSON.parse(readFileSync(path.resolve('public/app-config.json'), 'utf8'));
const t = copy.login;

async function openLogin(page) {
  await page.goto('/login');
  await page.locator(`[data-fid="${FID.frames.login}"]`).waitFor();
  await waitForFonts(page);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  // Config loaded (links carry their href), so nothing changes after capture.
  await expect(page.getByRole('link', { name: t.privacyPolicy })).toHaveAttribute('href', config.legal.privacyPolicyUrl);
}

test.describe('Login 6026:60111', () => {
  test('screenshot matches the Figma baseline (≤ 0.5 %, silo photo masked)', async ({ page }, testInfo) => {
    await openLogin(page);
    const mask = [await installMask(page, LOGIN_PHOTO_MASK)];

    // Report the ratio first (an upper bound: no anti-aliasing exclusion).
    const actual = await page.screenshot({ mask, maskColor: MASK_COLOR, animations: 'disabled', caret: 'hide' });
    const ratio = await diffRatio(actual, readFileSync(path.join(MASKED_BASELINE_DIR, BASELINE)));
    const note = `pixel-diff ratio ≤ ${(ratio * 100).toFixed(3)} % (YIQ threshold 0.1, no AA exclusion)`;
    testInfo.annotations.push({ type: 'pixel-diff', description: note });
    process.stdout.write(`[fidelity] ${BASELINE}: ${note}\n`);

    // maxDiffPixelRatio / threshold come from playwright.config.js (single source).
    await expect(page).toHaveScreenshot(BASELINE, {
      mask,
      maskColor: MASK_COLOR,
    });
  });

  test('measurement audit: every data-fid box ±1 px, exact colours, fonts and radii', async ({ page }) => {
    await openLogin(page);
    expect(await measurementAudit(page, readExpected('login.json'))).toEqual([]);
  });

  test('legal line styling (FR-20)', async ({ page }) => {
    await openLogin(page);
    const styleOf = (locator) =>
      locator.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          color: cs.color,
          fontWeight: cs.fontWeight,
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          decoration: cs.textDecorationLine,
          skipInk: cs.textDecorationSkipInk,
        };
      });
    const legal = page.locator(`[data-fid="${FID.login.legalText}"]`);
    for (const name of [t.privacyPolicy, t.termsOfService]) {
      expect(await styleOf(legal.getByRole('link', { name }))).toEqual({
        color: cssColour('#ffffff'),
        fontWeight: '500',
        fontSize: '14px',
        lineHeight: '24px',
        decoration: 'underline',
        skipInk: 'none',
      });
    }
    const separator = legal.locator('span').first();
    await expect(separator).toHaveText(t.legalSeparator.slice(0, t.legalSeparator.indexOf('|') + 1), {
      useInnerText: false,
    });
    expect(await styleOf(separator)).toMatchObject({
      color: cssColour('#ffffff80'),
      fontWeight: '400',
      decoration: 'none',
    });
    const forgot = page.locator(`[data-fid="${FID.login.forgotLink}"]`);
    expect(await styleOf(forgot)).toMatchObject({ decoration: 'underline', skipInk: 'none' });
  });

  test('copy audit: every string verbatim', async ({ page }) => {
    await openLogin(page);
    const problems = await copyAudit(page, {
      [FID.login.logo]: { alt: copy.brand.logoAlt },
      [FID.login.title]: { text: t.title },
      [FID.login.usernameLabel]: { text: t.usernameLabel },
      [FID.login.passwordLabel]: { text: t.passwordLabel },
      [FID.login.loginButtonLabel]: { text: t.submit },
      [FID.login.forgotLink]: { text: t.forgotLink },
      [FID.login.legalText]: { text: `${t.legalLead}${t.privacyPolicy}${t.legalSeparator}${t.termsOfService}` },
    });
    expect(problems).toEqual([]);
    // Hidden Figma layers are never rendered (FR-15).
    const body = await page.locator('body').textContent();
    expect(body).not.toMatch(/Remember Me|have an account yet/);
  });

  test('no external requests, no console output, links open a new tab safely', async ({ page, baseURL }) => {
    const appOrigin = new URL(baseURL).origin;
    const messages = [];
    const external = [];
    page.on('console', (msg) => messages.push(`${msg.type()}: ${msg.text()}`));
    page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
    page.on('request', (request) => {
      let origin;
      try {
        origin = new URL(request.url()).origin;
      } catch {
        external.push(request.url());
        return;
      }
      // data:, blob: and similar URLs have an opaque origin ('null') and never leave the app.
      if (origin !== 'null' && origin !== appOrigin) external.push(request.url());
    });

    await openLogin(page);
    expect(external).toEqual([]);
    expect(messages).toEqual([]);

    await page.getByLabel(t.usernameLabel).fill('farmer');
    for (const [name, url] of [
      [t.privacyPolicy, config.legal.privacyPolicyUrl],
      [t.termsOfService, config.legal.termsOfServiceUrl],
    ]) {
      const link = page.getByRole('link', { name });
      await expect(link).toHaveAttribute('href', url);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    await expect(page.getByLabel(t.usernameLabel)).toHaveValue('farmer');
  });

  test('every other route redirects to /login', async ({ page }) => {
    for (const route of ['/', '/dashboard', '/dashboard?state=small', '/xyz']) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.locator(`[data-fid="${FID.frames.login}"]`)).toBeVisible();
    }
  });

  test('wrong credentials: URL stays /login, Username kept, Password cleared and focused, banner shown (Story 1.4)', async ({
    page,
    baseURL,
  }) => {
    await openLogin(page);
    const username = page.getByLabel(t.usernameLabel);
    const password = page.getByLabel(t.passwordLabel);
    await username.fill('farmer');
    await password.fill('secret');
    await password.press('Enter');
    await expect(page.getByRole('alert')).toHaveText(t.errors.wrongCredentials, { timeout: 5_000 });
    const url = new URL(page.url());
    expect(url.href).toBe(new URL('/login', baseURL).href);
    expect(url.search).toBe('');
    await expect(username).toHaveValue('farmer');
    await expect(password).toHaveValue('');
    await expect(password).toBeFocused();
  });

  test('focus ring: shown on keyboard focus for every control, never at rest (AD-13, FR-9)', async ({ page }) => {
    await openLogin(page);
    const controls = [
      page.getByLabel(t.usernameLabel),
      page.getByLabel(t.passwordLabel),
      page.getByRole('button', { name: t.submit }),
      page.getByRole('button', { name: t.forgotLink }),
      page.getByRole('link', { name: t.privacyPolicy }),
      page.getByRole('link', { name: t.termsOfService }),
    ];
    const ring = (locator) =>
      locator.evaluate((el) => {
        const cs = getComputedStyle(el);
        return `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} ${cs.outlineOffset}`;
      });
    const SHOWN = 'solid 2px rgb(255, 255, 255) 2px';

    // At rest: no ring anywhere.
    for (const control of controls) expect(await ring(control)).toMatch(/^none /);

    // Keyboard: Tab walks the FR-21 order and each control shows the ring.
    await page.locator('body').click({ position: { x: 1000, y: 400 } });
    for (const control of controls) {
      await page.keyboard.press('Tab');
      await expect(control).toBeFocused();
      expect(await ring(control)).toBe(SHOWN);
    }

    // Mouse: pressing a button or link focuses it without a ring. Text inputs
    // always match :focus-visible in Chromium, which is what FR-9 asks for
    // ("text inputs show focus whenever focused"), so they show the ring.
    for (const [index, control] of controls.entries()) {
      await page.locator('body').click({ position: { x: 1000, y: 400 } });
      const box = await control.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await expect(control).toBeFocused();
      const isInput = index < 2;
      expect(await ring(control)).toEqual(isInput ? SHOWN : expect.stringMatching(/^none /));
      // Release away from the control so links do not open a tab.
      await page.mouse.move(1000, 400);
      await page.mouse.up();
    }
  });
});
