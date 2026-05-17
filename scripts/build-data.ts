import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'data', 'expansions');
const SEASONS_FILE = path.join(ROOT, 'data', 'seasons.yaml');
const SETUPS_FILE = path.join(ROOT, 'data', 'setups.yaml');
const OUT_FILE = path.join(ROOT, 'lib', 'data', 'expansions.generated.ts');
const SETUPS_OUT_FILE = path.join(ROOT, 'lib', 'data', 'setups.generated.ts');

type SeasonInfo = {
  season?: number;
  type?: 'main' | 'sub';
  theme?: string;
  badge?: string;
};

/**
 * seasons.yaml を読み込み、package 名 → SeasonInfo のマップに展開する。
 * YAML はシーズン単位のグループ構造 (theme と packages を持つ) で、
 * グループ単位の theme/season を配下の各 package に展開する。
 */
function loadSeasonsByPackage(): Map<string, SeasonInfo> {
  const text = readFileSync(SEASONS_FILE, 'utf8');
  const raw = yaml.load(text);
  if (!Array.isArray(raw)) {
    throw new Error(`${SEASONS_FILE}: トップレベルは配列`);
  }
  const map = new Map<string, SeasonInfo>();
  raw.forEach((group, gIdx) => {
    if (!group || typeof group !== 'object') {
      throw new Error(`${SEASONS_FILE}: [${gIdx}] はオブジェクト`);
    }
    const g = group as Record<string, unknown>;
    const season =
      g.season === undefined
        ? undefined
        : typeof g.season === 'number'
          ? g.season
          : (() => {
              throw new Error(`${SEASONS_FILE}: [${gIdx}].season は number か未指定`);
            })();
    if (g.theme !== undefined && typeof g.theme !== 'string') {
      throw new Error(`${SEASONS_FILE}: [${gIdx}].theme は string か未指定`);
    }
    const theme = g.theme as string | undefined;
    if (!Array.isArray(g.packages)) {
      throw new Error(`${SEASONS_FILE}: [${gIdx}].packages は配列`);
    }
    g.packages.forEach((p, pIdx) => {
      if (!p || typeof p !== 'object') {
        throw new Error(`${SEASONS_FILE}: [${gIdx}].packages[${pIdx}] はオブジェクト`);
      }
      const pp = p as Record<string, unknown>;
      if (typeof pp.name !== 'string') {
        throw new Error(`${SEASONS_FILE}: [${gIdx}].packages[${pIdx}].name`);
      }
      let type: 'main' | 'sub' | undefined;
      if (pp.type === undefined) {
        type = undefined;
      } else if (pp.type === 'main' || pp.type === 'sub') {
        type = pp.type;
      } else {
        throw new Error(
          `${SEASONS_FILE}: [${gIdx}].packages[${pIdx}].type は 'main' / 'sub' / 未指定`,
        );
      }
      if (pp.badge !== undefined && typeof pp.badge !== 'string') {
        throw new Error(
          `${SEASONS_FILE}: [${gIdx}].packages[${pIdx}].badge は string か未指定`,
        );
      }
      const badge = pp.badge as string | undefined;
      if (map.has(pp.name)) {
        throw new Error(`${SEASONS_FILE}: package "${pp.name}" が重複`);
      }
      map.set(pp.name, { season, type, theme, badge });
    });
  });
  return map;
}

type CardTypeEn = 'Gem' | 'Relic' | 'Spell';

// シート / YAML では日本語表記も受け付ける (内部は英語型に正規化)
const TYPE_TO_EN: Record<string, CardTypeEn> = {
  Gem: 'Gem',
  Relic: 'Relic',
  Spell: 'Spell',
  宝石: 'Gem',
  遺物: 'Relic',
  呪文: 'Spell',
};

function normalizeType(raw: unknown, ctx: string): CardTypeEn {
  if (typeof raw !== 'string' || !(raw in TYPE_TO_EN)) {
    throw new Error(
      `${ctx}: type は Gem/Relic/Spell または 宝石/遺物/呪文 のいずれか (受領: ${JSON.stringify(raw)})`,
    );
  }
  return TYPE_TO_EN[raw];
}

type RawCard = {
  name: string;
  type: CardTypeEn;
  cost: number;
  effect?: string;
  keywords?: string[];
};

type BreachSymbol = 'o' | '↑' | '↓' | '←' | '→' | 'x';

