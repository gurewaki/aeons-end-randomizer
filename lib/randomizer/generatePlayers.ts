import type { Mage } from '../types';
import { shuffle } from './shuffle';
import {
  InvalidPlayerCountError,
  TooManyMustUseMagesError,
  InsufficientMagePoolError,
  PLAYER_COUNT_MIN,
  PLAYER_COUNT_MAX,
} from './errors';

export interface PlayerRandomizerOptions {
  playerCount: number;
  mustUseMageIds: ReadonlySet<string>;
}

export function generatePlayers(
  pool: Mage[],
  options: PlayerRandomizerOptions,
): Mage[] {
  const { playerCount, mustUseMageIds } = options;

  if (
    !Number.isInteger(playerCount) ||
    playerCount < PLAYER_COUNT_MIN ||
    playerCount > PLAYER_COUNT_MAX
  ) {
    throw new InvalidPlayerCountError(playerCount);
  }

  const mustUse = pool.filter((m) => mustUseMageIds.has(m.id));
  if (mustUse.length > playerCount) {
    throw new TooManyMustUseMagesError(mustUse.length, playerCount);
  }

  const slots = playerCount - mustUse.length;
  const fillable = pool.filter((m) => !mustUseMageIds.has(m.id));

  if (fillable.length < slots) {
    throw new InsufficientMagePoolError(
      playerCount,
      mustUse.length + fillable.length,
    );
  }

  const filled = slots > 0 ? shuffle(fillable).slice(0, slots) : [];
  return shuffle([...mustUse, ...filled]);
}
