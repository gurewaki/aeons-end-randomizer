import type { CardType, SetupSlot, SupplySetup } from '../../lib/types';
import { MARKET_COMPOSITION } from '../../lib/types';

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

/**
 * 公式構成 (Gem 3 / Relic 2 / Spell 4 = 9 枠) を「サプライ全体」、
 * それ以外を「1 枚抽選 (探索行用)」グループとして区別する。
 */
function isFullSupply(setup: SupplySetup): boolean {
  const counts = { Gem: 0, Relic: 0, Spell: 0 };
  for (const s of setup.slots) counts[s.type]++;
  return (
    counts.Gem === MARKET_COMPOSITION.Gem &&
    counts.Relic === MARKET_COMPOSITION.Relic &&
    counts.Spell === MARKET_COMPOSITION.Spell
  );
}

function SetupPreview({ setup }: { setup: SupplySetup }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {setup.slots.map((slot, i) => (
        <span
          key={i}
          title={TYPE_TITLE[slot.type]}
          className={`inline-block min-w-[3rem] rounded border px-1.5 py-0.5 text-center text-xs font-medium ${TYPE_CHIP[slot.type]}`}
        >
          {constraintLabel(slot)}
        </span>
      ))}
    </div>
  );
}

export function SetupSelector({ setups, selectedName, onChange }: Props) {
  const fullSupplies = setups.filter(isFullSupply);
  const singleCards = setups.filter((s) => !isFullSupply(s));
  const selected = setups.find((s) => s.name === selectedName);

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-100">
        セットアップ
      </h2>
      <select
        value={selectedName}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
      >
        {fullSupplies.length > 0 && (
          <optgroup label="サプライ全体">
            {fullSupplies.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </optgroup>
        )}
        {singleCards.length > 0 && (
          <optgroup label="1 枚抽選 (探索行用)">
            {singleCards.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {selected && <SetupPreview setup={selected} />}
    </section>
  );
}
