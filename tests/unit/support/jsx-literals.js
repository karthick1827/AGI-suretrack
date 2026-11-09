// Shared AD-15 / AD-16 checker: every JSX literal that would put user-visible
// text on screen, a literal data-fid, or a "/"-prefixed URL. Parsing the JSX
// means {expressions} are set aside exactly, so text written next to an
// expression (`Hello {name}`) is still caught.
import { parse } from '@babel/parser';

const TEXT_ATTRIBUTES = new Set(['alt', 'aria-label', 'title', 'placeholder']);

export function jsxLiterals(source) {
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const found = [];
  const stringOf = (node) => (node?.type === 'StringLiteral' ? node.value : null);
  const visit = (node, parent) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'JSXText' && node.value.trim() !== '') found.push(`text: ${node.value.trim()}`);
    if (node.type === 'JSXExpressionContainer' && parent?.type === 'JSXElement') {
      const e = node.expression;
      if (e.type === 'StringLiteral' || e.type === 'TemplateLiteral') {
        found.push(`child expression: ${source.slice(e.start, e.end)}`);
      }
    }
    if (node.type === 'JSXAttribute') {
      const name = node.name.name;
      const value = node.value?.type === 'JSXExpressionContainer' ? node.value.expression : node.value;
      const literal = stringOf(value);
      if (literal && TEXT_ATTRIBUTES.has(name)) found.push(`${name}="${literal}"`);
      if (literal !== null && name === 'data-fid') found.push(`data-fid="${literal}"`);
      if (literal !== null && (name === 'to' || name === 'href') && literal.startsWith('/')) {
        found.push(`${name}="${literal}"`);
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra') continue;
      if (Array.isArray(value)) for (const child of value) visit(child, node);
      else if (value && typeof value === 'object') visit(value, node);
    }
  };
  visit(ast.program, null);
  return found;
}
