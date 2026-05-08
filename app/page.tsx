'use client';

import { useState } from 'react';
import { EXPANSIONS } from '../lib/data';
import type { MarketSupply } from '../lib/types';
import { generateMarket } from '../lib/randomizer/generateMarket';
import { ExpansionSelector } from './components/ExpansionSelector';
import { OptionsPanel } from './components/OptionsPanel';
import { GenerateButton } from './components/GenerateButton';
import { MarketDisplay } from './components/MarketDisplay';
import { ErrorBanner } from './components/ErrorBanner';

export default function Page() {
  const [selectedExpansionIds, setSelectedExpansionIds] = useState<Set<string>>(
    () => new Set(EXPANSIONS.map((e) => e.id)),
  );
  const [requireCost3Gem, setRequireCost3Gem] = useState(false);
  const [market, setMarket] = useState<MarketSupply | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    const pool = EXPANSIONS.filter((e) => selectedExpansionIds.has(e.id))
      .flatMap((e) => e.cards);
    try {
      setMarket(generateMarket(pool, { requireCost3Gem }));
    } catch (e) {
      setMarket(null);
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
    }
  };

  const canGenerate = selectedExpansionIds.size > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          Aeons End マーケットランダマイザー
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          公式構成 (宝石 3 / 遺物 2 / 呪文 4) でマーケットをランダム生成します
        </p>
      </header>

      <div className="space-y-4">
        <ExpansionSelector
          expansions={EXPANSIONS}
          selected={selectedExpansionIds}
          onChange={setSelectedExpansionIds}
        />
        <OptionsPanel
          requireCost3Gem={requireCost3Gem}
          onChange={setRequireCost3Gem}
        />
        <GenerateButton disabled={!canGenerate} onClick={handleGenerate} />
        <ErrorBanner message={error} />
      </div>

      <div className="mt-10">
        <MarketDisplay market={market} />
      </div>

      <footer className="mt-12 border-t border-slate-800 pt-4 text-xs text-slate-500">
        カードデータはサンプルです。<code>data/expansions/*.yaml</code> を編集して実カードに差し替えてください。
      </footer>
    </main>
  );
}
