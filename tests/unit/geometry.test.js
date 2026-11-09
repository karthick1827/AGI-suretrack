// geometry.js (AD-8) — Health bar segments (FR-69) and Runtime bars (FR-80):
// every expected px value of PRD FR-69, FR-80 / addendum §B.8 (segments to
// ±0.01; bar heights exact), plus the edge cases.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  HEALTH_BAR_PX,
  HEALTH_GAP_PX,
  HEALTH_KINDS,
  RUNTIME_BAR_SPACE_PX,
  RUNTIME_BAR_WIDTH_PX,
  RUNTIME_CHART_MIN_HEIGHT_PX,
  RUNTIME_CHART_PX,
  RUNTIME_COLUMN_HEIGHT_PX,
  RUNTIME_COLUMN_PX,
  RUNTIME_DAY_LABEL_PX,
  RUNTIME_MAX_BAR_PX,
  RUNTIME_SCALE_PX,
  RUNTIME_SLOTS,
  RUNTIME_VALUE_LABEL_OFFSET_PX,
  healthSegments,
  runtimeBars,
} from '../../src/lib/geometry.js';
import { fromRoot } from './support/project.js';

const near = (actual, expected) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.01);

/** `[kind, x, width]` triples, compared to ±0.01 px. */
function expectSegments(counts, expected) {
  const got = healthSegments(counts);
  expect(got.map((s) => s.kind)).toEqual(expected.map(([kind]) => kind));
  got.forEach((segment, i) => {
    near(segment.x, expected[i][1]);
    near(segment.width, expected[i][2]);
  });
  return got;
}

describe('healthSegments() — FR-69 expected widths', () => {
  it('constants: 474 px bar, 2 px gaps, order alert → offline → healthy', () => {
    expect(HEALTH_BAR_PX).toBe(474);
    expect(HEALTH_GAP_PX).toBe(2);
    expect(HEALTH_KINDS).toEqual(['alerts', 'offline', 'healthy']);
  });

  it.each([
    ['Full Bins 3/1/3 (k=3)', { alerts: 3, offline: 1, healthy: 3 }, [['alerts', 0, 201.43], ['offline', 203.43, 67.14], ['healthy', 272.57, 201.43]]],
    ['Full Piles 1/0/2 (k=2)', { alerts: 1, offline: 0, healthy: 2 }, [['alerts', 0, 157.33], ['healthy', 159.33, 314.67]]],
    ['Full Flats 0/0/2 (k=1)', { alerts: 0, offline: 0, healthy: 2 }, [['healthy', 0, 474]]],
    ['Full Tanks 1/0/5 (k=2)', { alerts: 1, offline: 0, healthy: 5 }, [['alerts', 0, 78.67], ['healthy', 80.67, 393.33]]],
    ['Full Dryers 0/0/2 (k=1)', { alerts: 0, offline: 0, healthy: 2 }, [['healthy', 0, 474]]],
    ['Small Bin 1/0/0 (solid red)', { alerts: 1, offline: 0, healthy: 0 }, [['alerts', 0, 474]]],
    ['Small Dryer 0/0/1', { alerts: 0, offline: 0, healthy: 1 }, [['healthy', 0, 474]]],
    ['All-good Bin 0/0/1', { alerts: 0, offline: 0, healthy: 1 }, [['healthy', 0, 474]]],
  ])('%s', (_name, counts, expected) => {
    expectSegments(counts, expected);
  });

  it('every row of the three state documents gives its FR-69 segments (data → px, no caption parsing)', () => {
    const doc = (state) => JSON.parse(readFileSync(fromRoot(`src/data/json/dashboard.${state}.json`), 'utf8'));
    const expected = {
      full: [
        [['alerts', 0, 201.43], ['offline', 203.43, 67.14], ['healthy', 272.57, 201.43]],
        [['alerts', 0, 157.33], ['healthy', 159.33, 314.67]],
        [['healthy', 0, 474]],
        [['alerts', 0, 78.67], ['healthy', 80.67, 393.33]],
        [['healthy', 0, 474]],
      ],
      small: [[['alerts', 0, 474]], [['healthy', 0, 474]]],
      allgood: [[['healthy', 0, 474]]],
    };
    for (const [state, rows] of Object.entries(expected)) {
      const docRows = doc(state).equipmentCard.rows;
      expect(docRows).toHaveLength(rows.length);
      docRows.forEach((row, i) => expectSegments(row, rows[i]));
    }
  });

  it('segments plus gaps fill exactly 474 px and are contiguous', () => {
    for (const counts of [
      { alerts: 3, offline: 1, healthy: 3 },
      { alerts: 1, offline: 0, healthy: 2 },
      { alerts: 7, offline: 11, healthy: 13 },
    ]) {
      const segs = healthSegments(counts);
      const last = segs.at(-1);
      near(last.x + last.width, 474);
      segs.slice(1).forEach((s, i) => near(s.x, segs[i].x + segs[i].width + 2));
    }
  });

  it('zero-count segments are omitted and reserve no gap', () => {
    const segs = healthSegments({ alerts: 0, offline: 1, healthy: 1 });
    expect(segs.map((s) => s.kind)).toEqual(['offline', 'healthy']);
    near(segs[0].width, 236);
    near(segs[1].x, 238);
  });
});

