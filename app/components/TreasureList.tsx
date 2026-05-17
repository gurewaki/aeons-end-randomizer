'use client';

import { useMemo, useState } from 'react';
import { EXPANSIONS } from '../../lib/data';
import type { Treasure, TreasureLevel } from '../../lib/types';
import { ExpansionSelector } from './ExpansionSelector';
import { TreasureTile } from './TreasureTile';

const LEVELS: TreasureLevel[] = [1, 2, 3];

const LEVEL_BUTTON_STYLES: Record<
  TreasureLevel,
  { active: string; inactive: string }
> = {
  1: {
    active: 'bg-emerald-500/30 text-emerald-100 border-emerald-500/60',
    inactive:
      'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50',
  },
  2: {
    active: 'bg-blue-500/30 text-blue-100 border-blue-500/60',
    inactive:
      'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50',
  },
  3: {
    active: 'bg-yellow-500/30 text-yellow-100 border-yellow-500/60',
    inactive:
      'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50',
  },
};

export function TreasureList() {
  const expansionsWithTreasures = useMemo(
    () => EXPANSIONS.filter((e) => e.treasures.length > 0),
    [],
  );
  const allTreasures = useMemo(
    () => expansionsWithTreasures.flatMap((e) => e.treasures),
    [expansionsWithTreasures],
  );

  const [expansionIds, setExpansionIds] = useState<Set<string>>(
    () => new Set(expansionsWithTreasures.map((e) => e.id)),
  );
  const [selectedLevels, setSelectedLevels] = useState<Set<TreasureLevel>>(
    () => new Set(LEVELS),
  );
  const [search, setSearch] = useState('');

  const expansionOrder = useMemo(() => {
    const m = new Map<string, number>();
    EXPANSIONS.forEach((e, i) => m.set(e.id, i));
    return m;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    return allTreasures
      .filter((t) => expansionIds.has(t.expansionId))
      .filter((t) => selectedLevels.has(t.level))
      .filter((t) => {
        if (q === '') return true;
        if (t.name.includes(q)) return true;
        if (t.effect.includes(q)) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        const ai = expansionOrder.get(a.expansionId) ?? Infinity;
        const bi = expansionOrder.get(b.expansionId) ?? Infinity;
        if (ai !== bi) return ai - bi;
        return a.id.localeCompare(b.id);
      });
  }, [allTreasures, expansionIds, selectedLevels, search, expansionOrder]);

  const toggleLevel = (l: TreasureLevel) => {
    const next = new Set(selectedLevels);
    if (next.has(l)) next.delete(l);
    else next.add(l);
    setSelectedLevels(next);
  };

  return (
    <div className="space-y-4">
      <ExpansionSelector
        expansions={expansionsWithTreasures}
        selected={expansionIds}
        onChange={setExpansionIds}
        countLabel={(e) => `${e.treasures.length} 枚`}
        groupBySeason
      />

      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">レベル</h2>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => {
            const active = selectedLevels.has(l);
            const styles = LEVEL_BUTTON_STYLES[l];
            return (
              <button
                key={l}
                type="button"
                onClick={() => toggleLevel(l)}
                className={`min-w-[2.5rem] rounded border px-3 py-1.5 text-sm transition ${
                  active ? styles.active : styles.inactive
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">
          名前・効果文検索
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="例: 破孔、チャージ、エーテル"
          className="w-full rounded border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
        />
      </section>

      <p className="mt-2 text-sm text-slate-400">
        {filtered.length} / {allTreasures.length} 枚を表示
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t: Treasure) => (
            <TreasureTile key={t.id} treasure={t} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          該当するトレジャーがありません
        </div>
      )}
    </div>
  );
}
