import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';

const YAML_DIR = 'data/expansions';
const SEASONS_FILE = 'data/seasons.yaml';
const SETUPS_FILE = 'data/setups.yaml';

type CsvRow = Record<string, string>;

// シート / YAML の type は英語/日本語どちらでも受け付け、英語に正規化して比較
const TYPE_TO_EN: Record<string, string> = {
  Gem: 'Gem',
  Relic: 'Relic',
  Spell: 'Spell',
  宝石: 'Gem',
  遺物: 'Relic',
  呪文: 'Spell',
};
function normalizeType(raw: string | undefined): string {
  if (!raw) return '';
  return TYPE_TO_EN[raw] ?? raw;
}

type YamlCard = {
  name: string;
  type: string;
  cost: number;
  effect?: string;
};
type YamlMage = {
  name: string;
  job: string;
  level?: number;
  breaches?: string[];
  uniqueBreach?: { number: number; effect: string };
  uniqueCard?: { name: string; type: string; effect: string };
  hand?: { unique: number; crystal: number; spark: number };
  deck?: { unique: number; crystal: number; spark: number };
  skill?: { name: string; timing: string; charge: number; effect: string };
  rule?: string;
};
type YamlNemesisSpecificCard = {
  placement: string;
  tier?: number;
  name: string;
  type?: string;
  life?: number | '*';
  shield?: number;
  effect: string;
};
type YamlNemesis = {
  name: string;
  level?: number;
  battle: number;
  rule: string;
  cards?: YamlNemesisSpecificCard[];
};
type YamlNemesisCard = {
  category: string;
  tier: number;
  name: string;
  type: string;
  life?: number;
  shield?: number;
  effect: string;
};
type YamlExpansion = {
  id: string;
  name: string;
  cards: YamlCard[];
  mages?: YamlMage[];
  nemeses?: YamlNemesis[];
  nemesisCards?: YamlNemesisCard[];
};

const NEMESIS_TYPE_TO_EN: Record<string, string> = {
  Attack: 'Attack',
  Minion: 'Minion',
  Power: 'Power',
  アタック: 'Attack',
  ミニオン: 'Minion',
  パワー: 'Power',
};
function normalizeNemesisType(raw: string | undefined): string {
  if (!raw) return '';
  return NEMESIS_TYPE_TO_EN[raw] ?? raw;
}
const NEMESIS_CATEGORY_TO_EN: Record<string, string> = {
  Basic: 'Basic',
  Advanced: 'Advanced',
  基本カード: 'Basic',
  上級基本カード: 'Advanced',
};
function normalizeNemesisCategory(raw: string | undefined): string {
  if (!raw) return '';
  return NEMESIS_CATEGORY_TO_EN[raw] ?? raw;
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') {
        cur.push(cell);
        cell = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        cur.push(cell);
        rows.push(cur);
        cur = [];
        cell = '';
      } else cell += c;
    }
  }
  if (cell.length > 0 || cur.length > 0) {
    cur.push(cell);
    rows.push(cur);
  }
  const filtered = rows.filter((r) => r.length > 1 || r[0]);
  if (filtered.length === 0) return [];
  const [header, ...data] = filtered;
  return data
    .filter((r) => r.some((v) => v))
    .map((r) => {
      const obj: CsvRow = {};
      header.forEach((h, i) => {
        if (h) obj[h] = r[i] ?? '';
      });
      return obj;
    });
}

function loadYamlByName(): Map<string, { file: string; expansion: YamlExpansion }> {
  const out = new Map<string, { file: string; expansion: YamlExpansion }>();
  const files = readdirSync(YAML_DIR).filter(
    (f) => f.endsWith('.yaml') || f.endsWith('.yml'),
  );
  for (const file of files) {
    const text = readFileSync(join(YAML_DIR, file), 'utf8');
    const exp = yaml.load(text) as YamlExpansion;
    out.set(exp.name, { file, expansion: exp });
  }
  return out;
}

type SeasonInfo = {
  season?: number;
  type?: 'main' | 'sub';
  theme?: string;
  badge?: string;
};