type RawMage = {
  name: string;
  job: string;
  level?: number;
  breaches?: { tiles: [BreachSymbol, BreachSymbol, BreachSymbol, BreachSymbol] };
  uniqueBreach?: { number: number; effect?: string };
  uniqueCard?: { name: string; type: CardTypeEn; effect: string };
  hand?: { unique: number; crystal: number; spark: number };
  deck?: { unique: number; crystal: number; spark: number };
  skill?: {
    name: string;
    timing?: string;
    effect: string;
    charge?: number;
  };
  rule?: string;
};

const VALID_BREACH = new Set(['o', '↑', '↓', '←', '→', 'x']);

type RawNemesisSpecificCard = {
  placement: string;
  tier?: number;
  name: string;
  type?: NemesisCardTypeEn;
  typeNote?: string;
  life?: number | '*';
  shield?: number;
  effect: string;
};

/**
 * 「ミニオン：ネメシス」のように type に「：」で副ラベルが付いた表記をパースする。
 * 単に「ミニオン」と書かれていれば副ラベルは undefined。
 */
function parseTypeWithNote(
  raw: unknown,
  ctx: string,
): { type: NemesisCardTypeEn | undefined; note: string | undefined } {
  if (raw === undefined || raw === null) return { type: undefined, note: undefined };
  if (typeof raw !== 'string') {
    throw new Error(`${ctx} は string か未指定 (受領: ${JSON.stringify(raw)})`);
  }
  const [base, ...rest] = raw.split('：');
  if (!(base in NEMESIS_TYPE_TO_EN)) {
    throw new Error(
      `${ctx}: type の基底は Attack/Minion/Power または アタック/ミニオン/パワー (受領: ${JSON.stringify(raw)})`,
    );
  }
  return {
    type: NEMESIS_TYPE_TO_EN[base],
    note: rest.length > 0 ? rest.join('：') : undefined,
  };
}

type RawNemesis = {
  name: string;
  level?: number;
  battle: number;
  rule: string;
  cards: RawNemesisSpecificCard[];
};

type NemesisCardTypeEn = 'Attack' | 'Minion' | 'Power';
type NemesisCardCategoryEn = 'Basic' | 'Advanced';

const NEMESIS_TYPE_TO_EN: Record<string, NemesisCardTypeEn> = {
  Attack: 'Attack',
  Minion: 'Minion',
  Power: 'Power',
  アタック: 'Attack',
  ミニオン: 'Minion',
  パワー: 'Power',
};
const NEMESIS_CATEGORY_TO_EN: Record<string, NemesisCardCategoryEn> = {
  Basic: 'Basic',
  Advanced: 'Advanced',
  基本カード: 'Basic',
  上級基本カード: 'Advanced',
};

function normalizeNemesisType(raw: unknown, ctx: string): NemesisCardTypeEn {
  if (typeof raw !== 'string' || !(raw in NEMESIS_TYPE_TO_EN)) {
    throw new Error(
      `${ctx}: type は Attack/Minion/Power または アタック/ミニオン/パワー (受領: ${JSON.stringify(raw)})`,
    );
  }
  return NEMESIS_TYPE_TO_EN[raw];
}
function normalizeNemesisCategory(raw: unknown, ctx: string): NemesisCardCategoryEn {
  if (typeof raw !== 'string' || !(raw in NEMESIS_CATEGORY_TO_EN)) {
    throw new Error(
      `${ctx}: category は Basic/Advanced または 基本カード/上級基本カード (受領: ${JSON.stringify(raw)})`,
    );
  }
  return NEMESIS_CATEGORY_TO_EN[raw];
}

type RawNemesisCard = {
  category: NemesisCardCategoryEn;
  tier: number;
  name: string;
  type: NemesisCardTypeEn;
  life?: number;
  shield?: number;
  effect: string;
};

type RawExpansion = {
  id: string;
  name: string;
  cards: RawCard[];
  mages: RawMage[];
  nemeses: RawNemesis[];
  nemesisCards: RawNemesisCard[];
};

