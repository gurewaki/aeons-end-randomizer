import { describe, it, expect } from 'vitest';
import {
  buildNemesisDeck,
  currentTier,
  drawTop,
  totalRemaining,
} from '../lib/randomizer/generateNemesisDeck';
import {
  InsufficientNemesisBasicError,
  NemesisBasicSourceNotSelectedError,
  NemesisBossNotSelectedError,
} from '../lib/randomizer/errors';
import type {
  Expansion,
  Nemesis,
  NemesisCard,
  NemesisDeckSetup,
  NemesisSpecificCard,
  NemesisTier,
} from '../lib/types';

function basic(
  id: string,
  expansionId: string,
  tier: NemesisTier,
  type: 'Attack' | 'Minion' | 'Power' = 'Attack',
): NemesisCard {
  return {
    id,
    expansionId,
    category: 'Basic',
    tier,
    name: `Basic-${id}`,
    type,
    effect: '',
  };
}

function makeExpansion(id: string, cards: NemesisCard[]): Expansion {
  return {
    id,
    name: `Exp ${id}`,
    englishName: `Exp${id}`,
    cards: [],
    mages: [],
    nemeses: [],
    nemesisCards: cards,
    treasures: [],
  };
}

function specific(
  id: string,
  bossId: string,
  tier: NemesisTier | undefined,
  type: 'Attack' | 'Minion' | 'Power' | 'none' = 'Attack',
  placement: string = 'ネメシスデッキ',
): NemesisSpecificCard {
  return {
    id,
    nemesisId: bossId,
    placement,
    tier,
    name: `Spec-${id}`,
    type: type === 'none' ? undefined : type,
    effect: '',
  };
}

function makeBoss(id: string, cards: NemesisSpecificCard[]): Nemesis {
  return {
    id,
    expansionId: 'exp-boss',
    name: `Boss ${id}`,
    battle: 1,
    rule: '',
    cards,
  };
}

function expansionWithAllTiers(id: string, perTier: number): Expansion {
  const cards: NemesisCard[] = [];
  for (const tier of [1, 2, 3] as const) {
    for (let i = 0; i < perTier; i++) {
      cards.push(basic(`${id}-t${tier}-${i}`, id, tier));
    }
  }
  return makeExpansion(id, cards);
}

const baseSetup = (bossId: string, expId: string): NemesisDeckSetup => ({
  bossId,
  basicSourceExpansionByTier: { 1: expId, 2: expId, 3: expId },
  playerCount: 4,
});

