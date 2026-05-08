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
}: {
  title: string;
  cards: readonly T[];
}) {
  const sorted = sortByCost(cards);
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-300">
        {title} ({sorted.length})
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((c) => (
          <CardTile key={c.id} card={c} />
        ))}
      </div>
    </section>
  );
}

export function MarketDisplay({ market }: { market: MarketSupply | null }) {
  if (!market) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        「ランダム生成」ボタンを押すとマーケットが表示されます
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Section title="宝石" cards={market.gems} />
      <Section title="遺物" cards={market.relics} />
      <Section title="呪文" cards={market.spells} />
    </div>
  );
}
