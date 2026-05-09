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
    const m = generateMarket(fxPool, { requireLowCostGem: false, stratifyCost: false, mustUseCardIds: new Set() });
    expect(m.gems).toHaveLength(3);
    expect(m.relics).toHaveLength(2);
    expect(m.spells).toHaveLength(4);
    expect(m.gems.every((c) => c.type === 'Gem')).toBe(true);
    expect(m.relics.every((c) => c.type === 'Relic')).toBe(true);
    expect(m.spells.every((c) => c.type === 'Spell')).toBe(true);
  });

  it('各セクション内で id・name 重複がない', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(fxPool, { requireLowCostGem: false, stratifyCost: false, mustUseCardIds: new Set() });
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
      const m = generateMarket(fxPool, { requireLowCostGem: true, stratifyCost: false, mustUseCardIds: new Set() });
      expect(m.gems.some((g) => g.cost <= 3)).toBe(true);
      expect(m.gems).toHaveLength(3);
    }
  });

  it('requireLowCostGem: true で cost<=3 Gem が 0 枚なら InsufficientPoolError(LowCostGem)', () => {
    expect(() =>
      generateMarket(poolWithoutLowCostGem, { requireLowCostGem: true, stratifyCost: false, mustUseCardIds: new Set() }),
    ).toThrow(InsufficientPoolError);
    try {
      generateMarket(poolWithoutLowCostGem, { requireLowCostGem: true, stratifyCost: false, mustUseCardIds: new Set() });
    } catch (e) {
      expect(e).toBeInstanceOf(InsufficientPoolError);
      expect((e as InsufficientPoolError).kind).toBe('LowCostGem');
    }
  });

  it('Gem が 3 枚未満なら InsufficientPoolError(Gem)', () => {
    const pool = [...fxRelics, ...fxSpells]; // Gem 0 枚
    try {
      generateMarket(pool, { requireLowCostGem: false, stratifyCost: false, mustUseCardIds: new Set() });
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
      generateMarket(pool, { requireLowCostGem: false, stratifyCost: false, mustUseCardIds: new Set() });
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
      generateMarket(pool, { requireLowCostGem: false, stratifyCost: false, mustUseCardIds: new Set() });
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
        stratifyCost: false,
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
        stratifyCost: false,
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
      stratifyCost: false,
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
        stratifyCost: false,
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
        stratifyCost: false,
        mustUseCardIds: new Set(highGemIds),
      }),
    ).toThrow(InsufficientPoolError);
  });

  it('requireLowCostGem ON で必ず使用に低コスト Gem があれば追加抽選不要', () => {
    const lowGem = fxPool.find((c) => c.type === 'Gem' && c.cost <= 3)!;
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(fxPool, {
        requireLowCostGem: true,
        stratifyCost: false,
        mustUseCardIds: new Set([lowGem.id]),
      });
      expect(m.gems.map((c) => c.id)).toContain(lowGem.id);
      expect(m.gems.some((g) => g.cost <= 3)).toBe(true);
    }
  });
});

describe('generateMarket: stratifyCost', () => {
  // 各バケットに複数枚を入れて、抽選結果が必ず各バケットから 1 枚ずつになることを検証
  // Spell: cost 1,2,3,4,5,6,7,8 の 8 枚 → 4 等分で各バケット = [1,2] [3,4] [5,6] [7,8]
  const spell = (id: string, cost: number) => ({
    id: `fx:s${id}`,
    expansionId: 'fx',
    name: `呪文${id}`,
    type: 'Spell' as const,
    cost,
  });
  const gem = (id: string, cost: number) => ({
    id: `fx:g${id}`,
    expansionId: 'fx',
    name: `宝石${id}`,
    type: 'Gem' as const,
    cost,
  });
  const relic = (id: string, cost: number) => ({
    id: `fx:r${id}`,
    expansionId: 'fx',
    name: `遺物${id}`,
    type: 'Relic' as const,
    cost,
  });

  const stratifyPool = [
    gem('1', 1), gem('2', 2), gem('3', 3), gem('4', 4), gem('5', 5), gem('6', 6),
    relic('1', 1), relic('2', 2), relic('3', 5), relic('4', 6),
    spell('1', 1), spell('2', 2), spell('3', 3), spell('4', 4),
    spell('5', 5), spell('6', 6), spell('7', 7), spell('8', 8),
  ];

  it('stratify: Spell 4 枚が各バケット (1-2 / 3-4 / 5-6 / 7-8) から 1 枚ずつ', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(stratifyPool, {
        requireLowCostGem: false,
        stratifyCost: true,
        mustUseCardIds: new Set(),
      });
      const sorted = m.spells.map((c) => c.cost).sort((a, b) => a - b);
      expect(sorted[0]).toBeGreaterThanOrEqual(1);
      expect(sorted[0]).toBeLessThanOrEqual(2);
      expect(sorted[1]).toBeGreaterThanOrEqual(3);
      expect(sorted[1]).toBeLessThanOrEqual(4);
      expect(sorted[2]).toBeGreaterThanOrEqual(5);
      expect(sorted[2]).toBeLessThanOrEqual(6);
      expect(sorted[3]).toBeGreaterThanOrEqual(7);
      expect(sorted[3]).toBeLessThanOrEqual(8);
    }
  });

  it('stratify: Gem 3 枚が各バケット (1-2 / 3-4 / 5-6) から 1 枚ずつ', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(stratifyPool, {
        requireLowCostGem: false,
        stratifyCost: true,
        mustUseCardIds: new Set(),
      });
      const sorted = m.gems.map((c) => c.cost).sort((a, b) => a - b);
      expect(sorted[0]).toBeGreaterThanOrEqual(1);
      expect(sorted[0]).toBeLessThanOrEqual(2);
      expect(sorted[1]).toBeGreaterThanOrEqual(3);
      expect(sorted[1]).toBeLessThanOrEqual(4);
      expect(sorted[2]).toBeGreaterThanOrEqual(5);
      expect(sorted[2]).toBeLessThanOrEqual(6);
    }
  });

  it('stratify: Relic 2 枚が各バケット (1-2 / 5-6) から 1 枚ずつ', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(stratifyPool, {
        requireLowCostGem: false,
        stratifyCost: true,
        mustUseCardIds: new Set(),
      });
      const sorted = m.relics.map((c) => c.cost).sort((a, b) => a - b);
      expect(sorted[0]).toBeLessThanOrEqual(2);
      expect(sorted[1]).toBeGreaterThanOrEqual(5);
    }
  });

  it('stratify + requireLowCostGem: 低コスト Gem 1 枚 + 残りは fillable から層化抽選', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(stratifyPool, {
        requireLowCostGem: true,
        stratifyCost: true,
        mustUseCardIds: new Set(),
      });
      expect(m.gems.some((g) => g.cost <= 3)).toBe(true);
    }
  });

  it('stratify + mustUse: 必ず使用後の残スロットに層化を適用', () => {
    const mustGem = stratifyPool.find(
      (c) => c.type === 'Gem' && c.cost === 6,
    )!;
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(stratifyPool, {
        requireLowCostGem: false,
        stratifyCost: true,
        mustUseCardIds: new Set([mustGem.id]),
      });
      expect(m.gems.map((c) => c.id)).toContain(mustGem.id);
      expect(m.gems).toHaveLength(3);
    }
  });
});
