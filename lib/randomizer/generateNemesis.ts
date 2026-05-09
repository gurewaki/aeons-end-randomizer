import type { Nemesis } from '../types';
import { shuffle } from './shuffle';
import { NoMatchingNemesisError } from './errors';

export type NemesisMode = 'normal' | 'expedition';

export interface NemesisRandomizerOptions {
  mode: NemesisMode;
  /** 通常モードで使用。空または未指定なら全難易度 */
  levelFilter?: ReadonlySet<number>;
  /** 探索行モードで使用。null/undefined なら全バトル */
  battleFilter?: number | null;
}

export function generateNemesis(
  pool: Nemesis[],
  options: NemesisRandomizerOptions,
): Nemesis {
  let filtered: Nemesis[];
  if (options.mode === 'normal') {
    // 通常モードは難易度未設定 (探索行専用) のネメシスを除外
    filtered = pool.filter((n) => n.level !== undefined);
    if (options.levelFilter && options.levelFilter.size > 0) {
      filtered = filtered.filter((n) => options.levelFilter!.has(n.level!));
    }
  } else {
    filtered = pool;
    if (options.battleFilter !== undefined && options.battleFilter !== null) {
      filtered = filtered.filter((n) => n.battle === options.battleFilter);
    }
  }
  if (filtered.length === 0) {
    throw new NoMatchingNemesisError();
  }
  return shuffle(filtered)[0];
}
