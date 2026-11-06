// Fidelity check (FR-10, AD-6, AD-15): Chromium only, 1366×768 at DPR 1.
// Results are authoritative only from the macos-latest CI job; a Windows or
// Linux run is advisory (font rasterisation differs).
//
// Baselines are the committed 1× Figma exports in tests/fidelity/__baselines__/.
// `--update-snapshots` is forbidden: comparison files are derived from those
// exports by globalSetup, and updateSnapshots 'none' never writes a missing one.
import { defineConfig, devices } from '@playwright/test';

const PORT = 5199;
const VIEWPORT = { width: 1366, height: 768 };

export default defineConfig({
  testDir: 'tests/fidelity',
  outputDir: 'test-results',
  snapshotPathTemplate: '{testDir}/.baselines-masked/{arg}{ext}',
  updateSnapshots: 'none',
  globalSetup: './tests/fidelity/support/global-setup.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list']],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.005, threshold: 0.1, animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORT,
        deviceScaleFactor: 1,
        // Figma rasterises text with grayscale, unhinted anti-aliasing. Match it
        // so a Windows/Linux run does not add LCD colour fringes or hinting.
        launchOptions: { args: ['--disable-lcd-text', '--font-render-hinting=none'] },
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_DATA_LATENCY_MS: '0' },
  },
});