function validateExpansion(raw: unknown, file: string): RawExpansion {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`${file}: ルートはオブジェクトである必要があります`);
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string') throw new Error(`${file}: id (string) が必要`);
  if (typeof r.name !== 'string') throw new Error(`${file}: name (string) が必要`);
  if (!Array.isArray(r.cards)) throw new Error(`${file}: cards (array) が必要`);

  const seenNames = new Set<string>();
  const cards: RawCard[] = r.cards.map((c, idx) => {
    if (!c || typeof c !== 'object') {
      throw new Error(`${file}: cards[${idx}] はオブジェクト`);
    }
    const card = c as Record<string, unknown>;
    if (typeof card.name !== 'string') throw new Error(`${file}: cards[${idx}].name (string)`);
    const cardType = normalizeType(card.type, `${file}: cards[${idx}].type`);
    if (typeof card.cost !== 'number' || !Number.isFinite(card.cost)) {
      throw new Error(`${file}: cards[${idx}].cost (number)`);
    }
    if (seenNames.has(card.name)) {
      throw new Error(`${file}: 拡張内で card name が重複: ${card.name}`);
    }
    seenNames.add(card.name);
    return {
      name: card.name,
      type: cardType,
      cost: card.cost,
      effect: typeof card.effect === 'string' ? card.effect : undefined,
      keywords: Array.isArray(card.keywords)
        ? card.keywords.filter((k): k is string => typeof k === 'string')
        : undefined,
    };
  });

  const mages = parseMages(r.mages, file);
  const nemeses = parseNemeses(r.nemeses, file);
  const nemesisCards = parseNemesisCards(r.nemesisCards, file);

  return {
    id: r.id,
    name: r.name,
    cards,
    mages,
    nemeses,
    nemesisCards,
  };
}

function parseMages(raw: unknown, file: string): RawMage[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error(`${file}: mages は配列`);
  const seen = new Set<string>();
  return raw.map((m, idx) => {
    const ctx = `${file}: mages[${idx}]`;
    if (!m || typeof m !== 'object') throw new Error(`${ctx} はオブジェクト`);
    const r = m as Record<string, unknown>;
    if (typeof r.name !== 'string') throw new Error(`${ctx}.name`);
    if (typeof r.job !== 'string') throw new Error(`${ctx}.job`);
    if (seen.has(r.name)) throw new Error(`${file}: mage name 重複: ${r.name}`);
    seen.add(r.name);

    const level = optNumber(r.level, `${ctx}.level`);
    const breaches = parseBreaches(r.breaches, `${ctx}.breaches`);
    const uniqueBreach = parseUniqueBreach(r.uniqueBreach, `${ctx}.uniqueBreach`);
    const uniqueCard = parseUniqueCard(r.uniqueCard, `${ctx}.uniqueCard`);
    const hand = parseInitialPile(r.hand, `${ctx}.hand`);
    const deck = parseInitialPile(r.deck, `${ctx}.deck`);
    const skill = parseSkill(r.skill, `${ctx}.skill`);
    const rule = optString(r.rule, `${ctx}.rule`);

    return {
      name: r.name,
      job: r.job,
      level,
      breaches,
      uniqueBreach,
      uniqueCard,
      hand,
      deck,
      skill,
      rule,
    };
  });
}

function optNumber(v: unknown, ctx: string): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`${ctx} は number か未指定`);
  }
  return v;
}
function optString(v: unknown, ctx: string): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw new Error(`${ctx} は string か未指定`);
  return v;
}
function reqNumber(v: unknown, ctx: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`${ctx} は number`);
  }
  return v;
}
function reqString(v: unknown, ctx: string): string {
  if (typeof v !== 'string') throw new Error(`${ctx} は string`);
  return v;
}
function normalizeBreach(v: unknown): BreachSymbol | null {
  if (v === '×' || v === 'x' || v === 'X') return 'x';
  if (v === 'o' || v === 'O' || v === '○' || v === '〇') return 'o';
  if (v === '↑' || v === '↓' || v === '←' || v === '→') return v;
  return null;
}

