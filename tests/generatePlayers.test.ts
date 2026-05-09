import { describe, it, expect } from 'vitest';
import { generatePlayers } from '../lib/randomizer/generatePlayers';
import {
  InvalidPlayerCountError,
  TooManyMustUseMagesError,
  InsufficientMagePoolError,
} from '../lib/randomizer/errors';
import type { Mage } from '../lib/types';

const ITERATIONS = 50;

const mage = (id: string, name: string, job = 'job', level?: number): Mage => ({
  id: `fx:${id}`,
  expansionId: 'fx',
  name,
  job,
  level,
});

const fxMages: Mage[] = [
  mage('m1', 'メイジA'),
  mage('m2', 'メイジB', 'job', 2),
  mage('m3', 'メイジC', 'job', 3),
  mage('m4', 'メイジD'),
  mage('m5', 'メイジE', 'job', 5),
  mage('m6', 'メイジF'),
  mage('m7', 'メイジG'),
  mage('m8', 'メイジH'),
  mage('m9', 'メイジI'),
];

describe('generatePlayers', () => {
  it('指定人数のメイジを返す', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const m = generatePlayers(fxMages, {
        playerCount: n,
        mustUseMageIds: new Set(),
      });
      expect(m).toHaveLength(n);
    }
  });

  it('結果に重複が無い', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generatePlayers(fxMages, {
        playerCount: 4,
        mustUseMageIds: new Set(),
      });
      expect(new Set(m.map((x) => x.id)).size).toBe(m.length);
    }
  });

  it('mustUseMageIds に指定したメイジは必ず含まれる', () => {
    const ids = new Set([fxMages[0].id, fxMages[1].id]);
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generatePlayers(fxMages, {
        playerCount: 4,
        mustUseMageIds: ids,
      });
      expect(m.map((x) => x.id)).toContain(fxMages[0].id);
      expect(m.map((x) => x.id)).toContain(fxMages[1].id);
    }
  });

  it('mustUse がプレイヤー人数を超えると TooManyMustUseMagesError', () => {
    const ids = new Set(fxMages.slice(0, 5).map((m) => m.id));
    expect(() =>
      generatePlayers(fxMages, { playerCount: 4, mustUseMageIds: ids }),
    ).toThrow(TooManyMustUseMagesError);
  });

  it('プール不足で InsufficientMagePoolError', () => {
    expect(() =>
      generatePlayers(fxMages.slice(0, 3), {
        playerCount: 4,
        mustUseMageIds: new Set(),
      }),
    ).toThrow(InsufficientMagePoolError);
  });

  it('mustUse が pool に無い ID なら無視される (filter で実質 0 扱い)', () => {
    const ids = new Set(['fx:no-such-mage']);
    const m = generatePlayers(fxMages, { playerCount: 4, mustUseMageIds: ids });
    expect(m).toHaveLength(4);
  });

  it('範囲外 (0 / 9) で InvalidPlayerCountError', () => {
    expect(() =>
      generatePlayers(fxMages, { playerCount: 0, mustUseMageIds: new Set() }),
    ).toThrow(InvalidPlayerCountError);
    expect(() =>
      generatePlayers(fxMages, { playerCount: 9, mustUseMageIds: new Set() }),
    ).toThrow(InvalidPlayerCountError);
  });

  it('mustUse のみで人数を満たす場合は追加抽選しない', () => {
    const ids = new Set(fxMages.slice(0, 3).map((m) => m.id));
    const m = generatePlayers(fxMages, {
      playerCount: 3,
      mustUseMageIds: ids,
    });
    expect(m).toHaveLength(3);
    expect(m.map((x) => x.id).sort()).toEqual(
      fxMages
        .slice(0, 3)
        .map((x) => x.id)
        .sort(),
    );
  });
});
