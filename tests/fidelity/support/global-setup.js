// Derive the masked comparison baselines from the committed Figma exports.
//
// tests/fidelity/__baselines__/ holds the 1× Figma frame exports, unmodified.
// Playwright paints `mask` boxes into the capture, so each comparison baseline
// is the Figma export with the SAME boxes painted in the same colour. The
// derived files live in tests/fidelity/.baselines-masked/ (git-ignored) and are
// rewritten on every run, so they can never come from an app screenshot.
import { mkdirSync } from 'node:fs';
import {
  FORGOT_PASSWORD_BASELINE,
  FORGOT_PASSWORD_CARD_IN_REFERENCE,
  FORGOT_PASSWORD_CORNER_MASK,
  FORGOT_PASSWORD_REFERENCE,
  LOGIN_PHOTO_MASK,
  MASKED_BASELINE_DIR,
  writeCroppedBaseline,
  writeMaskedBaseline,
} from './fidelity.js';

export default async function globalSetup() {
  mkdirSync(MASKED_BASELINE_DIR, { recursive: true });
  await writeMaskedBaseline('login-6026-60111.png', LOGIN_PHOTO_MASK);
  // Story 1.5: the modal card cropped out of the committed 636×410 Figma render.
  await writeCroppedBaseline(
    FORGOT_PASSWORD_REFERENCE,
    FORGOT_PASSWORD_BASELINE,
    FORGOT_PASSWORD_CARD_IN_REFERENCE,
    FORGOT_PASSWORD_CORNER_MASK,
  );
}
