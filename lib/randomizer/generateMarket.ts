import type {
  Card,
  Gem,
  Relic,
  Spell,
  CardType,
  MarketSupply,
  RandomizerOptions,
  SetupSlot,
} from '../types';
import { MARKET_COMPOSITION } from '../types';
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
): MarketSupply {
  const { setup, mustUseCardIds } = options;

  // タイプ別の必ず使用枚数 vs setup スロット数を検証
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

  // 必ず使用カードを setup スロットに配置 (most-constrained-first)
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

  // 残スロットを fillable から充足
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

  // タイプ別に集約 (各タイプ内は表示順をシャッフル)
  const result: MarketSupply = { gems: [], relics: [], spells: [] };
  for (let i = 0; i < setup.slots.length; i++) {
    const card = placed.get(i)!;
    if (card.type === 'Gem') result.gems.push(card as Gem);
    else if (card.type === 'Relic') result.relics.push(card as Relic);
    else result.spells.push(card as Spell);
  }
  result.gems = shuffle(result.gems);
  result.relics = shuffle(result.relics);
  result.spells = shuffle(result.spells);

  // 結果のタイプ別枚数が setup のスロット構成と一致するかをサニティチェック
  if (
    result.gems.length !== setupTypeCounts.Gem ||
    result.relics.length !== setupTypeCounts.Relic ||
    result.spells.length !== setupTypeCounts.Spell
  ) {
    throw new Error(
      `setup "${setup.name}" の生成結果がスロット構成と一致しません (Gem ${result.gems.length}/${setupTypeCounts.Gem}, Relic ${result.relics.length}/${setupTypeCounts.Relic}, Spell ${result.spells.length}/${setupTypeCounts.Spell})`,
    );
  }

  return result;
}
