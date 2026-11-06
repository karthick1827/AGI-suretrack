// Derive the masked comparison baselines from the committed Figma exports.
//
// tests/fidelity/__baselines__/ holds the 1× Figma frame exports, unmodified.
// Playwright paints `mask` boxes into the capture, so each comparison baseline
// is the Figma export with the SAME boxes painted in the same colour. The
// derived files live in tests/fidelity/.baselines-masked/ (git-ignored) and are
// rewritten on every run, so they can never come from an app screenshot.
import { mkdirSync } from 'node:fs';
import { LOGIN_PHOTO_MASK, MASKED_BASELINE_DIR, writeMaskedBaseline } from './fidelity.js';

export default async function globalSetup() {
  mkdirSync(MASKED_BASELINE_DIR, { recursive: true });
  await writeMaskedBaseline('login-6026-60111.png', LOGIN_PHOTO_MASK);
}
