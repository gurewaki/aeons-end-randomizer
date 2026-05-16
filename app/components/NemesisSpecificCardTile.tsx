import type { NemesisSpecificCard } from '../../lib/types';
import { NEMESIS_CARD_TYPE_LABEL } from '../../lib/types';
import { EffectText } from './EffectText';

const TYPE_STYLES: Record<NonNullable<NemesisSpecificCard['type']>, string> = {
  Attack: 'border-violet-500/60 bg-violet-950/30',
  Minion: 'border-sky-500/60 bg-sky-950/30',
  Power: 'border-yellow-500/60 bg-yellow-950/30',
};

const TYPE_BADGE: Record<NonNullable<NemesisSpecificCard['type']>, string> = {
  Attack: 'bg-violet-500/20 text-violet-200 border-violet-500/40',
  Minion: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
  Power: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
};

export function NemesisSpecificCardTile({
  card,
}: {
  card: NemesisSpecificCard;
}) {
  const frame = card.type
    ? TYPE_STYLES[card.type]
    : 'border-slate-600 bg-slate-800/60';
  return (
    <div className={`rounded-md border p-3 shadow-sm ${frame}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {card.type && (
          <span
            className={`rounded border px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[card.type]}`}
          >
            {NEMESIS_CARD_TYPE_LABEL[card.type]}
          </span>
        )}
        {card.tier !== undefined && (
          <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5 text-xs text-slate-300">
            階層 {card.tier}
          </span>
        )}
        {card.life !== undefined && (
          <span className="ml-auto text-sm font-semibold text-slate-200">
            体力 {card.life}
            {card.shield !== undefined && ` / シールド ${card.shield}`}
          </span>
        )}
      </div>
      <div className="text-lg font-bold leading-snug text-slate-50">
        {card.name}
      </div>
      <EffectText
        text={card.effect}
        className="mt-1.5 text-xs leading-relaxed text-slate-300"
      />
    </div>
  );
}
