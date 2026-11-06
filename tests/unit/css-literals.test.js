// scripts/check-css-literals.mjs — the AD-2 lint gate.
import { describe, expect, it } from 'vitest';
import { findLiteralViolations } from '../../scripts/check-css-literals.mjs';

const reasons = (css) => findLiteralViolations(css).map((v) => v.reason);

describe('findLiteralViolations', () => {
  it('accepts tokens and literal px geometry', () => {
    const css = `
      .card { color: var(--raw-1f2937); border: 1px solid var(--raw-d1d5db); width: 392.4285px; }
      .title { font-family: var(--font-stack-roboto); font-weight: 600; }
      .shadow { filter: drop-shadow(var(--shadow-card)); }
      .x:hover { cursor: pointer; } /* #ffffff in a comment is fine */
      .inherit { font-family: inherit; }
    `;
    expect(findLiteralViolations(css)).toEqual([]);
  });

  it('flags hex colours', () => {
    expect(reasons('.a { color: #fff; }')).toEqual(['hex colour literal']);
    expect(reasons('.a { background: linear-gradient(#009926, var(--raw-006633)); }')).toEqual(['hex colour literal']);
  });

  it('flags rgb()/rgba()', () => {
    expect(reasons('.a { border-bottom: 1px solid rgba(30,42,44,0.15); }')).toEqual(['rgb()/rgba()/hsl() colour literal']);
    expect(reasons('.a { color: rgb(0 0 0); }')).toEqual(['rgb()/rgba()/hsl() colour literal']);
  });

  it('flags a hex fallback inside var()', () => {
    expect(reasons('.a { color: var(--x, #fff); }')).toEqual(['hex colour literal']);
  });

  it('flags font-family literals, including in the font shorthand', () => {
    expect(reasons('.a { font-family: Roboto, sans-serif; }')).toEqual(['font-family literal']);
    expect(reasons('.a { font-family: var(--font-stack-roboto), sans-serif; }')).toEqual(['font-family literal']);
    expect(reasons('.a { font: 600 20px/24px "Roboto"; }')).toEqual(['font-family literal in font shorthand']);
  });

  it('reports the line number', () => {
    expect(findLiteralViolations('.a {\n  width: 1px;\n  color: #000;\n}')[0].line).toBe(3);
  });
});
