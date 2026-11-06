// scripts/check-css-literals.mjs — the AD-2 lint gate.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { findLiteralViolations } from '../../scripts/check-css-literals.mjs';
import { fromRoot } from './support/project.js';

const reasons = (css) => findLiteralViolations(css).map((v) => v.reason);

describe('findLiteralViolations', () => {
  it('accepts tokens and literal px geometry', () => {
    const css = `
      .card { color: var(--raw-1f2937); border: 1px solid var(--raw-d1d5db); width: 392.4285px; }
      .title { font-family: var(--font-stack-roboto); font-weight: 600; }
      .shadow { filter: drop-shadow(var(--shadow-card)); }
      .x:hover { cursor: pointer; } /* #ffffff in a comment is fine */
      .inherit { font-family: inherit; }
      .keywords { color: currentColor; background: transparent; border-color: inherit; outline-color: unset; fill: initial; }
      .important { font-family: var(--font-stack-sf-pro) !important; color: var(--raw-111827) !important; }
      .font { font: 600 20px/24px var(--font-stack-roboto); }
      .fontvar { font: var(--x); }
      .url { mask: url(#abc); background: url("a;b}#fff.svg") no-repeat; }
      .content { content: "red #fff ; }"; }
      .anim { animation-name: tan; }
    `;
    expect(findLiteralViolations(css)).toEqual([]);
  });

  it('flags hex colours', () => {
    expect(reasons('.a { color: #fff; }')).toEqual(['hex colour literal']);
    expect(reasons('.a { background: linear-gradient(#009926, var(--raw-006633)); }')).toEqual(['hex colour literal']);
  });

  it.each([
    'rgba(30,42,44,0.15)',
    'rgb(0 0 0)',
    'hsl(120 50% 50%)',
    'hwb(120 0% 0%)',
    'lab(50% 40 59)',
    'lch(52% 72 56)',
    'oklab(0.6 0.1 0.1)',
    'oklch(0.6 0.2 30)',
    'color(display-p3 1 0 0)',
  ])('flags the colour function %s', (fn) => {
    expect(reasons(`.a { border-bottom: 1px solid ${fn}; }`)).toEqual(['colour function literal']);
  });

  it.each(['red', 'White', 'rebeccapurple', 'tan'])('flags the named colour %s', (name) => {
    expect(reasons(`.a { color: ${name}; }`)).toEqual(['named colour literal']);
  });

  it('flags a hex fallback inside var()', () => {
    expect(reasons('.a { color: var(--x, #fff); }')).toEqual(['hex colour literal']);
  });

  it('flags font-family literals, including in the font shorthand', () => {
    expect(reasons('.a { font-family: Roboto, sans-serif; }')).toEqual(['font-family literal']);
    expect(reasons('.a { font-family: var(--font-stack-roboto), sans-serif; }')).toEqual(['font-family literal']);
    expect(reasons('.a { font-family: Roboto !important; }')).toEqual(['font-family literal']);
    expect(reasons('.a { font: 600 20px/24px "Roboto"; }')).toEqual(['font-family literal in font shorthand']);
    expect(reasons('.a { font: italic bold 12px/30px Georgia, serif; }')).toEqual(['font-family literal in font shorthand']);
    expect(reasons('.a { font: 16px var(--font-stack-roboto), Arial; }')).toEqual(['font-family literal in font shorthand']);
  });

  it('does not let ; or } inside strings or url() split a declaration', () => {
    expect(reasons('.a { background: url("x;y}.png") #fff; }')).toEqual(['hex colour literal']);
  });

  it('reports the line number', () => {
    expect(findLiteralViolations('.a {\n  width: 1px;\n  color: #000;\n}')[0].line).toBe(3);
  });
});

describe('check-css-literals CLI', () => {
  let dir;
  const run = (...args) =>
    spawnSync(process.execPath, [fromRoot('scripts/check-css-literals.mjs'), ...args], {
      cwd: fromRoot(),
      encoding: 'utf8',
    });

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'css-literals-'));
    mkdirSync(path.join(dir, 'bad', 'features', 'Card'), { recursive: true });
    mkdirSync(path.join(dir, 'bad', 'styles'), { recursive: true });
    mkdirSync(path.join(dir, 'clean', 'ui'), { recursive: true });
    writeFileSync(path.join(dir, 'bad', 'features', 'Card', 'Card.module.css'), '.card {\n  width: 10px;\n  color: #C62828;\n}\n');
    writeFileSync(path.join(dir, 'bad', 'features', 'Card', 'plain.css'), '.x { font-family: Roboto; }\n');
    // Files under styles/ are the token layer and are exempt.
    writeFileSync(path.join(dir, 'bad', 'styles', 'tokens.css'), ':root { --raw-c62828: #C62828; }\n');
    writeFileSync(path.join(dir, 'clean', 'ui', 'Chip.module.css'), '.chip { color: var(--raw-000000); width: 66px; }\n');
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('exits non-zero and prints file:line for a literal in any .css outside styles/', () => {
    const result = run(path.join(dir, 'bad'));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Card\.module\.css:3 {2}hex colour literal/);
    expect(result.stderr).toMatch(/plain\.css:1 {2}font-family literal/);
    expect(result.stderr).not.toMatch(/tokens\.css:\d/);
  });

  it('exits 0 for a clean fixture', () => {
    const result = run(path.join(dir, 'clean'));
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/1 CSS file\(s\) clean/);
  });

  it('exits 0 for the real src/ tree', () => {
    expect(run().status).toBe(0);
  });
});
