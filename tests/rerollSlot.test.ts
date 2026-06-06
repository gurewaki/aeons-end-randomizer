import { describe, it, expect } from 'vitest';
import {
  generateMarket,
  rerollSlot,
  canRerollSlot,
} from '../lib/randomizer/generateMarket';
import { SlotCannotBeFilledError } from '../lib/randomizer/errors';
import type { Card, Gem, Relic, Spell, SupplySetup } from '../lib/types';

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

function buildCards(
  type: 'Gem' | 'Relic' | 'Spell',
  costs: number[],
  prefix = 'fx-rr',
): Card[] {
  return costs.map((cost, i) => {
    const id = `${prefix}:${type}-${i}`;
    const name = `${type}${i}`;
    if (type === 'Gem')
      return { id, expansionId: prefix, no: i, name, type: 'Gem', cost } as Gem;
    if (type === 'Relic')
      return {
        id,
        expansionId: prefix,
        no: i,
        name,
        type: 'Relic',
        cost,
      } as Relic;
    return { id, expansionId: prefix, no: i, name, type: 'Spell', cost } as Spell;
  });
}

describe('rerollSlot', () => {
  it('再抽選結果はそのスロット制約に合致する', () => {
    // バランス setup: スロット 2 (index 2) は Gem cost >= 5
    const pool = [
      ...buildCards('Gem', [2, 3, 3, 4, 4, 5, 5, 6, 6]),
      ...buildCards('Relic', [2, 3, 3, 4, 4, 5, 5]),
      ...buildCards('Spell', [1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 7]),
    ];
    const gen = generateMarket(pool, {
      setup: BALANCED_SETUP,
      mustUseCardIds: new Set(),
    });
    const slotIndex = 2; // Gem >= 5
    for (let i = 0; i < 30; i++) {
      const newCard = rerollSlot(
        gen.poolSnapshot,
        slotIndex,
        gen.placements,
        gen.mustUseIds,
      );
      expect(newCard.type).toBe('Gem');
      expect(newCard.cost).toBeGreaterThanOrEqual(5);
    }
  });

  it('再抽選結果は現在の他 8 枚と id・name が重複しない', () => {
    const pool = [
      ...buildCards('Gem', [2, 3, 4, 5, 6, 6]),
      ...buildCards('Relic', [2, 3, 4, 5]),
      ...buildCards('Spell', [1, 2, 3, 4, 5, 6, 7]),
    ];
    const gen = generateMarket(pool, {
      setup: RANDOM_SETUP,
      mustUseCardIds: new Set(),
    });
    for (let trial = 0; trial < 30; trial++) {
      const slotIndex = trial % gen.placements.length;
      const newCard = rerollSlot(
        gen.poolSnapshot,
        slotIndex,
        gen.placements,
        gen.mustUseIds,
      );
      const otherIds = new Set(
        gen.placements.map((p) => p.card.id).filter((_, i) => i !== slotIndex),
      );
      const otherNames = new Set(
        gen.placements
          .map((p) => p.card.name)
          .filter((_, i) => i !== slotIndex),
      );
      expect(otherIds.has(newCard.id)).toBe(false);
      expect(otherNames.has(newCard.name)).toBe(false);
      // 自分自身とも別カードである (rerollSlot は自身も usedIds に入れて除外する)
      expect(newCard.id).not.toBe(gen.placements[slotIndex].card.id);
    }
  });

  it('必ず使用カードは候補から除外される', () => {
    const pool = [
      ...buildCards('Gem', [2, 3, 4, 5, 6, 6, 6]),
      ...buildCards('Relic', [2, 3, 4, 5]),
      ...buildCards('Spell', [1, 2, 3, 4, 5, 6, 7]),
    ];
    // cost 6 の Gem 3 枚のうち 1 枚を必ず使用に指定。バランス setup のスロット 2 (>=5) に入る
    const mustGem = pool.find((c) => c.type === 'Gem' && c.cost === 6)!;
    const gen = generateMarket(pool, {
      setup: BALANCED_SETUP,
      mustUseCardIds: new Set([mustGem.id]),
    });
    // 必ず使用カードが入っていないスロットを 1 つ再抽選 → 候補に必ず使用 id が出てこない
    const otherSlotIdx = gen.placements.findIndex(
      (p) => p.card.id !== mustGem.id,
    );
    for (let i = 0; i < 30; i++) {
      const newCard = rerollSlot(
        gen.poolSnapshot,
        otherSlotIdx,
        gen.placements,
        gen.mustUseIds,
      );
      expect(newCard.id).not.toBe(mustGem.id);
    }
  });

  it('候補が無いと SlotCannotBeFilledError', () => {
    // Gem >= 5 が 1 枚しかないと、その 1 枚は元のスロットに入っているため再抽選候補が 0 になる
    const pool = [
      ...buildCards('Gem', [2, 3, 4, 5]),
      ...buildCards('Relic', [2, 3, 4, 5]),
      ...buildCards('Spell', [1, 2, 3, 4, 5, 6, 7]),
    ];
    const gen = generateMarket(pool, {
      setup: BALANCED_SETUP,
      mustUseCardIds: new Set(),
    });
    // スロット 2 (Gem >= 5) は cost 5 が 1 枚のみのプール → reroll 不能
    const slotIndex = 2;
    expect(
      canRerollSlot(
        gen.poolSnapshot,
        slotIndex,
        gen.placements,
        gen.mustUseIds,
      ),
    ).toBe(false);
    expect(() =>
      rerollSlot(gen.poolSnapshot, slotIndex, gen.placements, gen.mustUseIds),
    ).toThrow(SlotCannotBeFilledError);
  });

  it('候補が十分にあれば canRerollSlot は true', () => {
    const pool = [
      ...buildCards('Gem', [2, 3, 3, 4, 4, 5, 5, 6, 6]),
      ...buildCards('Relic', [2, 3, 3, 4, 4, 5, 5]),
      ...buildCards('Spell', [1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 7]),
    ];
    const gen = generateMarket(pool, {
      setup: BALANCED_SETUP,
      mustUseCardIds: new Set(),
    });
    for (let i = 0; i < gen.placements.length; i++) {
      expect(
        canRerollSlot(gen.poolSnapshot, i, gen.placements, gen.mustUseIds),
      ).toBe(true);
    }
  });

  it('範囲外の slotIndex で RangeError', () => {
    const pool = [
      ...buildCards('Gem', [2, 3, 4]),
      ...buildCards('Relic', [2, 3]),
      ...buildCards('Spell', [1, 2, 3, 4]),
    ];
    const gen = generateMarket(pool, {
      setup: RANDOM_SETUP,
      mustUseCardIds: new Set(),
    });
    expect(() =>
      rerollSlot(gen.poolSnapshot, -1, gen.placements, gen.mustUseIds),
    ).toThrow(RangeError);
    expect(() =>
      rerollSlot(
        gen.poolSnapshot,
        gen.placements.length,
        gen.placements,
        gen.mustUseIds,
      ),
    ).toThrow(RangeError);
  });
});
