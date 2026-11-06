// fonts.css: the Roboto metric overrides match Figma's Roboto build (Story 1.2).
import { describe, expect, it } from 'vitest';
import { fromRoot, readText } from './support/project.js';

const css = readText(fromRoot('src/styles/fonts.css')).replace(/\/\*[\s\S]*?\*\//g, '');
const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
const prop = (face, name) => face.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1].trim();
const roboto = faces.filter((face) => prop(face, 'font-family') === '"Roboto"');
const inter = faces.filter((face) => prop(face, 'font-family') === '"Inter"');

describe('fonts.css — Roboto metric overrides', () => {
  it('declares the five Roboto faces 400–800', () => {
    expect(roboto.map((face) => prop(face, 'font-weight'))).toEqual(['400', '500', '600', '700', '800']);
  });

  it.each(['400', '500', '600', '700', '800'])('Roboto %s: ascent 92.77%%, descent 24.41%%, line gap 0%%', (weight) => {
    const face = roboto.find((f) => prop(f, 'font-weight') === weight);
    expect(prop(face, 'ascent-override')).toBe('92.77%');
    expect(prop(face, 'descent-override')).toBe('24.41%');
    expect(prop(face, 'line-gap-override')).toBe('0%');
  });

  it('leaves the Inter faces without overrides', () => {
    expect(inter).toHaveLength(4);
    for (const face of inter) expect(face).not.toMatch(/-override/);
  });
});