describe('healthSegments() — edge cases', () => {
  it('a total of 0 gives no segments, with no NaN', () => {
    expect(healthSegments({ alerts: 0, offline: 0, healthy: 0 })).toEqual([]);
    expect(healthSegments({})).toEqual([]);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a number', 7],
    ['a string', '3/1/3'],
    ['an array', [3, 1, 3]],
  ])('unusable input (%s) gives no segments', (_name, input) => {
    expect(healthSegments(input)).toEqual([]);
  });

  it('non-numeric, negative, NaN and infinite counts count as 0; never NaN', () => {
    const segs = healthSegments({ alerts: '3', offline: -1, healthy: 2 });
    expect(segs).toEqual([{ kind: 'healthy', x: 0, width: 474 }]);
    expect(healthSegments({ alerts: Number.NaN, offline: Infinity, healthy: null })).toEqual([]);
    expect(healthSegments({ alerts: Number.MAX_VALUE, offline: Number.MAX_VALUE, healthy: 0 })).toEqual([]);
    for (const s of healthSegments({ alerts: 1e-9, healthy: 1 })) {
      expect(Number.isFinite(s.x) && Number.isFinite(s.width)).toBe(true);
    }
  });

  it('counts must be non-negative integers: fractions, numeric strings, booleans and BigInts count as 0', () => {
    expect(healthSegments({ alerts: 1.5, offline: 0.1, healthy: 2 })).toEqual([{ kind: 'healthy', x: 0, width: 474 }]);
    expect(healthSegments({ alerts: '1', offline: true, healthy: 2n })).toEqual([]);
    expect(healthSegments({ alerts: 2.0, healthy: 4 }).map((s) => s.kind)).toEqual(['alerts', 'healthy']);
  });

  it('is pure: the input is not changed and repeated calls are equal', () => {
    const counts = Object.freeze({ alerts: 3, offline: 1, healthy: 3 });
    expect(healthSegments(counts)).toEqual(healthSegments(counts));
  });

  it('geometry.js imports nothing (pure lib, AD-8)', () => {
    const source = readFileSync(fromRoot('src/lib/geometry.js'), 'utf8');
    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).not.toMatch(/\bdocument\.|\bwindow\.|localStorage|sessionStorage/);
  });
});

/* ------------------------------------------------------------------------ */
/* runtimeBars() — FR-80, AD-14                                              */
/* ------------------------------------------------------------------------ */

const doc = (state) => JSON.parse(readFileSync(fromRoot(`src/data/json/dashboard.${state}.json`), 'utf8'));
/** FR-80 bar x offsets within the chart (2 decimals in the PRD). */
const X_OFFSETS = [15.57, 70.71, 125.86, 181.0, 236.14, 291.29, 346.43];
const BAR_PX = [54, 61, 66, 72, 68, 79, 76];
const FORMULA_PX = [54, 61, 65, 71, 68, 79, 75];
const HOURS = [62, 70, 74, 81, 77, 90, 86];
const DAYS = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Today'];
const heights = (chart) => runtimeBars(chart).map((bar) => bar.height);
const nearX = (bars, count = bars.length) =>
  bars.slice(0, count).forEach((bar, i) => expect(Math.abs(bar.x - X_OFFSETS[i]), `bar ${i} x ${bar.x}`).toBeLessThanOrEqual(0.005));
const noHours = (chart) => chart.map(({ barPx: _barPx, ...entry }) => entry);

