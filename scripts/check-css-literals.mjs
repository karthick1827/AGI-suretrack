// Lint gate for AD-2: component CSS Modules may use colours and font families
// only through var(--…). Fails (exit 1) if any src/**/*.module.css contains a
// hex colour, rgb()/rgba()/hsl()/hsla(), or a font-family literal outside a
// var(--token) reference. Literal px geometry is allowed. Tokens live only in
// src/styles/tokens.css.
//
//   node scripts/check-css-literals.mjs        (part of `npm run lint`)

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COLOR_FUNCTION = /\b(?:rgba?|hsla?)\s*\(/i;
const HEX = /#[0-9a-f]{3,8}\b/i;
const FONT_FAMILY_KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);
const FONT_FAMILY_NAMES = /["']|\b(?:serif|sans-serif|monospace|cursive|fantasy|system-ui|-apple-system|BlinkMacSystemFont|Roboto|Inter|SF Pro)\b/i;
// A var() with no fallback. A fallback (`var(--x, #fff)`) is itself a literal.
const PURE_VAR = /var\(\s*--[\w-]+\s*\)/g;

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

/** Returns `{ line, property, value, reason }` for every violation in `css`. */
export function findLiteralViolations(css) {
  // Blank out comments but keep newlines so line numbers stay correct.
  const source = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
  const violations = [];
  const declaration = /([a-zA-Z-]+)\s*:\s*([^;{}]+)(?=[;}])/g;
  for (const match of source.matchAll(declaration)) {
    const property = match[1].toLowerCase();
    const value = match[2].trim();
    const residue = value.replace(PURE_VAR, '');
    const line = lineOf(source, match.index);
    if (HEX.test(residue)) {
      violations.push({ line, property, value, reason: 'hex colour literal' });
    }
    if (COLOR_FUNCTION.test(residue)) {
      violations.push({ line, property, value, reason: 'rgb()/rgba()/hsl() colour literal' });
    }
    if (property === 'font-family') {
      const rest = residue.replace(/[\s,]+/g, ' ').trim();
      if (rest !== '' && !FONT_FAMILY_KEYWORDS.has(rest.toLowerCase())) {
        violations.push({ line, property, value, reason: 'font-family literal' });
      }
    } else if (property === 'font' && FONT_FAMILY_NAMES.test(residue)) {
      violations.push({ line, property, value, reason: 'font-family literal in font shorthand' });
    }
  }
  return violations;
}

async function listModuleCss(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listModuleCss(full)));
    else if (entry.name.endsWith('.module.css')) files.push(full);
  }
  return files;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const files = await listModuleCss(path.join(root, 'src'));
  let count = 0;
  for (const file of files) {
    const violations = findLiteralViolations(await readFile(file, 'utf8'));
    for (const v of violations) {
      count += 1;
      process.stderr.write(
        `${path.relative(root, file)}:${v.line}  ${v.reason}: ${v.property}: ${v.value}\n`,
      );
    }
  }
  if (count > 0) {
    process.stderr.write(`\ncheck-css-literals: ${count} violation(s). Use var(--token) from src/styles/tokens.css.\n`);
    process.exit(1);
  }
  process.stdout.write(`check-css-literals: ${files.length} CSS Module file(s) clean.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
