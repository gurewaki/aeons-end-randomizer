import type { MarketSupply } from '../../lib/types';
import { CardTile } from './CardTile';

function Section({
  title,
  cards,
}: {
  title: string;
  cards: MarketSupply['gems'] | MarketSupply['relics'] | MarketSupply['spells'];
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-300">
        {title} ({cards.length})
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
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
