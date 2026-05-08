import { Fragment } from 'react';
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

function splitOrSegments(effect: string): string[] {
  const lines = effect.split('\n');
  const segments: string[] = [];
  let buf: string[] = [];
  for (const line of lines) {
    if (line.trim() === 'または') {
      segments.push(buf.join('\n').trim());
      buf = [];
    } else {
      buf.push(line);
    }
  }
  segments.push(buf.join('\n').trim());
  return segments.filter((s) => s.length > 0);
}

function OrDivider() {
  return (
    <div className="my-1.5 flex items-center gap-2">
      <span className="h-px flex-1 bg-slate-600/80" />
      <span className="text-[10px] tracking-widest text-slate-400">または</span>
      <span className="h-px flex-1 bg-slate-600/80" />
    </div>
  );
}

export function CardTile({ card }: { card: Card }) {
  const expansion = getExpansion(card.expansionId);
  const expansionLabel = expansion?.badge ?? expansion?.name ?? card.expansionId;
  const segments = card.effect ? splitOrSegments(card.effect) : [];

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
      {segments.length > 0 && (
        <div className="mt-1 text-xs leading-relaxed text-slate-300">
          {segments.map((seg, i) => (
            <Fragment key={i}>
              {i > 0 && <OrDivider />}
              <p className="whitespace-pre-line">{seg}</p>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
