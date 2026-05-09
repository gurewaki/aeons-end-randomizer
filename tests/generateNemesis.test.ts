import { describe, it, expect } from 'vitest';
import { generateNemesis } from '../lib/randomizer/generateNemesis';
import { NoMatchingNemesisError } from '../lib/randomizer/errors';
import type { Nemesis } from '../lib/types';

const ITERATIONS = 50;

const nem = (
  id: string,
  name: string,
  level: number | undefined,
  battle: number,
): Nemesis => ({
  id: `fx:${id}`,
  expansionId: 'fx',
  name,
  level,
  battle,
  rule: `<${name}> と戦う。`,
});

const fxPool: Nemesis[] = [
  nem('n1', 'ネメシスA', 2, 1),
  nem('n2', 'ネメシスB', 3, 1),
  nem('n3', 'ネメシスC', 5, 2),
  nem('n4', 'ネメシスD', 5, 2),
  nem('n5', 'ネメシスE', 7, 4),
  nem('n6', 'ネメシスF', undefined, 3), // expedition only
];

describe('generateNemesis', () => {
  it('通常モードで pool から 1 体返す (level 未設定は除外)', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const n = generateNemesis(fxPool, { mode: 'normal' });
      expect(n.level).toBeDefined();
    }
  });

  it('通常モード + level 複数選択 が反映される', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const n = generateNemesis(fxPool, {
        mode: 'normal',
        levelFilter: new Set([2, 5]),
      });
      expect([2, 5]).toContain(n.level);
    }
  });

  it('通常モード + level 単一でも動く', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const n = generateNemesis(fxPool, {
        mode: 'normal',
        levelFilter: new Set([5]),
      });
      expect(n.level).toBe(5);
    }
  });

  it('探索行モードで pool 全体から 1 体返す (level 未設定も含む)', () => {
    let foundLevelless = false;
    for (let i = 0; i < ITERATIONS; i++) {
      const n = generateNemesis(fxPool, { mode: 'expedition' });
      if (n.level === undefined) foundLevelless = true;
    }
    expect(foundLevelless).toBe(true);
  });

  it('探索行モード + battle 単一選択が反映される', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const n = generateNemesis(fxPool, {
        mode: 'expedition',
        battleFilter: 2,
      });
      expect(n.battle).toBe(2);
    }
  });

  it('battle null は全バトル扱い', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const n = generateNemesis(fxPool, {
        mode: 'expedition',
        battleFilter: null,
      });
      expect(n).toBeDefined();
    }
  });

  it('該当 0 件で NoMatchingNemesisError', () => {
    expect(() =>
      generateNemesis(fxPool, {
        mode: 'normal',
        levelFilter: new Set([99]),
      }),
    ).toThrow(NoMatchingNemesisError);

    expect(() =>
      generateNemesis(fxPool, {
        mode: 'expedition',
        battleFilter: 99,
      }),
    ).toThrow(NoMatchingNemesisError);
  });

  it('通常モードで level 未設定のみのプールは NoMatchingNemesisError', () => {
    const onlyLevelless = [nem('only', 'X', undefined, 1)];
    expect(() => generateNemesis(onlyLevelless, { mode: 'normal' })).toThrow(
      NoMatchingNemesisError,
    );
  });
});
