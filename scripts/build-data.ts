import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'data', 'expansions');
const SEASONS_FILE = path.join(ROOT, 'data', 'seasons.yaml');
const OUT_FILE = path.join(ROOT, 'lib', 'data', 'expansions.generated.ts');

function loadSeasonsByPackage(): Map<string, number> {
  const text = readFileSync(SEASONS_FILE, 'utf8');
  const raw = yaml.load(text);
  if (!Array.isArray(raw)) {
    throw new Error(`${SEASONS_FILE}: トップレベルは配列`);
  }
  const map = new Map<string, number>();
  raw.forEach((row, idx) => {
    if (!row || typeof row !== 'object') {
      throw new Error(`${SEASONS_FILE}: [${idx}] はオブジェクト`);
    }
    const r = row as Record<string, unknown>;
    if (typeof r.package !== 'string') {
      throw new Error(`${SEASONS_FILE}: [${idx}].package`);
    }
    if (typeof r.season !== 'number') {
      throw new Error(`${SEASONS_FILE}: [${idx}].season は number`);
    }
    if (map.has(r.package)) {
      throw new Error(`${SEASONS_FILE}: package "${r.package}" が重複`);
    }
    map.set(r.package, r.season);
  });
  return map;
}

type RawCard = {
  id: string;
  name: string;
  type: 'Gem' | 'Relic' | 'Spell';
  cost: number;
  effect?: string;
  keywords?: string[];
};

type RawMage = {
  id: string;
  name: string;
  job: string;
  level?: number;
};

type RawNemesis = {
  id: string;
  name: string;
  level?: number;
  battle: number;
  rule: string;
};

type RawExpansion = {
  id: string;
  name: string;
  badge?: string;
  cards: RawCard[];
  mages: RawMage[];
  nemeses: RawNemesis[];
};

const VALID_TYPES = new Set(['Gem', 'Relic', 'Spell']);

function validateExpansion(raw: unknown, file: string): RawExpansion {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`${file}: ルートはオブジェクトである必要があります`);
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string') throw new Error(`${file}: id (string) が必要`);
  if (typeof r.name !== 'string') throw new Error(`${file}: name (string) が必要`);
  if (!Array.isArray(r.cards)) throw new Error(`${file}: cards (array) が必要`);

  const seenIds = new Set<string>();
  const cards: RawCard[] = r.cards.map((c, idx) => {
    if (!c || typeof c !== 'object') {
      throw new Error(`${file}: cards[${idx}] はオブジェクト`);
    }
    const card = c as Record<string, unknown>;
    if (typeof card.id !== 'string') throw new Error(`${file}: cards[${idx}].id (string)`);
    if (typeof card.name !== 'string') throw new Error(`${file}: cards[${idx}].name (string)`);
    if (typeof card.type !== 'string' || !VALID_TYPES.has(card.type)) {
      throw new Error(`${file}: cards[${idx}].type は Gem/Relic/Spell のいずれか`);
    }
    if (typeof card.cost !== 'number' || !Number.isFinite(card.cost)) {
      throw new Error(`${file}: cards[${idx}].cost (number)`);
    }
    if (seenIds.has(card.id)) {
      throw new Error(`${file}: 拡張内で id が重複: ${card.id}`);
    }
    seenIds.add(card.id);
    return {
      id: card.id,
      name: card.name,
      type: card.type as RawCard['type'],
      cost: card.cost,
      effect: typeof card.effect === 'string' ? card.effect : undefined,
      keywords: Array.isArray(card.keywords)
        ? card.keywords.filter((k): k is string => typeof k === 'string')
        : undefined,
    };
  });

  const mages = parseMages(r.mages, file);
  const nemeses = parseNemeses(r.nemeses, file);

  return {
    id: r.id,
    name: r.name,
    badge: typeof r.badge === 'string' ? r.badge : undefined,
    cards,
    mages,
    nemeses,
  };
}

function parseMages(raw: unknown, file: string): RawMage[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error(`${file}: mages は配列`);
  const seen = new Set<string>();
  return raw.map((m, idx) => {
    if (!m || typeof m !== 'object') {
      throw new Error(`${file}: mages[${idx}] はオブジェクト`);
    }
    const r = m as Record<string, unknown>;
    if (typeof r.id !== 'string') throw new Error(`${file}: mages[${idx}].id`);
    if (typeof r.name !== 'string') throw new Error(`${file}: mages[${idx}].name`);
    if (typeof r.job !== 'string') throw new Error(`${file}: mages[${idx}].job`);
    if (seen.has(r.id)) throw new Error(`${file}: mage 内で id 重複: ${r.id}`);
    seen.add(r.id);
    const level =
      r.level === undefined || r.level === null
        ? undefined
        : typeof r.level === 'number'
          ? r.level
          : (() => {
              throw new Error(`${file}: mages[${idx}].level は number か未指定`);
            })();
    return { id: r.id, name: r.name, job: r.job, level };
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
    if (typeof r.id !== 'string') throw new Error(`${file}: nemeses[${idx}].id`);
    if (typeof r.name !== 'string') throw new Error(`${file}: nemeses[${idx}].name`);
    if (typeof r.battle !== 'number') {
      throw new Error(`${file}: nemeses[${idx}].battle は number`);
    }
    if (typeof r.rule !== 'string') throw new Error(`${file}: nemeses[${idx}].rule`);
    if (seen.has(r.id)) throw new Error(`${file}: nemesis 内で id 重複: ${r.id}`);
    seen.add(r.id);
    const level =
      r.level === undefined || r.level === null
        ? undefined
        : typeof r.level === 'number'
          ? r.level
          : (() => {
              throw new Error(`${file}: nemeses[${idx}].level は number か未指定`);
            })();
    return {
      id: r.id,
      name: r.name,
      level,
      battle: r.battle,
      rule: r.rule,
    };
  });
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

  const data = expansions.map((e) => ({
    id: e.id,
    name: e.name,
    badge: e.badge,
    season: seasonsByPackage.get(e.name),
    cards: e.cards.map((c) => ({
      id: `${e.id}:${c.id}`,
      expansionId: e.id,
      name: c.name,
      type: c.type,
      cost: c.cost,
      effect: c.effect,
      keywords: c.keywords,
    })),
    mages: e.mages.map((m) => ({
      id: `${e.id}:${m.id}`,
      expansionId: e.id,
      name: m.name,
      job: m.job,
      level: m.level,
    })),
    nemeses: e.nemeses.map((n) => ({
      id: `${e.id}:${n.id}`,
      expansionId: e.id,
      name: n.name,
      level: n.level,
      battle: n.battle,
      rule: n.rule,
    })),
  }));

  const banner = `// AUTO-GENERATED by scripts/build-data.ts — DO NOT EDIT.\n// Source: data/expansions/*.yaml\n`;
  const body = `import type { Expansion } from '../types';\n\nexport const EXPANSIONS: Expansion[] = ${JSON.stringify(data, null, 2)} as const satisfies Expansion[];\n`;

  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, banner + body, 'utf8');

  const totalCards = data.reduce((n, e) => n + e.cards.length, 0);
  const totalMages = data.reduce((n, e) => n + e.mages.length, 0);
  const totalNemeses = data.reduce((n, e) => n + e.nemeses.length, 0);
  const seasonAssigned = data.filter((e) => e.season !== undefined).length;
  console.log(
    `[build-data] 生成完了: ${expansions.length} 拡張 (シーズン割当 ${seasonAssigned}) / カード ${totalCards} / メイジ ${totalMages} / ネメシス ${totalNemeses} → ${path.relative(ROOT, OUT_FILE)}`,
  );
}

main();
