import type { NemesisSpecificCard } from '../../lib/types';
import { NemesisSpecificCardTile } from './NemesisSpecificCardTile';

/**
 * ネメシス固有カードを placement 別にグルーピングして表示するセクション群。
 * 図鑑のネメシス詳細とネメシスランダマイザの結果表示で共用する。
 */
export function NemesisCardSections({
  cards,
}: {
  cards: NemesisSpecificCard[];
}) {
  // placement の出現順を保持してグルーピング
  const groups: { placement: string; cards: NemesisSpecificCard[] }[] = [];
  const indexByPlacement = new Map<string, number>();
  for (const c of cards) {
    let i = indexByPlacement.get(c.placement);
    if (i === undefined) {
      i = groups.length;
      indexByPlacement.set(c.placement, i);
      groups.push({ placement: c.placement, cards: [] });
    }
    groups[i].cards.push(c);
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        このネメシスの固有カードはまだ登録されていません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.placement} className="space-y-3">
          <h3 className="border-l-4 border-rose-500/60 pl-3 text-lg font-semibold text-slate-100">
            {g.placement}
            <span className="ml-2 text-sm font-normal text-slate-400">
              {g.cards.length} 枚
            </span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.cards.map((c) => (
              <NemesisSpecificCardTile key={c.id} card={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
