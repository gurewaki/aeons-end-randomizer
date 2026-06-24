import type {
  Expansion,
  Nemesis,
  NemesisCard,
  NemesisDeckCard,
  NemesisDeckDraw,
  NemesisDeckPile,
  NemesisDeckSetup,
  NemesisDeckState,
  NemesisSpecificCard,
  NemesisTier,
} from '../types';
import { NEMESIS_BASIC_COUNT_BY_PLAYER, NEMESIS_TIERS } from '../types';
import { shuffle } from './shuffle';
import {
  InsufficientNemesisBasicError,
  NemesisBasicSourceNotSelectedError,
  NemesisBossNotSelectedError,
} from './errors';

function isValidTier(t: number | undefined): t is NemesisTier {
  return t === 1 || t === 2 || t === 3;
}

/**
 * ボス specific カードの placement 値。これに一致するものだけが
 * 通常のネメシスデッキに加わる本則カード。
 * 他の placement (例: ストライク, 世界を飲み込む者, 呪い, 堕落カード, 錬成 など)
 * は別山・トークン・プレイヤー用などの特殊カードなのでデッキには入れない。
 */
const NEMESIS_DECK_PLACEMENT = 'ネメシスデッキ';

function basicForTier(expansion: Expansion, tier: NemesisTier): NemesisCard[] {
  return expansion.nemesisCards.filter(
    (c) => c.category === 'Basic' && c.tier === tier,
  );
}

/** ボス固有カードのうち、「ネメシスデッキ」placement + tier + 攻撃/ミニオン/パワー のものを tier 別に振り分け */
function specificByTier(
  boss: Nemesis,
): Record<NemesisTier, NemesisSpecificCard[]> {
  const out: Record<NemesisTier, NemesisSpecificCard[]> = { 1: [], 2: [], 3: [] };
  for (const c of boss.cards) {
    if (c.placement !== NEMESIS_DECK_PLACEMENT) continue;
    if (!isValidTier(c.tier)) continue;
    if (c.type !== 'Attack' && c.type !== 'Minion' && c.type !== 'Power') continue;
    out[c.tier].push(c);
  }
  return out;
}

export interface BuildNemesisDeckInput {
  setup: NemesisDeckSetup;
  /** ボス検索用 */
  bossesById: ReadonlyMap<string, Nemesis>;
  /** Basic カード供給拡張検索用 */
  expansionsById: ReadonlyMap<string, Expansion>;
}

/**
 * セットアップから 3 tier 分のネメシスデッキを構築する。
 *
 * - tier ごとの枚数 = Basic 枚数 (公式) + Specific 枚数 (全部加算)
 * - Basic は選んだ拡張の category=Basic + tier 一致のもの
 * - Specific はボスの cards のうち tier 設定あり + type が攻撃/ミニオン/パワー
 * - 各 tier 内で Basic + Specific を 1 山にシャッフル
 */
export function buildNemesisDeck(input: BuildNemesisDeckInput): NemesisDeckState {
  const { setup, bossesById, expansionsById } = input;

  const boss = bossesById.get(setup.bossId);
  if (!boss) throw new NemesisBossNotSelectedError();

  const basicCounts = NEMESIS_BASIC_COUNT_BY_PLAYER[setup.playerCount];
  const specificByT = specificByTier(boss);

  const piles = NEMESIS_TIERS.map((tier): NemesisDeckPile => {
    const expansionId = setup.basicSourceExpansionByTier[tier];
    if (!expansionId) throw new NemesisBasicSourceNotSelectedError(tier);
    const expansion = expansionsById.get(expansionId);
    if (!expansion) throw new NemesisBasicSourceNotSelectedError(tier);

    const basicPool = basicForTier(expansion, tier);
    const required = basicCounts[tier];
    if (basicPool.length < required) {
      throw new InsufficientNemesisBasicError(
        tier,
        required,
        basicPool.length,
      );
    }
    const basics = shuffle(basicPool).slice(0, required);

    const deckCards: NemesisDeckCard[] = [
      ...basics.map((c): NemesisDeckCard => ({ source: 'basic', card: c })),
      ...specificByT[tier].map(
        (c): NemesisDeckCard => ({ source: 'specific', card: c }),
      ),
    ];
    return { tier, cards: shuffle(deckCards) };
  }) as [NemesisDeckPile, NemesisDeckPile, NemesisDeckPile];

  return {
    setup,
    piles,
    drawHistory: [],
  };
}

/**
 * 現在の tier から 1 枚引く。現 tier が空なら次 tier に自動進行して引く。
 * 全 tier 空なら null を返す。
 */
export function drawTop(state: NemesisDeckState): {
  state: NemesisDeckState;
  drawn: NemesisDeckDraw | null;
} {
  for (let i = 0; i < state.piles.length; i++) {
    const pile = state.piles[i];
    if (pile.cards.length === 0) continue;
    const [top, ...rest] = pile.cards;
    const newPile: NemesisDeckPile = { tier: pile.tier, cards: rest };
    const piles = state.piles.map((p, idx) =>
      idx === i ? newPile : p,
    ) as unknown as NemesisDeckState['piles'];
    const drawn: NemesisDeckDraw = { tier: pile.tier, card: top };
    return {
      state: {
        ...state,
        piles,
        drawHistory: [...state.drawHistory, drawn],
      },
      drawn,
    };
  }
  return { state, drawn: null };
}

/** 現 tier (最初に cards.length > 0 のもの) を返す。全部空なら null */
export function currentTier(state: NemesisDeckState): NemesisTier | null {
  for (const p of state.piles) {
    if (p.cards.length > 0) return p.tier;
  }
  return null;
}

/** 全 tier 合算の残量と総枚数 */
export function totalRemaining(state: NemesisDeckState): {
  remaining: number;
  total: number;
} {
  const remaining = state.piles.reduce((acc, p) => acc + p.cards.length, 0);
  const total = remaining + state.drawHistory.length;
  return { remaining, total };
}
