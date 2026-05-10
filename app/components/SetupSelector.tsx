import type { SupplySetup } from '../../lib/types';

interface Props {
  setups: readonly SupplySetup[];
  selectedName: string;
  onChange: (name: string) => void;
}

function describeSlot(slot: SupplySetup['slots'][number]): string {
  if (slot.minCost !== undefined && slot.maxCost !== undefined) {
    if (slot.minCost === slot.maxCost) return `=${slot.minCost}`;
    return `${slot.minCost}〜${slot.maxCost}`;
  }
  if (slot.minCost !== undefined) return `≥${slot.minCost}`;
  if (slot.maxCost !== undefined) return `≤${slot.maxCost}`;
  return '不問';
}

const TYPE_LABEL: Record<string, string> = {
  Gem: '宝石',
  Relic: '遺物',
  Spell: '呪文',
};

function SetupPreview({ setup }: { setup: SupplySetup }) {
  // タイプ別にコスト制約を集約
  const byType = { Gem: [] as string[], Relic: [] as string[], Spell: [] as string[] };
  for (const slot of setup.slots) {
    byType[slot.type as keyof typeof byType].push(describeSlot(slot));
  }
  return (
    <div className="mt-1 space-y-0.5 text-xs text-slate-400">
      {(['Gem', 'Relic', 'Spell'] as const).map((t) => (
        <div key={t}>
          {TYPE_LABEL[t]}: {byType[t].join(' / ')}
        </div>
      ))}
    </div>
  );
}

export function SetupSelector({ setups, selectedName, onChange }: Props) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-100">
        セットアップ
      </h2>
      <div className="space-y-2">
        {setups.map((setup) => {
          const active = setup.name === selectedName;
          return (
            <label
              key={setup.name}
              className={`flex cursor-pointer items-start gap-2 rounded border px-3 py-2 transition ${
                active
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-slate-700 bg-slate-900/30 hover:bg-slate-700/30'
              }`}
            >
              <input
                type="radio"
                className="mt-1 h-4 w-4 accent-emerald-500"
                name="supply-setup"
                checked={active}
                onChange={() => onChange(setup.name)}
              />
              <div className="flex-1">
                <div className="font-medium text-slate-100">{setup.name}</div>
                <SetupPreview setup={setup} />
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
