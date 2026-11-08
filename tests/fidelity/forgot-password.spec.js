// Fidelity check — Forgot Password modal vs Figma frame 6026:62907 (FR-36–FR-49, AD-15).
//
// The modal region (600×374 at x 383, y 197) is compared with the card cropped
// out of the committed Figma render (global-setup.js; the committed file is
// never edited), with only the four corners outside the 16 px radius masked.
// The Login at-rest checks stay in login.spec.js, unchanged.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import {
  FORGOT_PASSWORD_BASELINE,
  FORGOT_PASSWORD_CLIP,
  FORGOT_PASSWORD_CORNER_MASK,
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

const config = JSON.parse(readFileSync(path.resolve('public/app-config.json'), 'utf8'));
const users = JSON.parse(readFileSync(path.resolve('src/data/json/users.json'), 'utf8'));
const t = copy.forgotPassword;
const login = copy.login;
const coachName = `SureTrack Coach ${config.coach.phone}`;
const fid = (id) => `[data-fid="${id}"]`;

async function openLogin(page) {
  await page.goto(paths.login());
  await page.locator(fid(FID.frames.login)).waitFor();
  await waitForFonts(page);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  await expect(page.getByRole('link', { name: login.privacyPolicy })).toHaveAttribute('href', config.legal.privacyPolicyUrl);
}

async function openModal(page) {
  await openLogin(page);
  await page.getByRole('button', { name: login.forgotLink }).click();
  const dialog = page.getByRole('dialog', { name: t.title });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('link', { name: coachName })).toHaveAttribute('href', config.coach.tel);
  await waitForFonts(page);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  return dialog;
}