function loadSeasonsYaml(): Map<string, SeasonInfo> {
  const text = readFileSync(SEASONS_FILE, 'utf8');
  const raw = yaml.load(text) as {
    season?: number;
    theme?: string;
    packages: { name: string; type?: 'main' | 'sub'; badge?: string }[];
  }[];
  const map = new Map<string, SeasonInfo>();
  for (const group of raw) {
    for (const p of group.packages) {
      map.set(p.name, {
        season: group.season,
        type: p.type,
        theme: group.theme,
        badge: p.badge,
      });
    }
  }
  return map;
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\s+$/, '');
}

const sheetDir = process.argv[2] ?? join(tmpdir(), 'aeons-end-sheets');
const yamlByName = loadYamlByName();
const seasonsYaml = loadSeasonsYaml();

let diffs = 0;
const knownPackages = new Set(yamlByName.keys());

// ============================================================
// 1) season tab vs data/seasons.yaml
// ============================================================
{
  const seasonRows = parseCsv(readFileSync(join(sheetDir, 'season.csv'), 'utf8'));
  const sheetMap = new Map<
    string,
    { season?: number; type?: string; theme?: string; badge?: string }
  >();
  for (const row of seasonRows) {
    const pkg = row.package;
    if (!pkg) continue;
    const s = row.season === '' ? undefined : Number(row.season);
    const theme = row.theme && row.theme !== '' ? row.theme : undefined;
    const badge = row.badge && row.badge !== '' ? row.badge : undefined;
    sheetMap.set(pkg, { season: s, type: row.type, theme, badge });
  }
  for (const [pkg, { season, type, theme, badge }] of sheetMap.entries()) {
    const y = seasonsYaml.get(pkg);
    if (!y) {
      console.log(`[season] YAML 欠落: package="${pkg}" season=${season} type=${type}`);
      diffs++;
      continue;
    }
    // season: シート空欄 → undefined 扱い、YAML も undefined なら一致
    if (y.season !== season) {
      console.log(`[season] ${pkg}: season 差分 sheet=${season} yaml=${y.season}`);
      diffs++;
    }
    // type: シート '-' → undefined 扱い (YAML 側はもともと省略)
    const sheetType = type === '-' || type === '' ? undefined : type;
    if (sheetType !== undefined && sheetType !== 'main' && sheetType !== 'sub') {
      console.log(`[season] ${pkg}: type が main/sub/- 以外 (sheet=${type})`);
      diffs++;
    } else if (y.type !== sheetType) {
      console.log(`[season] ${pkg}: type 差分 sheet=${sheetType} yaml=${y.type}`);
      diffs++;
    }
    if ((y.theme ?? null) !== (theme ?? null)) {
      console.log(`[season] ${pkg}: theme 差分 sheet=${theme} yaml=${y.theme}`);
      diffs++;
    }
    if ((y.badge ?? null) !== (badge ?? null)) {
      console.log(`[season] ${pkg}: badge 差分 sheet=${badge} yaml=${y.badge}`);
      diffs++;
    }
  }
  for (const [pkg, y] of seasonsYaml.entries()) {
    if (!sheetMap.has(pkg)) {
      console.log(
        `[season] シート欠落: package="${pkg}" yaml season=${y.season} type=${y.type}`,
      );
      diffs++;
    }
  }
}

