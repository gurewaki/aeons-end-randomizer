import type { CardType } from '../types';
import { LOW_COST_GEM_THRESHOLD, MARKET_COMPOSITION } from '../types';

export type InsufficientPoolKind = CardType | 'LowCostGem';

const KIND_LABEL: Record<InsufficientPoolKind, string> = {
  Gem: '宝石',
  Relic: '遺物',
  Spell: '呪文',
  LowCostGem: `コスト ${LOW_COST_GEM_THRESHOLD} 以下の宝石`,
};

const TYPE_LABEL: Record<CardType, string> = {
  Gem: '宝石',
  Relic: '遺物',
  Spell: '呪文',
};

export class InsufficientPoolError extends Error {
  constructor(
    public readonly kind: InsufficientPoolKind,
    public readonly required: number,
    public readonly available: number,
  ) {
    super(
      `カードプールが不足しています: ${KIND_LABEL[kind]} 必要 ${required} / 利用可能 ${available}`,
    );
    this.name = 'InsufficientPoolError';
  }
}

export class TooManyMustUseError extends Error {
  constructor(
    public readonly type: CardType,
    public readonly count: number,
  ) {
    super(
      `「必ず使用」のカードが${TYPE_LABEL[type]}スロット数 (${MARKET_COMPOSITION[type]}) を超えています: ${count} 枚`,
    );
    this.name = 'TooManyMustUseError';
  }
}
