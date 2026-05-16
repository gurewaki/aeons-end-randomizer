import type { Nemesis } from '../../lib/types';
import { PackageBadge } from './PackageBadge';
import { NemesisCardSections } from './NemesisCardSections';

/**
 * ネメシスのヘッダ + ルール + 固有カードを表示する詳細ビュー。
 * Modal 内で使う想定 (閉じる導線は呼び出し元が用意する)。
 */
export function NemesisDetail({
  nemesis,
  titleId,
  onClose,
}: {
  nemesis: Nemesis;
  titleId?: string;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-6">
      <article className="rounded-lg border border-rose-500/60 bg-rose-950/30 p-6 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <PackageBadge expansionId={nemesis.expansionId} />
          {nemesis.level !== undefined && (
            <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5">
              難易度 {nemesis.level}
            </span>
          )}
          <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5">
            バトル {nemesis.battle}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className="ml-auto rounded border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-base leading-none text-slate-200 hover:bg-slate-700/70"
            >
              ×
            </button>
          )}
        </div>
        <h2
          id={titleId}
          className="text-3xl font-bold text-slate-50 sm:text-4xl"
        >
          {nemesis.name}
        </h2>
      </article>

      <NemesisCardSections cards={nemesis.cards} />
    </div>
  );
}
