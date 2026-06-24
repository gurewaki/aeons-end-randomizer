'use client';

import { useMemo, useState } from 'react';
import { EXPANSIONS } from '../../lib/data';
import {
  DEFAULT_SETTINGS,
  type TurnOrderSettings,
} from '../../lib/turnOrder';
import type {
  Expansion,
  Nemesis,
  NemesisDeckSetup,
  NemesisDeckState,
  NemesisPlayerCount,
  NemesisTier,
} from '../../lib/types';
import {
  buildNemesisDeck,
  drawTop,
} from '../../lib/randomizer/generateNemesisDeck';
import { TurnOrderRandomizer } from './TurnOrderRandomizer';
import { TurnOrderSettingsPanel } from './TurnOrderSettings';
import { NemesisDeckSetupPanel } from './NemesisDeckSetupPanel';
import { NemesisDeckPanel } from './NemesisDeckPanel';
import { NemesisDeckResetConfirmModal } from './NemesisDeckResetConfirmModal';

function allBosses(expansions: readonly Expansion[]): Nemesis[] {
  const out: Nemesis[] = [];
  for (const e of expansions) out.push(...e.nemeses);
  return out;
}

const EMPTY_SETUP: NemesisDeckSetup = {
  bossId: '',
  basicSourceExpansionByTier: { 1: '', 2: '', 3: '' } as Record<
    NemesisTier,
    string
  >,
  playerCount: 4,
};

/**
 * β: ターン順 + ネメシスデッキの組み合わせ画面。
 *
 * レイアウト:
 *   - 上段: 設定エリア (ターン順設定 + ネメシス設定 を 1 枠でまとめる)
 *   - 下段: 山札エリア (ターン順 + ネメシス を横並び、高さを揃える)
 *
 * settings は親 (= ここ) が保持し、TurnOrderRandomizer には hideSettings で
 * 渡して内部の SettingsPanel を非表示にする。
 */
export function TurnOrderTrial() {
  const [settings, setSettings] = useState<TurnOrderSettings>(DEFAULT_SETTINGS);
  const playerCount = settings.playerValues.length as NemesisPlayerCount;
  const isExpedition = settings.expeditionMode && settings.playerValues.length === 4;

  const [setup, setSetup] = useState<NemesisDeckSetup>({
    ...EMPTY_SETUP,
    playerCount,
  });
  const [deckState, setDeckState] = useState<NemesisDeckState | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 設定変更時のリセット確認モーダル */
  const [pendingSettings, setPendingSettings] =
    useState<TurnOrderSettings | null>(null);
  /** 新規ゲーム押下時の確認モーダル */
  const [confirmReset, setConfirmReset] = useState(false);

  const bosses = useMemo(() => allBosses(EXPANSIONS), []);
  const bossesById = useMemo(() => {
    const m = new Map<string, Nemesis>();
    for (const b of bosses) m.set(b.id, b);
    return m;
  }, [bosses]);
  const expansionsById = useMemo(() => {
    const m = new Map<string, Expansion>();
    for (const e of EXPANSIONS) m.set(e.id, e);
    return m;
  }, []);

  /** setup.playerCount を settings.playerValues.length に同期 */
  if (setup.playerCount !== playerCount) {
    setSetup({ ...setup, playerCount });
  }

  const handleSettingsChange = (next: TurnOrderSettings) => {
    if (deckState) {
      setPendingSettings(next);
      return;
    }
    setSettings(next);
  };

  const confirmSettingsChange = () => {
    if (!pendingSettings) return;
    setSettings(pendingSettings);
    setDeckState(null);
    setPendingSettings(null);
  };

  const cancelSettingsChange = () => {
    setPendingSettings(null);
  };

  const handleStart = () => {
    setError(null);
    try {
      const state = buildNemesisDeck({
        setup: { ...setup, playerCount },
        bossesById,
        expansionsById,
      });
      setDeckState(state);
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
    }
  };

  const handleDraw = () => {
    if (!deckState) return;
    const { state: next, drawn } = drawTop(deckState);
    if (!drawn) return;
    setDeckState(next);
  };

  const handleRequestReset = () => {
    setConfirmReset(true);
  };

  const confirmResetDeck = () => {
    setDeckState(null);
    setConfirmReset(false);
  };

  const cancelResetDeck = () => {
    setConfirmReset(false);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          ターン順 + ネメシスデッキ
          <span className="ml-2 rounded border border-amber-500/60 bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-200">
            β
          </span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          ターン順カードと連動して、ネメシスデッキ (階層 1→2→3) を 1 ゲーム分管理するトライアル機能です。
          プレイヤー人数からネメシスデッキの枚数を自動計算します。
        </p>
      </header>

      {/* 上段: 設定エリア (ターン順設定 + ネメシス設定 を横並び or 縦並びでまとめる) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TurnOrderSettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
        />
        {isExpedition ? (
          <section className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-200">
            探索行モードのネメシスデッキは v1 では未対応です。通常モードに切り替えると利用できます。
          </section>
        ) : deckState ? (
          // デッキ構築済みのときは、設定変更不可の代わりに「リセット」を案内
          <section className="space-y-2 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h2 className="text-lg font-semibold text-slate-100">
              ネメシスデッキ
            </h2>
            <p className="text-xs text-slate-400">
              デッキ構築済み。設定を変更するか「新規ゲーム」を押すとデッキが破棄されます。
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <span>
                ボス: {bossesById.get(deckState.setup.bossId)?.name ?? '?'}
              </span>
            </div>
          </section>
        ) : (
          <NemesisDeckSetupPanel
            expansions={EXPANSIONS}
            bosses={bosses}
            setup={setup}
            onSetupChange={setSetup}
            playerCount={playerCount}
            onStart={handleStart}
            startDisabled={false}
          />
        )}
      </div>

      {error && (
        <div className="rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* 下段: 山札エリア (ターン順 + ネメシスを横並び、デスクトップで lg:grid-cols-2) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TurnOrderRandomizer
          settings={settings}
          onSettingsChange={handleSettingsChange}
          hideHeader
          hideSettings
        />
        {!isExpedition && deckState && (
          <NemesisDeckPanel
            state={deckState}
            onDraw={handleDraw}
            onRequestReset={handleRequestReset}
            bossName={bossesById.get(deckState.setup.bossId)?.name}
          />
        )}
        {!isExpedition && !deckState && (
          <section className="flex items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30 p-8 text-center text-sm text-slate-400">
            上のセットアップで「新規ゲーム」を押すと、ネメシスデッキ が表示されます
          </section>
        )}
      </div>

      <NemesisDeckResetConfirmModal
        open={pendingSettings !== null}
        title="設定変更でネメシスデッキをリセットしますか？"
        description="ターン順の設定が変わるため、デッキとドロー履歴を破棄して再構築する必要があります。"
        onCancel={cancelSettingsChange}
        onConfirm={confirmSettingsChange}
      />

      <NemesisDeckResetConfirmModal
        open={confirmReset}
        onCancel={cancelResetDeck}
        onConfirm={confirmResetDeck}
      />
    </main>
  );
}
