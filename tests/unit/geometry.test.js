// geometry.js (AD-8) — Health bar segments (FR-69): every expected px value of
// PRD FR-69 / addendum §B.8 to ±0.01, plus the edge cases.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { HEALTH_BAR_PX, HEALTH_GAP_PX, HEALTH_KINDS, healthSegments } from '../../src/lib/geometry.js';
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
