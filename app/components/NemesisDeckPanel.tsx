'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type {
  NemesisDeckCard,
  NemesisDeckDraw,
  NemesisDeckState,
  NemesisTier,
} from '../../lib/types';
import {
  currentTier,
  totalRemaining,
} from '../../lib/randomizer/generateNemesisDeck';
import { NEMESIS_TIERS } from '../../lib/types';
import { NemesisCardTile } from './NemesisCardTile';
import { NemesisSpecificCardTile } from './NemesisSpecificCardTile';
import { NemesisDeckBack, NemesisDeckCardFace } from './NemesisDeckCardFace';

/** ターン順カードと同じ reveal アニメ時間 (CSS と一致)
 *  - 0-1500ms:  reveal-suspense
 *  - 1500-2250ms: reveal-face
 */
const REVEAL_MS = 2250;

function NemesisDeckCardDetail({
  card,
  bossName,
}: {
  card: NemesisDeckCard;
  bossName?: string;
}) {
  if (card.source === 'basic') return <NemesisCardTile card={card.card} />;
  return <NemesisSpecificCardTile card={card.card} nemesisName={bossName} />;
}

/**
 * ネメシスデッキ操作 + 履歴 UI。
 *
 * UX はターン順カードシャッフラに合わせる:
 * - 山札エリア (高さ h-72) 全体が「タップして引く」ボタン
 * - 引くと reveal-suspense → reveal-face のアニメ
 * - アニメ後は山札裏に戻り (= ターン順と同じ)、最新ドローは下の詳細パネルで全文確認
 */
