import type { Card, MarketSupply } from '../../lib/types';
import { CardTile } from './CardTile';

function sortByCost<T extends Card>(cards: readonly T[]): T[] {
  return [...cards].sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name, 'ja');
  });
}

function Section<T extends Card>({
  title,
  cards,
  mustUseIds,
  onRerollCard,
  rerollDisabledByCardId,
}: {
  title: string;
  cards: readonly T[];
  mustUseIds: ReadonlySet<string>;
  onRerollCard?: (card: Card) => void;
  rerollDisabledByCardId?: ReadonlyMap<string, string>;
}) {
  const sorted = sortByCost(cards);
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-300">
        {title} ({sorted.length})
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((c) => (
          <CardTile
            key={c.id}
            card={c}
            isMustUse={mustUseIds.has(c.id)}
            onReroll={onRerollCard ? () => onRerollCard(c) : undefined}
            rerollDisabledReason={rerollDisabledByCardId?.get(c.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function MarketDisplay({
  market,
  mustUseIds,
  onRerollCard,
  rerollDisabledByCardId,
}: {
  market: MarketSupply | null;
  mustUseIds: ReadonlySet<string>;
  /** 指定時のみ各カードに再抽選ボタンを表示。共有 URL モードでは未指定 */
  onRerollCard?: (card: Card) => void;
  /** カード ID → disabled 理由。値があるとボタンは disabled + tooltip 表示 */
  rerollDisabledByCardId?: ReadonlyMap<string, string>;
}) {
  if (!market) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        「ランダム生成」ボタンを押すとサプライが表示されます
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {market.gems.length > 0 && (
        <Section
          title="宝石"
          cards={market.gems}
          mustUseIds={mustUseIds}
          onRerollCard={onRerollCard}
          rerollDisabledByCardId={rerollDisabledByCardId}
        />
      )}
      {market.relics.length > 0 && (
        <Section
          title="遺物"
          cards={market.relics}
          mustUseIds={mustUseIds}
          onRerollCard={onRerollCard}
          rerollDisabledByCardId={rerollDisabledByCardId}
        />
      )}
      {market.spells.length > 0 && (
        <Section
          title="呪文"
          cards={market.spells}
          mustUseIds={mustUseIds}
          onRerollCard={onRerollCard}
          rerollDisabledByCardId={rerollDisabledByCardId}
        />
      )}
    </div>
  );
}