test.describe('Forgot Password 6026:62907', () => {
  test('modal region matches the Figma render (≤ 0.5 %, corners outside the radius masked)', async ({ page }, testInfo) => {
    await openModal(page);
    // FR-49 focuses Email on open (checked in its own test below); the Figma
    // frame shows it unfocused. AD-13: the at-rest capture is taken with the
    // focus state style removed — only the focus ring; Email stays focused,
    // untouched and empty (its caret is hidden by `caret: 'hide'`).
    await expect(page.getByRole('textbox', { name: t.emailAccessibleLabel })).toBeFocused();
    await page.addStyleTag({ content: '[data-overlay] :focus-visible { outline: none !important; }' });
    await expect(page.getByRole('textbox', { name: t.emailAccessibleLabel })).not.toHaveAttribute('aria-invalid', 'true');
    const { x, y } = FORGOT_PASSWORD_CLIP;
    const mask = [await installMask(page, FORGOT_PASSWORD_CORNER_MASK.map((r) => ({ ...r, left: r.left + x, top: r.top + y })))];

    const actual = await page.screenshot({ clip: FORGOT_PASSWORD_CLIP, mask, maskColor: MASK_COLOR, animations: 'disabled', caret: 'hide' });
    const ratio = await diffRatio(actual, readFileSync(path.join(MASKED_BASELINE_DIR, FORGOT_PASSWORD_BASELINE)));
    const note = `pixel-diff ratio ≤ ${(ratio * 100).toFixed(3)} % (YIQ threshold 0.1, no AA exclusion)`;
    testInfo.annotations.push({ type: 'pixel-diff', description: note });
    process.stdout.write(`[fidelity] ${FORGOT_PASSWORD_BASELINE}: ${note}\n`);

    await expect(page).toHaveScreenshot(FORGOT_PASSWORD_BASELINE, { clip: FORGOT_PASSWORD_CLIP, mask, maskColor: MASK_COLOR });
  });

  test('FR-49: on open, keyboard focus is on the Email field', async ({ page }) => {
    const dialog = await openModal(page);
    await expect(dialog.getByRole('textbox', { name: t.emailAccessibleLabel })).toBeFocused();
  });

  test('measurement audit: every data-fid box ±1 px, exact colours, fonts and radii', async ({ page }) => {
    await openModal(page);
    expect(await measurementAudit(page, readExpected('forgot-password.json'))).toEqual([]);
  });

  test('copy audit: every string verbatim', async ({ page }) => {
    await openModal(page);
    const problems = await copyAudit(page, {
      [FID.forgotPassword.title]: { text: t.title },
      [FID.forgotPassword.intro]: {
        text: 'Forgot your password or username? Enter your email address, and we’ll send you a link to reset your password.',
      },
      [FID.forgotPassword.emailLabel]: { text: 'Email *' },
      [FID.forgotPassword.helpText]: { text: `Need additional help?${coachName}` },
      [FID.forgotPassword.cancel]: { text: 'Cancel' },
      [FID.forgotPassword.submit]: { text: 'Submit' },
    });
    expect(problems).toEqual([]);
    await expect(page.getByRole('textbox', { name: t.emailAccessibleLabel })).toHaveAttribute('placeholder', 'Eg. example@mail.com');
    // The intro wraps to exactly 2 lines, breaking after "email address," (FR-40).
    const lines = await page.locator(fid(FID.forgotPassword.intro)).evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
    });
    expect(lines).toBe(2);
  });

  test('styles: red asterisk, Medium Coach line drawn like text, close X invisible, backdrop, Shadow/Lg, cursors', async ({ page }) => {
    const dialog = await openModal(page);
    const style = (selector, props) =>
      page.locator(selector).first().evaluate((el, keys) => {
        const cs = getComputedStyle(el);
        return Object.fromEntries(keys.map((k) => [k, cs[k]]));
      }, props);
    expect(await style(`${fid(FID.forgotPassword.emailLabel)} span`, ['color'])).toEqual({ color: cssColour('#dc2626') });
    expect(await style(`${fid(FID.forgotPassword.helpText)} a`, ['color', 'fontWeight', 'textDecorationLine'])).toEqual({
      color: cssColour('#374151'),
      fontWeight: '500',
      textDecorationLine: 'none',
    });
    expect(await style(fid(FID.frames.forgotPassword), ['boxShadow'])).toEqual({
      boxShadow: 'rgba(39, 39, 39, 0.15) 0px 12px 20px -2px',
    });
    expect(await style('[data-overlay-backdrop]', ['backgroundColor', 'position'])).toEqual({
      backgroundColor: cssColour('#000000b2'),
      position: 'absolute',
    });
    expect(await style('[data-overlay]', ['position', 'top', 'left'])).toEqual({ position: 'fixed', top: '0px', left: '0px' });
    // Disabled Submit (empty email) is drawn unchanged; only the cursor changes.
    const submit = dialog.getByRole('button', { name: t.submit });
    await expect(submit).toHaveAttribute('aria-disabled', 'true');
    await submit.hover();
    expect(await style(fid(FID.forgotPassword.submit), ['cursor', 'opacity', 'backgroundColor'])).toEqual({
      cursor: 'not-allowed',
      opacity: '1',
      backgroundColor: cssColour('#006a36'),
    });
    // The close X stays at opacity 0 on hover too (FR-39).
    await dialog.getByRole('button', { name: t.close }).hover();
    expect(await style(fid(FID.forgotPassword.closeButton), ['opacity', 'cursor'])).toEqual({ opacity: '0', cursor: 'pointer' });
  });

  test('keyboard: focus starts on Email, Tab cycles Close → help → Email → Coach → Cancel → Submit and wraps both ways', async ({
    page,
  }) => {
    const dialog = await openModal(page);
    const email = dialog.getByRole('textbox', { name: t.emailAccessibleLabel });
    await expect(email).toBeFocused();
    const order = [
      dialog.getByRole('button', { name: t.close }),
      dialog.getByRole('button', { name: t.helpIconLabel }),
      email,
      dialog.getByRole('link', { name: coachName }),
      dialog.getByRole('button', { name: t.cancel }),
      dialog.getByRole('button', { name: t.submit }),
    ];
    // From Email, Tab walks the rest, then wraps to Close and on to Email.
    for (const control of [...order.slice(3), ...order.slice(0, 3)]) {
      await page.keyboard.press('Tab');
      await expect(control).toBeFocused();
    }
    for (const control of [...order.slice(0, 2).reverse(), ...order.slice(2).reverse()]) {
      await page.keyboard.press('Shift+Tab');
      await expect(control).toBeFocused();
    }
    // The close X shows (opacity 1) with the FR-9 ring on keyboard focus only.
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    const close = order[0];
    await expect(close).toBeFocused();
    expect(
      await close.evaluate((el) => {
        const cs = getComputedStyle(el);
        return `${cs.opacity} ${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`;
      }),
    ).toBe('1 solid 2px rgb(0, 106, 54)');
    // The help tooltip shows on keyboard focus.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tooltip')).toHaveText(t.helpTooltip);
  });

  test('validation on blur, then the confirmation; no request is sent, no console output', async ({ page }) => {
    const messages = [];
    page.on('console', (msg) => messages.push(`${msg.type()}: ${msg.text()}`));
    page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
    const dialog = await openModal(page);
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));

    const email = dialog.getByRole('textbox', { name: t.emailAccessibleLabel });
    await email.fill('a@b');
    await expect(dialog.getByText(t.invalidEmail)).toHaveCount(0);
    await page.keyboard.press('Tab'); // blur → message
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await email.getAttribute('aria-describedby');
    await expect(page.locator(`[id="${describedBy}"]`)).toHaveText(t.invalidEmail);
    // The footer moved down by the message height (FR-45).
    const footerBox = await page.locator(fid(FID.forgotPassword.footer)).boundingBox();
    expect(Math.abs(footerBox.y - (499 + 20))).toBeLessThanOrEqual(1);

    await email.fill('farmer@suretrack.example');
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
    await email.press('Enter');
    await expect(dialog.locator(fid(FID.forgotPassword.body)).getByText(t.confirmation)).toBeVisible();
    await expect(dialog.getByRole('button', { name: t.submit })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: t.cancel })).toBeFocused();
    // requestPasswordReset() sends nothing: no request at all after the modal opened.
    expect(requests).toEqual([]);
    expect(messages).toEqual([]);
  });

  test('close: Esc, backdrop click, Cancel and the close X unmount the modal and refocus the trigger; inside clicks do not', async ({ page }) => {
    const forgot = page.getByRole('button', { name: login.forgotLink });
    for (const close of [
      (dialog) => dialog.press('Escape'),
      () => page.mouse.click(100, 100),
      (dialog) => dialog.getByRole('button', { name: t.cancel }).click(),
      (dialog) => dialog.getByRole('button', { name: t.close }).click(),
    ]) {
      const dialog = await openModal(page);
      await page.getByRole('textbox', { name: t.emailAccessibleLabel }).fill('typed@farm.com');
      await dialog.locator(fid(FID.forgotPassword.body)).click({ position: { x: 500, y: 200 } });
      await expect(dialog).toBeVisible();
      await close(dialog);
      await expect(dialog).toHaveCount(0);
      await expect(forgot).toBeFocused();
      await expect(page.locator('#overlay-root')).toBeEmpty();
    }
  });

  test('opens from the expired-password banner and returns focus there', async ({ page }) => {
    await openLogin(page);
    const expired = users.users.find((user) => user.passwordExpired === true);
    await page.getByLabel(login.usernameLabel).fill(expired.username);
    await page.getByLabel(login.passwordLabel).fill(expired.password);
    await page.getByLabel(login.passwordLabel).press('Enter');
    const reset = page.getByRole('button', { name: login.errors.resetPasswordLink });
    await expect(reset).toBeVisible({ timeout: 5_000 });
    await expect(reset).not.toHaveAttribute('aria-disabled', /.*/);
    await reset.click();
    const dialog = page.getByRole('dialog', { name: t.title });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(reset).toBeFocused();
  });
});