// ============================================================
// 2) card tab vs YAML.cards (per package)
// ============================================================
{
  const cardRows = parseCsv(readFileSync(join(sheetDir, 'card.csv'), 'utf8'));
  const cardsByPkg = new Map<string, CsvRow[]>();
  for (const row of cardRows) {
    if (!row.package) {
      console.log(`[card] (name=${row.name}): package 空欄`);
      diffs++;
      continue;
    }
    const arr = cardsByPkg.get(row.package) ?? [];
    arr.push(row);
    cardsByPkg.set(row.package, arr);
  }

  for (const pkg of cardsByPkg.keys()) {
    if (!knownPackages.has(pkg)) {
      console.log(`[card] YAML 未登録 package: "${pkg}"`);
      diffs++;
    }
  }
  for (const pkg of knownPackages) {
    if (!cardsByPkg.has(pkg)) {
      console.log(`[card] シート欠落 package: "${pkg}"`);
      diffs++;
    }
  }

  for (const [pkg, sheetRows] of cardsByPkg.entries()) {
    const target = yamlByName.get(pkg);
    if (!target) continue;
    const cardsByCardName = new Map(target.expansion.cards.map((c) => [c.name, c]));
    const sheetNames = new Set(sheetRows.map((r) => r.name));

    for (const name of sheetNames) {
      if (!cardsByCardName.has(name)) {
        console.log(`[card][${pkg}] YAML 欠落: ${name}`);
        diffs++;
      }
    }
    for (const name of cardsByCardName.keys()) {
      if (!sheetNames.has(name)) {
        console.log(`[card][${pkg}] シート欠落: ${name}`);
        diffs++;
      }
    }

    for (const sheet of sheetRows) {
      const y = cardsByCardName.get(sheet.name);
      if (!y) continue;
      if (normalizeType(sheet.type) !== normalizeType(y.type)) {
        console.log(`[card][${pkg}] ${sheet.name} type: sheet="${sheet.type}" yaml="${y.type}"`);
        diffs++;
      }
      if (Number(sheet.cost) !== y.cost) {
        console.log(`[card][${pkg}] ${sheet.name} cost: sheet="${sheet.cost}" yaml="${y.cost}"`);
        diffs++;
      }
      const sE = normalize(sheet.effect ?? '');
      const yE = normalize(y.effect ?? '');
      if (sE !== yE) {
        console.log(`[card][${pkg}] ${sheet.name} effect:`);
        console.log(`  sheet: ${JSON.stringify(sE)}`);
        console.log(`   yaml: ${JSON.stringify(yE)}`);
        diffs++;
      }
    }

  }
}

// ============================================================
// 3) nemesis tab vs YAML.nemeses (per known package)
// ============================================================
{
  const rows = parseCsv(readFileSync(join(sheetDir, 'nemesis.csv'), 'utf8'));
  const byPkg = new Map<string, CsvRow[]>();
  for (const row of rows) {
    if (!row.package) continue;
    if (!knownPackages.has(row.package)) continue; // 未登録 package は無視
    const arr = byPkg.get(row.package) ?? [];
    arr.push(row);
    byPkg.set(row.package, arr);
  }

  for (const [pkg, sheetRows] of byPkg.entries()) {
    const target = yamlByName.get(pkg)!;
    const nemesesByName = new Map(
      (target.expansion.nemeses ?? []).map((n) => [n.name, n]),
    );
    const sheetNames = new Set(sheetRows.map((r) => r.name));
    for (const name of sheetNames) {
      if (!nemesesByName.has(name)) {
        console.log(`[nemesis][${pkg}] YAML 欠落: ${name}`);
        diffs++;
      }
    }
    for (const name of nemesesByName.keys()) {
      if (!sheetNames.has(name)) {
        console.log(`[nemesis][${pkg}] シート欠落: ${name}`);
        diffs++;
      }
    }
    for (const sheet of sheetRows) {
      const y = nemesesByName.get(sheet.name);
      if (!y) continue;
      const sLevel = sheet.level === '' || sheet.level === '-' ? undefined : Number(sheet.level);
      if (sLevel !== y.level) {
        console.log(`[nemesis][${pkg}] ${sheet.name} level: sheet="${sLevel}" yaml="${y.level}"`);
        diffs++;
      }
      if (Number(sheet.battle) !== y.battle) {
        console.log(`[nemesis][${pkg}] ${sheet.name} battle: sheet="${sheet.battle}" yaml="${y.battle}"`);
        diffs++;
      }
      const sR = normalize(sheet.rule ?? '');
      const yR = normalize(y.rule ?? '');
      if (sR !== yR) {
        console.log(`[nemesis][${pkg}] ${sheet.name} rule:`);
        console.log(`  sheet: ${JSON.stringify(sR)}`);
        console.log(`   yaml: ${JSON.stringify(yR)}`);
        diffs++;
      }
    }
  }
}

