'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EXPANSIONS, SETUPS } from '../../lib/data';
import type {
  Card,
  Gem,
  MarketSupply,
  Relic,
  Spell,
} from '../../lib/types';
import { generateMarket } from '../../lib/randomizer/generateMarket';
import { ExpansionSelector } from './ExpansionSelector';
import { SetupSelector } from './SetupSelector';
import { MustUseCardSelector } from './MustUseCardSelector';
import { GenerateButton } from './GenerateButton';
import { MarketDisplay } from './MarketDisplay';
import { ErrorBanner } from './ErrorBanner';
import { SupplyShareQR } from './SupplyShareQR';

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
  const [error, setError] = useState<string | null>(null);
  /** 共有 URL から開いた状態 (受け手モード) */
  const [isShared, setIsShared] = useState(false);

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
      setMarket(generated);
      setMarketMustUseIds(new Set(mustUseCardIds));
      setIsShared(false);
      updateShareUrl(generated, selectedSetupName);
    } catch (e) {
      setMarket(null);
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
    }
  };

  /** 共有モードから抜けて、通常生成 UI に戻る */
  const handleExitSharedView = () => {
    setIsShared(false);
    setMarket(null);
    setMarketMustUseIds(new Set());
    router.replace(pathname);
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
        <MarketDisplay market={market} mustUseIds={marketMustUseIds} />
        {shareUrl && <SupplyShareQR url={shareUrl} />}
      </div>
    </main>
  );
}
