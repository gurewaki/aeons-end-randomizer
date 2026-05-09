import type { Expansion } from '../../lib/types';

interface Props {
  expansions: readonly Expansion[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  countLabel?: (e: Expansion) => string;
  /** true のとき、シーズン (Expansion.season) でグループ化して見出し付きで表示する */
  groupBySeason?: boolean;
}

const defaultCountLabel = (e: Expansion) => `${e.cards.length} 枚`;

function groupBySeasonFn(
  expansions: readonly Expansion[],
): { season: number | null; items: Expansion[] }[] {
  const map = new Map<number | null, Expansion[]>();
  for (const e of expansions) {
    const key = e.season ?? null;
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    })
    .map(([season, items]) => ({ season, items }));
}

function ExpansionRow({
  e,
  checked,
  onToggle,
  countLabel,
}: {
  e: Expansion;
  checked: boolean;
  onToggle: () => void;
  countLabel: (e: Expansion) => string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-700/50">
      <input
        type="checkbox"
        className="h-4 w-4 accent-emerald-500"
        checked={checked}
        onChange={onToggle}
      />
      <span className="font-medium text-slate-100">{e.name}</span>
      <span className="ml-auto text-xs text-slate-400">{countLabel(e)}</span>
    </label>
  );
}

export function ExpansionSelector({
  expansions,
  selected,
  onChange,
  countLabel = defaultCountLabel,
  groupBySeason = false,
}: Props) {
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const allSelected = expansions.every((e) => selected.has(e.id));
  const toggleAll = () => {
    if (allSelected) onChange(new Set());
    else onChange(new Set(expansions.map((e) => e.id)));
  };

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">使用する拡張</h2>
        <button
          type="button"
          onClick={toggleAll}
          className="text-sm text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
        >
          {allSelected ? 'すべて外す' : 'すべて選択'}
        </button>
      </div>

      {groupBySeason ? (
        <div className="space-y-3">
          {groupBySeasonFn(expansions).map(({ season, items }) => (
            <div key={season ?? 'none'}>
              <h3 className="mb-1 text-xs font-semibold tracking-wider text-slate-400">
                {season !== null ? `シーズン ${season}` : 'その他'}
              </h3>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((e) => (
                  <li key={e.id}>
                    <ExpansionRow
                      e={e}
                      checked={selected.has(e.id)}
                      onToggle={() => toggle(e.id)}
                      countLabel={countLabel}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {expansions.map((e) => (
            <li key={e.id}>
              <ExpansionRow
                e={e}
                checked={selected.has(e.id)}
                onToggle={() => toggle(e.id)}
                countLabel={countLabel}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
