import { describe, it, expect } from 'vitest';
import {
  generateBasicDeck,
  NEMESIS_TIERS,
} from '../lib/randomizer/generateBasicDeck';
import { NoEligibleSeasonError } from '../lib/randomizer/errors';

const ITERATIONS = 50;

describe('generateBasicDeck', () => {
  it('対象シーズン 0 件で NoEligibleSeasonError', () => {
    expect(() => generateBasicDeck([])).toThrow(NoEligibleSeasonError);
  });

  it('3 階層分の結果を返す', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const r = generateBasicDeck([1, 4]);
      expect(Object.keys(r.byTier).map(Number).sort()).toEqual([1, 2, 3]);
      for (const t of NEMESIS_TIERS) {
        expect([1, 4]).toContain(r.byTier[t]);
      }
    }
  });

  it('対象シーズンが 1 つだと全階層その値', () => {
    const r = generateBasicDeck([2]);
    expect(r.byTier[1]).toBe(2);
    expect(r.byTier[2]).toBe(2);
    expect(r.byTier[3]).toBe(2);
  });

  it('独立抽選なので階層間で重複し得る', () => {
    let seenDuplicate = false;
    for (let i = 0; i < ITERATIONS && !seenDuplicate; i++) {
      const r = generateBasicDeck([1, 4]);
      const values = [r.byTier[1], r.byTier[2], r.byTier[3]];
      if (new Set(values).size < values.length) seenDuplicate = true;
    }
    expect(seenDuplicate).toBe(true);
  });
});
