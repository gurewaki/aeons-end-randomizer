import type { Expansion } from '../types';
import { EXPANSIONS } from './expansions.generated';
import { SETUPS } from './setups.generated';

export { EXPANSIONS, SETUPS };

const byId = new Map<string, Expansion>(EXPANSIONS.map((e) => [e.id, e]));

export function getExpansion(id: string): Expansion | undefined {
  return byId.get(id);
}

/**
 * 指定シーズンのテーマカラーを取得する。
 * シーズンに属する任意の Expansion から theme を引く (現状すべて同色を想定)。
 */
export function getSeasonTheme(season: number): string | undefined {
  const exp = EXPANSIONS.find((e) => e.season === season);
  return exp?.theme;
}
