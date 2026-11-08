// FR-45 email rule [ASSUMPTION], pure. After trimming spaces the address has
// exactly one "@", a non-empty local part without spaces, and a domain with at
// least one "." whose final label is 2 or more letters.
const EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/** True when `value` is a valid email address under the FR-45 rule. */
export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL.test(value.trim());
}
