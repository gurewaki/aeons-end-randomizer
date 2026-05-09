import type { Mage } from '../../lib/types';
import { MageTile } from './MageTile';

function sortMages(mages: readonly Mage[]): Mage[] {
  return [...mages].sort((a, b) => {
    const al = a.level ?? Infinity;
    const bl = b.level ?? Infinity;
    if (al !== bl) return al - bl;
    return a.name.localeCompare(b.name, 'ja');
  });
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
  const sorted = sortMages(mages);
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-300">
        メイジ ({sorted.length})
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((m) => (
          <MageTile key={m.id} mage={m} isMustUse={mustUseIds.has(m.id)} />
        ))}
      </div>
    </section>
  );
}
