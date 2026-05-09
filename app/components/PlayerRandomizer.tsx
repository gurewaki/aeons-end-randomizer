'use client';

import { useMemo, useState } from 'react';
import { EXPANSIONS } from '../../lib/data';
import type { Mage } from '../../lib/types';
import { generatePlayers } from '../../lib/randomizer/generatePlayers';
import { ExpansionSelector } from './ExpansionSelector';
import { PlayerCountSelector } from './PlayerCountSelector';
import { MustUseMageSelector } from './MustUseMageSelector';
import { GenerateButton } from './GenerateButton';
import { MageDisplay } from './MageDisplay';
import { ErrorBanner } from './ErrorBanner';

export function PlayerRandomizer() {
  const expansionsWithMages = useMemo(
    () => EXPANSIONS.filter((e) => e.mages.length > 0),
    [],
  );

  const [selectedExpansionIds, setSelectedExpansionIds] = useState<Set<string>>(
    () => new Set(expansionsWithMages.map((e) => e.id)),
  );
  const [playerCount, setPlayerCount] = useState(4);
  const [mustUseMageIds, setMustUseMageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [result, setResult] = useState<Mage[] | null>(null);
  const [resultMustUseIds, setResultMustUseIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const allMagesById = useMemo(() => {
    const m = new Map<string, Mage>();
    for (const e of EXPANSIONS) for (const x of e.mages) m.set(x.id, x);
    return m;
  }, []);

  const handleGenerate = () => {
    setError(null);
    const selectedMages = EXPANSIONS.filter((e) =>
      selectedExpansionIds.has(e.id),
    ).flatMap((e) => e.mages);
    const poolIds = new Set(selectedMages.map((m) => m.id));
    const mustUseExtra = Array.from(mustUseMageIds)
      .filter((id) => !poolIds.has(id))
      .map((id) => allMagesById.get(id))
      .filter((m): m is Mage => Boolean(m));
    const pool = [...selectedMages, ...mustUseExtra];

    try {
      const generated = generatePlayers(pool, {
        playerCount,
        mustUseMageIds,
      });
      setResult(generated);
      setResultMustUseIds(new Set(mustUseMageIds));
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
    }
  };

  const canGenerate =
    selectedExpansionIds.size > 0 || mustUseMageIds.size > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          プレイヤーランダマイザ
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          指定した人数分のメイジをランダムに選択します
        </p>
      </header>

      <div className="space-y-4">
        <PlayerCountSelector value={playerCount} onChange={setPlayerCount} />
        <ExpansionSelector
          expansions={expansionsWithMages}
          selected={selectedExpansionIds}
          onChange={setSelectedExpansionIds}
          countLabel={(e) => `${e.mages.length} 人`}
          groupBySeason
        />
        <MustUseMageSelector
          expansions={expansionsWithMages}
          selected={mustUseMageIds}
          onChange={setMustUseMageIds}
        />
        <GenerateButton disabled={!canGenerate} onClick={handleGenerate} />
        <ErrorBanner message={error} />
      </div>

      <div className="mt-10">
        <MageDisplay mages={result} mustUseIds={resultMustUseIds} />
      </div>
    </main>
  );
}
