import type { CardType, SetupSlot, SupplySetup } from '../../lib/types';

interface Props {
  setups: readonly SupplySetup[];
  selectedName: string;
  onChange: (name: string) => void;
}

const TYPE_CHIP: Record<CardType, string> = {
  Gem: 'border-violet-500/60 bg-violet-500/20 text-violet-200',
  Relic: 'border-blue-500/60 bg-blue-500/20 text-blue-200',
  Spell: 'border-yellow-500/60 bg-yellow-500/20 text-yellow-200',
};

const TYPE_TITLE: Record<CardType, string> = {
  Gem: '宝石',
  Relic: '遺物',
  Spell: '呪文',
};

function constraintLabel(slot: SetupSlot): string {
  if (slot.minCost !== undefined && slot.maxCost !== undefined) {
    if (slot.minCost === slot.maxCost) return `=${slot.minCost}`;
    return `${slot.minCost}〜${slot.maxCost}`;
  }
  if (slot.minCost !== undefined) return `≥${slot.minCost}`;
  if (slot.maxCost !== undefined) return `≤${slot.maxCost}`;
  return 'ANY';
}

function SetupPreview({ setup }: { setup: SupplySetup }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {setup.slots.map((slot, i) => (
        <span
          key={i}
          title={TYPE_TITLE[slot.type]}
          className={`rounded border px-1.5 py-0.5 text-xs font-medium ${TYPE_CHIP[slot.type]}`}
        >
          {constraintLabel(slot)}
        </span>
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
