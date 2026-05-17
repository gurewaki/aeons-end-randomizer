import type { Mage } from '../../lib/types';
import { PackageBadge } from './PackageBadge';

/**
 * 図鑑のメイジ一覧に並べるサマリタイル。詳細は Modal で開く。
 */
export function MageTile({ mage }: { mage: Mage }) {
  return (
    <div className="rounded-md border border-slate-600 bg-slate-800/60 p-3 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <PackageBadge expansionId={mage.expansionId} />
        {mage.level !== undefined && (
          <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5 text-xs text-slate-300">
            難易度 {mage.level}
          </span>
        )}
      </div>
      <div className="text-xl font-bold leading-snug text-slate-50">
        {mage.name}
      </div>
      <div className="mt-0.5 text-xs text-slate-300">{mage.job}</div>
    </div>
  );
}
