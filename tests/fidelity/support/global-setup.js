// Derive the masked comparison baselines from the committed Figma exports.
//
// tests/fidelity/__baselines__/ holds the 1× Figma frame exports, unmodified.
// Playwright paints `mask` boxes into the capture, so each comparison baseline
// is the Figma export with the SAME boxes painted in the same colour. The
// derived files live in tests/fidelity/.baselines-masked/ (git-ignored) and are
// rewritten on every run, so they can never come from an app screenshot.
import { mkdirSync } from 'node:fs';
import {
  EQUIPMENT_CARD_REFERENCES,
  FAN_ACTIVITY_REFERENCES,
  FORGOT_PASSWORD_BASELINE,
  FORGOT_PASSWORD_CARD_IN_REFERENCE,
  FORGOT_PASSWORD_CORNER_MASK,
  FORGOT_PASSWORD_REFERENCE,
  HEADER_BASELINE,
  HEADER_IN_REFERENCE,
  HEADER_MASK,
  HEADER_REFERENCE,
  KPI_STRIP_IN_REFERENCE,
  KPI_STRIP_REFERENCES,
  LOGIN_PHOTO_MASK,
  MASKED_BASELINE_DIR,
  PROFILE_MENU_BASELINE,
  PROFILE_MENU_IN_REFERENCE,
  PROFILE_MENU_MASK,
  PROFILE_MENU_REFERENCE,
  RECENT_ALERTS_REFERENCES,
  equipmentCardBaseline,
  equipmentCardInReference,
  fanActivityBaseline,
  fanActivityInReference,
  kpiStripBaseline,
  recentAlertsBaseline,
  recentAlertsInReference,
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
  // Story 2.1: the Header cropped out of its 1374×72 render (shadow overflow),
  // avatar masked; the profile panel (exact 290×768), omitted entries masked.
  await writeCroppedBaseline(HEADER_REFERENCE, HEADER_BASELINE, HEADER_IN_REFERENCE, HEADER_MASK);
  await writeCroppedBaseline(PROFILE_MENU_REFERENCE, PROFILE_MENU_BASELINE, PROFILE_MENU_IN_REFERENCE, PROFILE_MENU_MASK);
  // Story 2.3: the KPI strip cropped out of each 1× Dashboard render (no mask).
  for (const [state, source] of Object.entries(KPI_STRIP_REFERENCES)) {
    await writeCroppedBaseline(source, kpiStripBaseline(state), KPI_STRIP_IN_REFERENCE, []);
  }
  // Story 2.4: the Equipment card (inside its border) from the same renders (no mask).
  for (const [state, source] of Object.entries(EQUIPMENT_CARD_REFERENCES)) {
    await writeCroppedBaseline(source, equipmentCardBaseline(state), equipmentCardInReference(state), []);
  }
  // Story 2.5: the Recent Alerts card (inside its border) from the same renders (no mask).
  for (const [state, source] of Object.entries(RECENT_ALERTS_REFERENCES)) {
    await writeCroppedBaseline(source, recentAlertsBaseline(state), recentAlertsInReference(state), []);
  }
  // Story 2.6: the Fan activity card (inside its border) from the same renders (no mask).
  for (const [state, source] of Object.entries(FAN_ACTIVITY_REFERENCES)) {
    await writeCroppedBaseline(source, fanActivityBaseline(state), fanActivityInReference(state), []);
  }
}
