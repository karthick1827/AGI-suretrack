// Lint gate for AD-2: component CSS may use colours and font families only
// through var(--…). Fails (exit 1) if any src/**/*.css outside src/styles/
// contains:
//   - a hex colour, a CSS named colour, or a colour function
//     (rgb/rgba/hsl/hsla/hwb/lab/lch/oklab/oklch/color);
//   - a font-family literal, in `font-family` or in the `font` shorthand.
// Literal px geometry is allowed. Tokens live only in src/styles/tokens.css
// (fonts.css and reset.css sit in the same exempt folder).
//
//   node scripts/check-css-literals.mjs            (part of `npm run lint`)
//   node scripts/check-css-literals.mjs <dir>...   (scan other folders, e.g. fixtures)

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HEX = /#[0-9a-f]{3,8}(?![\w-])/i;
const COLOR_FUNCTION = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/i;
// A var() with no fallback. A fallback (`var(--x, #fff)`) is itself a literal.
const PURE_VAR = /var\(\s*--[\w-]+\s*\)/gi;
const IMPORTANT = /!\s*important\b/gi;
const GLOBAL_KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);

// CSS Color Module Level 4 named colours. `transparent` and `currentColor`
// are allowed: they carry no Figma value.
const NAMED_COLOURS = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
  'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta',
  'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
  'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink',
  'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen',
  'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow',
  'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon',
  'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
  'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine',
  'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
  'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream',
  'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
  'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple',
  'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell',
  'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white',
  'whitesmoke', 'yellow', 'yellowgreen',
];
const NAMED_COLOUR = new RegExp(`(?<![\\w-])(?:${NAMED_COLOURS.join('|')})(?![\\w-])`, 'i');
// Properties whose values are identifiers, not colours (e.g. `animation-name: tan`).
const NON_COLOUR_PROPERTIES = new Set([
  'composes', 'animation', 'animation-name', 'grid-area', 'grid-template-areas', 'grid-row',
  'grid-column', 'content', 'counter-reset', 'counter-increment', 'counter-set', 'will-change',
  'transition', 'transition-property', 'font-family', 'font', 'list-style-type', 'container-name',
  'view-transition-name', 'anchor-name', 'position-anchor',
]);

// Tokens that may appear in the `font` shorthand besides the family.
const FONT_SHORTHAND_KEYWORDS = new Set([
  'normal', 'italic', 'oblique', 'small-caps', 'bold', 'bolder', 'lighter',
  'ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'semi-expanded',
  'expanded', 'extra-expanded', 'ultra-expanded',
  'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'xxx-large',
  'smaller', 'larger', ...GLOBAL_KEYWORDS,
]);
const FONT_SIZE_OR_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([a-z%]+)?(\/[+-]?(\d+\.?\d*|\.\d+)([a-z%]+)?)?$|^\/[+-]?(\d+\.?\d*|\.\d+)([a-z%]+)?$|^\/$/i;

/**
 * Split CSS into declarations, honouring quotes and parentheses so that `;`
 * or `}` inside a string or url() never ends a value. Comments must already
 * be blanked. Returns `{ property, value, index }`.
 */
function declarations(source) {
  const out = [];
  let start = 0;
  let depth = 0;
  let i = 0;
  const flush = (end, isDeclarationEnd) => {
    if (isDeclarationEnd) {
      const text = source.slice(start, end);
      const colon = topLevelColon(text);
      if (colon > 0) {
        const lead = text.length - text.trimStart().length;
        out.push({
          property: text.slice(0, colon).trim().toLowerCase(),
          value: text.slice(colon + 1).trim(),
          index: start + lead,
        });
      }
    }
    start = end + 1;
  };
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'") {
      i = skipString(source, i);
      continue;
    }
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0 && (ch === ';' || ch === '}')) flush(i, true);
    else if (depth === 0 && ch === '{') flush(i, false); // selector / at-rule prelude
    i += 1;
  }
  return out;
}

function skipString(source, i) {
  const quote = source[i];
  let j = i + 1;
  while (j < source.length && source[j] !== quote) j += source[j] === '\\' ? 2 : 1;
  return j + 1;
}

function topLevelColon(text) {
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipString(text, i) - 1;
      continue;
    }
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ':' && depth === 0) {
      // Reject pseudo-class selectors such as `a:hover` left over without `{`.
      return /^\s*-{0,2}[a-zA-Z][\w-]*\s*$/.test(text.slice(0, i)) ? i : -1;
    }
  }
  return -1;
}

/** Blank url(...) bodies and quoted strings (for colour checks). */
function withoutUrlsAndStrings(value) {
  return value
    .replace(/url\(\s*(?:"[^"]*"|'[^']*'|[^)]*)\s*\)/gi, 'url()')
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

/** Returns `{ line, property, value, reason }` for every violation in `css`. */
export function findLiteralViolations(css) {
  // Blank out comments but keep newlines so line numbers stay correct.
  const source = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
  const violations = [];
  for (const { property, value, index } of declarations(source)) {
    if (property.startsWith('--')) continue; // custom properties are checked where used
    const line = lineOf(source, index);
    const base = value.replace(IMPORTANT, '').replace(PURE_VAR, ' ').trim();
    const colourResidue = withoutUrlsAndStrings(base);
    const push = (reason) => violations.push({ line, property, value, reason });

    if (HEX.test(colourResidue)) push('hex colour literal');
    if (COLOR_FUNCTION.test(colourResidue)) push('colour function literal');
    if (!NON_COLOUR_PROPERTIES.has(property) && NAMED_COLOUR.test(colourResidue)) push('named colour literal');

    if (property === 'font-family') {
      const rest = base.replace(/[\s,]+/g, ' ').trim();
      if (rest !== '' && !GLOBAL_KEYWORDS.has(rest.toLowerCase())) push('font-family literal');
    } else if (property === 'font') {
      const remaining = base
        .split(/\s+/)
        .filter(Boolean)
        .filter((token) => !FONT_SHORTHAND_KEYWORDS.has(token.toLowerCase()) && !FONT_SIZE_OR_NUMBER.test(token));
      if (remaining.length > 0) push('font-family literal in font shorthand');
    }
  }
  return violations;
}

/** Every *.css under `dir`, except anything inside its top-level `styles/` folder. */
async function listCss(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).split(path.sep).join('/');
    if (rel === 'styles' || rel.startsWith('styles/')) continue;
    if (entry.isDirectory()) files.push(...(await listCss(full, base)));
    else if (entry.name.endsWith('.css')) files.push(full);
  }
  return files;
}

async function main(argv) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dirs = argv.length > 0 ? argv.map((d) => path.resolve(d)) : [path.join(root, 'src')];
  const files = (await Promise.all(dirs.map((dir) => listCss(dir)))).flat();
  let count = 0;
  for (const file of files) {
    for (const v of findLiteralViolations(await readFile(file, 'utf8'))) {
      count += 1;
      process.stderr.write(`${path.relative(process.cwd(), file)}:${v.line}  ${v.reason}: ${v.property}: ${v.value}\n`);
    }
  }
  if (count > 0) {
    process.stderr.write(`\ncheck-css-literals: ${count} violation(s). Use var(--token) from src/styles/tokens.css.\n`);
    process.exit(1);
  }
  process.stdout.write(`check-css-literals: ${files.length} CSS file(s) clean.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
