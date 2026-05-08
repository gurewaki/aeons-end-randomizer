import type { Card, Gem, Relic, Spell } from '../lib/types';

const gem = (id: string, name: string, cost: number): Gem => ({
  id: `fx:${id}`,
  expansionId: 'fx',
  name,
  type: 'Gem',
  cost,
});

const relic = (id: string, name: string, cost: number): Relic => ({
  id: `fx:${id}`,
  expansionId: 'fx',
  name,
  type: 'Relic',
  cost,
});

const spell = (id: string, name: string, cost: number): Spell => ({
  id: `fx:${id}`,
  expansionId: 'fx',
  name,
  type: 'Spell',
  cost,
});

export const fxGems: Gem[] = [
  gem('g1', '宝石A', 2),
  gem('g2', '宝石B', 3),
  gem('g3', '宝石C', 3),
  gem('g4', '宝石D', 4),
  gem('g5', '宝石E', 5),
];

export const fxRelics: Relic[] = [
  relic('r1', '遺物A', 3),
  relic('r2', '遺物B', 4),
  relic('r3', '遺物C', 5),
];

export const fxSpells: Spell[] = [
  spell('s1', '呪文A', 0),
  spell('s2', '呪文B', 2),
  spell('s3', '呪文C', 3),
  spell('s4', '呪文D', 4),
  spell('s5', '呪文E', 5),
];

export const fxPool: Card[] = [...fxGems, ...fxRelics, ...fxSpells];

export const poolWithoutLowCostGem: Card[] = [
  gem('hi1', '宝石X', 4),
  gem('hi2', '宝石Y', 4),
  gem('hi3', '宝石Z', 5),
  ...fxRelics,
  ...fxSpells,
];

export const fxPoolWithDuplicateNames: Card[] = [
  ...fxGems,
  gem('dup1', '宝石A', 2),
  gem('dup2', '宝石A', 2),
  ...fxRelics,
  ...fxSpells,
];
