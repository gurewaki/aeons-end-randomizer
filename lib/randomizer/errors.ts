import type { CardType } from '../types';

export type InsufficientPoolKind = CardType | 'Cost3Gem';

const KIND_LABEL: Record<InsufficientPoolKind, string> = {
  Gem: '宝石',
  Relic: '遺物',
  Spell: '呪文',
  Cost3Gem: 'コスト 3 の宝石',
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
