// Fidelity check — signed-in shell (Story 2.1): Header 6227:63670 and the
// profile panel 6026:52937 vs their 1× Figma exports, plus the measurement
// and copy audits (FR-50–FR-55, FR-58, AD-14, AD-15, AD-17).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { copy } from '../../src/lib/copy.js';
import { FID } from '../../src/lib/fid.js';
import { paths } from '../../src/lib/paths.js';
import { SESSION_KEY, createSessionRecord } from '../../src/lib/session.js';
import {
  HEADER_BASELINE,
  HEADER_CLIP,
  HEADER_MASK,
  MASK_COLOR,
  MASKED_BASELINE_DIR,
  PROFILE_MENU_BASELINE,
  PROFILE_MENU_CLIP,
  PROFILE_MENU_MASK,
  PROFILE_MENU_VIEWPORT,
  copyAudit,
  cssColour,
  diffRatio,
  installMask,
  measurementAudit,
  offsetRects,
  readExpected,
  waitForFonts,
} from './support/fidelity.js';

const users = JSON.parse(readFileSync(path.resolve('src/data/json/users.json'), 'utf8'));
// The badge reading comes from the state document, never a hard-coded value.
const fullDoc = JSON.parse(readFileSync(path.resolve('src/data/json/dashboard.full.json'), 'utf8'));
const BADGE = String(fullDoc.header.bellBadge);
const demo = users.users.find((user) => user.username === 'demo');
const s = copy.shell;
const fid = (page, id) => page.locator(`[data-fid="${id}"]`);

/** Sign in as `demo` by writing the Session record, then open `url` and wait for a stable render. */
async function openSignedIn(page, url = paths.dashboard()) {
  await page.goto(paths.login());
  const record = createSessionRecord(demo, { now: Date.now(), ttlMinutes: users.policy.sessionTtlMinutes });
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SESSION_KEY, JSON.stringify(record)]);
  await page.goto(url);
  await fid(page, FID.shell.header).waitFor();
  await expect(fid(page, FID.shell.badgeText)).toHaveText(BADGE);
  await waitForFonts(page);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
}

async function openMenu(page) {
  await page.getByRole('button', { name: s.avatarLabel }).click();
  const panel = fid(page, FID.frames.profileMenu);
  await panel.waitFor();
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  // Park the pointer outside the panel and the Header (no hover state in the capture).
  await page.mouse.move(600, 400);
  return panel;
}

async function compare(page, testInfo, { baseline, clip, rects }) {
  const mask = [await installMask(page, rects)];
  const actual = await page.screenshot({ clip, mask, maskColor: MASK_COLOR, animations: 'disabled', caret: 'hide' });
  const ratio = await diffRatio(actual, readFileSync(path.join(MASKED_BASELINE_DIR, baseline)));
  const note = `pixel-diff ratio ≤ ${(ratio * 100).toFixed(3)} % (YIQ threshold 0.1, no AA exclusion)`;
  testInfo.annotations.push({ type: 'pixel-diff', description: note });
  process.stdout.write(`[fidelity] ${baseline}: ${note}\n`);
  // maxDiffPixelRatio / threshold come from playwright.config.js (single source).
  await expect(page).toHaveScreenshot(baseline, { clip, mask, maskColor: MASK_COLOR });
}

