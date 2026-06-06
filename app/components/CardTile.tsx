import { RotateCcw } from 'lucide-react';
import type { Card } from '../../lib/types';
import { CARD_TYPE_LABEL } from '../../lib/types';
import { PackageBadge } from './PackageBadge';
import { EffectText } from './EffectText';

const TYPE_STYLES: Record<Card['type'], string> = {
  Gem: 'border-violet-500/60 bg-violet-950/30',
  Relic: 'border-blue-500/60 bg-blue-950/30',
  Spell: 'border-yellow-500/60 bg-yellow-950/30',
};

const TYPE_BADGE: Record<Card['type'], string> = {
  Gem: 'bg-violet-500/20 text-violet-200 border-violet-500/40',
  Relic: 'bg-blue-500/20 text-blue-200 border-blue-500/40',
  Spell: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
};

export function CardTile({
  card,
  isMustUse = false,
  onReroll,
  rerollDisabledReason,
}: {
  card: Card;
  isMustUse?: boolean;
  /** 指定時のみ再抽選ボタンを表示。isMustUse のカードでは無視する */
  onReroll?: () => void;
  /** 指定するとボタンが disabled + tooltip 表示になる */
  rerollDisabledReason?: string;
}) {
  const ringClass = isMustUse ? 'ring-2 ring-emerald-400/70' : '';
  const showReroll = onReroll !== undefined && !isMustUse;
  const rerollDisabled = Boolean(rerollDisabledReason);

  return (
    <div
      className={`rounded-md border p-3 shadow-sm ${TYPE_STYLES[card.type]} ${ringClass}`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[card.type]}`}
        >
          {CARD_TYPE_LABEL[card.type]}
        </span>
        <PackageBadge expansionId={card.expansionId} />
        {isMustUse && (
          <span
            className="rounded border border-emerald-400/60 bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-200"
            title="必ず使用に指定したカード"
          >
            ★ 指定
          </span>
        )}
        <span className="ml-auto text-sm font-semibold text-slate-200">
          コスト {card.cost}
        </span>
        {showReroll && (
          <button
            type="button"
            onClick={onReroll}
            disabled={rerollDisabled}
            aria-label="このカードを再抽選"
            title={rerollDisabledReason ?? 'このカードを別のものに再抽選'}
            className="rounded border border-slate-600 bg-slate-800/70 p-1 text-slate-300 hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-800/70"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="text-xl font-bold leading-snug text-slate-50">
        {card.name}
      </div>
      {card.effect && (
        <EffectText
          text={card.effect}
          className="mt-1.5 text-xs leading-relaxed text-slate-300"
        />
      )}
    </div>
  );
}
