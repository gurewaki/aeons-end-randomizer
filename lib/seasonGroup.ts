import type { Expansion } from './types';

export interface SeasonGroup {
  season: number | null;
  items: Expansion[];
}

/**
 * Expansion 配列を Expansion.season 別にグループ化する。
 * シーズン昇順、season 未割当 (undefined/null) は末尾の null グループへ。
 */
export function groupExpansionsBySeason(
  expansions: readonly Expansion[],
): SeasonGroup[] {
  const map = new Map<number | null, Expansion[]>();
  for (const e of expansions) {
    const key = e.season ?? null;
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    })
    .map(([season, items]) => ({ season, items }));
}

export function seasonLabel(season: number | null): string {
  return season !== null ? `シーズン ${season}` : 'その他';
}
