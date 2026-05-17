import type { Treasure, CardType } from '../../lib/types';
import { CARD_TYPE_LABEL } from '../../lib/types';
import { PackageBadge } from './PackageBadge';
import { EffectText } from './EffectText';

// Level 1 はプレイヤーカードと同じ配色 (CardTile に合わせる)
const LEVEL1_TYPE_FRAME: Record<CardType, string> = {
  Gem: 'border-violet-500/60 bg-violet-950/30',
  Relic: 'border-blue-500/60 bg-blue-950/30',
  Spell: 'border-yellow-500/60 bg-yellow-950/30',
};
const LEVEL1_TYPE_BADGE: Record<CardType, string> = {
  Gem: 'bg-violet-500/20 text-violet-200 border-violet-500/40',
  Relic: 'bg-blue-500/20 text-blue-200 border-blue-500/40',
  Spell: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
};

const LEVEL2_FRAME = 'border-blue-500/60 bg-blue-950/30';
const LEVEL3_FRAME = 'border-yellow-500/60 bg-yellow-950/30';

export function TreasureTile({ treasure }: { treasure: Treasure }) {
  let frameClass: string;
  if (treasure.level === 1 && treasure.type) {
    frameClass = LEVEL1_TYPE_FRAME[treasure.type];
  } else if (treasure.level === 2) {
    frameClass = LEVEL2_FRAME;
  } else {
    frameClass = LEVEL3_FRAME;
  }

  return (
    <div className={`rounded-md border p-3 shadow-sm ${frameClass}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {treasure.level === 1 && treasure.type && (
          <span
            className={`rounded border px-2 py-0.5 text-xs font-medium ${LEVEL1_TYPE_BADGE[treasure.type]}`}
          >
            {CARD_TYPE_LABEL[treasure.type]}
          </span>
        )}
        <PackageBadge expansionId={treasure.expansionId} />
        <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5 text-xs text-slate-300">
          レベル {treasure.level}
        </span>
      </div>
      <div className="text-xl font-bold leading-snug text-slate-50">
        {treasure.name}
      </div>
      <EffectText
        text={treasure.effect}
        className="mt-1.5 text-xs leading-relaxed text-slate-300"
      />
    </div>
  );
}
