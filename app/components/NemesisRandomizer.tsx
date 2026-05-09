'use client';

import { useMemo, useState } from 'react';
import { EXPANSIONS, getExpansion } from '../../lib/data';
import type { Nemesis } from '../../lib/types';
import {
  generateNemesis,
  type NemesisMode,
} from '../../lib/randomizer/generateNemesis';
import { ExpansionSelector } from './ExpansionSelector';
import { GenerateButton } from './GenerateButton';
import { ErrorBanner } from './ErrorBanner';

function ModeTabs({
  value,
  onChange,
}: {
  value: NemesisMode;
  onChange: (m: NemesisMode) => void;
}) {
  const tabs: { key: NemesisMode; label: string }[] = [
    { key: 'normal', label: '通常モード' },
    { key: 'expedition', label: '探索行モード' },
  ];
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-1">
      <div className="flex gap-1">
        {tabs.map(({ key, label }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
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
  );
}

function LevelChipFilter({
  levels,
  selected,
  onChange,
}: {
  levels: number[];
  selected: ReadonlySet<number>;
  onChange: (next: Set<number>) => void;
}) {
  const toggle = (n: number) => {
    const next = new Set(selected);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    onChange(next);
  };
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">難易度</h2>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => onChange(new Set())}
            className="text-sm text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
          >
            クリア
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {levels.map((n) => {
          const active = selected.has(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => toggle(n)}
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
  );
}

function BattleChipFilter({
  battles,
  selected,
  onChange,
}: {
  battles: number[];
  selected: number | null;
  onChange: (next: number | null) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">バトル</h2>
        {selected !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
          >
            クリア
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {battles.map((n) => {
          const active = selected === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(active ? null : n)}
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
  );
}

function NemesisDisplay({
  result,
  mode,
}: {
  result: Nemesis | null;
  mode: NemesisMode;
}) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        「ランダム生成」ボタンを押すとネメシスが表示されます
      </div>
    );
  }
  const expansion = getExpansion(result.expansionId);
  const expansionLabel =
    expansion?.badge ?? expansion?.name ?? result.expansionId;
  return (
    <article className="rounded-lg border border-rose-500/60 bg-rose-950/30 p-6 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
        <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5">
          {expansionLabel}
        </span>
        {expansion?.season !== undefined && (
          <span className="rounded border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 text-rose-200">
            シーズン {expansion.season}
          </span>
        )}
        {result.level !== undefined && (
          <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5">
            難易度 {result.level}
          </span>
        )}
        <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5">
          バトル {result.battle}
        </span>
      </div>
      <h3 className="text-3xl font-bold text-slate-50 sm:text-4xl">
        {result.name}
      </h3>
      {mode === 'expedition' && (
        <div className="mt-4 border-l-4 border-emerald-500/60 bg-slate-900/60 p-3">
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
            {result.rule}
          </p>
        </div>
      )}
    </article>
  );
}

export function NemesisRandomizer() {
  const expansionsWithNemeses = useMemo(
    () => EXPANSIONS.filter((e) => e.nemeses.length > 0),
    [],
  );

  // 通常モードの難易度は将来追加されるネメシスを想定して 1-10 を固定で表示
  const allLevels = useMemo(
    () => Array.from({ length: 10 }, (_, i) => i + 1),
    [],
  );
  // 探索行モードのバトルはゲーム設計上 1-4 で固定
  const allBattles = useMemo(
    () => Array.from({ length: 4 }, (_, i) => i + 1),
    [],
  );

  const [selectedExpansionIds, setSelectedExpansionIds] = useState<Set<string>>(
    () => new Set(expansionsWithNemeses.map((e) => e.id)),
  );
  const [mode, setMode] = useState<NemesisMode>('normal');
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(
    () => new Set(),
  );
  const [selectedBattle, setSelectedBattle] = useState<number | null>(null);
  const [result, setResult] = useState<Nemesis | null>(null);
  const [resultMode, setResultMode] = useState<NemesisMode>('normal');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    const pool = EXPANSIONS.filter((e) =>
      selectedExpansionIds.has(e.id),
    ).flatMap((e) => e.nemeses);
    try {
      const n = generateNemesis(pool, {
        mode,
        levelFilter: mode === 'normal' ? selectedLevels : undefined,
        battleFilter: mode === 'expedition' ? selectedBattle : undefined,
      });
      setResult(n);
      setResultMode(mode);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
    }
  };

  const canGenerate = selectedExpansionIds.size > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          ネメシスランダマイザ
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          通常モードでは難易度、探索行モードではバトルでネメシスを 1 体抽選します
        </p>
      </header>

      <div className="space-y-4">
        <ExpansionSelector
          expansions={expansionsWithNemeses}
          selected={selectedExpansionIds}
          onChange={setSelectedExpansionIds}
          countLabel={(e) => `${e.nemeses.length} 体`}
          groupBySeason
        />
        <ModeTabs value={mode} onChange={setMode} />
        {mode === 'normal' ? (
          <LevelChipFilter
            levels={allLevels}
            selected={selectedLevels}
            onChange={setSelectedLevels}
          />
        ) : (
          <BattleChipFilter
            battles={allBattles}
            selected={selectedBattle}
            onChange={setSelectedBattle}
          />
        )}
        <GenerateButton disabled={!canGenerate} onClick={handleGenerate} />
        <ErrorBanner message={error} />
      </div>

      <div className="mt-10">
        <NemesisDisplay result={result} mode={resultMode} />
      </div>
    </main>
  );
}