function parseBreaches(raw: unknown, ctx: string): RawMage['breaches'] {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw) || raw.length !== 4) {
    throw new Error(`${ctx} は長さ 4 の配列`);
  }
  const tiles: BreachSymbol[] = [];
  for (const v of raw) {
    const n = normalizeBreach(v);
    if (n === null) {
      throw new Error(`${ctx} の各要素は o/↑/↓/←/→/x のいずれか (受領: ${JSON.stringify(v)})`);
    }
    tiles.push(n);
  }
  return { tiles: tiles as [BreachSymbol, BreachSymbol, BreachSymbol, BreachSymbol] };
}
function parseUniqueBreach(raw: unknown, ctx: string): RawMage['uniqueBreach'] {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'object') throw new Error(`${ctx} はオブジェクト`);
  const r = raw as Record<string, unknown>;
  return {
    number: reqNumber(r.number, `${ctx}.number`),
    effect: optString(r.effect, `${ctx}.effect`),
  };
}
function parseUniqueCard(raw: unknown, ctx: string): RawMage['uniqueCard'] {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'object') throw new Error(`${ctx} はオブジェクト`);
  const r = raw as Record<string, unknown>;
  return {
    name: reqString(r.name, `${ctx}.name`),
    type: normalizeType(r.type, `${ctx}.type`),
    effect: reqString(r.effect, `${ctx}.effect`),
  };
}
function parseInitialPile(raw: unknown, ctx: string): RawMage['hand'] {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'object') throw new Error(`${ctx} はオブジェクト`);
  const r = raw as Record<string, unknown>;
  return {
    unique: reqNumber(r.unique, `${ctx}.unique`),
    crystal: reqNumber(r.crystal, `${ctx}.crystal`),
    spark: reqNumber(r.spark, `${ctx}.spark`),
  };
}
function parseSkill(raw: unknown, ctx: string): RawMage['skill'] {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'object') throw new Error(`${ctx} はオブジェクト`);
  const r = raw as Record<string, unknown>;
  return {
    name: reqString(r.name, `${ctx}.name`),
    timing: optString(r.timing, `${ctx}.timing`),
    effect: reqString(r.effect, `${ctx}.effect`),
    charge: optNumber(r.charge, `${ctx}.charge`),
  };
}

function parseNemesisCards(raw: unknown, file: string): RawNemesisCard[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error(`${file}: nemesisCards は配列`);
  const seen = new Set<string>();
  return raw.map((c, idx) => {
    const ctx = `${file}: nemesisCards[${idx}]`;
    if (!c || typeof c !== 'object') throw new Error(`${ctx} はオブジェクト`);
    const r = c as Record<string, unknown>;
    const category = normalizeNemesisCategory(r.category, `${ctx}.category`);
    const tier = reqNumber(r.tier, `${ctx}.tier`);
    const name = reqString(r.name, `${ctx}.name`);
    const type = normalizeNemesisType(r.type, `${ctx}.type`);
    const effect = reqString(r.effect, `${ctx}.effect`);
    const life = optNumber(r.life, `${ctx}.life`);
    const shield = optNumber(r.shield, `${ctx}.shield`);
    if (type !== 'Minion' && (life !== undefined || shield !== undefined)) {
      throw new Error(`${ctx}: life/shield は Minion のみ指定可`);
    }
    if (seen.has(name)) {
      throw new Error(`${file}: nemesisCard name 重複: ${name}`);
    }
    seen.add(name);
    return { category, tier, name, type, life, shield, effect };
  });
}

function parseNemeses(raw: unknown, file: string): RawNemesis[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error(`${file}: nemeses は配列`);
  const seen = new Set<string>();
  return raw.map((m, idx) => {
    if (!m || typeof m !== 'object') {
      throw new Error(`${file}: nemeses[${idx}] はオブジェクト`);
    }
    const r = m as Record<string, unknown>;
    if (typeof r.name !== 'string') throw new Error(`${file}: nemeses[${idx}].name`);
    if (typeof r.battle !== 'number') {
      throw new Error(`${file}: nemeses[${idx}].battle は number`);
    }
    if (typeof r.rule !== 'string') throw new Error(`${file}: nemeses[${idx}].rule`);
    if (seen.has(r.name)) throw new Error(`${file}: nemesis name 重複: ${r.name}`);
    seen.add(r.name);
    const level =
      r.level === undefined || r.level === null
        ? undefined
        : typeof r.level === 'number'
          ? r.level
          : (() => {
              throw new Error(`${file}: nemeses[${idx}].level は number か未指定`);
            })();
    const cards = parseNemesisSpecificCards(r.cards, `${file}: nemeses[${idx}=${r.name}].cards`);
    return {
      name: r.name,
      level,
      battle: r.battle,
      rule: r.rule,
      cards,
    };
  });
}

