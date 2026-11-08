// Story 1.4 — the FR-32 alert banner in a real browser against the production
// bundle: its position and style for one case (wrong credentials), the FR-30
// disabled Login button, and the at-rest page still matching the Story 1.2
// Figma baseline (the banner never renders at rest).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { ATTEMPTS_KEY } from '../../src/lib/session.js';
import {
  LOGIN_PHOTO_MASK,
  MASK_COLOR,
  MASKED_BASELINE_DIR,
  cssColour,
  diffRatio,
  installMask,
  waitForFonts,
} from './support/fidelity.js';

const BASELINE = 'login-6026-60111.png';
const config = JSON.parse(readFileSync(path.resolve('public/app-config.json'), 'utf8'));
const t = copy.login;

// Login column top (FR-15) + logo 24 + gap 40 = the form stack's page y.
const COLUMN_LEFT = 90;
const FORM_TOP = 127.039 + 24 + 40;
const near = (actual, expected) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.5);

async function openLogin(page) {
  await page.goto(paths.login());
  await page.locator(`[data-fid="${FID.frames.login}"]`).waitFor();
  await waitForFonts(page);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  await expect(page.getByRole('link', { name: t.privacyPolicy })).toHaveAttribute('href', config.legal.privacyPolicyUrl);
}

test.describe('Sign-in failure banner (FR-26, FR-30, FR-32)', () => {
  test('at rest: no banner, and the page still matches the Story 1.2 Figma baseline (≤ 0.5 %)', async ({ page }) => {
    await openLogin(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: t.submit })).toBeEnabled();
    const mask = [await installMask(page, LOGIN_PHOTO_MASK)];
    const actual = await page.screenshot({ mask, maskColor: MASK_COLOR, animations: 'disabled', caret: 'hide' });
    const ratio = await diffRatio(actual, readFileSync(path.join(MASKED_BASELINE_DIR, BASELINE)));
    process.stdout.write(`[fidelity] ${BASELINE} (Story 1.4 at rest): pixel-diff ratio ≤ ${(ratio * 100).toFixed(3)} %\n`);
    await expect(page).toHaveScreenshot(BASELINE, { mask, maskColor: MASK_COLOR });
  });

  test('wrong credentials: banner under the title, FR-32 style, content below moved down', async ({ page }) => {
    await openLogin(page);
    const username = page.getByLabel(t.usernameLabel);
    const password = page.getByLabel(t.passwordLabel);
    await username.fill('demo');
    await password.fill('x');
    await password.press('Enter');

    const banner = page.getByRole('alert');
    await expect(banner).toHaveText(t.errors.wrongCredentials, { timeout: 5_000 });
    await expect(username).toHaveValue('demo');
    await expect(password).toHaveValue('');
    await expect(password).toBeFocused();

    const box = async (locator) => locator.boundingBox();
    const bannerBox = await box(banner);
    const titleBox = await box(page.locator(`[data-fid="${FID.login.title}"]`));
    const labelBox = await box(page.locator(`[data-fid="${FID.login.usernameLabel}"]`));
    near(bannerBox.x, COLUMN_LEFT);
    near(bannerBox.width, 392.43);
    near(titleBox.y, FORM_TOP);
    near(bannerBox.y, titleBox.y + titleBox.height + 16);
    near(labelBox.y, bannerBox.y + bannerBox.height + 24);
    // One line of text: 20px + 2 × 8px padding + 2 × 1px border.
    near(bannerBox.height, 38);

    // Everything below keeps its order and stays inside the 768px frame.
    const order = [
      FID.login.usernameGroup,
      FID.login.passwordGroup,
      FID.login.loginButton,
      FID.login.forgotLinkBox,
      FID.login.legalText,
    ];
    let previousBottom = bannerBox.y + bannerBox.height;
    for (const fid of order) {
      const element = await box(page.locator(`[data-fid="${fid}"]`));
      expect(element.y).toBeGreaterThanOrEqual(previousBottom);
      previousBottom = element.y + element.height;
    }
    expect(previousBottom).toBeLessThanOrEqual(768);
    near((await box(page.locator(`[data-fid="${FID.login.formColumn}"]`))).y, 127.039);

    const style = await banner.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        background: cs.backgroundColor,
        borderTop: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        borderLeft: `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor}`,
        radius: cs.borderTopLeftRadius,
        padding: cs.padding,
        family: cs.fontFamily,
        weight: cs.fontWeight,
        size: cs.fontSize,
        lineHeight: cs.lineHeight,
        color: cs.color,
      };
    });
    expect(style).toEqual({
      background: cssColour('#ffffff'),
      borderTop: `1px solid ${cssColour('#dc2626')}`,
      borderLeft: `1px solid ${cssColour('#dc2626')}`,
      radius: '8px',
      padding: '8px 16px',
      family: expect.stringMatching(/^"?Roboto"?/),
      weight: '400',
      size: '14px',
      lineHeight: '20px',
      color: cssColour('#111827'),
    });
  });

  test('during a lockout Login is disabled at opacity 0.5 and the banner shows the time', async ({ page }) => {
    await page.addInitScript(
      ({ key }) => localStorage.setItem(key, JSON.stringify({ count: 5, lockedUntil: Date.now() + 15 * 60_000 })),
      { key: ATTEMPTS_KEY },
    );
    await openLogin(page);
    const button = page.getByRole('button', { name: t.submit });
    await expect(button).toBeDisabled();
    expect(await button.evaluate((el) => [getComputedStyle(el).opacity, getComputedStyle(el).cursor])).toEqual([
      '0.5',
      'not-allowed',
    ]);
    await expect(page.getByRole('alert')).toHaveText(/^Too many sign-in attempts\. You can try again at .+\.$/);
  });
});
