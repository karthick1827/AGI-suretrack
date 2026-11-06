// Shared helpers for unit tests: project paths and source documents.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const fromRoot = (...parts) => path.join(ROOT, ...parts);

export const BRIEF_DIR = fromRoot('_acl-output/planning-artifacts/briefs/brief-agi-cursor2-2026-11-05');
export const PRD_DIR = fromRoot('_acl-output/planning-artifacts/prds/prd-agi-cursor2-2026-11-05');
export const FIGMA_ASSETS = path.join(BRIEF_DIR, 'figma-assets');

export const readText = (file) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

/** Text between the first `startHeading` (after `from`) and the next `endHeading`. */
export function section(text, startHeading, endHeading, from = 0) {
  const start = text.indexOf(startHeading, from);
  if (start < 0) throw new Error(`heading not found: ${startHeading}`);
  const end = text.indexOf(endHeading, start + startHeading.length);
  if (end < 0) throw new Error(`heading not found: ${endHeading}`);
  return text.slice(start, end);
}

/** The first ```json fenced block after `heading` in `text`. */
export function jsonBlockAfter(text, heading) {
  const at = text.indexOf(heading);
  if (at < 0) throw new Error(`heading not found: ${heading}`);
  const fence = text.indexOf('```json\n', at);
  if (fence < 0) throw new Error(`no \`\`\`json fence after heading: ${heading}`);
  const open = fence + '```json\n'.length;
  const close = text.indexOf('\n```', open);
  if (close < 0) throw new Error(`unclosed \`\`\`json fence after heading: ${heading}`);
  return text.slice(open, close) + '\n';
}

/** `--name: value;` declarations of a CSS file as a Map (comments removed). */
export function customProperties(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const map = new Map();
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) map.set(m[1], m[2].trim());
  return map;
}