// ============================================================
// 4) player tab vs YAML.mages (per known package)
// ============================================================
{
  const rows = parseCsv(readFileSync(join(sheetDir, 'player.csv'), 'utf8'));
  const byPkg = new Map<string, CsvRow[]>();
  for (const row of rows) {
    if (!row.package) continue;
    if (!knownPackages.has(row.package)) continue;
    const arr = byPkg.get(row.package) ?? [];
    arr.push(row);
    byPkg.set(row.package, arr);
  }

  for (const [pkg, sheetRows] of byPkg.entries()) {
    const target = yamlByName.get(pkg)!;
    const magesByName = new Map(
      (target.expansion.mages ?? []).map((m) => [m.name, m]),
    );
    const sheetNames = new Set(sheetRows.map((r) => r.name));
    for (const name of sheetNames) {
      if (!magesByName.has(name)) {
        console.log(`[player][${pkg}] YAML 欠落: ${name}`);
        diffs++;
      }
    }
    for (const name of magesByName.keys()) {
      if (!sheetNames.has(name)) {
        console.log(`[player][${pkg}] シート欠落: ${name}`);
        diffs++;
      }
    }
    for (const sheet of sheetRows) {
      const y = magesByName.get(sheet.name);
      if (!y) continue;
      if (sheet.job !== y.job) {
        console.log(`[player][${pkg}] ${sheet.name} job: sheet="${sheet.job}" yaml="${y.job}"`);
        diffs++;
      }
      const sLevel = sheet.level === '' || sheet.level === '-' ? undefined : Number(sheet.level);
      if (sLevel !== y.level) {
        console.log(`[player][${pkg}] ${sheet.name} level: sheet="${sLevel}" yaml="${y.level}"`);
        diffs++;
      }

      // breaches: × → x に正規化
      const sBreaches = [sheet.breach_1, sheet.breach_2, sheet.breach_3, sheet.breach_4]
        .map((b) => (b === '×' ? 'x' : b ?? ''));
      const yBreaches = y.breaches ?? [];
      const breachesEqual =
        sBreaches.length === yBreaches.length && sBreaches.every((b, i) => b === yBreaches[i]);
      if (!breachesEqual) {
        console.log(
          `[player][${pkg}] ${sheet.name} breaches: sheet=${JSON.stringify(sBreaches)} yaml=${JSON.stringify(yBreaches)}`,
        );
        diffs++;
      }

      // uniqueBreach: シート '-' は未設定
      const sUBNum =
        sheet.unique_breach === '' || sheet.unique_breach === '-'
          ? undefined
          : Number(sheet.unique_breach);
      const sUBEff =
        sheet.unique_breach_effect === '' || sheet.unique_breach_effect === '-'
          ? undefined
          : sheet.unique_breach_effect;
      const yUBNum = y.uniqueBreach?.number;
      const yUBEff = y.uniqueBreach?.effect;
      if (sUBNum !== yUBNum) {
        console.log(`[player][${pkg}] ${sheet.name} uniqueBreach.number: sheet=${sUBNum} yaml=${yUBNum}`);
        diffs++;
      }
      if ((sUBEff ?? null) !== (yUBEff ?? null)) {
        console.log(
          `[player][${pkg}] ${sheet.name} uniqueBreach.effect: sheet=${JSON.stringify(sUBEff)} yaml=${JSON.stringify(yUBEff)}`,
        );
        diffs++;
      }

      // uniqueCard
      const sUCName =
        sheet.unique_card === '' || sheet.unique_card === '-' ? undefined : sheet.unique_card;
      const sUCType =
        sheet.unique_card_type === '' || sheet.unique_card_type === '-'
          ? undefined
          : sheet.unique_card_type;
      const sUCEff =
        sheet.unique_card_effect === '' || sheet.unique_card_effect === '-'
          ? undefined
          : sheet.unique_card_effect;
      const yUCName = y.uniqueCard?.name;
      const yUCType = y.uniqueCard?.type;
      const yUCEff = y.uniqueCard?.effect;
      if ((sUCName ?? null) !== (yUCName ?? null)) {
        console.log(
          `[player][${pkg}] ${sheet.name} uniqueCard.name: sheet=${JSON.stringify(sUCName)} yaml=${JSON.stringify(yUCName)}`,
        );
        diffs++;
      }
      if (normalizeType(sUCType ?? '') !== normalizeType(yUCType ?? '')) {
        console.log(
          `[player][${pkg}] ${sheet.name} uniqueCard.type: sheet=${JSON.stringify(sUCType)} yaml=${JSON.stringify(yUCType)}`,
        );
        diffs++;
      }
      const sUCEffN = normalize(sUCEff ?? '');
      const yUCEffN = normalize(yUCEff ?? '');
      if (sUCEffN !== yUCEffN) {
        console.log(`[player][${pkg}] ${sheet.name} uniqueCard.effect:`);
        console.log(`  sheet: ${JSON.stringify(sUCEffN)}`);
        console.log(`   yaml: ${JSON.stringify(yUCEffN)}`);
        diffs++;
      }

      // hand / deck (空欄 = メイジ詳細未登録なのでスキップ)
      const sHasPile =
        sheet.hand_unique !== '' || sheet.deck_unique !== '';
      if (sHasPile) {
        const checkPile = (label: 'hand' | 'deck') => {
          const sU = Number(sheet[`${label}_unique`]);
          const sC = Number(sheet[`${label}_crystal`]);
          const sS = Number(sheet[`${label}_spark`]);
          const yP = y[label];
          if (!yP) {
            console.log(`[player][${pkg}] ${sheet.name} ${label}: yaml 欠落`);
            diffs++;
            return;
          }
          if (sU !== yP.unique || sC !== yP.crystal || sS !== yP.spark) {
            console.log(
              `[player][${pkg}] ${sheet.name} ${label}: sheet=${sU}/${sC}/${sS} yaml=${yP.unique}/${yP.crystal}/${yP.spark}`,
            );
            diffs++;
          }
        };
        checkPile('hand');
        checkPile('deck');
      }

      // skill
      const sSkName = sheet.skill === '' || sheet.skill === '-' ? undefined : sheet.skill;
      const sSkTim =
        sheet.skill_timing === '' || sheet.skill_timing === '-' ? undefined : sheet.skill_timing;
      const sSkEff =
        sheet.skill_effect === '' || sheet.skill_effect === '-' ? undefined : sheet.skill_effect;
      const sSkCh =
        sheet.skill_charge === '' || sheet.skill_charge === '-'
          ? undefined
          : Number(sheet.skill_charge);
      const yS = y.skill;
      if ((sSkName ?? null) !== (yS?.name ?? null)) {
        console.log(
          `[player][${pkg}] ${sheet.name} skill.name: sheet=${JSON.stringify(sSkName)} yaml=${JSON.stringify(yS?.name)}`,
        );
        diffs++;
      }
      if ((sSkTim ?? null) !== (yS?.timing ?? null)) {
        console.log(
          `[player][${pkg}] ${sheet.name} skill.timing: sheet=${JSON.stringify(sSkTim)} yaml=${JSON.stringify(yS?.timing)}`,
        );
        diffs++;
      }
      if ((sSkCh ?? null) !== (yS?.charge ?? null)) {
        console.log(
          `[player][${pkg}] ${sheet.name} skill.charge: sheet=${sSkCh} yaml=${yS?.charge}`,
        );
        diffs++;
      }
      const sSkEffN = normalize(sSkEff ?? '');
      const ySkEffN = normalize(yS?.effect ?? '');
      if (sSkEffN !== ySkEffN) {
        console.log(`[player][${pkg}] ${sheet.name} skill.effect:`);
        console.log(`  sheet: ${JSON.stringify(sSkEffN)}`);
        console.log(`   yaml: ${JSON.stringify(ySkEffN)}`);
        diffs++;
      }

      // rule
      const sRule = sheet.rule === '' || sheet.rule === '-' ? undefined : sheet.rule;
      const sRuleN = normalize(sRule ?? '');
      const yRuleN = normalize(y.rule ?? '');
      if (sRuleN !== yRuleN) {
        console.log(`[player][${pkg}] ${sheet.name} rule:`);
        console.log(`  sheet: ${JSON.stringify(sRuleN)}`);
        console.log(`   yaml: ${JSON.stringify(yRuleN)}`);
        diffs++;
      }
    }
  }
}

