export type CardType = 'Gem' | 'Relic' | 'Spell';

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  Gem: '宝石',
  Relic: '遺物',
  Spell: '呪文',
};

interface CardBase {
  /** 内部ユニーク ID (`${expansionId}:card:${name}`) */
  id: string;
  expansionId: string;
  /** パッケージ内のカード番号 (シートの `id` 列由来)。共有 URL の短縮に使う */
  no: number;
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

export interface MageSpecificCard {
  id: string;
  mageId: string;
  /** 自由記述ラベル (例: 「錬成」)。詳細表示で同じ placement のカードをグルーピングする */
  placement: string;
  name: string;
  /** 宝石/遺物/呪文。カードでない場合は未指定 */
  type?: CardType;
  effect: string;
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
  /** 固有カード (初期手札・デッキの unique カウントが指すカード) */
  uniqueCard?: MageUniqueCard;
  /** 初期手札の構成 */
  hand?: MageInitialPile;
  /** 初期デッキの構成 */
  deck?: MageInitialPile;
  /** 固有スキル */
  skill?: MageSkill;
  /** キャラクター固有ルール */
  rule?: string;
  /** 初期手札・デッキ以外の固有カード (錬成の山 等) */
  cards: MageSpecificCard[];
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
  /** type の副ラベル (例: 「ミニオン：ネメシス」の「ネメシス」) */
  typeNote?: string;
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
  /** 体力 */
  life?: number;
  /** 暴走効果 */
  unleash?: string;
  /** 追加ルール */
  additionalRules?: string;
  /** ゲーム準備 */
  setup?: string;
  /** 難化ルール */
  increasedDifficulty?: string;
  /** 探索行モードでのバトル数 */
  battle: number;
  /** 探索行モードでの選択時に表示するルール */
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

export type TreasureLevel = 1 | 2 | 3;

export interface Treasure {
  id: string;
  expansionId: string;
  level: TreasureLevel;
  name: string;
  /** レベル1 のみ。プレイヤーカードと同じく宝石/遺物/呪文 のいずれか */
  type?: CardType;
  effect: string;
}

export type PackageType = 'main' | 'sub';

export interface Expansion {
  id: string;
  name: string;
  /** 英語名 (空白を除いたものを URL slug として使う) */
  englishName: string;
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
  treasures: Treasure[];
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

export interface SupplyPlacement {
  slot: SetupSlot;
  card: Card;
}

/**
 * generateMarket の返り値。再抽選するために setup スロット情報と
 * 生成時プール (dedup 後) を保持する。
 */
export interface GeneratedSupply {
  market: MarketSupply;
  /** setup.slots と同じ順序の配置情報 (各スロットに 1 枚) */
  placements: SupplyPlacement[];
  /** 生成時の dedup 済みプール。再抽選で同じプールから引くために凍結 */
  poolSnapshot: readonly Card[];
  /** 生成時の必ず使用 ID。再抽選時に常に除外する */
  mustUseIds: ReadonlySet<string>;
  setup: SupplySetup;
}

export const MARKET_COMPOSITION = { Gem: 3, Relic: 2, Spell: 4 } as const;

// --- Nemesis deck (ターン順+ネメシストライアル機能) -------------------------

/** ネメシスデッキの階層 (1 が最上位) */
export type NemesisTier = 1 | 2 | 3;

/** デッキ内に入りうるカード。基本/上級基本 (NemesisCard) と ボス固有 (NemesisSpecificCard) を統合 */
export type NemesisDeckCard =
  | { source: 'basic'; card: NemesisCard }
  | { source: 'specific'; card: NemesisSpecificCard };

/** プレイヤー人数 (turn-order の playerValues.length と一致) */
export type NemesisPlayerCount = 1 | 2 | 3 | 4;

export interface NemesisDeckSetup {
  bossId: string;
  /** tier (1|2|3) → Basic カード供給拡張 id (択一) */
  basicSourceExpansionByTier: Record<NemesisTier, string>;
  playerCount: NemesisPlayerCount;
}

export interface NemesisDeckPile {
  tier: NemesisTier;
  /** 山札の一番上が index 0 */
  cards: ReadonlyArray<NemesisDeckCard>;
}

export interface NemesisDeckDraw {
  tier: NemesisTier;
  card: NemesisDeckCard;
}

export interface NemesisDeckState {
  setup: NemesisDeckSetup;
  /** tier1, tier2, tier3 の順 */
  piles: readonly [NemesisDeckPile, NemesisDeckPile, NemesisDeckPile];
  /** ドロー履歴 (最新が末尾) */
  drawHistory: readonly NemesisDeckDraw[];
}

/**
 * Basic カード枚数公式 (Aeons End 本則準拠 / プレイヤー人数 → tier 別 Basic 枚数)。
 * Specific カードはこの枚数に加算される。
 */
export const NEMESIS_BASIC_COUNT_BY_PLAYER: Record<
  NemesisPlayerCount,
  Record<NemesisTier, number>
> = {
  1: { 1: 1, 2: 3, 3: 7 },
  2: { 1: 3, 2: 5, 3: 7 },
  3: { 1: 5, 2: 6, 3: 7 },
  4: { 1: 8, 2: 7, 3: 7 },
};

export const NEMESIS_TIERS: readonly NemesisTier[] = [1, 2, 3] as const;
