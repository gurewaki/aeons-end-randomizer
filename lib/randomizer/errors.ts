import type { CardType, SetupSlot } from '../types';
import { MARKET_COMPOSITION } from '../types';

const TYPE_LABEL: Record<CardType, string> = {
  Gem: '宝石',
  Relic: '遺物',
  Spell: '呪文',
};

function formatSlotConstraint(slot: SetupSlot): string {
  const t = TYPE_LABEL[slot.type];
  if (slot.minCost !== undefined && slot.maxCost !== undefined) {
    if (slot.minCost === slot.maxCost) return `${t} (コスト ${slot.minCost})`;
    return `${t} (コスト ${slot.minCost}〜${slot.maxCost})`;
  }
  if (slot.minCost !== undefined) return `${t} (コスト ${slot.minCost} 以上)`;
  if (slot.maxCost !== undefined) return `${t} (コスト ${slot.maxCost} 以下)`;
  return `${t} (コスト不問)`;
}

export class TooManyMustUseError extends Error {
  constructor(
    public readonly type: CardType,
    public readonly count: number,
    public readonly slotCount: number,
  ) {
    super(
      `「必ず使用」のカードが${TYPE_LABEL[type]}スロット数 (${slotCount}) を超えています: ${count} 枚`,
    );
    this.name = 'TooManyMustUseError';
  }
}

export class MustUseCannotBePlacedError extends Error {
  constructor(public readonly cardName: string) {
    super(
      `「必ず使用」のカード「${cardName}」を選択中のセットアップのどのスロットにも配置できません`,
    );
    this.name = 'MustUseCannotBePlacedError';
  }
}

export class SlotCannotBeFilledError extends Error {
  constructor(
    public readonly slot: SetupSlot,
    public readonly slotIndex: number,
  ) {
    super(
      `スロット ${slotIndex + 1} (${formatSlotConstraint(slot)}) を満たすカードがプールにありません`,
    );
    this.name = 'SlotCannotBeFilledError';
  }
}

// 以下、サプライランダマイザ以外で使用しているエラー (互換のため維持)

export const PLAYER_COUNT_MIN = 1;
export const PLAYER_COUNT_MAX = 8;

export class InvalidPlayerCountError extends Error {
  constructor(public readonly count: number) {
    super(
      `プレイヤー人数は ${PLAYER_COUNT_MIN}〜${PLAYER_COUNT_MAX} の範囲で指定してください: ${count}`,
    );
    this.name = 'InvalidPlayerCountError';
  }
}

export class TooManyMustUseMagesError extends Error {
  constructor(
    public readonly mustCount: number,
    public readonly playerCount: number,
  ) {
    super(
      `「必ず使用」のメイジ (${mustCount} 人) がプレイヤー人数 (${playerCount} 人) を超えています`,
    );
    this.name = 'TooManyMustUseMagesError';
  }
}

export class InsufficientMagePoolError extends Error {
  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(
      `メイジプールが不足しています: 必要 ${required} / 利用可能 ${available}`,
    );
    this.name = 'InsufficientMagePoolError';
  }
}

export class NoMatchingNemesisError extends Error {
  constructor() {
    super('条件に該当するネメシスがいません。フィルタを緩めてください');
    this.name = 'NoMatchingNemesisError';
  }
}

export class NoEligibleSeasonError extends Error {
  constructor() {
    super(
      '抽選対象のシーズンがありません。各シーズンの大箱 (main パッケージ) を所有している必要があります',
    );
    this.name = 'NoEligibleSeasonError';
  }
}
