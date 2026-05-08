import type { Expansion } from '../../lib/types';

interface Props {
  expansions: Expansion[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function ExpansionSelector({ expansions, selected, onChange }: Props) {
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
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {expansions.map((e) => (
          <li key={e.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-700/50">
              <input
                type="checkbox"
                className="h-4 w-4 accent-emerald-500"
                checked={selected.has(e.id)}
                onChange={() => toggle(e.id)}
              />
              <span className="font-medium text-slate-100">{e.name}</span>
              <span className="ml-auto text-xs text-slate-400">
                {e.cards.length} 枚
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
