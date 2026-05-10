import { describe, it, expect } from 'vitest';
import { generateMarket } from '../lib/randomizer/generateMarket';
import {
  TooManyMustUseError,
  MustUseCannotBePlacedError,
  SlotCannotBeFilledError,
} from '../lib/randomizer/errors';
import type { Card, Gem, Relic, Spell, SupplySetup } from '../lib/types';
import {
  fxPool,
  fxRelics,
  fxSpells,
  fxPoolWithDuplicateNames,
} from './fixtures';

const ITERATIONS = 30;

const RANDOM_SETUP: SupplySetup = {
  name: 'ランダム',
  slots: [
    { type: 'Gem' },
    { type: 'Gem' },
    { type: 'Gem' },
    { type: 'Relic' },
    { type: 'Relic' },
    { type: 'Spell' },
    { type: 'Spell' },
    { type: 'Spell' },
    { type: 'Spell' },
  ],
};

const BALANCED_SETUP: SupplySetup = {
  name: 'バランス',
  slots: [
    { type: 'Gem', maxCost: 3 },
    { type: 'Gem', minCost: 4, maxCost: 4 },
    { type: 'Gem', minCost: 5 },
    { type: 'Relic', maxCost: 3 },
    { type: 'Relic', minCost: 4 },
    { type: 'Spell', maxCost: 4 },
    { type: 'Spell', maxCost: 4 },
    { type: 'Spell', minCost: 5 },
    { type: 'Spell', minCost: 5 },
  ],
};

describe('generateMarket: ランダム setup', () => {
  it('Gem 3 / Relic 2 / Spell 4 を返す', () => {
    const m = generateMarket(fxPool, {
      setup: RANDOM_SETUP,
      mustUseCardIds: new Set(),
    });
    expect(m.gems).toHaveLength(3);
    expect(m.relics).toHaveLength(2);
    expect(m.spells).toHaveLength(4);
  });

  it('各セクション内 id・name 重複なし', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(fxPool, {
        setup: RANDOM_SETUP,
        mustUseCardIds: new Set(),
      });
      const checkUnique = (cards: { id: string; name: string }[]) => {
        expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
        expect(new Set(cards.map((c) => c.name)).size).toBe(cards.length);
      };
      checkUnique(m.gems);
      checkUnique(m.relics);
      checkUnique(m.spells);
    }
  });

  it('Relic が 2 枚未満で SlotCannotBeFilledError', () => {
    const pool: Card[] = [
      ...fxPool.filter((c) => c.type !== 'Relic'),
      fxRelics[0],
    ];
    expect(() =>
      generateMarket(pool, { setup: RANDOM_SETUP, mustUseCardIds: new Set() }),
    ).toThrow(SlotCannotBeFilledError);
  });

  it('Spell が 4 枚未満で SlotCannotBeFilledError', () => {
    const pool: Card[] = [
      ...fxPool.filter((c) => c.type !== 'Spell'),
      ...fxSpells.slice(0, 3),
    ];
    expect(() =>
      generateMarket(pool, { setup: RANDOM_SETUP, mustUseCardIds: new Set() }),
    ).toThrow(SlotCannotBeFilledError);
  });

  it('同名カードが複数あっても結果で 1 枚に', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(fxPoolWithDuplicateNames, {
        setup: RANDOM_SETUP,
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

describe('generateMarket: バランス setup (コスト制約)', () => {
  // 各コスト帯のカードを十分に揃えたプール
  const balancedPool: Card[] = [
    // Gem: cost 2, 3 (低), 4 (中), 5, 6 (高)
    ...buildCards('Gem', [2, 3, 3, 4, 4, 5, 5, 6]),
    // Relic: cost 2, 3 (低), 4, 5 (高)
    ...buildCards('Relic', [2, 3, 3, 4, 5, 5]),
    // Spell: cost 1, 2, 3, 4 (低), 5, 5, 6, 7 (高)
    ...buildCards('Spell', [1, 2, 3, 4, 4, 5, 5, 6, 7, 7]),
  ];

  function buildCards(type: 'Gem' | 'Relic' | 'Spell', costs: number[]): Card[] {
    return costs.map((cost, i) => {
      const id = `fx-bal:${type}-${i}`;
      const name = `${type}${i}`;
      if (type === 'Gem') return { id, expansionId: 'fx-bal', name, type: 'Gem', cost } as Gem;
      if (type === 'Relic') return { id, expansionId: 'fx-bal', name, type: 'Relic', cost } as Relic;
      return { id, expansionId: 'fx-bal', name, type: 'Spell', cost } as Spell;
    });
  }

  it('Gem スロット: 1 枚目 cost ≤ 3 / 2 枚目 cost = 4 / 3 枚目 cost ≥ 5', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(balancedPool, {
        setup: BALANCED_SETUP,
        mustUseCardIds: new Set(),
      });
      const sorted = m.gems.map((g) => g.cost).sort((a, b) => a - b);
      expect(sorted[0]).toBeLessThanOrEqual(3);
      expect(sorted[1]).toBe(4);
      expect(sorted[2]).toBeGreaterThanOrEqual(5);
    }
  });

  it('Relic スロット: 1 枚目 cost ≤ 3 / 2 枚目 cost ≥ 4', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(balancedPool, {
        setup: BALANCED_SETUP,
        mustUseCardIds: new Set(),
      });
      const sorted = m.relics.map((r) => r.cost).sort((a, b) => a - b);
      expect(sorted[0]).toBeLessThanOrEqual(3);
      expect(sorted[1]).toBeGreaterThanOrEqual(4);
    }
  });

  it('Spell スロット: 2 枚 cost ≤ 4 / 2 枚 cost ≥ 5', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(balancedPool, {
        setup: BALANCED_SETUP,
        mustUseCardIds: new Set(),
      });
      const lowSpells = m.spells.filter((s) => s.cost <= 4);
      const highSpells = m.spells.filter((s) => s.cost >= 5);
      expect(lowSpells).toHaveLength(2);
      expect(highSpells).toHaveLength(2);
    }
  });

  it('スロットを満たすカードが無いと SlotCannotBeFilledError', () => {
    // Gem cost = 4 が無いプール → スロット 2 が満たせない
    const noFour: Card[] = balancedPool.filter(
      (c) => !(c.type === 'Gem' && c.cost === 4),
    );
    expect(() =>
      generateMarket(noFour, {
        setup: BALANCED_SETUP,
        mustUseCardIds: new Set(),
      }),
    ).toThrow(SlotCannotBeFilledError);
  });
});

