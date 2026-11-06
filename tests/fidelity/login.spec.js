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

    await expect(page).toHaveScreenshot(BASELINE, {
      maxDiffPixelRatio: 0.005,
      threshold: 0.1,
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
      const url = request.url();
      if (!url.startsWith('data:') && !url.startsWith('blob:') && new URL(url).origin !== appOrigin) external.push(url);
    });

    await openLogin(page);
    expect(external).toEqual([]);
    // Dev-server-only noise (Vite HMR client, React DevTools hint) is not app output.
    const devNoise = (m) => m.startsWith('debug:') || m.includes('[vite]') || m.includes('React DevTools');
    expect(messages.filter((m) => !devNoise(m))).toEqual([]);

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

  test('keyboard focus shows a ring only on keyboard focus (AD-13)', async ({ page }) => {
    await openLogin(page);
    const outline = (locator) => locator.evaluate((el) => getComputedStyle(el).outlineStyle);
    const privacy = page.getByRole('link', { name: t.privacyPolicy });
    expect(await outline(privacy)).toBe('none');
    await page.getByRole('button', { name: t.forgotLink }).focus();
    await page.keyboard.press('Tab');
    await expect(privacy).toBeFocused();
    expect(await outline(privacy)).toBe('solid');
  });
});
