'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EXPANSIONS, SETUPS } from '../../lib/data';
import type {
  Card,
  GeneratedSupply,
  Gem,
  MarketSupply,
  Relic,
  Spell,
  SupplyPlacement,
} from '../../lib/types';
import {
  canRerollSlot,
  generateMarket,
  rerollSlot,
} from '../../lib/randomizer/generateMarket';
import { QrCode } from 'lucide-react';
import { ExpansionSelector } from './ExpansionSelector';
import { SetupSelector } from './SetupSelector';
import { MustUseCardSelector } from './MustUseCardSelector';
import { GenerateButton } from './GenerateButton';
import { MarketDisplay } from './MarketDisplay';
import { ErrorBanner } from './ErrorBanner';
import { Modal } from './Modal';
import { SupplyShareQR } from './SupplyShareQR';
import { SupplyRerollConfirmModal } from './SupplyRerollConfirmModal';

const SHARE_PARAM_SETUP = 's';
const SHARE_PARAM_CARDS = 'c';

/** englishName から URL slug を作る (空白除去のみ。"Core Box" → "CoreBox") */
function packSlug(englishName: string): string {
  return englishName.replace(/\s+/g, '');
}

/** カードを `<slug>.<no>` トークンに変換 */
function tokenForCard(c: Card, expansionSlugById: Map<string, string>): string {
  const slug = expansionSlugById.get(c.expansionId) ?? c.expansionId;
  return `${slug}.${c.no}`;
}

/** market 内のカードを Gem → Relic → Spell の順でトークン列に */
function serializeMarketTokens(
  m: MarketSupply,
  expansionSlugById: Map<string, string>,
): string[] {
  return [...m.gems, ...m.relics, ...m.spells].map((c) =>
    tokenForCard(c, expansionSlugById),
  );
}

/** カードの配列を MarketSupply に組み立てる (type 別に振り分け) */
function buildMarketFromCards(cards: Card[]): MarketSupply {
  const gems: Gem[] = [];
  const relics: Relic[] = [];
  const spells: Spell[] = [];
  for (const c of cards) {
    if (c.type === 'Gem') gems.push(c);
    else if (c.type === 'Relic') relics.push(c);
    else spells.push(c);
  }
  return { gems, relics, spells };
}