test.describe('Signed-in shell 6215:58878', () => {
  test('Header screenshot matches the Figma baseline (≤ 0.5 %, avatar masked)', async ({ page }, testInfo) => {
    await openSignedIn(page);
    await compare(page, testInfo, { baseline: HEADER_BASELINE, clip: HEADER_CLIP, rects: HEADER_MASK });
  });

  test('profile panel screenshot matches the Figma baseline (≤ 0.5 %, AD-14 omissions masked)', async ({ page }, testInfo) => {
    await page.setViewportSize(PROFILE_MENU_VIEWPORT);
    await openSignedIn(page);
    await openMenu(page);
    await compare(page, testInfo, {
      baseline: PROFILE_MENU_BASELINE,
      clip: PROFILE_MENU_CLIP,
      rects: offsetRects(PROFILE_MENU_MASK, PROFILE_MENU_CLIP.x, PROFILE_MENU_CLIP.y),
    });
  });

  test('measurement audit: Header and title strip, every data-fid box ±1 px, exact styles', async ({ page }) => {
    await openSignedIn(page);
    expect(await measurementAudit(page, readExpected('header.json'))).toEqual([]);

    // FR-55 title text (no Figma id of its own): box at 24, 80 and exact type.
    const title = page.getByRole('heading', { level: 1 });
    const box = await title.boundingBox();
    expect(Math.abs(box.x - 24)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.y - 80)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.height - 32)).toBeLessThanOrEqual(1);
    expect(
      await title.evaluate((el) => {
        const cs = getComputedStyle(el);
        return [cs.color, cs.fontFamily.split(',')[0].replace(/"/g, ''), cs.fontWeight, cs.fontSize, cs.lineHeight, cs.letterSpacing, cs.textOverflow];
      }),
    ).toEqual([cssColour('#09090b'), 'Roboto', '600', '24px', '32px', '-0.6px', 'ellipsis']);

    // FR-50 canvas background and FR-52 active underline: a 4 px bottom stroke
    // drawn inside (as Figma does), so it never shifts the tab content.
    const tabStroke = await fid(page, FID.shell.navTabDashboard).evaluate((el) => {
      const cs = getComputedStyle(el);
      return [cs.boxShadow, cs.borderBottomWidth, cs.cursor];
    });
    expect(tabStroke).toEqual([`${cssColour('#006a36')} 0px -4px 0px 0px inset`, '0px', 'pointer']);
    const canvasBg = await page.locator('main').evaluate((el) => getComputedStyle(el.parentElement).backgroundColor);
    expect(canvasBg).toBe(cssColour('#f3f4f6'));
    // Header shadow: the generated-code drop-shadow (PRD Q-S2). A box-shadow
    // was measured and rejected: its blur matches the Figma render less well.
    const filter = await fid(page, FID.shell.header).evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toBe('drop-shadow(rgba(39, 39, 39, 0.1) 0px 2px 2px)');
  });

  test('measurement audit: profile panel ±1 px, exact styles', async ({ page }) => {
    await page.setViewportSize(PROFILE_MENU_VIEWPORT);
    await openSignedIn(page);
    await openMenu(page);
    expect(await measurementAudit(page, readExpected('profile-menu.json'))).toEqual([]);
  });

  test('copy audit: every string verbatim', async ({ page }) => {
    await openSignedIn(page);
    expect(
      await copyAudit(page, {
        [FID.shell.logo]: { alt: copy.brand.logoAlt },
        [FID.shell.navLabelDashboard]: { text: s.tabs.dashboard },
        [FID.shell.navLabelEquipment]: { text: s.tabs.equipment },
        [FID.shell.navLabelAlerts]: { text: s.tabs.alerts },
        [FID.shell.badgeText]: { text: BADGE },
        [FID.shell.pageTitle]: { text: s.pageTitles.dashboard },
      }),
    ).toEqual([]);
    await openMenu(page);
    expect(
      await copyAudit(page, {
        [FID.profileMenu.title]: { text: s.profileMenuTitle },
        [FID.profileMenu.logoutLabel]: { text: s.logout },
        [FID.frames.profileMenu]: { text: `${s.profileMenuTitle}${s.logout}` },
      }),
    ).toEqual([]);
    await expect(page.locator('body')).not.toContainText(/Farm Test|Henry Jones|My Preference|Account Settings/);
  });

  test('Equipment and Alerts: Coming soon inside the shell, matching tab active', async ({ page }) => {
    await openSignedIn(page);
    for (const [label, url, title] of [
      [s.tabs.equipment, paths.equipment(), s.pageTitles.equipment],
      [s.tabs.alerts, paths.alerts(), s.pageTitles.alerts],
    ]) {
      await page.getByRole('banner').getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`${url}$`));
      await expect(page.getByText(copy.placeholder.comingSoon)).toBeVisible();
      await expect(page.getByRole('banner').getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    }
    // Back returns to the Dashboard.
    await page.goBack();
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('profile menu: Esc and an outside click close it, focus returns to the avatar', async ({ page }) => {
    await openSignedIn(page);
    const avatar = page.getByRole('button', { name: s.avatarLabel });
    await openMenu(page);
    await expect(page.getByRole('button', { name: s.logout })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(fid(page, FID.frames.profileMenu)).toHaveCount(0);
    await expect(avatar).toBeFocused();

    await openMenu(page);
    await page.mouse.click(300, 300); // the page, outside the panel
    await expect(fid(page, FID.frames.profileMenu)).toHaveCount(0);
    await expect(avatar).toBeFocused();
  });

  test('focus ring: keyboard focus only, never at rest (FR-58, AD-13)', async ({ page }) => {
    await openSignedIn(page);
    const controls = [
      page.getByRole('banner').getByRole('link', { name: s.tabs.dashboard }),
      page.getByRole('banner').getByRole('link', { name: s.tabs.equipment }),
      page.getByRole('banner').getByRole('link', { name: s.tabs.alerts }),
      page.getByRole('button', { name: s.bellLabel }),
      page.getByRole('button', { name: s.avatarLabel }),
    ];
    const ring = (locator) =>
      locator.evaluate((el) => {
        const cs = getComputedStyle(el);
        return `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} ${cs.outlineOffset} ${cs.cursor}`;
      });
    for (const control of controls) expect(await ring(control)).toMatch(/^none .* pointer$/);
    await page.locator('body').click({ position: { x: 600, y: 500 } });
    for (const control of controls) {
      await page.keyboard.press('Tab');
      await expect(control).toBeFocused();
      expect(await ring(control)).toBe(`solid 2px ${cssColour('#006a36')} 2px pointer`);
    }
  });
});
