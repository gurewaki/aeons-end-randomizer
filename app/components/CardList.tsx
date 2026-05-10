'use client';

import { useMemo, useState } from 'react';
import { EXPANSIONS } from '../../lib/data';
import type { CardType } from '../../lib/types';
import { CARD_TYPE_LABEL } from '../../lib/types';
import { ExpansionSelector } from './ExpansionSelector';
import { CardTile } from './CardTile';

const TYPE_ORDER: Record<CardType, number> = { Gem: 0, Relic: 1, Spell: 2 };
const TYPES: CardType[] = ['Gem', 'Relic', 'Spell'];

const TYPE_BUTTON_STYLES: Record<
  CardType,
  { active: string; inactive: string }
> = {
  Gem: {
    active: 'bg-violet-500/30 text-violet-100 border-violet-500/60',
    inactive:
      'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50',
  },
  Relic: {
    active: 'bg-blue-500/30 text-blue-100 border-blue-500/60',
    inactive:
      'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50',
  },
  Spell: {
    active: 'bg-yellow-500/30 text-yellow-100 border-yellow-500/60',
    inactive:
      'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50',
  },
};

export function CardList() {
  const allCards = useMemo(
    () => EXPANSIONS.flatMap((e) => e.cards),
    [],
  );

  const [expansionIds, setExpansionIds] = useState<Set<string>>(
    () => new Set(EXPANSIONS.map((e) => e.id)),
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<CardType>>(
    () => new Set(TYPES),
  );
  const [selectedCosts, setSelectedCosts] = useState<Set<number>>(
    () => new Set(),
  );
  const [search, setSearch] = useState('');

  const costRange = useMemo(() => {
    if (allCards.length === 0) return [];
    const min = Math.min(...allCards.map((c) => c.cost));
    const max = Math.max(...allCards.map((c) => c.cost));
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [allCards]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return allCards
      .filter((c) => expansionIds.has(c.expansionId))
      .filter((c) => selectedTypes.has(c.type))
      .filter((c) => selectedCosts.size === 0 || selectedCosts.has(c.cost))
      .filter((c) => {
        if (q === '') return true;
        if (c.name.includes(q)) return true;
        if (c.effect && c.effect.includes(q)) return true;
        return false;
      })
      .sort((a, b) => {
        if (TYPE_ORDER[a.type] !== TYPE_ORDER[b.type]) {
          return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
        }
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.name.localeCompare(b.name, 'ja');
      });
  }, [allCards, expansionIds, selectedTypes, selectedCosts, search]);

  const toggleType = (t: CardType) => {
    const next = new Set(selectedTypes);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setSelectedTypes(next);
  };

  const toggleCost = (c: number) => {
    const next = new Set(selectedCosts);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setSelectedCosts(next);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <ExpansionSelector
          expansions={EXPANSIONS}
          selected={expansionIds}
          onChange={setExpansionIds}
          groupBySeason
        />

        <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">タイプ</h2>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const active = selectedTypes.has(t);
              const styles = TYPE_BUTTON_STYLES[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`rounded border px-3 py-1.5 text-sm transition ${
                    active ? styles.active : styles.inactive
                  }`}
                >
                  {CARD_TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">コスト</h2>
            {selectedCosts.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCosts(new Set())}
                className="text-sm text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
              >
                クリア
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {costRange.map((c) => {
              const active = selectedCosts.has(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCost(c)}
                  className={`min-w-[2.5rem] rounded border px-3 py-1.5 text-sm transition ${
                    active
                      ? 'border-emerald-500/60 bg-emerald-500/30 text-emerald-100'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  {c}
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
            placeholder="例: チャージ、エーテル、ヴィジョン"
            className="w-full rounded border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </section>
      </div>

      <p className="mt-2 text-sm text-slate-400">
        {filtered.length} / {allCards.length} 枚を表示
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CardTile key={c.id} card={c} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          該当するカードがありません
        </div>
      )}
    </div>
  );
}
