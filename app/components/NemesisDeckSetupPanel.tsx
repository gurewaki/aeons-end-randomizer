'use client';

import { useEffect, useMemo } from 'react';
import type {
  Expansion,
  Nemesis,
  NemesisDeckSetup,
  NemesisPlayerCount,
  NemesisTier,
} from '../../lib/types';
import { NEMESIS_BASIC_COUNT_BY_PLAYER, NEMESIS_TIERS } from '../../lib/types';

interface ValidationIssue {
  message: string;
}

/**
 * トライアル: ネメシスデッキの初期セットアップ UI。
 * ボス選択 + tier 別 Basic 供給拡張選択。プレイヤー人数は turn-order の settings 由来。
 */
export function NemesisDeckSetupPanel({
  expansions,
  bosses,
  setup,
  onSetupChange,
  playerCount,
  onStart,
  startDisabled,
  startDisabledReason,
}: {
  expansions: readonly Expansion[];
  /** 選択可能なボスの一覧 (生成済み) */
  bosses: readonly Nemesis[];
  setup: NemesisDeckSetup;
  onSetupChange: (next: NemesisDeckSetup) => void;
  playerCount: NemesisPlayerCount;
  /** 「新規ゲーム」 押下 */
  onStart: () => void;
  startDisabled: boolean;
  startDisabledReason?: string;
}) {
  const expansionById = useMemo(() => {
    const m = new Map<string, Expansion>();
    for (const e of expansions) m.set(e.id, e);
    return m;
  }, [expansions]);

  // tier ごとに「Basic カードを N 枚以上持っている拡張」を抽出。択一なので候補数も表示
  const candidatesByTier = useMemo(() => {
    const out: Record<NemesisTier, Expansion[]> = { 1: [], 2: [], 3: [] };
    for (const tier of NEMESIS_TIERS) {
      const required = NEMESIS_BASIC_COUNT_BY_PLAYER[playerCount][tier];
      out[tier] = expansions.filter((e) => {
        const count = e.nemesisCards.filter(
          (c) => c.category === 'Basic' && c.tier === tier,
        ).length;
        return count >= required;
      });
    }
    return out;
  }, [expansions, playerCount]);

  const selectedBoss = bosses.find((b) => b.id === setup.bossId);

  /**
   * ボス選択時 / プレイヤー人数変更時に、各 tier の Basic 供給拡張を自動アサインする。
   * - 既に有効な (= 必要枚数を満たす) 拡張が選択済みなら触らない
   * - 未選択 or 不足の場合: ボスと同じ拡張で足りるならそれ、なければ候補リストの先頭
   */
  useEffect(() => {
    if (!setup.bossId) return;
    const boss = bosses.find((b) => b.id === setup.bossId);
    if (!boss) return;

    const updated: Record<NemesisTier, string> = {
      ...setup.basicSourceExpansionByTier,
    };
    let changed = false;
    for (const tier of NEMESIS_TIERS) {
      const required = NEMESIS_BASIC_COUNT_BY_PLAYER[playerCount][tier];
      const current = updated[tier];
      // 既存選択が有効ならそのまま
      if (current) {
        const exp = expansionById.get(current);
        if (exp) {
          const have = exp.nemesisCards.filter(
            (c) => c.category === 'Basic' && c.tier === tier,
          ).length;
          if (have >= required) continue;
        }
      }
      // それ以外は候補から選ぶ (ボスの拡張が満たすならそれを優先、なければ先頭)
      const candidates = candidatesByTier[tier];
      const preferred =
        candidates.find((e) => e.id === boss.expansionId) ?? candidates[0];
      if (preferred) {
        updated[tier] = preferred.id;
        changed = true;
      }
    }
    if (changed) {
      onSetupChange({ ...setup, basicSourceExpansionByTier: updated });
    }
    // setup を deps に入れると無限ループになりかねないので bossId / playerCount のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup.bossId, playerCount]);

  // 事前バリデーション (ドロー機能側でも throw されるが、ユーザーには事前に見せる)
  const issues: ValidationIssue[] = useMemo(() => {
    const out: ValidationIssue[] = [];
    if (!setup.bossId) out.push({ message: 'ボスを選択してください' });
    for (const tier of NEMESIS_TIERS) {
      const expId = setup.basicSourceExpansionByTier[tier];
      const required = NEMESIS_BASIC_COUNT_BY_PLAYER[playerCount][tier];
      if (!expId) {
        out.push({ message: `階層 ${tier} の Basic 供給拡張を選択してください` });
        continue;
      }
      const exp = expansionById.get(expId);
      if (!exp) {
        out.push({ message: `階層 ${tier} の拡張が見つかりません` });
        continue;
      }
      const available = exp.nemesisCards.filter(
        (c) => c.category === 'Basic' && c.tier === tier,
      ).length;
      if (available < required) {
        out.push({
          message: `階層 ${tier}: ${exp.name} の Basic カードが ${available} 枚しかありません (必要 ${required} 枚)`,
        });
      }
    }
    return out;
  }, [setup, playerCount, expansionById]);

  const setTierSource = (tier: NemesisTier, expansionId: string) => {
    onSetupChange({
      ...setup,
      basicSourceExpansionByTier: {
        ...setup.basicSourceExpansionByTier,
        [tier]: expansionId,
      },
    });
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <h2 className="text-lg font-semibold text-slate-100">
        ネメシスデッキの準備
      </h2>

      <div className="text-xs text-slate-400">
        プレイヤー人数: <span className="text-slate-200">{playerCount} 人</span>
        <span className="ml-2">
          (Basic 枚数: tier1={NEMESIS_BASIC_COUNT_BY_PLAYER[playerCount][1]} /
          tier2={NEMESIS_BASIC_COUNT_BY_PLAYER[playerCount][2]} / tier3=
          {NEMESIS_BASIC_COUNT_BY_PLAYER[playerCount][3]})
        </span>
      </div>

      {/* ボス選択 */}
      <div>
        <label
          htmlFor="boss-select"
          className="mb-1 block text-sm font-medium text-slate-200"
        >
          ボス (ネメシス) を 1 体選択
        </label>
        <select
          id="boss-select"
          value={setup.bossId}
          onChange={(e) =>
            onSetupChange({ ...setup, bossId: e.target.value })
          }
          className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        >
          <option value="">— 未選択 —</option>
          {bosses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.level !== undefined ? ` (難易度 ${b.level})` : ''}
            </option>
          ))}
        </select>
        {selectedBoss && (
          <div className="mt-2 rounded border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-300">
            <div className="font-semibold text-slate-100">{selectedBoss.name}</div>
            {selectedBoss.life !== undefined && (
              <div>体力: {selectedBoss.life}</div>
            )}
            {selectedBoss.unleash && (
              <div className="mt-1">
                <span className="text-slate-400">暴走: </span>
                {selectedBoss.unleash}
              </div>
            )}
          </div>
        )}
      </div>

      {/* tier 別 Basic 供給拡張 */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-200">
          Basic カードの供給拡張 (階層ごとに 1 つ選択)
        </div>
        {NEMESIS_TIERS.map((tier) => {
          const required = NEMESIS_BASIC_COUNT_BY_PLAYER[playerCount][tier];
          const candidates = candidatesByTier[tier];
          return (
            <div key={tier} className="flex flex-wrap items-center gap-2">
              <label
                htmlFor={`tier-${tier}-select`}
                className="w-20 text-sm text-slate-300"
              >
                階層 {tier}
              </label>
              <select
                id={`tier-${tier}-select`}
                value={setup.basicSourceExpansionByTier[tier] ?? ''}
                onChange={(e) => setTierSource(tier, e.target.value)}
                disabled={!setup.bossId}
                className="flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {!setup.bossId && (
                  <option value="">— まずボスを選択 —</option>
                )}
                {expansions.map((e) => {
                  const count = e.nemesisCards.filter(
                    (c) => c.category === 'Basic' && c.tier === tier,
                  ).length;
                  const enough = count >= required;
                  return (
                    <option
                      key={e.id}
                      value={e.id}
                      disabled={!enough}
                    >
                      {e.name} ({count} 枚{!enough ? ` / 必要 ${required}` : ''})
                    </option>
                  );
                })}
              </select>
              <span className="text-xs text-slate-500">必要 {required} 枚</span>
              {candidates.length === 0 && (
                <span className="text-xs text-red-300">
                  候補拡張なし
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* バリデーション */}
      {issues.length > 0 && (
        <div className="rounded border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-amber-200">
          <div className="font-medium">セットアップに以下の問題があります:</div>
          <ul className="ml-4 mt-1 list-disc">
            {issues.map((i, idx) => (
              <li key={idx}>{i.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={onStart}
          disabled={startDisabled || issues.length > 0}
          title={startDisabledReason}
          className="inline-flex items-center gap-2 rounded border border-emerald-500/60 bg-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-500/30"
        >
          新規ゲーム (デッキを構築)
        </button>
      </div>
    </section>
  );
}
