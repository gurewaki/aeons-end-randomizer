import type {
  Card,
  Gem,
  Relic,
  Spell,
  MarketSupply,
  RandomizerOptions,
} from '../types';
import { LOW_COST_GEM_THRESHOLD, MARKET_COMPOSITION } from '../types';
import { shuffle } from './shuffle';
import { InsufficientPoolError, TooManyMustUseError } from './errors';

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

/**
 * pool から n 枚を抽選する。
 * stratify=true: コスト範囲 [min,max] を n 等分し、各コスト帯から 1 枚ずつ抽選。
 *                空のコスト帯があれば残りプール全体からフォールバック抽選。
 * stratify=false: 単純シャッフル後の先頭 n 枚。
 */
function pickN<T extends Card>(pool: T[], n: number, stratify: boolean): T[] {
  if (n <= 0) return [];
  if (pool.length <= n) return shuffle(pool);
  if (!stratify) return shuffle(pool).slice(0, n);

  const sorted = [...pool].sort((a, b) => a.cost - b.cost);
  const min = sorted[0].cost;
  const max = sorted[sorted.length - 1].cost;
  // 全部同コストなら範囲分割しても意味が無いのでフォールバック
  if (min === max) return shuffle(pool).slice(0, n);

  const range = max - min;
  const used = new Set<string>();
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const lo = min + (i * range) / n;
    const hi = min + ((i + 1) * range) / n;
    const isLast = i === n - 1;
    let bucket = sorted.filter(
      (c) =>
        !used.has(c.id) &&
        c.cost >= lo &&
        (isLast ? c.cost <= hi : c.cost < hi),
    );
    if (bucket.length === 0) {
      // 該当コスト帯が空 → 残りプール全体から抽選
      bucket = sorted.filter((c) => !used.has(c.id));
    }
    const picked = shuffle(bucket)[0];
    used.add(picked.id);
    out.push(picked);
  }
  return out;
}

export function generateMarket(
  pool: Card[],
  options: RandomizerOptions,
): MarketSupply {
  const mustUseSet = options.mustUseCardIds;

  const mustUse = pool.filter((c) => mustUseSet.has(c.id));
  const mustGems = mustUse.filter((c): c is Gem => c.type === 'Gem');
  const mustRelics = mustUse.filter((c): c is Relic => c.type === 'Relic');
  const mustSpells = mustUse.filter((c): c is Spell => c.type === 'Spell');

  if (mustGems.length > MARKET_COMPOSITION.Gem) {
    throw new TooManyMustUseError('Gem', mustGems.length);
  }
  if (mustRelics.length > MARKET_COMPOSITION.Relic) {
    throw new TooManyMustUseError('Relic', mustRelics.length);
  }
  if (mustSpells.length > MARKET_COMPOSITION.Spell) {
    throw new TooManyMustUseError('Spell', mustSpells.length);
  }

  const mustUseNames = new Set(mustUse.map((c) => c.name));
  const fillable = dedupeByName(
    pool.filter((c) => !mustUseSet.has(c.id) && !mustUseNames.has(c.name)),
  );

  const fillableGems = fillable.filter((c): c is Gem => c.type === 'Gem');
  const fillableRelics = fillable.filter((c): c is Relic => c.type === 'Relic');
  const fillableSpells = fillable.filter((c): c is Spell => c.type === 'Spell');

  const gems = pickGems(
    mustGems,
    fillableGems,
    options.requireLowCostGem,
    options.stratifyCost,
  );
  const relics = pickFixed(
    mustRelics,
    fillableRelics,
    'Relic',
    options.stratifyCost,
  );
  const spells = pickFixed(
    mustSpells,
    fillableSpells,
    'Spell',
    options.stratifyCost,
  );

  return { gems, relics, spells };
}

function pickGems(
  must: Gem[],
  fillable: Gem[],
  requireLowCost: boolean,
  stratify: boolean,
): Gem[] {
  const total = MARKET_COMPOSITION.Gem;
  const slots = total - must.length;

  if (!requireLowCost) {
    if (fillable.length < slots) {
      throw new InsufficientPoolError(
        'Gem',
        total,
        must.length + fillable.length,
      );
    }
    const filled = pickN(fillable, slots, stratify);
    return shuffle([...must, ...filled]);
  }

  // requireLowCost = true
  const mustHasLowCost = must.some((g) => g.cost <= LOW_COST_GEM_THRESHOLD);
  if (mustHasLowCost) {
    if (fillable.length < slots) {
      throw new InsufficientPoolError(
        'Gem',
        total,
        must.length + fillable.length,
      );
    }
    const filled = pickN(fillable, slots, stratify);
    return shuffle([...must, ...filled]);
  }

  // 必ず使用に低コスト Gem がない → 残スロットで確保する必要
  if (slots < 1) {
    // 既に Gem スロットが必ず使用で埋まっている
    throw new InsufficientPoolError('LowCostGem', 1, 0);
  }
  const lowCost = fillable.filter((g) => g.cost <= LOW_COST_GEM_THRESHOLD);
  if (lowCost.length < 1) {
    throw new InsufficientPoolError('LowCostGem', 1, 0);
  }
  if (fillable.length < slots) {
    throw new InsufficientPoolError(
      'Gem',
      total,
      must.length + fillable.length,
    );
  }
  const pickedLow = shuffle(lowCost)[0];
  const rest = fillable.filter((g) => g.id !== pickedLow.id);
  const restPicked = pickN(rest, slots - 1, stratify);
  return shuffle([...must, pickedLow, ...restPicked]);
}

function pickFixed<T extends Card>(
  must: T[],
  fillable: T[],
  type: 'Relic' | 'Spell',
  stratify: boolean,
): T[] {
  const total = MARKET_COMPOSITION[type];
  const slots = total - must.length;
  if (fillable.length < slots) {
    throw new InsufficientPoolError(
      type,
      total,
      must.length + fillable.length,
    );
  }
  const filled = pickN(fillable, slots, stratify);
  return shuffle([...must, ...filled]);
}
