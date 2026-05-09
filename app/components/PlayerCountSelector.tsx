import {
  PLAYER_COUNT_MAX,
  PLAYER_COUNT_MIN,
} from '../../lib/randomizer/errors';

interface Props {
  value: number;
  onChange: (next: number) => void;
}

export function PlayerCountSelector({ value, onChange }: Props) {
  const options = Array.from(
    { length: PLAYER_COUNT_MAX - PLAYER_COUNT_MIN + 1 },
    (_, i) => PLAYER_COUNT_MIN + i,
  );
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-100">プレイヤー人数</h2>
      <div className="flex flex-wrap gap-2">
        {options.map((n) => {
          const active = n === value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
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
