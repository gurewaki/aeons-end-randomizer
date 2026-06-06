import type {
  Card,
  Gem,
  Relic,
  Spell,
  CardType,
  GeneratedSupply,
  MarketSupply,
  RandomizerOptions,
  SetupSlot,
  SupplyPlacement,
} from '../types';
import { shuffle } from './shuffle';
import {
  TooManyMustUseError,
  MustUseCannotBePlacedError,
  SlotCannotBeFilledError,
} from './errors';

function dedupeByName<T extends Card>(cards: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const c of cards) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    out.push(c);
  }
  return out;
}

function fitsSlot(card: Card, slot: SetupSlot): boolean {
  if (card.type !== slot.type) return false;
  if (slot.minCost !== undefined && card.cost < slot.minCost) return false;
  if (slot.maxCost !== undefined && card.cost > slot.maxCost) return false;
  return true;
}

function emptyTypeCounts(): Record<CardType, number> {
  return { Gem: 0, Relic: 0, Spell: 0 };
}

function buildMarketFromPlacements(placements: SupplyPlacement[]): MarketSupply {
  const result: MarketSupply = { gems: [], relics: [], spells: [] };
  for (const { card } of placements) {
    if (card.type === 'Gem') result.gems.push(card as Gem);
    else if (card.type === 'Relic') result.relics.push(card as Relic);
    else result.spells.push(card as Spell);
  }
  result.gems = shuffle(result.gems);
  result.relics = shuffle(result.relics);
  result.spells = shuffle(result.spells);
  return result;
}

/**
 * セットアップに沿ってサプライを生成する。
 *
 * 1. 必ず使用するカードのタイプ別枚数が setup の各タイプ枠数を超えないか検証
 * 2. 必ず使用カードを「適合スロット数の少ない順」(most-constrained-first) で
 *    setup の各スロットに割り当てる。割り当て不能なら MustUseCannotBePlacedError
 * 3. 残スロットを fillable プールからスロット制約に合うカードで充足
 * 4. 同名カードはタイプを跨いでも 1 枚のみ
 */
export function generateMarket(
  pool: Card[],
  options: RandomizerOptions,
): GeneratedSupply {
  const { setup, mustUseCardIds } = options;

  const setupTypeCounts = emptyTypeCounts();
  for (const slot of setup.slots) setupTypeCounts[slot.type]++;

  const dedupedPool = dedupeByName(pool);
  const mustUse = dedupedPool.filter((c) => mustUseCardIds.has(c.id));
  const mustUseTypeCounts = emptyTypeCounts();
  for (const c of mustUse) mustUseTypeCounts[c.type]++;
  for (const t of ['Gem', 'Relic', 'Spell'] as const) {
    if (mustUseTypeCounts[t] > setupTypeCounts[t]) {
      throw new TooManyMustUseError(t, mustUseTypeCounts[t], setupTypeCounts[t]);
    }
  }

  const placed = new Map<number, Card>();
  const sortedMustUse = [...mustUse].sort((a, b) => {
    const aFit = setup.slots.filter((s) => fitsSlot(a, s)).length;
    const bFit = setup.slots.filter((s) => fitsSlot(b, s)).length;
    return aFit - bFit;
  });
  for (const card of sortedMustUse) {
    let placedAt = -1;
    for (let i = 0; i < setup.slots.length; i++) {
      if (placed.has(i)) continue;
      if (fitsSlot(card, setup.slots[i])) {
        placedAt = i;
        break;
      }
    }
    if (placedAt < 0) {
      throw new MustUseCannotBePlacedError(card.name);
    }
    placed.set(placedAt, card);
  }

  const usedNames = new Set(mustUse.map((c) => c.name));
  const fillable = dedupedPool.filter(
    (c) => !mustUseCardIds.has(c.id) && !usedNames.has(c.name),
  );
  const usedIds = new Set<string>(mustUse.map((c) => c.id));

  for (let i = 0; i < setup.slots.length; i++) {
    if (placed.has(i)) continue;
    const slot = setup.slots[i];
    const candidates = fillable.filter(
      (c) => fitsSlot(c, slot) && !usedIds.has(c.id) && !usedNames.has(c.name),
    );
    if (candidates.length === 0) {
      throw new SlotCannotBeFilledError(slot, i);
    }
    const picked = shuffle(candidates)[0];
    placed.set(i, picked);
    usedIds.add(picked.id);
    usedNames.add(picked.name);
  }

  const placements: SupplyPlacement[] = setup.slots.map((slot, i) => ({
    slot,
    card: placed.get(i)!,
  }));
  const market = buildMarketFromPlacements(placements);

  if (
    market.gems.length !== setupTypeCounts.Gem ||
    market.relics.length !== setupTypeCounts.Relic ||
    market.spells.length !== setupTypeCounts.Spell
  ) {
    throw new Error(
      `setup "${setup.name}" の生成結果がスロット構成と一致しません (Gem ${market.gems.length}/${setupTypeCounts.Gem}, Relic ${market.relics.length}/${setupTypeCounts.Relic}, Spell ${market.spells.length}/${setupTypeCounts.Spell})`,
    );
  }

  return {
    market,
    placements,
    poolSnapshot: dedupedPool,
    mustUseIds: new Set(mustUseCardIds),
    setup,
  };
}

function rerollCandidates(
  poolSnapshot: readonly Card[],
  slotIndex: number,
  placements: SupplyPlacement[],
  mustUseIds: ReadonlySet<string>,
): Card[] {
  const slot = placements[slotIndex].slot;
  const usedIds = new Set(placements.map((p) => p.card.id));
  const usedNames = new Set(placements.map((p) => p.card.name));
  return poolSnapshot.filter(
    (c) =>
      fitsSlot(c, slot) &&
      !usedIds.has(c.id) &&
      !usedNames.has(c.name) &&
      !mustUseIds.has(c.id),
  );
}

/**
 * 単一スロットを再抽選する。
 * 候補は: poolSnapshot のうち
 *  - そのスロット制約に合致
 *  - 現在の他 8 枚 + 自身 (= 全 placements) の id・name と重複しない
 *  - 必ず使用カードでない
 * 候補 0 件で SlotCannotBeFilledError。
 */
export function rerollSlot(
  poolSnapshot: readonly Card[],
  slotIndex: number,
  placements: SupplyPlacement[],
  mustUseIds: ReadonlySet<string>,
): Card {
  if (slotIndex < 0 || slotIndex >= placements.length) {
    throw new RangeError(`slotIndex ${slotIndex} は範囲外です`);
  }
  const candidates = rerollCandidates(
    poolSnapshot,
    slotIndex,
    placements,
    mustUseIds,
  );
  if (candidates.length === 0) {
    throw new SlotCannotBeFilledError(placements[slotIndex].slot, slotIndex);
  }
  return shuffle(candidates)[0];
}

/** 再抽選可能か (候補が 1 枚以上あるか) を事前判定する */
export function canRerollSlot(
  poolSnapshot: readonly Card[],
  slotIndex: number,
  placements: SupplyPlacement[],
  mustUseIds: ReadonlySet<string>,
): boolean {
  return (
    rerollCandidates(poolSnapshot, slotIndex, placements, mustUseIds).length > 0
  );
}