export function NemesisDeckPanel({
  state,
  onDraw,
  onRequestReset,
  bossName,
}: {
  state: NemesisDeckState;
  /** ドロー実行 (親が drawTop を呼んで state を更新する) */
  onDraw: () => void;
  /** 「新規ゲーム」 押下 → 親が確認モーダルを出す */
  onRequestReset: () => void;
  /** 詳細表示で specific カードに「○○のカード」と分かるようボス名を渡す */
  bossName?: string;
}) {
  // アニメ中のカード (= 引いたばかりで公開アニメ実行中)
  const [revealing, setRevealing] = useState<NemesisDeckDraw | null>(null);
  /**
   * 「最新のドロー」詳細パネルに表示する index。アニメ完了まで更新しないことで、
   * tap → render 1 回目で新カードが一瞬見えるレースを防ぐ。
   * drawHistory が 0 件のとき -1。
   */
  const [revealedIndex, setRevealedIndex] = useState(
    state.drawHistory.length - 1,
  );
  // drawHistory.length の前回値を保持し、増加検知でアニメをスタートする
  const prevLengthRef = useRef(state.drawHistory.length);

  useEffect(() => {
    const prev = prevLengthRef.current;
    prevLengthRef.current = state.drawHistory.length;
    if (state.drawHistory.length > prev) {
      const newestIdx = state.drawHistory.length - 1;
      setRevealing(state.drawHistory[newestIdx]);
      const tid = setTimeout(() => {
        setRevealing(null);
        setRevealedIndex(newestIdx);
      }, REVEAL_MS);
      return () => clearTimeout(tid);
    }
    // length が減った場合 (リセット) は revealing もクリア
    if (state.drawHistory.length < prev) {
      setRevealing(null);
      setRevealedIndex(state.drawHistory.length - 1);
    }
  }, [state.drawHistory.length, state.drawHistory]);

  const tier = currentTier(state);
  const { remaining, total } = totalRemaining(state);
  const tierRemaining: Record<NemesisTier, number> = {
    1: state.piles[0].cards.length,
    2: state.piles[1].cards.length,
    3: state.piles[2].cards.length,
  };

  const exhausted = tier === null;
  const animating = revealing !== null;
  const canTap = !animating && !exhausted;

  const handleTap = () => {
    if (!canTap) return;
    onDraw();
  };

  // 最新のドロー = アニメ完了済みの最後のカード (revealedIndex が指す要素)
  const latestRevealed: NemesisDeckDraw | null =
    revealedIndex >= 0 && revealedIndex < state.drawHistory.length
      ? state.drawHistory[revealedIndex]
      : null;

  const historyExceptLatest =
    revealedIndex > 0
      ? state.drawHistory.slice(0, revealedIndex)
      : [];

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-100">
          ネメシスデッキ
          <span className="ml-2 text-sm font-normal text-slate-400">
            {remaining} / {total} 枚
            {tier !== null && ` ・ 階層 ${tier}`}
          </span>
        </h2>
        <button
          type="button"
          onClick={onRequestReset}
          aria-label="新規ゲーム (ネメシスデッキを再構築)"
          title="新規ゲーム"
          className="inline-flex items-center gap-1 rounded border border-slate-600 bg-slate-800/70 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700/70"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          新規ゲーム
        </button>
      </div>

      {/* 山札エリア (ターン順と同じく button 全体がタップで引く) */}
      <div className="flex flex-col items-center justify-center gap-4 py-2">
        <button
          type="button"
          onClick={handleTap}
          disabled={!canTap}
          aria-label={
            exhausted
              ? 'ネメシスデッキは尽きました'
              : 'ネメシスデッキの一番上を引く'
          }
          className={`flex flex-col items-center gap-2 rounded-md p-2 transition focus:outline-none focus:ring-2 focus:ring-red-400/60 ${
            canTap
              ? 'cursor-pointer hover:-translate-y-1 active:scale-95'
              : 'cursor-not-allowed opacity-60'
          }`}
        >
          {/* h-72 で revealing 時の最大スケール (1.4 × h-48 ≈ 269px) でもクリップしない高さを確保 */}
          <div className="flex h-72 items-center justify-center">
            {exhausted ? (
              <div className="flex h-48 w-36 items-center justify-center rounded-md border-2 border-dashed border-slate-700 text-center text-xs text-slate-500">
                デッキが尽きました
              </div>
            ) : revealing ? (
              <div
                key={state.drawHistory.length}
                className="relative h-48 w-36"
              >
                {/* Phase 1: カード裏が震える */}
                <div className="reveal-suspense absolute inset-0 flex items-center justify-center">
                  <NemesisDeckBack size="large" />
                </div>
                {/* Phase 2: カード表がポップ */}
                <div className="reveal-face absolute inset-0 flex items-center justify-center">
                  <NemesisDeckCardFace card={revealing.card} size="large" />
                </div>
              </div>
            ) : (
              <NemesisDeckBack size="large" />
            )}
          </div>
          <span
            className={`text-xs text-slate-400 ${
              animating || exhausted ? 'invisible' : ''
            }`}
          >
            タップして引く
          </span>
        </button>
      </div>

      {/* tier ごとの残量 (ターン順のツールバー位置に対応) */}
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-slate-300">
        {NEMESIS_TIERS.map((t) => (
          <span
            key={t}
            className={
              'rounded border px-2 py-0.5 ' +
              (tier === t
                ? 'border-amber-500/60 bg-amber-500/20 text-amber-100'
                : tierRemaining[t] === 0
                  ? 'border-slate-700 bg-slate-800/40 text-slate-500 line-through'
                  : 'border-slate-600 bg-slate-800/40 text-slate-300')
            }
          >
            階層 {t}: {tierRemaining[t]} 枚
          </span>
        ))}
      </div>

      {/* 最新ドローの詳細 (アニメと独立で常時更新) */}
      {latestRevealed && (
        <div className="mt-6">
          <div className="mb-2 text-xs font-semibold text-slate-400">
            最新のドロー (階層 {latestRevealed.tier})
          </div>
          <NemesisDeckCardDetail card={latestRevealed.card} bossName={bossName} />
        </div>
      )}

      {/* 履歴 */}
      {historyExceptLatest.length > 0 && (
        <details className="mt-4 rounded border border-slate-700 bg-slate-900/40">
          <summary className="cursor-pointer px-3 py-2 text-xs text-slate-300">
            これまでのドロー履歴 ({historyExceptLatest.length} 枚)
          </summary>
          <div className="max-h-96 space-y-2 overflow-y-auto p-3">
            {historyExceptLatest
              .slice()
              .reverse()
              .map((d, idx) => (
                <div key={`${historyExceptLatest.length - 1 - idx}`}>
                  <div className="mb-1 text-[10px] text-slate-500">
                    階層 {d.tier}
                  </div>
                  <NemesisDeckCardDetail card={d.card} bossName={bossName} />
                </div>
              ))}
          </div>
        </details>
      )}
    </section>
  );
}
