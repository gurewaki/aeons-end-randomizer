'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildInitialState,
  DEFAULT_SETTINGS,
  pairKey,
  reshuffleFromDiscard,
  type PlayerValue,
  type TurnOrderCard,
  type TurnOrderSettings,
  type TurnOrderState,
} from '../../lib/turnOrder';
import { shuffle } from '../../lib/randomizer/shuffle';
import { TurnOrderSettingsPanel } from './TurnOrderSettings';
import {
  TurnOrderCardBack,
  TurnOrderCardFace,
} from './TurnOrderCardTile';
import { TurnOrderPeekModal } from './TurnOrderPeekModal';
import { TurnOrderReorderModal } from './TurnOrderReorderModal';
import { TurnOrderWildSelectionModal } from './TurnOrderWildSelectionModal';
import { TurnOrderPairSelectionModal } from './TurnOrderPairSelectionModal';
import { useTurnOrderProgress } from './TurnOrderProgressContext';

/** 公開アニメーションの長さ (CSS と一致)
 *  - 0-1000ms:  reveal-suspense (カード裏が震える)
 *  - 1000-1500ms: reveal-face (カード表ポップ)
 */
const REVEAL_MS = 1500;

type Mode = 'idle' | 'revealing';

/** どの「公開後の行き先」を選んでいるか (アニメーション完了後に適用) */
type RevealIntent =
  | { kind: 'discard' }
  | { kind: 'returnTop' }
  | { kind: 'returnBottom' };

