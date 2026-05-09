'use client';

import { useMemo, useState } from 'react';
import { EXPANSIONS } from '../../lib/data';
import type { Card, MarketSupply } from '../../lib/types';
import { generateMarket } from '../../lib/randomizer/generateMarket';
import { ExpansionSelector } from './ExpansionSelector';
import { OptionsPanel } from './OptionsPanel';
import { MustUseCardSelector } from './MustUseCardSelector';
import { GenerateButton } from './GenerateButton';
import { MarketDisplay } from './MarketDisplay';
import { ErrorBanner } from './ErrorBanner';

export function SupplyRandomizer() {
  const [selectedExpansionIds, setSelectedExpansionIds] = useState<Set<string>>(
    () => new Set(EXPANSIONS.map((e) => e.id)),
  );
  const [requireLowCostGem, setRequireLowCostGem] = useState(true);
  const [stratifyCost, setStratifyCost] = useState(false);
  const [mustUseCardIds, setMustUseCardIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [market, setMarket] = useState<MarketSupply | null>(null);
  const [marketMustUseIds, setMarketMustUseIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [error, setError] = useState<string | null>(null);

  const allCardsById = useMemo(() => {
    const m = new Map<string, Card>();
    for (const e of EXPANSIONS) for (const c of e.cards) m.set(c.id, c);
    return m;
  }, []);

  const handleGenerate = () => {
    setError(null);
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
      const generated = generateMarket(pool, {
        requireLowCostGem,
        stratifyCost,
        mustUseCardIds,
      });
      setMarket(generated);
      setMarketMustUseIds(new Set(mustUseCardIds));
    } catch (e) {
      setMarket(null);
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
    }
  };

  const canGenerate = selectedExpansionIds.size > 0 || mustUseCardIds.size > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          サプライランダマイザ
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          公式構成 (宝石 3 / 遺物 2 / 呪文 4) でサプライをランダム生成します
        </p>
      </header>

      <div className="space-y-4">
        <ExpansionSelector
          expansions={EXPANSIONS}
          selected={selectedExpansionIds}
          onChange={setSelectedExpansionIds}
        />
        <MustUseCardSelector
          expansions={EXPANSIONS}
          selected={mustUseCardIds}
          onChange={setMustUseCardIds}
        />
        <OptionsPanel
          requireLowCostGem={requireLowCostGem}
          stratifyCost={stratifyCost}
          onChangeRequireLowCostGem={setRequireLowCostGem}
          onChangeStratifyCost={setStratifyCost}
        />
        <GenerateButton disabled={!canGenerate} onClick={handleGenerate} />
        <ErrorBanner message={error} />
      </div>

      <div className="mt-10">
        <MarketDisplay market={market} mustUseIds={marketMustUseIds} />
      </div>
    </main>
  );
}
