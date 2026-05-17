import type { Nemesis } from '../../lib/types';
import { PackageBadge } from './PackageBadge';

export function NemesisTile({ nemesis }: { nemesis: Nemesis }) {
  return (
    <div className="rounded-md border border-slate-600 bg-slate-800/60 p-3 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <PackageBadge expansionId={nemesis.expansionId} />
        {nemesis.level !== undefined && (
          <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5 text-xs text-slate-300">
            難易度 {nemesis.level}
          </span>
        )}
        <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5 text-xs text-slate-300">
          バトル {nemesis.battle}
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 leading-snug">
        <span className="text-xl font-bold text-slate-50">{nemesis.name}</span>
        {nemesis.life !== undefined && (
          <span className="text-base font-bold text-red-400">
            体力 {nemesis.life}
          </span>
        )}
      </div>
    </div>
  );
}