// ============================================================
// 5) setup tab vs data/setups.yaml
// ============================================================
{
  const rows = parseCsv(readFileSync(join(sheetDir, 'setup.csv'), 'utf8'));
  const sheetSetups = new Map<string, { type: string; minCost?: number; maxCost?: number }[]>();
  for (const row of rows) {
    if (!row.setup) continue;
    const slot = {
      type: row.type,
      minCost:
        row.min_cost === '' || row.min_cost === '-'
          ? undefined
          : Number(row.min_cost),
      maxCost:
        row.max_cost === '' || row.max_cost === '-'
          ? undefined
          : Number(row.max_cost),
    };
    const arr = sheetSetups.get(row.setup) ?? [];
    arr.push(slot);
    sheetSetups.set(row.setup, arr);
  }

  const yamlSetups = yaml.load(readFileSync(SETUPS_FILE, 'utf8')) as {
    name: string;
    slots: { type: string; minCost?: number; maxCost?: number }[];
  }[];
  const yamlMap = new Map(yamlSetups.map((s) => [s.name, s.slots]));

  for (const name of sheetSetups.keys()) {
    if (!yamlMap.has(name)) {
      console.log(`[setup] YAML 欠落: setup="${name}"`);
      diffs++;
    }
  }
  for (const name of yamlMap.keys()) {
    if (!sheetSetups.has(name)) {
      console.log(`[setup] シート欠落: setup="${name}"`);
      diffs++;
    }
  }
  // 並び順 (UI のデフォルト選択 / 表示順に影響)
  const sheetOrder = [...sheetSetups.keys()].filter((n) => yamlMap.has(n));
  const yamlOrder = [...yamlMap.keys()].filter((n) => sheetSetups.has(n));
  if (sheetOrder.join('|') !== yamlOrder.join('|')) {
    console.log(`[setup] 並び順差分 sheet=[${sheetOrder.join(', ')}] yaml=[${yamlOrder.join(', ')}]`);
    diffs++;
  }
  for (const [name, sheetSlots] of sheetSetups.entries()) {
    const ySlots = yamlMap.get(name);
    if (!ySlots) continue;
    if (sheetSlots.length !== ySlots.length) {
      console.log(
        `[setup][${name}] スロット数差分: sheet=${sheetSlots.length} yaml=${ySlots.length}`,
      );
      diffs++;
      continue;
    }
    sheetSlots.forEach((s, i) => {
      const y = ySlots[i];
      if (normalizeType(s.type) !== normalizeType(y.type)) {
        console.log(`[setup][${name}] slot ${i + 1} type: sheet=${s.type} yaml=${y.type}`);
        diffs++;
      }
      if ((s.minCost ?? null) !== (y.minCost ?? null)) {
        console.log(
          `[setup][${name}] slot ${i + 1} minCost: sheet=${s.minCost} yaml=${y.minCost}`,
        );
        diffs++;
      }
      if ((s.maxCost ?? null) !== (y.maxCost ?? null)) {
        console.log(
          `[setup][${name}] slot ${i + 1} maxCost: sheet=${s.maxCost} yaml=${y.maxCost}`,
        );
        diffs++;
      }
    });
  }
}