export function TurnOrderRandomizer() {
  const [settings, setSettings] = useState<TurnOrderSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<TurnOrderState>(() =>
    buildInitialState(DEFAULT_SETTINGS),
  );
  const { setInProgress } = useTurnOrderProgress();

  // 設定が変わったら deck を再構築 (現在のゲーム状態はリセット)
  useEffect(() => {
    setState(buildInitialState(settings));
  }, [settings]);

  // 公開アニメーション状態
  const [mode, setMode] = useState<Mode>('idle');
  /** 今めくっているカード (アニメーション表示用) */
  const [revealing, setRevealing] = useState<TurnOrderCard | null>(null);
  const [revealIntent, setRevealIntent] = useState<RevealIntent | null>(null);

  // Modal 各種
  const [peekOpen, setPeekOpen] = useState(false);
  const [peekCard, setPeekCard] = useState<TurnOrderCard | null>(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  /** ワイルド公開待ち: 選択完了でこのカードを捨て札に確定する */
  const [wildPending, setWildPending] = useState<TurnOrderCard | null>(null);
  /** ペア (初回) 公開待ち: 選択完了でこのカードを捨て札に確定する */
  const [pairPending, setPairPending] = useState<TurnOrderCard | null>(null);

  const playerCandidates: PlayerValue[] = settings.playerValues;

  /** 山が空ならシャッフルして山に戻し、その後の deck/discard を返す */
  const ensureNonEmpty = (s: TurnOrderState): TurnOrderState => {
    return s.deck.length === 0 ? reshuffleFromDiscard(s) : s;
  };

  /** 公開アニメーション → 確定処理を実行 */
  const startReveal = (intent: RevealIntent) => {
    setState((prev) => {
      const ready = ensureNonEmpty(prev);
      const top = ready.deck[0];
      if (!top) return prev;
      // ready を新しい state にしておく (アニメ完了まで deck から外さず、見た目だけ動かす)
      setRevealing(top);
      setRevealIntent(intent);
      setMode('revealing');
      return ready;
    });
  };

  /** アニメーション完了で実際に deck/discard を更新 */
  useEffect(() => {
    if (mode !== 'revealing' || !revealing || !revealIntent) return;
    const timer = window.setTimeout(() => {
      if (revealing.kind === 'wild' && revealIntent.kind === 'discard') {
        // ワイルド公開 → プレイヤー選択 Modal を出して保留
        setWildPending(revealing);
      } else if (
        revealing.kind === 'pair' &&
        revealIntent.kind === 'discard'
      ) {
        // ペア公開: 既にこのペアが使われているなら自動割り振り、そうでなければ Modal
        const key = pairKey(revealing.pairValues!);
        const used = state.pairChoices[key];
        if (used !== undefined) {
          const [a, b] = revealing.pairValues!;
          const auto = used === a ? b : a;
          applyReveal(revealing, revealIntent, auto);
        } else {
          setPairPending(revealing);
        }
      } else {
        applyReveal(revealing, revealIntent);
      }
      setMode('idle');
      setRevealing(null);
      setRevealIntent(null);
    }, REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [mode, revealing, revealIntent, state.pairChoices]);

  /** 実際の deck/discard 操作。revealedAs はワイルド/ペア時に上書き。
   *  ペアカードかつ初回確定なら pairChoices に記録する。 */
  const applyReveal = (
    card: TurnOrderCard,
    intent: RevealIntent,
    revealedAs?: PlayerValue,
  ) => {
    setState((prev) => {
      const deckRest = prev.deck.slice(1);
      const annotated = revealedAs ? { ...card, revealedAs } : card;
      const nextPairChoices = { ...prev.pairChoices };
      if (
        intent.kind === 'discard' &&
        card.kind === 'pair' &&
        revealedAs !== undefined
      ) {
        const key = pairKey(card.pairValues!);
        // 初回 (まだ未記録) のときだけ choice を入れる
        if (nextPairChoices[key] === undefined) {
          nextPairChoices[key] = revealedAs;
        }
      }
      if (intent.kind === 'discard') {
        return {
          ...prev,
          deck: deckRest,
          discard: [annotated, ...prev.discard],
          pairChoices: nextPairChoices,
        };
      }
      if (intent.kind === 'returnTop') {
        return { ...prev, deck: [card, ...deckRest] };
      }
      // returnBottom
      return { ...prev, deck: [...deckRest, card] };
    });
  };

  // ワイルド選択結果が確定したら apply
  const handleWildSelect = (v: PlayerValue) => {
    if (!wildPending) return;
    applyReveal(wildPending, { kind: 'discard' }, v);
    setWildPending(null);
  };

  // ペア初回の選択結果が確定したら apply
  const handlePairSelect = (v: PlayerValue) => {
    if (!pairPending) return;
    applyReveal(pairPending, { kind: 'discard' }, v);
    setPairPending(null);
  };

  // 「公開」ボタン: 即・捨て札
  const handleReveal = () => {
    if (mode !== 'idle' || wildPending || pairPending) return;
    startReveal({ kind: 'discard' });
  };

  // 「見る」ボタン: peek modal (アニメなし)
  const handlePeek = () => {
    if (mode !== 'idle' || wildPending || pairPending) return;
    setState((prev) => {
      const ready = ensureNonEmpty(prev);
      setPeekCard(ready.deck[0] ?? null);
      setPeekOpen(true);
      return ready;
    });
  };

  const handlePeekDiscard = () => {
    if (!peekCard) return;
    setPeekOpen(false);
    if (peekCard.kind === 'wild') {
      setWildPending(peekCard);
    } else if (peekCard.kind === 'pair') {
      const key = pairKey(peekCard.pairValues!);
      const used = state.pairChoices[key];
      if (used !== undefined) {
        const [a, b] = peekCard.pairValues!;
        applyReveal(peekCard, { kind: 'discard' }, used === a ? b : a);
      } else {
        setPairPending(peekCard);
      }
    } else {
      applyReveal(peekCard, { kind: 'discard' });
    }
    setPeekCard(null);
  };
  const handlePeekReturnTop = () => {
    setPeekOpen(false);
    setPeekCard(null);
  };
  const handlePeekReturnBottom = () => {
    if (!peekCard) return;
    setPeekOpen(false);
    applyReveal(peekCard, { kind: 'returnBottom' });
    setPeekCard(null);
  };

  // 並べ替え
  const handleApplyReorder = (next: TurnOrderCard[]) => {
    setState((prev) => ({ ...prev, deck: next }));
  };

  // シャッフルし直す (現在の構成で新規シャッフル)
  const handleResetShuffle = () => {
    setState(buildInitialState(settings));
  };

  // 捨て札の特定カードを山に戻して再シャッフル (シャッフルなのでペアの追跡もリセット)
  const returnDiscardToDeck = (cardId: string) => {
    setState((prev) => {
      const found = prev.discard.find((c) => c.id === cardId);
      if (!found) return prev;
      const restored = { ...found, revealedAs: undefined };
      return {
        ...prev,
        discard: prev.discard.filter((c) => c.id !== cardId),
        deck: shuffle([...prev.deck, restored]),
        pairChoices: {},
      };
    });
  };

  const deckCount = state.deck.length;
  const totalCount = useMemo(
    () => state.deck.length + state.discard.length,
    [state],
  );

  const busy =
    mode !== 'idle' || wildPending !== null || pairPending !== null;

  // 公開を 1 度でも開始した = 捨て札がある or 公開中 or 選択待ち
  const inProgress =
    state.discard.length > 0 ||
    mode === 'revealing' ||
    wildPending !== null ||
    pairPending !== null;
  useEffect(() => {
    setInProgress(inProgress);
    return () => setInProgress(false);
  }, [inProgress, setInProgress]);

  // 設定変更を確認付きでラップ
  const handleSettingsChange = (next: TurnOrderSettings) => {
    if (inProgress) {
      const ok = window.confirm(
        '設定を変更すると進行中の山がリセットされます。よろしいですか？',
      );
      if (!ok) return;
    }
    setSettings(next);
  };

  // シャッフルし直すを確認付きでラップ (山札が空でない場合のみ)
  const handleResetShuffleSafe = () => {
    if (state.deck.length > 0) {
      const ok = window.confirm('山札を新しくシャッフルし直します。よろしいですか？');
      if (!ok) return;
    }
    handleResetShuffle();
  };

  // 「見る」「並べ替え」も誤タップ防止のため確認を入れる
  const handlePeekSafe = () => {
    if (mode !== 'idle' || wildPending) return;
    const ok = window.confirm('山札の一番上のカードを確認します。よろしいですか？');
    if (!ok) return;
    handlePeek();
  };
  const handleReorderSafe = () => {
    const ok = window.confirm('山札の中身を確認・並べ替えます。よろしいですか？');
    if (!ok) return;
    setReorderOpen(true);
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:py-12">
      <header>
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          ターン順カードシャッフラ
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          プレイヤー値とオプションを設定すると山が組まれ、各操作で公開できます
        </p>
      </header>

      <TurnOrderSettingsPanel settings={settings} onChange={handleSettingsChange} />

      {/* デッキ + 公開アニメーション */}
      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            山札
            <span className="ml-2 text-sm font-normal text-slate-400">
              {deckCount} / {totalCount} 枚
            </span>
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 py-2 sm:flex-row">
          {/* h-44 で revealing 時の最大スケール (1.4) でもクリップしない高さを確保 */}
          <div className="flex h-44 items-center justify-center">
            {revealing ? (
              <div key={revealing.id} className="relative h-32 w-24">
                {/* Phase 1: カード裏が震える */}
                <div className="reveal-suspense absolute inset-0 flex items-center justify-center">
                  <TurnOrderCardBack />
                </div>
                {/* Phase 2: カード表がポップ */}
                <div className="reveal-face absolute inset-0 flex items-center justify-center">
                  <TurnOrderCardFace card={revealing} />
                </div>
              </div>
            ) : deckCount > 0 ? (
              <TurnOrderCardBack />
            ) : (
              <div className="flex h-32 w-24 items-center justify-center rounded-md border-2 border-dashed border-slate-700 text-xs text-slate-500">
                空
              </div>
            )}
          </div>
        </div>

        {/* ツールバー */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={handleReveal}
            disabled={busy}
            className="rounded border border-emerald-500/60 bg-emerald-500/30 px-4 py-1.5 text-sm font-medium text-emerald-100 hover:bg-emerald-500/40 disabled:opacity-50"
          >
            公開
          </button>
          <button
            type="button"
            onClick={handlePeekSafe}
            disabled={busy}
            className="rounded border border-slate-600 bg-slate-800 px-4 py-1.5 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            見る
          </button>
          <button
            type="button"
            onClick={handleReorderSafe}
            disabled={busy || deckCount === 0}
            className="rounded border border-slate-600 bg-slate-800 px-4 py-1.5 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            並べ替え
          </button>
          <button
            type="button"
            onClick={handleResetShuffleSafe}
            disabled={busy}
            className="rounded border border-slate-600 bg-slate-800 px-4 py-1.5 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            シャッフルし直す
          </button>
        </div>
      </section>

      {/* 捨て札 */}
      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">
          捨て札
          <span className="ml-2 text-sm font-normal text-slate-400">
            {state.discard.length} 枚
          </span>
        </h2>
        {/* min-h で「最新カード + 現在のターン label + ボタン」と同じ縦サイズを確保し、
            捨て札が空 ↔ あり の遷移でレイアウトジャンプが起きないようにする */}
        <div className="min-h-48">
          {state.discard.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-md border-2 border-dashed border-slate-700/60 text-sm text-slate-500">
              まだ公開されたカードはありません
            </div>
          ) : (
            <ul className="flex flex-wrap items-end gap-3">
              {state.discard.map((c, i) => {
                const isLatest = i === 0;
                return (
                  <li
                    key={c.id}
                    className={`flex flex-col items-center gap-1 ${
                      isLatest
                        ? 'rounded-md p-2 ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-slate-800'
                        : ''
                    }`}
                  >
                    {isLatest && (
                      <span className="text-[10px] font-semibold tracking-widest text-emerald-300">
                        現在のターン
                      </span>
                    )}
                    <TurnOrderCardFace card={c} size={isLatest ? 'normal' : 'small'} />
                    <button
                      type="button"
                      onClick={() => returnDiscardToDeck(c.id)}
                      className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                      title="山に戻して再シャッフル"
                    >
                      ↻ 山へ戻す
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Modals */}
      <TurnOrderPeekModal
        open={peekOpen}
        card={peekCard}
        onDiscard={handlePeekDiscard}
        onReturnTop={handlePeekReturnTop}
        onReturnBottom={handlePeekReturnBottom}
      />
      <TurnOrderReorderModal
        open={reorderOpen}
        cards={state.deck}
        onClose={() => setReorderOpen(false)}
        onApply={handleApplyReorder}
      />
      <TurnOrderWildSelectionModal
        open={wildPending !== null}
        candidates={playerCandidates}
        onSelect={handleWildSelect}
      />
      <TurnOrderPairSelectionModal
        open={pairPending !== null}
        values={
          pairPending?.pairValues ?? ([1, 2] as [PlayerValue, PlayerValue])
        }
        onSelect={handlePairSelect}
      />
    </main>
  );
}
