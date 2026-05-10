import type { BreachSymbol, Mage, CardType } from '../../lib/types';
import { CARD_TYPE_LABEL } from '../../lib/types';
import { PackageBadge } from './PackageBadge';

const BREACH_STYLE: Record<BreachSymbol, { className: string; label: string }> = {
  o: { className: 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200', label: '○' },
  '↑': { className: 'border-amber-500/60 bg-amber-500/20 text-amber-200', label: '↑' },
  '↓': { className: 'border-amber-500/60 bg-amber-500/20 text-amber-200', label: '↓' },
  '←': { className: 'border-amber-500/60 bg-amber-500/20 text-amber-200', label: '←' },
  '→': { className: 'border-amber-500/60 bg-amber-500/20 text-amber-200', label: '→' },
  x: { className: 'border-slate-700 bg-slate-800/40 text-slate-500', label: '×' },
};

const TYPE_TEXT_COLOR: Record<CardType, string> = {
  Gem: 'text-violet-300',
  Relic: 'text-blue-300',
  Spell: 'text-yellow-300',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 mb-1 text-[10px] font-semibold tracking-widest text-slate-400">
      {children}
    </div>
  );
}

function PileLine({
  pile,
}: {
  pile: { unique: number; crystal: number; spark: number };
}) {
  return (
    <span className="text-xs text-slate-300">
      固有 {pile.unique} / 水晶 {pile.crystal} / スパーク {pile.spark}
    </span>
  );
}

export function MageDetailTile({ mage }: { mage: Mage }) {
  return (
    <article className="rounded-md border border-slate-600 bg-slate-800/60 p-4 shadow-sm">
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

      {mage.breaches && (
        <>
          <SectionLabel>破孔</SectionLabel>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {mage.breaches.tiles.map((b, i) => {
                const s = BREACH_STYLE[b];
                return (
                  <span
                    key={i}
                    className={`flex h-7 w-7 items-center justify-center rounded border text-sm font-medium ${s.className}`}
                  >
                    {s.label}
                  </span>
                );
              })}
            </div>
          </div>
          {mage.uniqueBreach && (
            <div className="mt-1.5 text-xs text-slate-300">
              <span className="font-semibold text-slate-200">
                固有破孔 #{mage.uniqueBreach.number}
              </span>
              {mage.uniqueBreach.effect && (
                <span className="ml-2 text-slate-300">
                  {mage.uniqueBreach.effect}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {mage.uniqueCard && (
        <>
          <SectionLabel>固有カード</SectionLabel>
          <div className="text-sm">
            <span className="font-semibold text-slate-100">
              {mage.uniqueCard.name}
            </span>
            <span
              className={`ml-2 text-xs ${TYPE_TEXT_COLOR[mage.uniqueCard.type]}`}
            >
              [{CARD_TYPE_LABEL[mage.uniqueCard.type]}]
            </span>
          </div>
          <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-slate-300">
            {mage.uniqueCard.effect}
          </p>
        </>
      )}

      {(mage.hand || mage.deck) && (
        <>
          <SectionLabel>初期構成</SectionLabel>
          <div className="space-y-0.5">
            {mage.hand && (
              <div>
                <span className="text-xs text-slate-400">手札: </span>
                <PileLine pile={mage.hand} />
              </div>
            )}
            {mage.deck && (
              <div>
                <span className="text-xs text-slate-400">山札: </span>
                <PileLine pile={mage.deck} />
              </div>
            )}
          </div>
        </>
      )}

      {mage.skill && (
        <>
          <SectionLabel>スキル</SectionLabel>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">
              {mage.skill.name}
            </span>
            {mage.skill.charge !== undefined && (
              <span className="rounded border border-amber-500/60 bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-200">
                ⚡ {mage.skill.charge}
              </span>
            )}
          </div>
          {mage.skill.timing && (
            <div className="mt-0.5 text-xs text-slate-400">
              {mage.skill.timing}
            </div>
          )}
          <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-slate-300">
            {mage.skill.effect}
          </p>
        </>
      )}

      {mage.rule && (
        <>
          <SectionLabel>ルール</SectionLabel>
          <p className="whitespace-pre-line text-xs leading-relaxed text-slate-300">
            {mage.rule}
          </p>
        </>
      )}
    </article>
  );
}
