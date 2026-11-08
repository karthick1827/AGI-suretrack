// Figma assets are byte-identical (AD-5, FR-6) and rasters fit the budget (FR-7).
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { FIGMA_ASSETS, fromRoot } from './support/project.js';

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const ICONS = fromRoot('src/assets/icons');
const HAND_AUTHORED = ['chevron-right.svg'];

const figmaSvgs = ['login', 'dashboard'].flatMap((dir) =>
  readdirSync(path.join(FIGMA_ASSETS, dir))
    .filter((name) => name.endsWith('.svg'))
    .map((name) => [name, path.join(FIGMA_ASSETS, dir, name)]),
);

describe('src/assets/icons — Figma SVGs, byte-identical', () => {
  it('copies every exported SVG', () => {
    expect(figmaSvgs.length).toBe(26); // + logout.svg, exported from 6026:52937 (Story 2.1)
  });

  it.each(figmaSvgs)('%s matches its Figma export checksum', (name, source) => {
    expect(sha256(path.join(ICONS, name))).toBe(sha256(source));
  });

  it('holds nothing else except the hand-authored chevron', () => {
    const expected = [...figmaSvgs.map(([name]) => name), ...HAND_AUTHORED].sort();
    expect(readdirSync(ICONS).sort()).toEqual(expected);
  });

  it('chevron-right.svg is 12×16 in #006A36 (the only hand-made icon)', () => {
    const svg = readFileSync(path.join(ICONS, 'chevron-right.svg'), 'utf8');
    expect(svg).toMatch(/width="12"/);
    expect(svg).toMatch(/height="16"/);
    expect(svg).toMatch(/viewBox="0 0 12 16"/);
    const colours = svg.match(/#[0-9a-fA-F]{6}\b/g);
    expect(new Set(colours)).toEqual(new Set(['#006A36']));
  });
});

describe('raster assets', () => {
  it.each(['login-bg.webp', 'login-bg.jpg'])('%s is 2732 px wide and ≤ 600 KB', async (name) => {
    const file = fromRoot('src/assets', name);
    expect(statSync(file).size).toBeLessThanOrEqual(600 * 1024);
    const meta = await sharp(file).metadata();
    expect(meta.width).toBe(2732);
    expect(meta.format).toBe(name.endsWith('.webp') ? 'webp' : 'jpeg');
  });

  it('avatar.png is avatar3.png, unmodified', () => {
    expect(sha256(fromRoot('src/assets/avatar.png'))).toBe(
      sha256(path.join(FIGMA_ASSETS, 'dashboard/avatar3.png')),
    );
  });

  it('ships no starter assets', () => {
    expect(readdirSync(fromRoot('src/assets')).sort()).toEqual(
      ['avatar.png', 'icons', 'login-bg.jpg', 'login-bg.webp'],
    );
  });
});