describe('generateMarket: mustUseCardIds + setup', () => {
  const balancedPool: Card[] = [
    ...buildCards('Gem', [2, 3, 4, 4, 5, 6]),
    ...buildCards('Relic', [2, 3, 4, 5]),
    ...buildCards('Spell', [1, 2, 3, 4, 5, 6, 7]),
  ];
  function buildCards(type: 'Gem' | 'Relic' | 'Spell', costs: number[]): Card[] {
    return costs.map((cost, i) => {
      const id = `fx-mu:${type}-${i}`;
      const name = `${type}${i}`;
      if (type === 'Gem') return { id, expansionId: 'fx-mu', name, type: 'Gem', cost } as Gem;
      if (type === 'Relic') return { id, expansionId: 'fx-mu', name, type: 'Relic', cost } as Relic;
      return { id, expansionId: 'fx-mu', name, type: 'Spell', cost } as Spell;
    });
  }

  it('必ず使用カードは適合スロットに配置される', () => {
    const mustGem4 = balancedPool.find(
      (c) => c.type === 'Gem' && c.cost === 4,
    )!;
    const mustGem6 = balancedPool.find(
      (c) => c.type === 'Gem' && c.cost === 6,
    )!;
    for (let i = 0; i < ITERATIONS; i++) {
      const m = generateMarket(balancedPool, {
        setup: BALANCED_SETUP,
        mustUseCardIds: new Set([mustGem4.id, mustGem6.id]),
      });
      expect(m.gems.map((g) => g.id)).toContain(mustGem4.id);
      expect(m.gems.map((g) => g.id)).toContain(mustGem6.id);
    }
  });

  it('適合スロットが無い必ず使用は MustUseCannotBePlacedError', () => {
    // バランス setup の Relic は ≤3 と ≥4 のみ。cost 5 を 2 枚指定すると 1 枚は ≥4 に入るが、
    // もう 1 枚は配置不能 (≤3 はコスト不一致、≥4 は埋まり)
    const relic5a = balancedPool.find(
      (c) => c.type === 'Relic' && c.cost === 5,
    )!;
    const relic5b: Relic = {
      ...relic5a,
      id: 'fx-mu:Relic-extra',
      name: 'RelicExtra',
    } as Relic;
    expect(() =>
      generateMarket([...balancedPool, relic5b], {
        setup: BALANCED_SETUP,
        mustUseCardIds: new Set([relic5a.id, relic5b.id]),
      }),
    ).toThrow(MustUseCannotBePlacedError);
  });

  it('タイプ枠を超える必ず使用は TooManyMustUseError', () => {
    const gemIds = balancedPool
      .filter((c) => c.type === 'Gem')
      .slice(0, 4)
      .map((c) => c.id);
    expect(() =>
      generateMarket(balancedPool, {
        setup: BALANCED_SETUP,
        mustUseCardIds: new Set(gemIds),
      }),
    ).toThrow(TooManyMustUseError);
  });
});