// ============================================================
// 6) nemesis_card tab vs YAML.nemesisCards (per known package)
// ============================================================
{
  const rows = parseCsv(readFileSync(join(sheetDir, 'nemesis_card.csv'), 'utf8'));
  const byPkg = new Map<string, CsvRow[]>();
  for (const row of rows) {
    if (!row.package) continue;
    if (!knownPackages.has(row.package)) {
      console.log(`[nemesis_card] YAML 未登録 package: "${row.package}"`);
      diffs++;
      continue;
    }
    const arr = byPkg.get(row.package) ?? [];
    arr.push(row);
    byPkg.set(row.package, arr);
  }

  for (const [pkg, sheetRows] of byPkg.entries()) {
    const target = yamlByName.get(pkg)!;
    const yamlCards = target.expansion.nemesisCards ?? [];
    const yamlByCardName = new Map(yamlCards.map((c) => [c.name, c]));
    const sheetByCardName = new Map(sheetRows.map((r) => [r.card_name, r]));

    for (const name of sheetByCardName.keys()) {
      if (!yamlByCardName.has(name)) {
        console.log(`[nemesis_card][${pkg}] YAML 欠落: ${name}`);
        diffs++;
      }
    }
    for (const name of yamlByCardName.keys()) {
      if (!sheetByCardName.has(name)) {
        console.log(`[nemesis_card][${pkg}] シート欠落: ${name}`);
        diffs++;
      }
    }

    for (const sheet of sheetRows) {
      const y = yamlByCardName.get(sheet.card_name);
      if (!y) continue;
      if (normalizeNemesisCategory(sheet.type_name) !== normalizeNemesisCategory(y.category)) {
        console.log(
          `[nemesis_card][${pkg}] ${sheet.card_name} category: sheet="${sheet.type_name}" yaml="${y.category}"`,
        );
        diffs++;
      }
      if (Number(sheet.tier) !== y.tier) {
        console.log(
          `[nemesis_card][${pkg}] ${sheet.card_name} tier: sheet="${sheet.tier}" yaml="${y.tier}"`,
        );
        diffs++;
      }
      if (normalizeNemesisType(sheet.card_type) !== normalizeNemesisType(y.type)) {
        console.log(
          `[nemesis_card][${pkg}] ${sheet.card_name} type: sheet="${sheet.card_type}" yaml="${y.type}"`,
        );
        diffs++;
      }
      const sLife =
        sheet.minion_life === '' || sheet.minion_life === '-'
          ? undefined
          : Number(sheet.minion_life);
      const sShield =
        sheet.minion_shield === '' || sheet.minion_shield === '-'
          ? undefined
          : Number(sheet.minion_shield);
      if ((sLife ?? null) !== (y.life ?? null)) {
        console.log(
          `[nemesis_card][${pkg}] ${sheet.card_name} life: sheet=${sLife} yaml=${y.life}`,
        );
        diffs++;
      }
      if ((sShield ?? null) !== (y.shield ?? null)) {
        console.log(
          `[nemesis_card][${pkg}] ${sheet.card_name} shield: sheet=${sShield} yaml=${y.shield}`,
        );
        diffs++;
      }
      const sE = normalize(sheet.effect ?? '');
      const yE = normalize(y.effect ?? '');
      if (sE !== yE) {
        console.log(`[nemesis_card][${pkg}] ${sheet.card_name} effect:`);
        console.log(`  sheet: ${JSON.stringify(sE)}`);
        console.log(`   yaml: ${JSON.stringify(yE)}`);
        diffs++;
      }
    }
  }
}

