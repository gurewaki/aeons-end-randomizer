'use client';

import { useState } from 'react';
import type { Expansion } from '../../lib/types';

interface Props {
  expansions: readonly Expansion[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
}

export function MustUseMageSelector({
  expansions,
  selected,
  onChange,
}: Props) {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  const toggleMage = (mageId: string) => {
    const next = new Set(selected);
    if (next.has(mageId)) next.delete(mageId);
    else next.add(mageId);
    onChange(next);
  };

  const clearAll = () => onChange(new Set());

  const totalSelected = selected.size;
  const expansionsWithMages = expansions.filter((e) => e.mages.length > 0);

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSectionOpen(!sectionOpen)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="text-slate-400">{sectionOpen ? '▼' : '▶'}</span>
          <h2 className="text-lg font-semibold text-slate-100">
            必ず使用するメイジ
            {totalSelected > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({totalSelected} 人)
              </span>
            )}
          </h2>
        </button>
        {totalSelected > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
          >
            すべて外す
          </button>
        )}
      </div>
      {sectionOpen && (
        <div className="mt-3 space-y-2">
          {expansionsWithMages.map((e) => {
            const isOpen = open.has(e.id);
            const checkedCount = e.mages.filter((m) =>
              selected.has(m.id),
            ).length;
            const sorted = isOpen ? e.mages : [];
            return (
              <div
                key={e.id}
                className="rounded border border-slate-700 bg-slate-900/30"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(e.id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-700/30"
                >
                  <span className="text-slate-400">{isOpen ? '▼' : '▶'}</span>
                  <span className="flex-1 font-medium text-slate-100">
                    {e.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {checkedCount > 0
                      ? `${checkedCount}/${e.mages.length} 人選択中`
                      : `${e.mages.length} 人`}
                  </span>
                </button>
                {isOpen && (
                  <ul className="grid grid-cols-1 gap-1 border-t border-slate-700 p-2 sm:grid-cols-2">
                    {sorted.map((m) => (
                      <li key={m.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-700/40">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-emerald-500"
                            checked={selected.has(m.id)}
                            onChange={() => toggleMage(m.id)}
                          />
                          <span className="flex-1 truncate text-slate-200">
                            {m.name}
                          </span>
                          <span className="shrink-0 truncate text-xs text-slate-400">
                            {m.job}
                          </span>
                          {m.level !== undefined && (
                            <span className="shrink-0 text-xs text-slate-400">
                              難易度 {m.level}
                            </span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
