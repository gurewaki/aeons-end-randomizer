import type { Card } from '../../lib/types';
import { CARD_TYPE_LABEL } from '../../lib/types';
import { getExpansion } from '../../lib/data';

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

export function CardTile({ card }: { card: Card }) {
  const expansion = getExpansion(card.expansionId);
  const expansionLabel = expansion?.name ?? card.expansionId;

  return (
    <div
      className={`rounded-md border p-3 shadow-sm ${TYPE_STYLES[card.type]}`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[card.type]}`}
        >
          {CARD_TYPE_LABEL[card.type]}
        </span>
        <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5 text-xs text-slate-300">
          {expansionLabel}
        </span>
        <span className="ml-auto text-sm font-semibold text-slate-200">
          コスト {card.cost}
        </span>
      </div>
      <div className="text-base font-bold text-slate-50">{card.name}</div>
      {card.effect && (
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          {card.effect}
        </p>
      )}
    </div>
  );
}
