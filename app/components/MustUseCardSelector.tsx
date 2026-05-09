'use client';

import { useState } from 'react';
import type { Card, Expansion } from '../../lib/types';
import { CARD_TYPE_LABEL } from '../../lib/types';
import { groupExpansionsBySeason, seasonLabel } from '../../lib/seasonGroup';

interface Props {
  expansions: readonly Expansion[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
}

const TYPE_ORDER: Record<Card['type'], number> = {
  Gem: 0,
  Relic: 1,
  Spell: 2,
};

const TYPE_BADGE: Record<Card['type'], string> = {
  Gem: 'text-violet-300',
  Relic: 'text-blue-300',
  Spell: 'text-yellow-300',
};

function sortCards(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (TYPE_ORDER[a.type] !== TYPE_ORDER[b.type]) {
      return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    }
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name, 'ja');
  });
}

export function MustUseCardSelector({ expansions, selected, onChange }: Props) {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  const toggleCard = (cardId: string) => {
    const next = new Set(selected);
    if (next.has(cardId)) next.delete(cardId);
    else next.add(cardId);
    onChange(next);
  };

  const clearAll = () => onChange(new Set());

  const totalSelected = selected.size;

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
            必ず使用するカード
            {totalSelected > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({totalSelected} 枚)
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
        <div className="mt-3 space-y-3">
          {groupExpansionsBySeason(expansions).map(({ season, items }) => (
            <div key={season ?? 'none'}>
              <h3 className="mb-1 text-xs font-semibold tracking-wider text-slate-400">
                {seasonLabel(season)}
              </h3>
              <div className="space-y-2">
                {items.map((e) => {
                  const isOpen = open.has(e.id);
                  const checkedCount = e.cards.filter((c) =>
                    selected.has(c.id),
                  ).length;
                  const sorted = isOpen ? sortCards(e.cards) : [];
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
                        <span className="text-slate-400">
                          {isOpen ? '▼' : '▶'}
                        </span>
                        <span className="flex-1 font-medium text-slate-100">
                          {e.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {checkedCount > 0
                            ? `${checkedCount}/${e.cards.length} 枚選択中`
                            : `${e.cards.length} 枚`}
                        </span>
                      </button>
                      {isOpen && (
                        <ul className="grid grid-cols-1 gap-1 border-t border-slate-700 p-2 sm:grid-cols-2">
                          {sorted.map((c) => (
                            <li key={c.id}>
                              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-700/40">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-emerald-500"
                                  checked={selected.has(c.id)}
                                  onChange={() => toggleCard(c.id)}
                                />
                                <span
                                  className={`shrink-0 text-xs font-medium ${TYPE_BADGE[c.type]}`}
                                >
                                  {CARD_TYPE_LABEL[c.type]}
                                </span>
                                <span className="shrink-0 text-xs text-slate-400">
                                  {c.cost}
                                </span>
                                <span className="flex-1 truncate text-slate-200">
                                  {c.name}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