export function SupplyRandomizer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedExpansionIds, setSelectedExpansionIds] = useState<Set<string>>(
    () => new Set(EXPANSIONS.map((e) => e.id)),
  );
  const [selectedSetupName, setSelectedSetupName] = useState<string>(
    () => SETUPS[0]?.name ?? '',
  );
  const [mustUseCardIds, setMustUseCardIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [market, setMarket] = useState<MarketSupply | null>(null);
  const [marketMustUseIds, setMarketMustUseIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  /**
   * 自分のセッションで生成したサプライの完全情報 (再抽選に必要)。
   * 共有 URL から復元したときは placements/poolSnapshot が無いので null。
   */
  const [generation, setGeneration] = useState<GeneratedSupply | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 共有 URL から開いた状態 (受け手モード) */
  const [isShared, setIsShared] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  /** 再抽選確認モーダル: 選択中のカード (null なら閉) */
  const [rerollTarget, setRerollTarget] = useState<Card | null>(null);

  const allCardsById = useMemo(() => {
    const m = new Map<string, Card>();
    for (const e of EXPANSIONS) for (const c of e.cards) m.set(c.id, c);
    return m;
  }, []);

  // expansionId → slug (空白除去した englishName)
  const expansionSlugById = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of EXPANSIONS) m.set(e.id, packSlug(e.englishName));
    return m;
  }, []);

  // `<slug>.<no>` から Card を引くためのインデックス
  const cardByToken = useMemo(() => {
    const m = new Map<string, Card>();
    for (const e of EXPANSIONS) {
      const slug = packSlug(e.englishName);
      for (const c of e.cards) m.set(`${slug}.${c.no}`, c);
    }
    return m;
  }, []);

  // URL クエリパラメータから初期 state を復元 (マウント直後、クライアントで実行)
  useEffect(() => {
    const setupName = searchParams.get(SHARE_PARAM_SETUP);
    const tokensStr = searchParams.get(SHARE_PARAM_CARDS);
    if (!setupName || !tokensStr) return;

    const setup = SETUPS.find((s) => s.name === setupName);
    if (!setup) return;

    const tokens = tokensStr.split(',').map((s) => s.trim()).filter(Boolean);
    const cards: Card[] = [];
    for (const token of tokens) {
      const c = cardByToken.get(token);
      if (!c) return; // 1 枚でも見つからなければ復元を諦める
      cards.push(c);
    }

    setSelectedSetupName(setupName);
    setMarket(buildMarketFromCards(cards));
    setMarketMustUseIds(new Set());
    setGeneration(null);
    setIsShared(true);
    // 復元はマウント時の URL を 1 回だけ反映すれば良い
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自分のセッションで market が更新されたとき、URL も同期する
  const updateShareUrl = (m: MarketSupply, setupName: string) => {
    const params = new URLSearchParams();
    params.set(SHARE_PARAM_SETUP, setupName);
    params.set(
      SHARE_PARAM_CARDS,
      serializeMarketTokens(m, expansionSlugById).join(','),
    );
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleGenerate = () => {
    setError(null);
    const setup = SETUPS.find((s) => s.name === selectedSetupName);
    if (!setup) {
      setError(`セットアップ "${selectedSetupName}" が見つかりません`);
      return;
    }
    const selectedCards = EXPANSIONS.filter((e) =>
      selectedExpansionIds.has(e.id),
    ).flatMap((e) => e.cards);
    const poolIds = new Set(selectedCards.map((c) => c.id));
    const mustUseExtra = Array.from(mustUseCardIds)
      .filter((id) => !poolIds.has(id))
      .map((id) => allCardsById.get(id))
      .filter((c): c is Card => Boolean(c));
    const pool = [...selectedCards, ...mustUseExtra];

    try {
      const generated = generateMarket(pool, { setup, mustUseCardIds });
      setGeneration(generated);
      setMarket(generated.market);
      setMarketMustUseIds(new Set(mustUseCardIds));
      setIsShared(false);
      updateShareUrl(generated.market, selectedSetupName);
    } catch (e) {
      setGeneration(null);
      setMarket(null);
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
    }
  };

  /** 共有モードから抜けて、通常生成 UI に戻る */
  const handleExitSharedView = () => {
    setIsShared(false);
    setMarket(null);
    setGeneration(null);
    setMarketMustUseIds(new Set());
    router.replace(pathname);
  };

  /** 🔄 ボタン押下: 確認モーダルを開く */
  const handleRequestReroll = (card: Card) => {
    if (!generation) return;
    setRerollTarget(card);
  };

  /** 確認モーダルで「再抽選する」: そのスロットを 1 枚抽選し直す */
  const handleConfirmReroll = () => {
    if (!generation || !rerollTarget) {
      setRerollTarget(null);
      return;
    }
    const slotIndex = generation.placements.findIndex(
      (p) => p.card.id === rerollTarget.id,
    );
    if (slotIndex < 0) {
      setRerollTarget(null);
      return;
    }
    try {
      const newCard = rerollSlot(
        generation.poolSnapshot,
        slotIndex,
        generation.placements,
        generation.mustUseIds,
      );
      const newPlacements: SupplyPlacement[] = generation.placements.map(
        (p, i) => (i === slotIndex ? { ...p, card: newCard } : p),
      );
      const newMarket: MarketSupply = {
        gems: newPlacements.filter((p) => p.card.type === 'Gem').map((p) => p.card as Gem),
        relics: newPlacements
          .filter((p) => p.card.type === 'Relic')
          .map((p) => p.card as Relic),
        spells: newPlacements
          .filter((p) => p.card.type === 'Spell')
          .map((p) => p.card as Spell),
      };
      setGeneration({
        ...generation,
        market: newMarket,
        placements: newPlacements,
      });
      setMarket(newMarket);
      updateShareUrl(newMarket, generation.setup.name);
      setRerollTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '再抽選に失敗しました');
      setRerollTarget(null);
    }
  };

  /** QR コード用の絶対 URL を組み立て (market が無いときは null) */
  const shareUrl = useMemo(() => {
    if (!market) return null;
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams();
    params.set(SHARE_PARAM_SETUP, selectedSetupName);
    params.set(
      SHARE_PARAM_CARDS,
      serializeMarketTokens(market, expansionSlugById).join(','),
    );
    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [market, selectedSetupName, pathname, expansionSlugById]);

  const canGenerate = selectedExpansionIds.size > 0 || mustUseCardIds.size > 0;

  /**
   * 各カード id について、再抽選可否を判定する。
   * - 必ず使用カード → undefined (= ボタン非表示)
   * - 候補が無い → 'disabled-reason' (= ボタン disabled + tooltip)
   * - 候補がある → undefined (= ボタン有効)
   * 注: undefined と「ボタン非表示」は CardTile 側で isMustUse プロップに従って区別される
   */
  const rerollDisabledByCardId = useMemo(() => {
    const m = new Map<string, string>();
    if (!generation) return m;
    for (let i = 0; i < generation.placements.length; i++) {
      const p = generation.placements[i];
      if (generation.mustUseIds.has(p.card.id)) continue;
      const ok = canRerollSlot(
        generation.poolSnapshot,
        i,
        generation.placements,
        generation.mustUseIds,
      );
      if (!ok) {
        m.set(p.card.id, 'このスロット制約を満たす別のカードがプールにありません');
      }
    }
    return m;
  }, [generation]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          サプライランダマイザ
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          セットアップごとのスロット制約に従ってサプライを生成します
        </p>
      </header>

      {isShared && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">
          <span>共有された構成を表示中</span>
          <button
            type="button"
            onClick={handleExitSharedView}
            className="rounded border border-amber-400/60 bg-amber-500/30 px-3 py-1 text-xs font-medium text-amber-50 hover:bg-amber-500/40"
          >
            新規生成する
          </button>
        </div>
      )}

      {!isShared && (
        <div className="space-y-4">
          <ExpansionSelector
            expansions={EXPANSIONS}
            selected={selectedExpansionIds}
            onChange={setSelectedExpansionIds}
            groupBySeason
          />
          <MustUseCardSelector
            expansions={EXPANSIONS}
            selected={mustUseCardIds}
            onChange={setMustUseCardIds}
          />
          <SetupSelector
            setups={SETUPS}
            selectedName={selectedSetupName}
            onChange={setSelectedSetupName}
          />
          <GenerateButton disabled={!canGenerate} onClick={handleGenerate} />
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-10 space-y-6">
        <MarketDisplay
          market={market}
          mustUseIds={marketMustUseIds}
          onRerollCard={
            !isShared && generation ? handleRequestReroll : undefined
          }
          rerollDisabledByCardId={
            !isShared && generation ? rerollDisabledByCardId : undefined
          }
        />
        {/* 共有ボタンは自分のセッションで生成した結果のみ表示。
            共有 URL から開いた状態 (isShared) では非表示 */}
        {market && !isShared && shareUrl && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-2 rounded border border-emerald-500/60 bg-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/40"
            >
              <QrCode className="h-4 w-4" aria-hidden="true" />
              このサプライを共有
            </button>
          </div>
        )}
      </div>

      <Modal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        labelledBy="share-modal-title"
      >
        {shareUrl && (
          <SupplyShareQR
            url={shareUrl}
            titleId="share-modal-title"
            onClose={() => setShareModalOpen(false)}
          />
        )}
      </Modal>

      <SupplyRerollConfirmModal
        open={rerollTarget !== null}
        card={rerollTarget}
        onCancel={() => setRerollTarget(null)}
        onConfirm={handleConfirmReroll}
      />
    </main>
  );
}
