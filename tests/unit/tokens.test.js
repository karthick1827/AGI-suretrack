// Token presence (AD-2, FR-1..FR-5) and self-hosted font rules (AD-6).
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  BRIEF_DIR,
  PRD_DIR,
  customProperties,
  fromRoot,
  readText,
  section,
} from './support/project.js';

const tokensCss = readText(fromRoot('src/styles/tokens.css'));
const tokens = customProperties(tokensCss);
const norm = (value) => value.replace(/\s+/g, '').toLowerCase();
const tokenValues = [...tokens.values()].map(norm);

const brief = readText(path.join(BRIEF_DIR, 'addendum.md'));
const partA = section(brief, '## Part A', '## Part B');
const partB = brief.slice(brief.indexOf('## Part B'));
const partATokens = section(partA, '### 1. Design tokens', '### 2. Login frame');
const partBTokens = section(partB, '### 1. Design tokens', '### 2. Page shell');

// Same colour written two ways in one addendum row: Figma's 8-digit hex for the
// Shadow/Lg colour (the effect is copied as the CSS the addendum gives), and the
// rgba() gloss next to the alpha-white/50 variable value.
const EQUIVALENT = { '#27272726': 'rgba(39,39,39,0.15)', 'rgba(255,255,255,0.5)': '#ffffff80' };

function colourLiterals(text) {
  const hexes = text.match(/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/g) ?? [];
  const rgbas = text.match(/rgba\([^)]*\)/g) ?? [];
  return [...new Set([...hexes, ...rgbas])];
}

function isTokenised(literal) {
  const wanted = norm(EQUIVALENT[literal] ?? literal);
  return tokenValues.some((value) => value === wanted || value.includes(wanted));
}

describe('tokens.css — every Figma colour is a token, verbatim', () => {
  const literals = [...colourLiterals(partATokens), ...colourLiterals(partBTokens)];

  it('finds the colour tables in the brief addendum', () => {
    expect(literals.length).toBeGreaterThan(60);
  });

  it.each(literals)('%s is present as a token value', (literal) => {
    expect(isTokenised(literal)).toBe(true);
  });
});

describe('tokens.css — Figma variables named by path (PRD FR-1)', () => {
  const prd = readText(path.join(PRD_DIR, 'prd.md'));
  const fr1 = section(prd, '#### FR-1:', '#### FR-2:');
  const pairs = [...fr1.matchAll(/`([a-z0-9][a-z0-9/_-]*)` `(#[0-9a-f]{6,8})`/g)].map((m) => [m[1], m[2]]);
  const tokenName = (figmaPath) => `--${figmaPath.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  it('extracts the FR-1 variable list', () => {
    expect(pairs.length).toBeGreaterThan(40);
  });

  it.each(pairs)('%s = %s', (figmaPath, value) => {
    expect(tokens.get(tokenName(figmaPath))).toBe(value);
  });
});

describe('tokens.css — near-duplicates stay separate (AD-2)', () => {
  it.each([
    ['--raw-c62828', '#C62828'],
    ['--raw-dc2626', '#DC2626'],
    ['--raw-ff0000', '#FF0000'],
    ['--raw-f3f4f6', '#F3F4F6'],
    ['--raw-f3f4f4', '#F3F4F4'],
  ])('%s is %s', (name, value) => {
    expect(tokens.get(name)).toBe(value);
  });

  it('the three reds and two page greys are five distinct tokens', () => {
    const names = ['--raw-c62828', '--raw-dc2626', '--raw-ff0000', '--raw-f3f4f6', '--raw-f3f4f4'];
    expect(new Set(names.map((n) => tokens.get(n))).size).toBe(5);
  });
});

describe('tokens.css — shadows, font stacks, z-index', () => {
  it('holds both shadows verbatim', () => {
    expect(tokens.get('--shadow-card')).toBe('0 2px 2px rgba(39,39,39,0.1)');
    expect(tokens.get('--shadow-lg')).toBe('0 12px 20px -2px rgba(39,39,39,0.15)');
  });

  it('holds the AD-6 font stacks', () => {
    expect(tokens.get('--font-stack-sf-pro')).toBe(
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", sans-serif',
    );
    expect(tokens.get('--font-stack-roboto')).toMatch(/^"Roboto"/);
    expect(tokens.get('--font-stack-inter')).toMatch(/^"Inter"/);
  });

  it('defines an increasing z-index scale', () => {
    const scale = [...tokens.entries()].filter(([name]) => name.startsWith('--z-'));
    expect(scale.length).toBeGreaterThanOrEqual(4);
    for (const [, value] of scale) expect(value).toMatch(/^\d+$/);
    expect(Number(tokens.get('--z-overlay-modal'))).toBeGreaterThan(Number(tokens.get('--z-overlay-backdrop')));
    expect(Number(tokens.get('--z-overlay-backdrop'))).toBeGreaterThan(Number(tokens.get('--z-header')));
  });

  it('is the only stylesheet in src/ declaring colour literals in :root', () => {
    const styles = readdirSync(fromRoot('src/styles'));
    expect(styles.sort()).toEqual(['fonts.css', 'reset.css', 'tokens.css']);
    const reset = readText(fromRoot('src/styles/reset.css'));
    expect(reset).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|font-family/i);
  });
});

describe('fonts.css — own @font-face, font-display: block (AD-6)', () => {
  const fontsCss = readText(fromRoot('src/styles/fonts.css'));
  const faces = [...fontsCss.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]);
  const prop = (face, name) => face.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1].trim();

  it('declares Roboto 400–800 and Inter 400–700', () => {
    const declared = faces.map((f) => `${prop(f, 'font-family')} ${prop(f, 'font-weight')}`).sort();
    expect(declared).toEqual(
      [
        ...[400, 500, 600, 700, 800].map((w) => `"Roboto" ${w}`),
        ...[400, 500, 600, 700].map((w) => `"Inter" ${w}`),
      ].sort(),
    );
  });

  it.each(faces.map((f, i) => [i, f]))('face %i uses font-display: block and a local latin WOFF2', (_, face) => {
    expect(prop(face, 'font-display')).toBe('block');
    const url = face.match(/url\("([^"]+)"\)/)[1];
    expect(url).toMatch(/^@fontsource\/(roboto|inter)\/files\/(roboto|inter)-latin-\d00-normal\.woff2$/);
    expect(existsSync(fromRoot('node_modules', url))).toBe(true);
  });

  it('never imports package CSS or a CDN', () => {
    expect(fontsCss).not.toMatch(/@import|https?:\/\//);
    const sources = ['src/app/main.jsx', 'src/app/App.jsx'].map((f) => readFileSync(fromRoot(f), 'utf8'));
    for (const source of sources) {
      expect(source).not.toMatch(/@fontsource\/(roboto|inter)['"/]/);
    }
    expect(readText(fromRoot('index.html'))).not.toMatch(/fonts\.googleapis|fonts\.gstatic|@fontsource/);
  });
});
