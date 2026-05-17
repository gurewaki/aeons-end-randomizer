'use client';

import { useState } from 'react';
import { CardList } from './CardList';
import { MageList } from './MageList';
import { NemesisList } from './NemesisList';
import { NemesisCardList } from './NemesisCardList';
import { TreasureList } from './TreasureList';

type LibraryTab =
  | 'card'
  | 'mage'
  | 'nemesis'
  | 'nemesisCard'
  | 'treasure';

const TABS: { key: LibraryTab; label: string }[] = [
  { key: 'card', label: 'カード' },
  { key: 'mage', label: 'メイジ' },
  { key: 'nemesis', label: 'ネメシス' },
  { key: 'nemesisCard', label: 'ネメシス基本カード' },
  { key: 'treasure', label: 'トレジャーカード' },
];

export function Library() {
  const [tab, setTab] = useState<LibraryTab>('card');

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">図鑑</h1>
        <p className="mt-2 text-sm text-slate-400">
          所有しているリソースを一覧で確認・検索できます
        </p>
      </header>

      <section className="mb-4 rounded-lg border border-slate-700 bg-slate-800/50 p-1">
        <div className="flex gap-1">
          {TABS.map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={
                  'flex-1 rounded px-4 py-2 text-sm font-medium transition ' +
                  (active
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100')
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {tab === 'card' && <CardList />}
      {tab === 'mage' && <MageList />}
      {tab === 'nemesis' && <NemesisList />}
      {tab === 'nemesisCard' && <NemesisCardList />}
      {tab === 'treasure' && <TreasureList />}
    </main>
  );
}
