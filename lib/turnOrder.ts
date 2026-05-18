/**
 * ターン順カードシャッフラのデータモデルとロジック。
 */
import { shuffle } from './randomizer/shuffle';

export type PlayerValue = 1 | 2 | 3 | 4;
export type CardKind = 'player' | 'nemesis' | 'doom' | 'wild' | 'pair';

export interface TurnOrderCard {
  /** React key 用の一意 ID */
  id: string;
  kind: CardKind;
  /** player カードの数字 (1-4) */
  value?: PlayerValue;
  /** pair カードの 2 つの値 (上半分, 下半分) */
  pairValues?: [PlayerValue, PlayerValue];
  /** ワイルド / ペア 公開時に確定したプレイヤー番号を記録 (捨て札表示用) */
  revealedAs?: PlayerValue;
}

export interface TurnOrderSettings {
  /** プレイヤーに割り当てる値の集合 (2〜4 要素) */
  playerValues: PlayerValue[];
  /** ネメシス2枚目を急襲カードに置き換えるか */
  useDoomCard: boolean;
  /** 探索行モード。4 人 (playerValues.length === 4) のときだけ
   *  ペアカード (1/2, 1/2, 3/4, 3/4, N, N) 構成になる。それ以外の人数では効果なし。 */
  expeditionMode: boolean;
}

export interface TurnOrderState {
  /** 山札。インデックス 0 が一番上 */
  deck: TurnOrderCard[];
  /** 捨て札。インデックス 0 が直近に捨てた (一番上) */
  discard: TurnOrderCard[];
  settings: TurnOrderSettings;
  /** ペアカードで使われたプレイヤー値の追跡。キー: "1-2" や "3-4"、
   *  値: 最初に選ばれたプレイヤー番号。シャッフルでリセット。 */
  pairChoices: Record<string, PlayerValue>;
}

export const DEFAULT_SETTINGS: TurnOrderSettings = {
  playerValues: [1, 2, 3, 4],
  useDoomCard: false,
  expeditionMode: false,
};

/** ペアカードのキー生成 (常に小さい順に連結) */
export function pairKey(values: [PlayerValue, PlayerValue]): string {
  const [a, b] = [...values].sort((x, y) => x - y);
  return `${a}-${b}`;
}

/**
 * 設定からカードのリストを生成。
 * - playerValues が 2 個 → 各値 2 枚ずつ計 4 枚 (2 人プレイ)
 * - playerValues が 3 個 → 各値 1 枚 + ワイルド 1 枚 (3 人プレイ)
 * - playerValues が 4 個 → 各値 1 枚 (4 人プレイ)
 * - 加えてネメシスカード 2 枚 (useDoomCard=true なら 2 枚目が doom)
 */
export function buildCards(settings: TurnOrderSettings): TurnOrderCard[] {
  const cards: TurnOrderCard[] = [];
  const { playerValues, expeditionMode } = settings;

  if (expeditionMode && playerValues.length === 4) {
    // 探索行モード 4 人: 1/2 × 2, 3/4 × 2 (固定ペア)
    const pair1: [PlayerValue, PlayerValue] = [1, 2];
    const pair2: [PlayerValue, PlayerValue] = [3, 4];
    cards.push({ id: 'pair-12-a', kind: 'pair', pairValues: pair1 });
    cards.push({ id: 'pair-12-b', kind: 'pair', pairValues: pair1 });
    cards.push({ id: 'pair-34-a', kind: 'pair', pairValues: pair2 });
    cards.push({ id: 'pair-34-b', kind: 'pair', pairValues: pair2 });
  } else if (playerValues.length === 2) {
    for (const v of playerValues) {
      cards.push({ id: `p-${v}-a`, kind: 'player', value: v });
      cards.push({ id: `p-${v}-b`, kind: 'player', value: v });
    }
  } else if (playerValues.length === 3) {
    for (const v of playerValues) {
      cards.push({ id: `p-${v}`, kind: 'player', value: v });
    }
    cards.push({ id: 'wild', kind: 'wild' });
  } else if (playerValues.length === 4) {
    for (const v of playerValues) {
      cards.push({ id: `p-${v}`, kind: 'player', value: v });
    }
  } else {
    throw new Error(`playerValues は 2〜4 要素 (received: ${playerValues.length})`);
  }

  cards.push({ id: 'nemesis-1', kind: 'nemesis' });
  cards.push({
    id: 'nemesis-2',
    kind: settings.useDoomCard ? 'doom' : 'nemesis',
  });

  return cards;
}

/**
 * 新規ゲーム用の初期 state を作る (シャッフル済み)。
 */
export function buildInitialState(settings: TurnOrderSettings): TurnOrderState {
  return {
    deck: shuffle(buildCards(settings)),
    discard: [],
    settings,
    pairChoices: {},
  };
}

/**
 * 山が空のときに自動でシャッフルする補助。捨て札全部を deck に戻してシャッフル。
 * シャッフルに伴い revealedAs / pairChoices もリセットされる。
 */
export function reshuffleFromDiscard(state: TurnOrderState): TurnOrderState {
  if (state.deck.length > 0) return state;
  const restored = state.discard.map((c) => ({ ...c, revealedAs: undefined }));
  return { ...state, deck: shuffle(restored), discard: [], pairChoices: {} };
}
