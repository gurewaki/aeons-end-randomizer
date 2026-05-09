import { shuffle } from './shuffle';
import { NoEligibleSeasonError } from './errors';

/** ネメシス基本カードの階層数 (Aeons End の階層 1〜3) */
export const NEMESIS_TIERS = [1, 2, 3] as const;
export type NemesisTier = (typeof NEMESIS_TIERS)[number];

export interface BasicDeckResult {
  /** 階層 → シーズン番号 */
  byTier: Record<NemesisTier, number>;
}

/**
 * 各階層に対して、抽選対象シーズンから独立にランダム選択する (重複可)。
 * @param eligibleSeasons 大箱 (type=main) を所有しているシーズン番号の配列
 */
export function generateBasicDeck(
  eligibleSeasons: readonly number[],
): BasicDeckResult {
  if (eligibleSeasons.length === 0) {
    throw new NoEligibleSeasonError();
  }
  const pool = [...eligibleSeasons];
  const byTier = {} as Record<NemesisTier, number>;
  for (const tier of NEMESIS_TIERS) {
    byTier[tier] = shuffle(pool)[0];
  }
  return { byTier };
}
