'use client';

import { useMemo, useState } from 'react';
import { EXPANSIONS } from '../../lib/data';
import type { Nemesis } from '../../lib/types';
import { ExpansionSelector } from './ExpansionSelector';
import { NemesisTile } from './NemesisTile';

export function NemesisList() {
  const expansionsWithNemeses = useMemo(
    () => EXPANSIONS.filter((e) => e.nemeses.length > 0),
    [],
  );
  const allNemeses = useMemo(
    () => expansionsWithNemeses.flatMap((e) => e.nemeses),
    [expansionsWithNemeses],
  );

  // 通常難易度は将来追加を想定して 1-10 固定 (NemesisRandomizer と統一)
  const allLevels = useMemo(
    () => Array.from({ length: 10 }, (_, i) => i + 1),
    [],
  );
  const allBattles = useMemo(
    () => Array.from({ length: 4 }, (_, i) => i + 1),
    [],
  );

  const [expansionIds, setExpansionIds] = useState<Set<string>>(
    () => new Set(expansionsWithNemeses.map((e) => e.id)),
  );
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(
    () => new Set(),
  );
  const [selectedBattles, setSelectedBattles] = useState<Set<number>>(
    () => new Set(),
  );
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim();
    const out: Nemesis[] = [];
    for (const e of EXPANSIONS) {
      if (!expansionIds.has(e.id)) continue;
      for (const n of e.nemeses) {
        if (selectedLevels.size > 0) {
          if (n.level === undefined || !selectedLevels.has(n.level)) continue;
        }
        if (selectedBattles.size > 0 && !selectedBattles.has(n.battle)) continue;
        if (q !== '') {
          if (!n.name.includes(q) && !(n.rule && n.rule.includes(q))) continue;
        }
        out.push(n);
      }
    }
    return out;
  }, [expansionIds, selectedLevels, selectedBattles, search]);

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  return (
    <div className="space-y-4">
      <ExpansionSelector
        expansions={expansionsWithNemeses}
        selected={expansionIds}
        onChange={setExpansionIds}
        countLabel={(e) => `${e.nemeses.length} 体`}
        groupBySeason
      />

      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">難易度</h2>
          {selectedLevels.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedLevels(new Set())}
              className="text-sm text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
            >
              クリア
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allLevels.map((n) => {
            const active = selectedLevels.has(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => setSelectedLevels(toggle(selectedLevels, n))}
                className={`min-w-[2.5rem] rounded border px-3 py-1.5 text-sm transition ${
                  active
                    ? 'border-emerald-500/60 bg-emerald-500/30 text-emerald-100'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">バトル</h2>
          {selectedBattles.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedBattles(new Set())}
              className="text-sm text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
            >
              クリア
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allBattles.map((n) => {
            const active = selectedBattles.has(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => setSelectedBattles(toggle(selectedBattles, n))}
                className={`min-w-[2.5rem] rounded border px-3 py-1.5 text-sm transition ${
                  active
                    ? 'border-emerald-500/60 bg-emerald-500/30 text-emerald-100'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">
          名前・ルール検索
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="例: レイジボーン、ゲートウィッチ"
          className="w-full rounded border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
        />
      </section>

      <p className="mt-2 text-sm text-slate-400">
        {filtered.length} / {allNemeses.length} 体を表示
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <NemesisTile key={n.id} nemesis={n} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          該当するネメシスがいません
        </div>
      )}
    </div>
  );
}