// ============================================================
// 7) nemesis_specific_card tab vs YAML.nemeses[].cards
// ============================================================
{
  const rows = parseCsv(
    readFileSync(join(sheetDir, 'nemesis_specific_card.csv'), 'utf8'),
  );
  // ネメシス名 → 行 のマップ。package は YAML 側の nemesis から逆引きする
  const sheetByNemesis = new Map<string, CsvRow[]>();
  for (const row of rows) {
    if (!row.nemesis) continue;
    const arr = sheetByNemesis.get(row.nemesis) ?? [];
    arr.push(row);
    sheetByNemesis.set(row.nemesis, arr);
  }

  // YAML 側で全 nemesis を name で索引化（同名はないと仮定）
  const yamlNemesisByName = new Map<
    string,
    { pkg: string; nemesis: YamlNemesis }
  >();
  for (const { file: _f, expansion } of yamlByName.values()) {
    for (const n of expansion.nemeses ?? []) {
      if (yamlNemesisByName.has(n.name)) {
        console.log(
          `[nemesis_specific_card] YAML 内で nemesis name 重複: ${n.name}`,
        );
        diffs++;
        continue;
      }
      yamlNemesisByName.set(n.name, { pkg: expansion.name, nemesis: n });
    }
  }

  for (const nemesisName of sheetByNemesis.keys()) {
    if (!yamlNemesisByName.has(nemesisName)) {
      console.log(
        `[nemesis_specific_card] nemesis YAML 欠落: "${nemesisName}"`,
      );
      diffs++;
    }
  }

  for (const [nemesisName, sheetRows] of sheetByNemesis.entries()) {
    const target = yamlNemesisByName.get(nemesisName);
    if (!target) continue;
    const { pkg, nemesis } = target;
    const yamlCards = nemesis.cards ?? [];
    const yamlByCardName = new Map(yamlCards.map((c) => [c.name, c]));
    const sheetByCardName = new Map(sheetRows.map((r) => [r.name, r]));

    for (const name of sheetByCardName.keys()) {
      if (!yamlByCardName.has(name)) {
        console.log(`[nemesis_specific_card][${pkg}/${nemesisName}] YAML 欠落: ${name}`);
        diffs++;
      }
    }
    for (const name of yamlByCardName.keys()) {
      if (!sheetByCardName.has(name)) {
        console.log(`[nemesis_specific_card][${pkg}/${nemesisName}] シート欠落: ${name}`);
        diffs++;
      }
    }

    for (const sheet of sheetRows) {
      const y = yamlByCardName.get(sheet.name);
      if (!y) continue;
      if (sheet.placement !== y.placement) {
        console.log(
          `[nemesis_specific_card][${pkg}/${nemesisName}] ${sheet.name} placement: sheet="${sheet.placement}" yaml="${y.placement}"`,
        );
        diffs++;
      }
      const sTier =
        sheet.tier === '' || sheet.tier === '-' ? undefined : Number(sheet.tier);
      if ((sTier ?? null) !== (y.tier ?? null)) {
        console.log(
          `[nemesis_specific_card][${pkg}/${nemesisName}] ${sheet.name} tier: sheet=${sTier} yaml=${y.tier}`,
        );
        diffs++;
      }
      const sType =
        sheet.type === '' || sheet.type === '-' ? undefined : sheet.type;
      if (normalizeNemesisType(sType) !== normalizeNemesisType(y.type)) {
        console.log(
          `[nemesis_specific_card][${pkg}/${nemesisName}] ${sheet.name} type: sheet="${sheet.type}" yaml="${y.type}"`,
        );
        diffs++;
      }
      const sLife: number | '*' | undefined =
        sheet.minion_life === '' || sheet.minion_life === '-'
          ? undefined
          : sheet.minion_life === '*'
            ? '*'
            : Number(sheet.minion_life);
      const sShield =
        sheet.minion_shield === '' || sheet.minion_shield === '-'
          ? undefined
          : Number(sheet.minion_shield);
      if ((sLife ?? null) !== (y.life ?? null)) {
        console.log(
          `[nemesis_specific_card][${pkg}/${nemesisName}] ${sheet.name} life: sheet=${sLife} yaml=${y.life}`,
        );
        diffs++;
      }
      if ((sShield ?? null) !== (y.shield ?? null)) {
        console.log(
          `[nemesis_specific_card][${pkg}/${nemesisName}] ${sheet.name} shield: sheet=${sShield} yaml=${y.shield}`,
        );
        diffs++;
      }
      const sE = normalize(sheet.effect ?? '');
      const yE = normalize(y.effect ?? '');
      if (sE !== yE) {
        console.log(
          `[nemesis_specific_card][${pkg}/${nemesisName}] ${sheet.name} effect:`,
        );
        console.log(`  sheet: ${JSON.stringify(sE)}`);
        console.log(`   yaml: ${JSON.stringify(yE)}`);
        diffs++;
      }
    }
  }
}

console.log(`\n合計 ${diffs} 件の差分`);
process.exit(diffs > 0 ? 1 : 0);