describe('buildNemesisDeck', () => {
  it('Basic 枚数公式 (4人=8/7/7) + specific 加算で総枚数が一致', () => {
    const exp = expansionWithAllTiers('e1', 10); // 各 tier 10 枚 Basic
    const boss = makeBoss('boss1', [
      specific('s1', 'boss1', 1),
      specific('s2', 'boss1', 1),
      specific('s3', 'boss1', 2),
    ]);
    const state = buildNemesisDeck({
      setup: baseSetup('boss1', 'e1'),
      bossesById: new Map([['boss1', boss]]),
      expansionsById: new Map([['e1', exp]]),
    });
    // tier1 = Basic 8 + Specific 2 = 10
    // tier2 = Basic 7 + Specific 1 = 8
    // tier3 = Basic 7 + Specific 0 = 7
    expect(state.piles[0].cards).toHaveLength(10);
    expect(state.piles[1].cards).toHaveLength(8);
    expect(state.piles[2].cards).toHaveLength(7);
    expect(state.piles[0].tier).toBe(1);
    expect(state.piles[2].tier).toBe(3);
  });

  it('プレイヤー人数で枚数が変わる (1 人 = 1/3/7)', () => {
    const exp = expansionWithAllTiers('e1', 10);
    const boss = makeBoss('boss1', []);
    const state = buildNemesisDeck({
      setup: { ...baseSetup('boss1', 'e1'), playerCount: 1 },
      bossesById: new Map([['boss1', boss]]),
      expansionsById: new Map([['e1', exp]]),
    });
    expect(state.piles[0].cards).toHaveLength(1);
    expect(state.piles[1].cards).toHaveLength(3);
    expect(state.piles[2].cards).toHaveLength(7);
  });

  it('specific が placement="ネメシスデッキ" 以外 (世界を飲み込む者など) はデッキから除外', () => {
    const exp = expansionWithAllTiers('e1', 10);
    const boss = makeBoss('boss1', [
      specific('valid', 'boss1', 1, 'Attack'),
      // 別 placement (ボス特殊ミニオン等) → 除外
      specific('special', 'boss1', 1, 'Minion', '世界を飲み込む者'),
      specific('curse', 'boss1', 2, 'Power', '呪い'),
    ]);
    const state = buildNemesisDeck({
      setup: baseSetup('boss1', 'e1'),
      bossesById: new Map([['boss1', boss]]),
      expansionsById: new Map([['e1', exp]]),
    });
    // tier1: Basic 8 + valid 1 = 9 枚 (special は除外)
    expect(state.piles[0].cards).toHaveLength(9);
    // tier2: Basic 7 + 0 (curse は除外)
    expect(state.piles[1].cards).toHaveLength(7);
    const allSpecIds = state.piles.flatMap((p) =>
      p.cards.filter((c) => c.source === 'specific').map((c) => c.card.id),
    );
    expect(allSpecIds).toEqual(['valid']);
  });

  it('specific の tier 未設定 / type 未設定はデッキから除外', () => {
    const exp = expansionWithAllTiers('e1', 10);
    const boss = makeBoss('boss1', [
      specific('valid', 'boss1', 1, 'Attack'),
      // tier 未設定 → 除外
      specific('no-tier', 'boss1', undefined, 'Attack'),
      // type 未設定 → 除外 (ストライク等)
      specific('no-type', 'boss1', 1, 'none'),
    ]);
    const state = buildNemesisDeck({
      setup: baseSetup('boss1', 'e1'),
      bossesById: new Map([['boss1', boss]]),
      expansionsById: new Map([['e1', exp]]),
    });
    // tier1: Basic 8 + valid 1 = 9 枚 (除外 2 枚)
    expect(state.piles[0].cards).toHaveLength(9);
    const specCards = state.piles[0].cards.filter(
      (c) => c.source === 'specific',
    );
    expect(specCards).toHaveLength(1);
    expect(specCards[0].card.id).toBe('valid');
  });

  it('tier ごとに別の拡張を指定できる', () => {
    const e1 = expansionWithAllTiers('e1', 10);
    const e2 = expansionWithAllTiers('e2', 10);
    const e3 = expansionWithAllTiers('e3', 10);
    const boss = makeBoss('boss1', []);
    const state = buildNemesisDeck({
      setup: {
        bossId: 'boss1',
        basicSourceExpansionByTier: { 1: 'e1', 2: 'e2', 3: 'e3' },
        playerCount: 4,
      },
      bossesById: new Map([['boss1', boss]]),
      expansionsById: new Map([
        ['e1', e1],
        ['e2', e2],
        ['e3', e3],
      ]),
    });
    for (const c of state.piles[0].cards) {
      expect(c.card.expansionId).toBe('e1');
    }
    for (const c of state.piles[1].cards) {
      expect(c.card.expansionId).toBe('e2');
    }
    for (const c of state.piles[2].cards) {
      expect(c.card.expansionId).toBe('e3');
    }
  });

  it('Basic が不足すると InsufficientNemesisBasicError', () => {
    // tier1 = 8 必要なのに 5 枚しか無い拡張
    const cards: NemesisCard[] = [];
    for (let i = 0; i < 5; i++) cards.push(basic(`t1-${i}`, 'e1', 1));
    for (let i = 0; i < 7; i++) cards.push(basic(`t2-${i}`, 'e1', 2));
    for (let i = 0; i < 7; i++) cards.push(basic(`t3-${i}`, 'e1', 3));
    const exp = makeExpansion('e1', cards);
    expect(() =>
      buildNemesisDeck({
        setup: baseSetup('boss1', 'e1'),
        bossesById: new Map([['boss1', makeBoss('boss1', [])]]),
        expansionsById: new Map([['e1', exp]]),
      }),
    ).toThrow(InsufficientNemesisBasicError);
  });

  it('未登録の bossId は NemesisBossNotSelectedError', () => {
    const exp = expansionWithAllTiers('e1', 10);
    expect(() =>
      buildNemesisDeck({
        setup: baseSetup('missing', 'e1'),
        bossesById: new Map(),
        expansionsById: new Map([['e1', exp]]),
      }),
    ).toThrow(NemesisBossNotSelectedError);
  });

  it('tier 拡張未選択は NemesisBasicSourceNotSelectedError', () => {
    const exp = expansionWithAllTiers('e1', 10);
    expect(() =>
      buildNemesisDeck({
        setup: {
          bossId: 'boss1',
          basicSourceExpansionByTier: { 1: 'e1', 2: '', 3: 'e1' },
          playerCount: 4,
        },
        bossesById: new Map([['boss1', makeBoss('boss1', [])]]),
        expansionsById: new Map([['e1', exp]]),
      }),
    ).toThrow(NemesisBasicSourceNotSelectedError);
  });
});

describe('drawTop', () => {
  function setupSmallDeck() {
    const exp = expansionWithAllTiers('e1', 10);
    const boss = makeBoss('boss1', []);
    return buildNemesisDeck({
      setup: { ...baseSetup('boss1', 'e1'), playerCount: 1 }, // 1/3/7
      bossesById: new Map([['boss1', boss]]),
      expansionsById: new Map([['e1', exp]]),
    });
  }

  it('現 tier の一番上を引いて履歴に追加', () => {
    let s = setupSmallDeck();
    const before = s.piles[0].cards.length;
    const top = s.piles[0].cards[0];
    const { state: after, drawn } = drawTop(s);
    expect(drawn).not.toBeNull();
    expect(drawn!.tier).toBe(1);
    expect(drawn!.card).toEqual(top);
    expect(after.piles[0].cards.length).toBe(before - 1);
    expect(after.drawHistory).toHaveLength(1);
  });

  it('tier1 が空になった次の引きで tier2 から引く (自動進行)', () => {
    let s = setupSmallDeck();
    // tier1 は 1 枚なので 1 回引くと空
    const r1 = drawTop(s);
    s = r1.state;
    expect(r1.drawn!.tier).toBe(1);
    expect(currentTier(s)).toBe(2);

    const r2 = drawTop(s);
    expect(r2.drawn!.tier).toBe(2);
  });

  it('全 tier 空なら drawn が null', () => {
    let s = setupSmallDeck();
    // 1 + 3 + 7 = 11 回引いて全部空に
    for (let i = 0; i < 11; i++) {
      const r = drawTop(s);
      expect(r.drawn).not.toBeNull();
      s = r.state;
    }
    expect(currentTier(s)).toBeNull();
    const { drawn } = drawTop(s);
    expect(drawn).toBeNull();
  });

  it('totalRemaining は履歴と残量の合計を維持', () => {
    let s = setupSmallDeck();
    const { total: t0, remaining: r0 } = totalRemaining(s);
    expect(t0).toBe(11);
    expect(r0).toBe(11);

    for (let i = 0; i < 5; i++) s = drawTop(s).state;
    const { total: t5, remaining: r5 } = totalRemaining(s);
    expect(t5).toBe(11);
    expect(r5).toBe(6);
  });
});
