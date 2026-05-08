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

  const gems = pickGems(mustGems, fillableGems, options.requireLowCostGem);
  const relics = pickFixed(mustRelics, fillableRelics, 'Relic');
  const spells = pickFixed(mustSpells, fillableSpells, 'Spell');

  return { gems, relics, spells };
}

function pickGems(
  must: Gem[],
  fillable: Gem[],
  requireLowCost: boolean,
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
    const filled = slots > 0 ? shuffle(fillable).slice(0, slots) : [];
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
    const filled = slots > 0 ? shuffle(fillable).slice(0, slots) : [];
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
  const restPicked = shuffle(rest).slice(0, slots - 1);
  return shuffle([...must, pickedLow, ...restPicked]);
}

function pickFixed<T extends Card>(
  must: T[],
  fillable: T[],
  type: 'Relic' | 'Spell',
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
  const filled = slots > 0 ? shuffle(fillable).slice(0, slots) : [];
  return shuffle([...must, ...filled]);
}
