export type CardType = 'Gem' | 'Relic' | 'Spell';

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  Gem: '宝石',
  Relic: '遺物',
  Spell: '呪文',
};

interface CardBase {
  id: string;
  expansionId: string;
  name: string;
  cost: number;
  effect?: string;
  keywords?: string[];
}

export interface Gem extends CardBase {
  type: 'Gem';
}
export interface Relic extends CardBase {
  type: 'Relic';
}
export interface Spell extends CardBase {
  type: 'Spell';
}
export type Card = Gem | Relic | Spell;

export type BreachSymbol = 'o' | '↑' | '↓' | '←' | '→' | 'x';

export interface MageBreaches {
  /** 破孔タイル 1〜4 の状態 */
  tiles: [BreachSymbol, BreachSymbol, BreachSymbol, BreachSymbol];
}

export interface MageUniqueBreach {
  number: number;
  effect?: string;
}

export interface MageUniqueCard {
  name: string;
  type: CardType;
  effect: string;
}

export interface MageInitialPile {
  unique: number;
  crystal: number;
  spark: number;
}

export interface MageSkill {
  name: string;
  timing?: string;
  effect: string;
  charge?: number;
}

export interface Mage {
  id: string;
  expansionId: string;
  name: string;
  job: string;
  level?: number;
  /** 破孔タイル 1-4 (o/↑/↓/←/→/x) */
  breaches?: MageBreaches;
  /** 固有破孔 (持っている場合) */
  uniqueBreach?: MageUniqueBreach;
  /** 固有カード */
  uniqueCard?: MageUniqueCard;
  /** 初期手札の構成 */
  hand?: MageInitialPile;
  /** 初期デッキの構成 */
  deck?: MageInitialPile;
  /** 固有スキル */
  skill?: MageSkill;
  /** キャラクター固有ルール */
  rule?: string;
}

export interface NemesisSpecificCard {
  id: string;
  nemesisId: string;
  /** 自由記述ラベル。図鑑では同じ placement のカードをグルーピングして表示する */
  placement: string;
  /** ネメシスデッキのカードは 1-3、ストライク等の階層を持たないカードは未指定 */
  tier?: number;
  name: string;
  /** アタック/ミニオン/パワー でない (ストライク 等) カードは未指定 */
  type?: NemesisCardType;
  /** ミニオンの体力 (Minion のみ)。可変の場合は '*' */
  life?: number | '*';
  /** ミニオンのシールド (Minion のみ、保有する場合) */
  shield?: number;
  effect: string;
}

export interface Nemesis {
  id: string;
  expansionId: string;
  name: string;
  level?: number;
  battle: number;
  rule: string;
  /** ネメシス固有カード (基本デッキの共有カードと別管理) */
  cards: NemesisSpecificCard[];
}

export type NemesisCardType = 'Attack' | 'Minion' | 'Power';

export const NEMESIS_CARD_TYPE_LABEL: Record<NemesisCardType, string> = {
  Attack: 'アタック',
  Minion: 'ミニオン',
  Power: 'パワー',
};

export type NemesisCardCategory = 'Basic' | 'Advanced';

export const NEMESIS_CARD_CATEGORY_LABEL: Record<NemesisCardCategory, string> = {
  Basic: '基本カード',
  Advanced: '上級基本カード',
};

export interface NemesisCard {
  id: string;
  expansionId: string;
  category: NemesisCardCategory;
  tier: number;
  name: string;
  type: NemesisCardType;
  /** ミニオンの体力 (Minion のみ) */
  life?: number;
  /** ミニオンのシールド (Minion のみ、保有する場合) */
  shield?: number;
  effect: string;
}

export type PackageType = 'main' | 'sub';

export interface Expansion {
  id: string;
  name: string;
  badge?: string;
  /** 統合スプレッドシートの season タブから派生。プロモなど未割当は undefined */
  season?: number;
  /** シーズン内での役割。main = 大箱 (基本カードを十分に含む)、sub = 小箱 */
  type?: PackageType;
  /** パッケージのテーマカラー (hex 例: '#D0C277') */
  theme?: string;
  cards: Card[];
  mages: Mage[];
  nemeses: Nemesis[];
  nemesisCards: NemesisCard[];
}

export interface SetupSlot {
  type: CardType;
  /** 下限コスト (含む)。省略で下限なし */
  minCost?: number;
  /** 上限コスト (含む)。省略で上限なし */
  maxCost?: number;
}

export interface SupplySetup {
  name: string;
  slots: SetupSlot[];
}

export interface RandomizerOptions {
  setup: SupplySetup;
  mustUseCardIds: ReadonlySet<string>;
}

export interface MarketSupply {
  gems: Gem[];
  relics: Relic[];
  spells: Spell[];
}

export const MARKET_COMPOSITION = { Gem: 3, Relic: 2, Spell: 4 } as const;
