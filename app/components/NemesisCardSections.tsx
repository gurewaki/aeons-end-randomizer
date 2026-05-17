import type { NemesisSpecificCard } from '../../lib/types';
import { NemesisSpecificCardTile } from './NemesisSpecificCardTile';

type TierGroup = {
  /** null は階層を持たないカード (ストライク, 堕落カード 等) */
  tier: number | null;
  cards: NemesisSpecificCard[];
};

type PlacementGroup = {
  placement: string;
  tierGroups: TierGroup[];
  /** placement 配下のカードがすべて tier 持ち = 階層サブセクションを表示する */
  hasTiers: boolean;
};

function group(cards: NemesisSpecificCard[]): PlacementGroup[] {
  const placementGroups: PlacementGroup[] = [];
  const placementIdx = new Map<string, number>();

  for (const c of cards) {
    let pi = placementIdx.get(c.placement);
    if (pi === undefined) {
      pi = placementGroups.length;
      placementIdx.set(c.placement, pi);
      placementGroups.push({ placement: c.placement, tierGroups: [], hasTiers: false });
    }
    const pg = placementGroups[pi];
    const tier = c.tier ?? null;
    let tg = pg.tierGroups.find((t) => t.tier === tier);
    if (!tg) {
      tg = { tier, cards: [] };
      pg.tierGroups.push(tg);
    }
    tg.cards.push(c);
  }

  for (const pg of placementGroups) {
    pg.hasTiers = pg.tierGroups.every((t) => t.tier !== null);
    pg.tierGroups.sort((a, b) => {
      if (a.tier === null) return 1;
      if (b.tier === null) return -1;
      return a.tier - b.tier;
    });
  }

  return placementGroups;
}

function CardsGrid({ cards }: { cards: NemesisSpecificCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <NemesisSpecificCardTile key={c.id} card={c} />
      ))}
    </div>
  );
}

/**
 * ネメシス固有カードを placement 別にグルーピングして表示するセクション群。
 * placement 配下のカードがすべて tier を持つ場合は、さらに階層ごとのサブセクションに分割する。
 * 図鑑のネメシス詳細とネメシスランダマイザの結果表示で共用する。
 */
export function NemesisCardSections({
  cards,
}: {
  cards: NemesisSpecificCard[];
}) {
  const groups = group(cards);

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        このネメシスの固有カードはまだ登録されていません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((pg) => {
        const totalCount = pg.tierGroups.reduce((n, t) => n + t.cards.length, 0);
        return (
          <section key={pg.placement} className="space-y-3">
            <h3 className="border-l-4 border-amber-700/70 pl-3 text-lg font-semibold text-slate-100">
              {pg.placement}
              <span className="ml-2 text-sm font-normal text-slate-400">
                {totalCount} 枚
              </span>
            </h3>
            {pg.hasTiers ? (
              <div className="space-y-4">
                {pg.tierGroups.map((tg) => (
                  <div key={tg.tier ?? 'none'} className="space-y-2">
                    <h4 className="text-sm font-semibold tracking-wide text-slate-300">
                      階層 {tg.tier}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {tg.cards.length} 枚
                      </span>
                    </h4>
                    <CardsGrid cards={tg.cards} />
                  </div>
                ))}
              </div>
            ) : (
              <CardsGrid cards={pg.tierGroups.flatMap((tg) => tg.cards)} />
            )}
          </section>
        );
      })}
    </div>
  );
}
