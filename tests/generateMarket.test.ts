import { describe, it, expect } from 'vitest';
import { generateMarket } from '../lib/randomizer/generateMarket';
import { InsufficientPoolError } from '../lib/randomizer/errors';
import {
  fxPool,
  fxRelics,
  fxSpells,
  poolWithoutLowCostGem,
  fxPoolWithDuplicateNames,
} from './fixtures';

const ITERATIONS = 50;

describe('generateMarket', () => {
  it('Gem 3 / Relic 2 / Spell 4 を返す', () => {
    const m = generateMarket(fxPool, { requireLowCostGem: false, mustUseCardIds: new Set() });
    expect(m.gems).toHaveLength(3);
    expect(m.relics).toHaveLength(2);
    expect(m.spells).toHaveLength(4);
    expect(m.gems.every((c) => c.type === 'Gem')).toBe(true);
    expect(m.relics.every((c) => c.type === 'Relic')).toBe(true);
    expect(m.spells.every((c) => c.type === 'Spell')).toBe(true);
  });

  it('各セクション内で id・name 重複がない', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(fxPool, { requireLowCostGem: false, mustUseCardIds: new Set() });
      const checkUnique = (cards: { id: string; name: string }[]) => {
        expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
        expect(new Set(cards.map((c) => c.name)).size).toBe(cards.length);
      };
      checkUnique(m.gems);
      checkUnique(m.relics);
      checkUnique(m.spells);
    }
  });

  it('requireLowCostGem: true で Gem に必ず cost<=3 が含まれる', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(fxPool, { requireLowCostGem: true, mustUseCardIds: new Set() });
      expect(m.gems.some((g) => g.cost <= 3)).toBe(true);
      expect(m.gems).toHaveLength(3);
    }
  });

  it('requireLowCostGem: true で cost<=3 Gem が 0 枚なら InsufficientPoolError(LowCostGem)', () => {
    expect(() =>
      generateMarket(poolWithoutLowCostGem, { requireLowCostGem: true, mustUseCardIds: new Set() }),
    ).toThrow(InsufficientPoolError);
    try {
      generateMarket(poolWithoutLowCostGem, { requireLowCostGem: true, mustUseCardIds: new Set() });
    } catch (e) {
      expect(e).toBeInstanceOf(InsufficientPoolError);
      expect((e as InsufficientPoolError).kind).toBe('LowCostGem');
    }
  });

  it('Gem が 3 枚未満なら InsufficientPoolError(Gem)', () => {
    const pool = [...fxRelics, ...fxSpells]; // Gem 0 枚
    try {
      generateMarket(pool, { requireLowCostGem: false, mustUseCardIds: new Set() });
      expect.unreachable('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(InsufficientPoolError);
      expect((e as InsufficientPoolError).kind).toBe('Gem');
    }
  });

  it('Relic が 2 枚未満なら InsufficientPoolError(Relic)', () => {
    const pool = [
      ...fxPool.filter((c) => c.type !== 'Relic'),
      fxRelics[0], // Relic 1 枚のみ
    ];
    try {
      generateMarket(pool, { requireLowCostGem: false, mustUseCardIds: new Set() });
      expect.unreachable('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(InsufficientPoolError);
      expect((e as InsufficientPoolError).kind).toBe('Relic');
    }
  });

  it('Spell が 4 枚未満なら InsufficientPoolError(Spell)', () => {
    const pool = [
      ...fxPool.filter((c) => c.type !== 'Spell'),
      ...fxSpells.slice(0, 3), // Spell 3 枚のみ
    ];
    try {
      generateMarket(pool, { requireLowCostGem: false, mustUseCardIds: new Set() });
      expect.unreachable('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(InsufficientPoolError);
      expect((e as InsufficientPoolError).kind).toBe('Spell');
    }
  });

  it('同名カードが複数プールに含まれていても結果に 1 枚しか出ない', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(fxPoolWithDuplicateNames, {
        requireLowCostGem: false,
        mustUseCardIds: new Set(),
      });
      const allNames = [
        ...m.gems.map((c) => c.name),
        ...m.relics.map((c) => c.name),
        ...m.spells.map((c) => c.name),
      ];
      expect(new Set(allNames).size).toBe(allNames.length);
    }
  });
});

describe('generateMarket: mustUseCardIds', () => {
  it('指定したカードは必ず結果に含まれる', () => {
    const mustGem = fxPool.find((c) => c.type === 'Gem' && c.cost === 4)!;
    const mustRelic = fxPool.find((c) => c.type === 'Relic')!;
    const mustSpell = fxPool.find((c) => c.type === 'Spell')!;
    const ids = new Set([mustGem.id, mustRelic.id, mustSpell.id]);
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(fxPool, {
        requireLowCostGem: false,
        mustUseCardIds: ids,
      });
      expect(m.gems.map((c) => c.id)).toContain(mustGem.id);
      expect(m.relics.map((c) => c.id)).toContain(mustRelic.id);
      expect(m.spells.map((c) => c.id)).toContain(mustSpell.id);
    }
  });

  it('Gem を 3 枚すべて指定すると残スロットを抽選しない', () => {
    const gemIds = fxPool
      .filter((c) => c.type === 'Gem')
      .slice(0, 3)
      .map((c) => c.id);
    const ids = new Set(gemIds);
    const m = generateMarket(fxPool, {
      requireLowCostGem: false,
      mustUseCardIds: ids,
    });
    expect(m.gems).toHaveLength(3);
    expect(m.gems.map((c) => c.id).sort()).toEqual([...gemIds].sort());
  });

  it('Gem を 4 枚以上指定すると TooManyMustUseError', async () => {
    const { TooManyMustUseError } = await import('../lib/randomizer/errors');
    const gemIds = fxPool
      .filter((c) => c.type === 'Gem')
      .slice(0, 4)
      .map((c) => c.id);
    expect(() =>
      generateMarket(fxPool, {
        requireLowCostGem: false,
        mustUseCardIds: new Set(gemIds),
      }),
    ).toThrow(TooManyMustUseError);
  });

  it('requireLowCostGem ON で 3 枚すべての Gem 指定が高コストなら InsufficientPoolError(LowCostGem)', () => {
    const highGemIds = fxPool
      .filter((c) => c.type === 'Gem' && c.cost > 3)
      .slice(0, 3)
      .map((c) => c.id);
    expect(highGemIds).toHaveLength(3);
    expect(() =>
      generateMarket(fxPool, {
        requireLowCostGem: true,
        mustUseCardIds: new Set(highGemIds),
      }),
    ).toThrow(InsufficientPoolError);
  });

  it('requireLowCostGem ON で必ず使用に低コスト Gem があれば追加抽選不要', () => {
    const lowGem = fxPool.find((c) => c.type === 'Gem' && c.cost <= 3)!;
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(fxPool, {
        requireLowCostGem: true,
        mustUseCardIds: new Set([lowGem.id]),
      });
      expect(m.gems.map((c) => c.id)).toContain(lowGem.id);
      expect(m.gems.some((g) => g.cost <= 3)).toBe(true);
    }
  });
});
