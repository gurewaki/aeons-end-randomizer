'use client';

import { useMemo, useState } from 'react';
import { EXPANSIONS } from '../../lib/data';
import type { Mage } from '../../lib/types';
import { ExpansionSelector } from './ExpansionSelector';
import { MageDetailTile } from './MageDetailTile';
import { MageTile } from './MageTile';
import { Modal } from './Modal';

export function MageList() {
  const [selected, setSelected] = useState<Mage | null>(null);

  const expansionsWithMages = useMemo(
    () => EXPANSIONS.filter((e) => e.mages.length > 0),
    [],
  );
  const allMages = useMemo(
    () => expansionsWithMages.flatMap((e) => e.mages),
    [expansionsWithMages],
  );

  const allLevels = useMemo(() => {
    const s = new Set<number>();
    for (const m of allMages) if (m.level !== undefined) s.add(m.level);
    return [...s].sort((a, b) => a - b);
  }, [allMages]);

  const [expansionIds, setExpansionIds] = useState<Set<string>>(
    () => new Set(expansionsWithMages.map((e) => e.id)),
  );
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(
    () => new Set(),
  );
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim();
    // パッケージ順 (EXPANSIONS の順) + YAML 内のメイジ順を保つ
    const out: Mage[] = [];
    for (const e of EXPANSIONS) {
      if (!expansionIds.has(e.id)) continue;
      for (const m of e.mages) {
        if (selectedLevels.size > 0) {
          if (m.level === undefined || !selectedLevels.has(m.level)) continue;
        }
        if (q !== '') {
          if (!m.name.includes(q) && !m.job.includes(q)) continue;
        }
        out.push(m);
      }
    }
    return out;
  }, [expansionIds, selectedLevels, search]);

  const toggleLevel = (n: number) => {
    const next = new Set(selectedLevels);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    setSelectedLevels(next);
  };

  return (
    <div className="space-y-4">
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        labelledBy="mage-detail-title"
      >
        {selected && (
          <MageDetailTile
            mage={selected}
            titleId="mage-detail-title"
            onClose={() => setSelected(null)}
          />
        )}
      </Modal>
      <ExpansionSelector
        expansions={expansionsWithMages}
        selected={expansionIds}
        onChange={setExpansionIds}
        countLabel={(e) => `${e.mages.length} 人`}
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
        {allLevels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allLevels.map((n) => {
              const active = selectedLevels.has(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleLevel(n)}
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
        ) : (
          <p className="text-sm text-slate-400">
            難易度が設定されているメイジがいません
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">
          名前・役職検索
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="例: ミスト、破孔魔術師"
          className="w-full rounded border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
        />
      </section>

      <p className="mt-2 text-sm text-slate-400">
        {filtered.length} / {allMages.length} 人を表示
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m)}
              className="rounded-md text-left transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <MageTile mage={m} />
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          該当するメイジがいません
        </div>
      )}
    </div>
  );
}
