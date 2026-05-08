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

export interface Mage {
  id: string;
  expansionId: string;
  name: string;
}

export interface Nemesis {
  id: string;
  expansionId: string;
  name: string;
}

export interface Expansion {
  id: string;
  name: string;
  cards: Card[];
  mages: Mage[];
  nemeses: Nemesis[];
}

export interface RandomizerOptions {
  requireLowCostGem: boolean;
}

export const LOW_COST_GEM_THRESHOLD = 3;

export interface MarketSupply {
  gems: Gem[];
  relics: Relic[];
  spells: Spell[];
}

export const MARKET_COMPOSITION = { Gem: 3, Relic: 2, Spell: 4 } as const;
