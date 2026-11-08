// FR-45 email rule [ASSUMPTION], pure. After trimming spaces the address has
// exactly one "@" and:
// - a local part of 1–64 characters, without spaces and without ".." (or a
//   leading / trailing ".");
// - a domain of at least two non-empty labels, each letters, digits and
//   hyphens, not starting or ending with "-"; the final label is 2 or more
//   letters, or a punycode TLD ("xn--…");
// - 254 characters at most in total.
const LOCAL = /^[^\s@.]+(?:\.[^\s@.]+)*$/;
const LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const TLD = /^(?:[A-Za-z]{2,}|xn--[A-Za-z0-9-]*[A-Za-z0-9])$/;

/** True when `value` is a valid email address under the FR-45 rule. */
export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  if (email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (local.length === 0 || local.length > 64 || !LOCAL.test(local)) return false;
  const labels = domain.split('.');
  if (labels.length < 2 || !labels.every((label) => LABEL.test(label))) return false;
  return TLD.test(labels.at(-1));
}
