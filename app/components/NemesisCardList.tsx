'use client';

import { useMemo, useState } from 'react';
import { EXPANSIONS } from '../../lib/data';
import type {
  NemesisCard,
  NemesisCardCategory,
  NemesisCardType,
} from '../../lib/types';
import {
  NEMESIS_CARD_CATEGORY_LABEL,
  NEMESIS_CARD_TYPE_LABEL,
} from '../../lib/types';
import { ExpansionSelector } from './ExpansionSelector';
import { NemesisCardTile } from './NemesisCardTile';

const TYPE_ORDER: Record<NemesisCardType, number> = {
  Attack: 0,
  Minion: 1,
  Power: 2,
};
const TYPES: NemesisCardType[] = ['Attack', 'Minion', 'Power'];

const TYPE_BUTTON_STYLES: Record<
  NemesisCardType,
  { active: string; inactive: string }
> = {
  Attack: {
    active: 'bg-violet-500/30 text-violet-100 border-violet-500/60',
    inactive:
      'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50',
  },
  Minion: {
    active: 'bg-sky-500/30 text-sky-100 border-sky-500/60',
    inactive:
      'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50',
  },
  Power: {
    active: 'bg-yellow-500/30 text-yellow-100 border-yellow-500/60',
    inactive:
      'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50',
  },
};

const CATEGORY_ORDER: Record<NemesisCardCategory, number> = {
  Basic: 0,
  Advanced: 1,
};
const CATEGORIES: NemesisCardCategory[] = ['Basic', 'Advanced'];

export function NemesisCardList() {
  const expansionsWithCards = useMemo(
    () => EXPANSIONS.filter((e) => e.nemesisCards.length > 0),
    [],
  );
  const allCards = useMemo(
    () => expansionsWithCards.flatMap((e) => e.nemesisCards),
    [expansionsWithCards],
  );

  const allTiers = useMemo(() => {
    const set = new Set<number>();
    for (const c of allCards) set.add(c.tier);
    return [...set].sort((a, b) => a - b);
  }, [allCards]);

  const availableCategories = useMemo(() => {
    const set = new Set<NemesisCardCategory>();
    for (const c of allCards) set.add(c.category);
    return CATEGORIES.filter((c) => set.has(c));
  }, [allCards]);

  const [expansionIds, setExpansionIds] = useState<Set<string>>(
    () => new Set(expansionsWithCards.map((e) => e.id)),
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<NemesisCardType>>(
    () => new Set(TYPES),
  );
  const [selectedCategories, setSelectedCategories] = useState<
    Set<NemesisCardCategory>
  >(() => new Set(availableCategories));
  const [selectedTiers, setSelectedTiers] = useState<Set<number>>(
    () => new Set(),
  );
  const [search, setSearch] = useState('');

  const expansionOrder = useMemo(() => {
    const m = new Map<string, number>();
    EXPANSIONS.forEach((e, i) => m.set(e.id, i));
    return m;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    return allCards
      .filter((c) => expansionIds.has(c.expansionId))
      .filter((c) => selectedTypes.has(c.type))
      .filter((c) => selectedCategories.has(c.category))
      .filter((c) => selectedTiers.size === 0 || selectedTiers.has(c.tier))
      .filter((c) => {
        if (q === '') return true;
        if (c.name.includes(q)) return true;
        if (c.effect.includes(q)) return true;
        return false;
      })
      .sort((a, b) => {
        if (CATEGORY_ORDER[a.category] !== CATEGORY_ORDER[b.category]) {
          return CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
        }
        if (a.tier !== b.tier) return a.tier - b.tier;
        if (TYPE_ORDER[a.type] !== TYPE_ORDER[b.type]) {
          return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
        }
        const ai = expansionOrder.get(a.expansionId) ?? Infinity;
        const bi = expansionOrder.get(b.expansionId) ?? Infinity;
        if (ai !== bi) return ai - bi;
        return a.id.localeCompare(b.id);
      });
  }, [
    allCards,
    expansionIds,
    selectedTypes,
    selectedCategories,
    selectedTiers,
    search,
    expansionOrder,
  ]);

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  return (
    <div className="space-y-4">
      <ExpansionSelector
        expansions={expansionsWithCards}
        selected={expansionIds}
        onChange={setExpansionIds}
        countLabel={(e) => `${e.nemesisCards.length} 枚`}
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
                onClick={() => setSelectedTypes(toggle(selectedTypes, t))}
                className={`rounded border px-3 py-1.5 text-sm transition ${
                  active ? styles.active : styles.inactive
                }`}
              >
                {NEMESIS_CARD_TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>
      </section>

      {availableCategories.length > 1 && (
        <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">分類</h2>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((c) => {
              const active = selectedCategories.has(c);
              const colors =
                c === 'Advanced'
                  ? 'border-amber-500/60 bg-amber-500/30 text-amber-100'
                  : 'border-emerald-500/60 bg-emerald-500/30 text-emerald-100';
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setSelectedCategories(toggle(selectedCategories, c))
                  }
                  className={`rounded border px-3 py-1.5 text-sm transition ${
                    active
                      ? colors
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  {NEMESIS_CARD_CATEGORY_LABEL[c]}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">階層</h2>
          {selectedTiers.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTiers(new Set())}
              className="text-sm text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
            >
              クリア
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allTiers.map((n) => {
            const active = selectedTiers.has(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => setSelectedTiers(toggle(selectedTiers, n))}
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
          名前・効果文検索
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="例: 暴走、グレイヴホールド、廃棄"
          className="w-full rounded border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
        />
      </section>

      <p className="mt-2 text-sm text-slate-400">
        {filtered.length} / {allCards.length} 枚を表示
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: NemesisCard) => (
            <NemesisCardTile key={c.id} card={c} />
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