describe('runtimeBars() — FR-80 expected px (addendum §B.8)', () => {
  it('constants: 386 px chart, 7 slots of 55.14 px, 24 px bars, 79 px formula scale; the column geometry', () => {
    expect(RUNTIME_CHART_PX).toBe(386);
    expect(RUNTIME_SLOTS).toBe(7);
    near(RUNTIME_COLUMN_PX, 55.14);
    expect(RUNTIME_BAR_WIDTH_PX).toBe(24);
    expect(RUNTIME_SCALE_PX).toBe(79);
    expect(RUNTIME_COLUMN_HEIGHT_PX).toBe(103);
    expect(RUNTIME_DAY_LABEL_PX).toBe(5 + 14);
    expect(RUNTIME_VALUE_LABEL_OFFSET_PX).toBe(18);
    expect(RUNTIME_CHART_MIN_HEIGHT_PX).toBe(119);
    // 103 px column − 19 px day label.
    expect(RUNTIME_BAR_SPACE_PX).toBe(84);
    // The value label of the tallest usable bar still starts inside the 119 px chart.
    expect(RUNTIME_MAX_BAR_PX).toBe(82);
    expect(RUNTIME_CHART_MIN_HEIGHT_PX - RUNTIME_DAY_LABEL_PX - RUNTIME_MAX_BAR_PX - RUNTIME_VALUE_LABEL_OFFSET_PX).toBe(0);
  });

  it.each(['full', 'small', 'allgood'])('%s: heights are exactly barPx 54/61/66/72/68/79/76 (0 px) at the FR-80 x offsets', (state) => {
    const bars = runtimeBars(doc(state).fanActivity.chart);
    expect(bars.map((bar) => bar.height)).toEqual(BAR_PX);
    nearX(bars);
    expect(bars.map((bar) => [bar.day, bar.hours, bar.isToday])).toEqual(DAYS.map((day, i) => [day, HOURS[i], day === 'Today']));
  });

  it('every bar is centred in its 55.14 px slot', () => {
    runtimeBars(doc('full').fanActivity.chart).forEach((bar, i) => {
      near(bar.x + RUNTIME_BAR_WIDTH_PX / 2, (i + 0.5) * RUNTIME_COLUMN_PX);
    });
  });

  it('barPx wins over the formula when every drawn entry has it, also where they disagree (Q-N2: Fri, Sat, Today)', () => {
    const chart = doc('full').fanActivity.chart;
    expect(heights(noHours(chart))).toEqual(FORMULA_PX);
    expect(heights(chart)).toEqual(BAR_PX);
    // A barPx of 0 is used as given (not replaced by the formula).
    expect(heights([{ hours: 90, barPx: 0 }])).toEqual([0]);
  });

  it('fallback without barPx: round(hours / max(hours) × 79)', () => {
    expect(heights(HOURS.map((hours, i) => ({ day: DAYS[i], hours })))).toEqual(FORMULA_PX);
    expect(heights([{ hours: 10 }, { hours: 5 }])).toEqual([79, 40]);
  });
});

describe('runtimeBars() — one scale per chart (barPx only when every drawn bar has a usable one)', () => {
  it('mixed barPx and formula: the formula for ALL drawn bars, never a mix of scales', () => {
    expect(heights([{ hours: 100, barPx: 3 }, { hours: 50 }])).toEqual([79, 40]);
    const chart = doc('full').fanActivity.chart.map((entry, i) => (i === 3 ? { ...entry, barPx: undefined } : entry));
    expect(heights(chart)).toEqual(FORMULA_PX);
  });

  it('fractional barPx is not usable: the formula applies (never rounded)', () => {
    const chart = doc('full').fanActivity.chart.map((entry, i) => (i === 0 ? { ...entry, barPx: 54.5 } : entry));
    expect(heights(chart)).toEqual(FORMULA_PX);
  });

  it.each([
    ['above the 82 px maximum', 83],
    ['far above it', 500],
    ['negative', -1],
    ['a numeric string', '54'],
    ['NaN', Number.NaN],
    ['Infinity', Infinity],
  ])('a barPx %s is rejected (never capped): the formula applies to every bar', (_name, barPx) => {
    const chart = doc('full').fanActivity.chart.map((entry, i) => (i === 5 ? { ...entry, barPx } : entry));
    expect(heights(chart)).toEqual(FORMULA_PX);
  });

  it('the maximum usable barPx (82) is drawn exactly', () => {
    expect(heights([{ hours: 1, barPx: 82 }, { hours: 2, barPx: 0 }])).toEqual([82, 0]);
  });

  it('an entry with only a usable barPx and no usable hours is drawn; it scales only if every bar has barPx', () => {
    expect(heights([{ day: 'Sun', barPx: 68 }, { day: 'Mon', barPx: 79 }])).toEqual([68, 79]);
    // In a formula chart it has no hours: 0 px.
    expect(heights([{ day: 'Sun', barPx: 68 }, { day: 'Mon', hours: 90 }])).toEqual([0, 79]);
  });
});

