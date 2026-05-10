'use client';

import { useMemo, useState } from 'react';
import { EXPANSIONS, getSeasonTheme } from '../../lib/data';
import type { Nemesis } from '../../lib/types';
import {
  generateNemesis,
  type NemesisMode,
} from '../../lib/randomizer/generateNemesis';
import {
  generateBasicDeck,
  NEMESIS_TIERS,
  type BasicDeckResult,
} from '../../lib/randomizer/generateBasicDeck';
import { ExpansionSelector } from './ExpansionSelector';
import { GenerateButton } from './GenerateButton';
import { ErrorBanner } from './ErrorBanner';
import { PackageBadge } from './PackageBadge';

type PageMode = NemesisMode | 'basic';

function ModeTabs({
  value,
  onChange,
}: {
  value: PageMode;
  onChange: (m: PageMode) => void;
}) {
  const tabs: { key: PageMode; label: string }[] = [
    { key: 'normal', label: '通常' },
    { key: 'expedition', label: '探索行' },
    { key: 'basic', label: '基本カード' },
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

function BasicSeasonChipFilter({
  eligible,
  selected,
  onChange,
}: {
  eligible: number[];
  selected: ReadonlySet<number>;
  onChange: (next: Set<number>) => void;
}) {
  const toggle = (n: number) => {
    const next = new Set(selected);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    onChange(next);
  };
  const allSelected =
    eligible.length > 0 && eligible.every((s) => selected.has(s));
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">
          抽選対象のシーズン
        </h2>
        {eligible.length > 0 && (
          <button
            type="button"
            onClick={() =>
              onChange(allSelected ? new Set() : new Set(eligible))
            }
            className="text-sm text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
          >
            {allSelected ? 'すべて外す' : 'すべて選択'}
          </button>
        )}
      </div>
      {eligible.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {eligible.map((s) => {
            const active = selected.has(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                className={`rounded border px-3 py-1.5 text-sm transition ${
                  active
                    ? 'border-emerald-500/60 bg-emerald-500/30 text-emerald-100'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                シーズン {s}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          各シーズンの大箱 (main パッケージ) を所有していません
        </p>
      )}
      <p className="mt-2 text-xs text-slate-400">
        各シーズンの main パッケージを所有しているシーズンが選択肢になります
      </p>
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
  return (
    <article className="rounded-lg border border-rose-500/60 bg-rose-950/30 p-6 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
        <PackageBadge expansionId={result.expansionId} />
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

function BasicDeckDisplay({ result }: { result: BasicDeckResult | null }) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        「ランダム生成」ボタンを押すと階層ごとのシーズンが表示されます
      </div>
    );
  }
  return (
    <article className="rounded-lg border border-rose-500/60 bg-rose-950/30 p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-bold text-slate-50">
        ネメシス基本カード
      </h3>
      <ul className="space-y-2">
        {NEMESIS_TIERS.map((tier) => {
          const season = result.byTier[tier];
          const theme = getSeasonTheme(season);
          return (
            <li
              key={tier}
              className="flex items-center justify-between rounded border border-slate-700 bg-slate-900/40 px-4 py-3"
            >
              <span className="text-base font-semibold text-slate-200">
                階層 {tier}
              </span>
              <span
                className="rounded border px-3 py-1 text-base font-bold"
                style={
                  theme
                    ? {
                        borderColor: `${theme}99`,
                        backgroundColor: `${theme}33`,
                        color: theme,
                      }
                    : undefined
                }
              >
                シーズン {season}
              </span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export function NemesisRandomizer() {
  const expansionsWithNemeses = useMemo(
    () => EXPANSIONS.filter((e) => e.nemeses.length > 0),
    [],
  );

  const allLevels = useMemo(
    () => Array.from({ length: 10 }, (_, i) => i + 1),
    [],
  );
  const allBattles = useMemo(
    () => Array.from({ length: 4 }, (_, i) => i + 1),
    [],
  );

  // 大箱 (type=main) を所有しているシーズン (= EXPANSIONS に YAML がある main)
  const eligibleSeasons = useMemo(() => {
    const set = new Set<number>();
    for (const e of EXPANSIONS) {
      if (e.type === 'main' && e.season !== undefined) set.add(e.season);
    }
    return [...set].sort((a, b) => a - b);
  }, []);

  const [pageMode, setPageMode] = useState<PageMode>('normal');
  const [selectedExpansionIds, setSelectedExpansionIds] = useState<Set<string>>(
    () => new Set(expansionsWithNemeses.map((e) => e.id)),
  );
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(
    () => new Set(),
  );
  const [selectedBattle, setSelectedBattle] = useState<number | null>(null);

  const [selectedBasicSeasons, setSelectedBasicSeasons] = useState<Set<number>>(
    () => new Set(eligibleSeasons),
  );
  const [nemesisResult, setNemesisResult] = useState<Nemesis | null>(null);
  const [nemesisResultMode, setNemesisResultMode] = useState<NemesisMode>('normal');
  const [basicResult, setBasicResult] = useState<BasicDeckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateNemesis = (mode: NemesisMode) => {
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
      setNemesisResult(n);
      setNemesisResultMode(mode);
    } catch (e) {
      setNemesisResult(null);
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
    }
  };

  const handleGenerateBasic = () => {
    setError(null);
    try {
      const seasons = eligibleSeasons.filter((s) =>
        selectedBasicSeasons.has(s),
      );
      setBasicResult(generateBasicDeck(seasons));
    } catch (e) {
      setBasicResult(null);
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
    }
  };

  const canGenerateNemesis = selectedExpansionIds.size > 0;
  const canGenerateBasic = eligibleSeasons.some((s) =>
    selectedBasicSeasons.has(s),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          ネメシスランダマイザ
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          通常 / 探索行モードはネメシス 1 体を抽選、基本カードモードは階層別にシーズンを抽選します
        </p>
      </header>

      <div className="space-y-4">
        <ModeTabs value={pageMode} onChange={setPageMode} />

        {pageMode !== 'basic' && (
          <ExpansionSelector
            expansions={expansionsWithNemeses}
            selected={selectedExpansionIds}
            onChange={setSelectedExpansionIds}
            countLabel={(e) => `${e.nemeses.length} 体`}
            groupBySeason
          />
        )}

        {pageMode === 'normal' && (
          <LevelChipFilter
            levels={allLevels}
            selected={selectedLevels}
            onChange={setSelectedLevels}
          />
        )}
        {pageMode === 'expedition' && (
          <BattleChipFilter
            battles={allBattles}
            selected={selectedBattle}
            onChange={setSelectedBattle}
          />
        )}
        {pageMode === 'basic' && (
          <BasicSeasonChipFilter
            eligible={eligibleSeasons}
            selected={selectedBasicSeasons}
            onChange={setSelectedBasicSeasons}
          />
        )}

        {pageMode === 'basic' ? (
          <GenerateButton
            disabled={!canGenerateBasic}
            onClick={handleGenerateBasic}
          />
        ) : (
          <GenerateButton
            disabled={!canGenerateNemesis}
            onClick={() => handleGenerateNemesis(pageMode)}
          />
        )}

        <ErrorBanner message={error} />
      </div>

      <div className="mt-10">
        {pageMode === 'basic' ? (
          <BasicDeckDisplay result={basicResult} />
        ) : (
          <NemesisDisplay result={nemesisResult} mode={nemesisResultMode} />
        )}
      </div>
    </main>
  );
}
