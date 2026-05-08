import type {
  Card,
  Gem,
  Relic,
  Spell,
  MarketSupply,
  RandomizerOptions,
} from '../types';
import { shuffle } from './shuffle';
import { InsufficientPoolError } from './errors';

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
  const deduped = dedupeByName(pool);

  const gemsPool = deduped.filter((c): c is Gem => c.type === 'Gem');
  const relicsPool = deduped.filter((c): c is Relic => c.type === 'Relic');
  const spellsPool = deduped.filter((c): c is Spell => c.type === 'Spell');

  let gems: Gem[];
  if (options.requireCost3Gem) {
    const cost3 = gemsPool.filter((g) => g.cost === 3);
    if (cost3.length < 1) {
      throw new InsufficientPoolError('Cost3Gem', 1, 0);
    }
    if (gemsPool.length < 3) {
      throw new InsufficientPoolError('Gem', 3, gemsPool.length);
    }
    const picked3 = shuffle(cost3)[0];
    const rest = gemsPool.filter((g) => g.id !== picked3.id);
    const picked2 = shuffle(rest).slice(0, 2);
    gems = shuffle([picked3, ...picked2]);
  } else {
    if (gemsPool.length < 3) {
      throw new InsufficientPoolError('Gem', 3, gemsPool.length);
    }
    gems = shuffle(gemsPool).slice(0, 3);
  }

  if (relicsPool.length < 2) {
    throw new InsufficientPoolError('Relic', 2, relicsPool.length);
  }
  if (spellsPool.length < 4) {
    throw new InsufficientPoolError('Spell', 4, spellsPool.length);
  }

  return {
    gems,
    relics: shuffle(relicsPool).slice(0, 2),
    spells: shuffle(spellsPool).slice(0, 4),
  };
}
