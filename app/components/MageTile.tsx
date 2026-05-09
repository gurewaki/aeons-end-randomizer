import type { Mage } from '../../lib/types';
import { getExpansion } from '../../lib/data';

export function MageTile({
  mage,
  isMustUse = false,
}: {
  mage: Mage;
  isMustUse?: boolean;
}) {
  const expansion = getExpansion(mage.expansionId);
  const expansionLabel = expansion?.badge ?? expansion?.name ?? mage.expansionId;
  const ringClass = isMustUse ? 'ring-2 ring-emerald-400/70' : '';

  return (
    <div
      className={`rounded-md border border-slate-600 bg-slate-800/60 p-3 shadow-sm ${ringClass}`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5 text-xs text-slate-300">
          {expansionLabel}
        </span>
        {mage.level !== undefined && (
          <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5 text-xs text-slate-300">
            Lv {mage.level}
          </span>
        )}
        {isMustUse && (
          <span
            className="rounded border border-emerald-400/60 bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-200"
            title="必ず使用に指定したメイジ"
          >
            ★ 指定
          </span>
        )}
      </div>
      <div className="text-xl font-bold leading-snug text-slate-50">
        {mage.name}
      </div>
      <div className="mt-1 text-xs text-slate-300">{mage.job}</div>
    </div>
  );
}