describe('runtimeBars() — edge cases (never NaN, never a crash)', () => {
  const allFinite = (bars) =>
    bars.every((bar) => Number.isInteger(bar.height) && bar.height >= 0 && Number.isFinite(bar.x));

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an object', { 0: { hours: 1 } }],
    ['a string', '62,70'],
    ['an empty array', []],
  ])('unusable chart (%s) gives no bars', (_name, chart) => {
    expect(runtimeBars(chart)).toEqual([]);
  });

  it('negative hours: the entry is dropped (no "-5h"), and no height is negative', () => {
    const bars = runtimeBars([{ hours: 10 }, { hours: -5 }]);
    expect(bars.map((bar) => [bar.hours, bar.height])).toEqual([[10, 79]]);
    // Even with a usable barPx, negative hours drop the entry.
    expect(runtimeBars([{ day: 'Wed', hours: -1, barPx: 10 }, { day: 'Thu', hours: 2, barPx: 20 }]).map((bar) => bar.day)).toEqual(['Thu']);
    expect(allFinite(runtimeBars([{ hours: -3 }, { hours: 0 }, { hours: -1e9 }]))).toBe(true);
  });

  it('max 0 or no usable hours → 0 px bars, no NaN; non-usable hours come back as null', () => {
    const zero = runtimeBars([{ hours: 0 }, { hours: 0 }]);
    expect(zero.map((bar) => bar.height)).toEqual([0, 0]);
    expect(allFinite(zero)).toBe(true);
    const mixed = runtimeBars([{ day: 'Wed', hours: Number.NaN, barPx: 12 }, { hours: 0 }]);
    expect(mixed.map((bar) => [bar.hours, bar.height])).toEqual([
      [null, 0],
      [0, 0],
    ]);
    expect(allFinite(runtimeBars([{ hours: Number.MAX_VALUE }, { hours: 1 }]))).toBe(true);
  });

  it('entries without usable hours or a usable barPx (and non-objects) are skipped', () => {
    const bars = runtimeBars([
      null,
      7,
      'Wed',
      [62],
      { day: 'Wed' },
      { day: 'Thu', hours: '70' },
      { day: 'Fri', hours: Infinity, barPx: -1 },
      { day: 'Sat', hours: 81, barPx: '72' },
      { day: 'Sun', barPx: 68 },
    ]);
    // Sat has no usable barPx → formula for both; Sun has no hours → 0.
    expect(bars.map((bar) => [bar.day, bar.height])).toEqual([
      ['Sat', 79],
      ['Sun', 0],
    ]);
    nearX(bars);
  });

  it('fewer than 7 entries fill slots from the left; more than 7 keep the last 7 (ending today)', () => {
    const chart = doc('full').fanActivity.chart;
    const three = runtimeBars(chart.slice(0, 3));
    expect(three.map((bar) => bar.height)).toEqual([54, 61, 66]);
    nearX(three);
    const nine = runtimeBars([{ day: 'Mon-1', hours: 1, barPx: 1 }, { day: 'Tue-1', hours: 2, barPx: 2 }, ...chart]);
    expect(nine.map((bar) => bar.day)).toEqual(DAYS);
    expect(nine.map((bar) => bar.height)).toEqual(BAR_PX);
    nearX(nine);
    expect(allFinite(nine)).toBe(true);
  });

  it('more than 7 without barPx: an off-window entry with larger hours never scales the drawn bars', () => {
    expect(heights([{ hours: 200 }, ...HOURS.map((hours) => ({ hours }))])).toEqual(FORMULA_PX);
  });

  it('isToday is true only for the last drawn entry, and only for the boolean true', () => {
    const bars = runtimeBars([
      { day: 'Today', hours: 1, isToday: 'true' },
      { day: { d: 1 }, hours: 2, isToday: true },
      { day: 7, hours: 3, isToday: true },
    ]);
    expect(bars.map((bar) => bar.isToday)).toEqual([false, false, true]);
    expect(bars[1].day).toEqual({ d: 1 });
    expect(bars[2].day).toBe(7);
    expect(runtimeBars([{ hours: 1, isToday: true }, { hours: 2, isToday: 1 }]).map((bar) => bar.isToday)).toEqual([false, false]);
    // A dropped last entry does not pass isToday on.
    expect(runtimeBars([{ hours: 1 }, { hours: 2, isToday: true }, { hours: -1, isToday: true }]).map((bar) => bar.isToday)).toEqual([false, true]);
  });

  it('is pure: the input is not changed and repeated calls are equal', () => {
    const chart = Object.freeze(doc('full').fanActivity.chart.map((entry) => Object.freeze({ ...entry })));
    expect(runtimeBars(chart)).toEqual(runtimeBars(chart));
  });
});