function parseNemesisSpecificCards(raw: unknown, ctx: string): RawNemesisSpecificCard[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error(`${ctx} は配列`);
  const seen = new Set<string>();
  return raw.map((c, idx) => {
    const cardCtx = `${ctx}[${idx}]`;
    if (!c || typeof c !== 'object') throw new Error(`${cardCtx} はオブジェクト`);
    const r = c as Record<string, unknown>;
    const placement = reqString(r.placement, `${cardCtx}.placement`);
    const tier = optNumber(r.tier, `${cardCtx}.tier`);
    const name = reqString(r.name, `${cardCtx}.name`);
    const effect = reqString(r.effect, `${cardCtx}.effect`);
    const { type, note: typeNote } = parseTypeWithNote(r.type, `${cardCtx}.type`);
    const life = parseLife(r.life, `${cardCtx}.life`);
    const shield = optNumber(r.shield, `${cardCtx}.shield`);
    if (type !== 'Minion' && (life !== undefined || shield !== undefined)) {
      throw new Error(`${cardCtx}: life/shield は Minion のみ指定可`);
    }
    // 同名カードは tier 違いに限り許容 (例: アラクノス「世界を飲み込む者」)
    const key = `${name}#${tier ?? ''}`;
    if (seen.has(key)) throw new Error(`${ctx}: (name, tier) 重複: ${name} tier=${tier}`);
    seen.add(key);
    return { placement, tier, name, type, typeNote, life, shield, effect };
  });
}

function parseLife(raw: unknown, ctx: string): number | '*' | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (raw === '*') return '*';
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  throw new Error(`${ctx} は number か '*' か未指定 (受領: ${JSON.stringify(raw)})`);
}

function main() {
  const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  if (files.length === 0) {
    throw new Error(`${SRC_DIR} に YAML ファイルがありません`);
  }

  const expansions = files.map((f) => {
    const text = readFileSync(path.join(SRC_DIR, f), 'utf8');
    const parsed = yaml.load(text);
    return validateExpansion(parsed, f);
  });

  const seenExpIds = new Set<string>();
  for (const e of expansions) {
    if (seenExpIds.has(e.id)) {
      throw new Error(`拡張 id が重複: ${e.id}`);
    }
    seenExpIds.add(e.id);
  }

  const seasonsByPackage = loadSeasonsByPackage();

  // シーズン昇順 (undefined = プロモ等は末尾) でソートしてから出力
  expansions.sort((a, b) => {
    const sa = seasonsByPackage.get(a.name)?.season ?? Infinity;
    const sb = seasonsByPackage.get(b.name)?.season ?? Infinity;
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });

  const data = expansions.map((e) => {
    const si = seasonsByPackage.get(e.name);
    return {
    id: e.id,
    name: e.name,
    badge: si?.badge,
    season: si?.season,
    type: si?.type,
    theme: si?.theme,
    cards: e.cards.map((c) => ({
      id: `${e.id}:card:${c.name}`,
      expansionId: e.id,
      name: c.name,
      type: c.type,
      cost: c.cost,
      effect: c.effect,
      keywords: c.keywords,
    })),
    mages: e.mages.map((m) => ({
      id: `${e.id}:mage:${m.name}`,
      expansionId: e.id,
      name: m.name,
      job: m.job,
      level: m.level,
      breaches: m.breaches,
      uniqueBreach: m.uniqueBreach,
      uniqueCard: m.uniqueCard,
      hand: m.hand,
      deck: m.deck,
      skill: m.skill,
      rule: m.rule,
    })),
    nemeses: e.nemeses.map((n) => {
      const nemesisId = `${e.id}:nemesis:${n.name}`;
      return {
        id: nemesisId,
        expansionId: e.id,
        name: n.name,
        level: n.level,
        battle: n.battle,
        rule: n.rule,
        cards: n.cards.map((c) => ({
          // 同名カードが tier 違いで複数存在しうるので id にも tier を含める
          id: `${nemesisId}:specificCard:${c.name}${c.tier !== undefined ? `#${c.tier}` : ''}`,
          nemesisId,
          placement: c.placement,
          tier: c.tier,
          name: c.name,
          type: c.type,
          typeNote: c.typeNote,
          life: c.life,
          shield: c.shield,
          effect: c.effect,
        })),
      };
    }),
    nemesisCards: e.nemesisCards.map((c) => ({
      id: `${e.id}:nemesisCard:${c.name}`,
      expansionId: e.id,
      category: c.category,
      tier: c.tier,
      name: c.name,
      type: c.type,
      life: c.life,
      shield: c.shield,
      effect: c.effect,
    })),
    };
  });

  const banner = `// AUTO-GENERATED by scripts/build-data.ts — DO NOT EDIT.\n// Source: data/expansions/*.yaml\n`;
  const body = `import type { Expansion } from '../types';\n\nexport const EXPANSIONS: Expansion[] = ${JSON.stringify(data, null, 2)} as const satisfies Expansion[];\n`;

  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, banner + body, 'utf8');

  const totalCards = data.reduce((n, e) => n + e.cards.length, 0);
  const totalMages = data.reduce((n, e) => n + e.mages.length, 0);
  const totalNemeses = data.reduce((n, e) => n + e.nemeses.length, 0);
  const totalNemesisCards = data.reduce((n, e) => n + e.nemesisCards.length, 0);
  const seasonAssigned = data.filter((e) => e.season !== undefined).length;
  console.log(
    `[build-data] 生成完了: ${expansions.length} 拡張 (シーズン割当 ${seasonAssigned}) / カード ${totalCards} / メイジ ${totalMages} / ネメシス ${totalNemeses} / ネメシスカード ${totalNemesisCards} → ${path.relative(ROOT, OUT_FILE)}`,
  );

  // setups
  const setups = loadSetups();
  const setupsBanner = `// AUTO-GENERATED by scripts/build-data.ts — DO NOT EDIT.\n// Source: data/setups.yaml\n`;
  const setupsBody = `import type { SupplySetup } from '../types';\n\nexport const SETUPS: SupplySetup[] = ${JSON.stringify(setups, null, 2)} as const satisfies SupplySetup[];\n`;
  writeFileSync(SETUPS_OUT_FILE, setupsBanner + setupsBody, 'utf8');
  console.log(
    `[build-data] セットアップ生成完了: ${setups.length} 件 → ${path.relative(ROOT, SETUPS_OUT_FILE)}`,
  );
}

