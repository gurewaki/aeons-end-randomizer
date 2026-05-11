import type { Mage } from '../../lib/types';
import { EXPANSIONS } from '../../lib/data';
import { MageDetailTile } from './MageDetailTile';

function sortByPackage(mages: readonly Mage[]): Mage[] {
  const ids = new Set(mages.map((m) => m.id));
  const out: Mage[] = [];
  for (const e of EXPANSIONS) {
    for (const m of e.mages) {
      if (ids.has(m.id)) out.push(m);
    }
  }
  return out;
}

export function MageDisplay({
  mages,
  mustUseIds,
}: {
  mages: Mage[] | null;
  mustUseIds: ReadonlySet<string>;
}) {
  if (!mages) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        「ランダム生成」ボタンを押すとメイジが表示されます
      </div>
    );
  }
  const sorted = sortByPackage(mages);
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-300">
        メイジ ({sorted.length})
      </h3>
      <div className="grid gap-3 lg:grid-cols-2">
        {sorted.map((m) => (
          <MageDetailTile
            key={m.id}
            mage={m}
            variant="compact"
            isMustUse={mustUseIds.has(m.id)}
          />
        ))}
      </div>
    </section>
  );
}
