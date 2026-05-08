import type { Card } from '../../lib/types';
import { CARD_TYPE_LABEL } from '../../lib/types';

const TYPE_STYLES: Record<Card['type'], string> = {
  Gem: 'border-emerald-500/60 bg-emerald-950/30',
  Relic: 'border-amber-500/60 bg-amber-950/30',
  Spell: 'border-violet-500/60 bg-violet-950/30',
};

const TYPE_BADGE: Record<Card['type'], string> = {
  Gem: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  Relic: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
  Spell: 'bg-violet-500/20 text-violet-200 border-violet-500/40',
};

export function CardTile({ card }: { card: Card }) {
  return (
    <div
      className={`rounded-md border p-3 shadow-sm ${TYPE_STYLES[card.type]}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span
          className={`rounded border px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[card.type]}`}
        >
          {CARD_TYPE_LABEL[card.type]}
        </span>
        <span className="text-sm font-semibold text-slate-200">
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