type RawSetupSlot = {
  type: CardTypeEn;
  minCost?: number;
  maxCost?: number;
};

type RawSetup = { name: string; slots: RawSetupSlot[] };

function loadSetups(): RawSetup[] {
  const text = readFileSync(SETUPS_FILE, 'utf8');
  const raw = yaml.load(text);
  if (!Array.isArray(raw)) {
    throw new Error(`${SETUPS_FILE}: トップレベルは配列`);
  }
  const seenNames = new Set<string>();
  return raw.map((s, idx) => {
    if (!s || typeof s !== 'object') {
      throw new Error(`${SETUPS_FILE}: [${idx}] はオブジェクト`);
    }
    const r = s as Record<string, unknown>;
    if (typeof r.name !== 'string') {
      throw new Error(`${SETUPS_FILE}: [${idx}].name は string`);
    }
    if (seenNames.has(r.name)) {
      throw new Error(`${SETUPS_FILE}: name "${r.name}" が重複`);
    }
    seenNames.add(r.name);
    if (!Array.isArray(r.slots)) {
      throw new Error(`${SETUPS_FILE}: [${idx}].slots は配列`);
    }
    const typeCounts = { Gem: 0, Relic: 0, Spell: 0 };
    const slots = r.slots.map((sl, sidx) => {
      if (!sl || typeof sl !== 'object') {
        throw new Error(`${SETUPS_FILE}: ${r.name}.slots[${sidx}] はオブジェクト`);
      }
      const ssl = sl as Record<string, unknown>;
      const slotType = normalizeType(
        ssl.type,
        `${SETUPS_FILE}: ${r.name}.slots[${sidx}].type`,
      );
      const minCost =
        ssl.minCost === undefined ? undefined : Number(ssl.minCost);
      const maxCost =
        ssl.maxCost === undefined ? undefined : Number(ssl.maxCost);
      if (minCost !== undefined && !Number.isFinite(minCost)) {
        throw new Error(`${SETUPS_FILE}: ${r.name}.slots[${sidx}].minCost`);
      }
      if (maxCost !== undefined && !Number.isFinite(maxCost)) {
        throw new Error(`${SETUPS_FILE}: ${r.name}.slots[${sidx}].maxCost`);
      }
      typeCounts[slotType]++;
      return { type: slotType, minCost, maxCost } satisfies RawSetupSlot;
    });
    if (slots.length === 0) {
      throw new Error(`${SETUPS_FILE}: setup "${r.name}" のスロットが空です`);
    }
    return { name: r.name, slots };
  });
}

main();
