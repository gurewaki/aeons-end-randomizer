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
  id: string;
  name: string;
  type: string;
  cost: number;
  effect?: string;
};
type YamlMage = {
  id: string;
  name: string;
  job: string;
  level?: number;
};
type YamlNemesis = {
  id: string;
  name: string;
  level?: number;
  battle: number;
  rule: string;
};
type YamlExpansion = {
  id: string;
  name: string;
  badge?: string;
  cards: YamlCard[];
  mages?: YamlMage[];
  nemeses?: YamlNemesis[];
};

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
};

function loadSeasonsYaml(): Map<string, SeasonInfo> {
  const text = readFileSync(SEASONS_FILE, 'utf8');
  const raw = yaml.load(text) as {
    season?: number;
    theme?: string;
    packages: { name: string; type?: 'main' | 'sub' }[];
  }[];
  const map = new Map<string, SeasonInfo>();
  for (const group of raw) {
    for (const p of group.packages) {
      map.set(p.name, {
        season: group.season,
        type: p.type,
        theme: group.theme,
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
    { season?: number; type?: string; theme?: string }
  >();
  for (const row of seasonRows) {
    const pkg = row.package;
    if (!pkg) continue;
    const s = row.season === '' ? undefined : Number(row.season);
    const theme = row.theme && row.theme !== '' ? row.theme : undefined;
    sheetMap.set(pkg, { season: s, type: row.type, theme });
  }
  for (const [pkg, { season, type, theme }] of sheetMap.entries()) {
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
      console.log(`[card] ${row.id}: package 空欄`);
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
    const cardsById = new Map(target.expansion.cards.map((c) => [c.id, c]));
    const sheetIds = new Set(sheetRows.map((r) => r.id));

    for (const id of sheetIds) {
      if (!cardsById.has(id)) {
        console.log(`[card][${pkg}] YAML 欠落: ${id}`);
        diffs++;
      }
    }
    for (const id of cardsById.keys()) {
      if (!sheetIds.has(id)) {
        console.log(`[card][${pkg}] シート欠落: ${id}`);
        diffs++;
      }
    }

    for (const sheet of sheetRows) {
      const y = cardsById.get(sheet.id);
      if (!y) continue;
      if (sheet.name !== y.name) {
        console.log(`[card][${pkg}] ${sheet.id} name: sheet="${sheet.name}" yaml="${y.name}"`);
        diffs++;
      }
      if (normalizeType(sheet.type) !== normalizeType(y.type)) {
        console.log(`[card][${pkg}] ${sheet.id} type: sheet="${sheet.type}" yaml="${y.type}"`);
        diffs++;
      }
      if (Number(sheet.cost) !== y.cost) {
        console.log(`[card][${pkg}] ${sheet.id} cost: sheet="${sheet.cost}" yaml="${y.cost}"`);
        diffs++;
      }
      const sE = normalize(sheet.effect ?? '');
      const yE = normalize(y.effect ?? '');
      if (sE !== yE) {
        console.log(`[card][${pkg}] ${sheet.id} effect:`);
        console.log(`  sheet: ${JSON.stringify(sE)}`);
        console.log(`   yaml: ${JSON.stringify(yE)}`);
        diffs++;
      }
    }

    if (sheetRows.length > 0 && sheetRows[0].badge !== undefined) {
      const sheetBadge = sheetRows[0].badge;
      if (sheetBadge && sheetBadge !== target.expansion.badge) {
        console.log(
          `[card][${pkg}] badge: sheet="${sheetBadge}" yaml="${target.expansion.badge}"`,
        );
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
    const nemesesById = new Map(
      (target.expansion.nemeses ?? []).map((n) => [n.id, n]),
    );
    const sheetIds = new Set(sheetRows.map((r) => r.id));
    for (const id of sheetIds) {
      if (!nemesesById.has(id)) {
        console.log(`[nemesis][${pkg}] YAML 欠落: ${id}`);
        diffs++;
      }
    }
    for (const id of nemesesById.keys()) {
      if (!sheetIds.has(id)) {
        console.log(`[nemesis][${pkg}] シート欠落: ${id}`);
        diffs++;
      }
    }
    for (const sheet of sheetRows) {
      const y = nemesesById.get(sheet.id);
      if (!y) continue;
      if (sheet.name !== y.name) {
        console.log(`[nemesis][${pkg}] ${sheet.id} name: sheet="${sheet.name}" yaml="${y.name}"`);
        diffs++;
      }
      const sLevel = sheet.level === '' || sheet.level === '-' ? undefined : Number(sheet.level);
      if (sLevel !== y.level) {
        console.log(`[nemesis][${pkg}] ${sheet.id} level: sheet="${sLevel}" yaml="${y.level}"`);
        diffs++;
      }
      if (Number(sheet.battle) !== y.battle) {
        console.log(`[nemesis][${pkg}] ${sheet.id} battle: sheet="${sheet.battle}" yaml="${y.battle}"`);
        diffs++;
      }
      const sR = normalize(sheet.rule ?? '');
      const yR = normalize(y.rule ?? '');
      if (sR !== yR) {
        console.log(`[nemesis][${pkg}] ${sheet.id} rule:`);
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
    const magesById = new Map(
      (target.expansion.mages ?? []).map((m) => [m.id, m]),
    );
    const sheetIds = new Set(sheetRows.map((r) => r.id));
    for (const id of sheetIds) {
      if (!magesById.has(id)) {
        console.log(`[player][${pkg}] YAML 欠落: ${id}`);
        diffs++;
      }
    }
    for (const id of magesById.keys()) {
      if (!sheetIds.has(id)) {
        console.log(`[player][${pkg}] シート欠落: ${id}`);
        diffs++;
      }
    }
    for (const sheet of sheetRows) {
      const y = magesById.get(sheet.id);
      if (!y) continue;
      if (sheet.name !== y.name) {
        console.log(`[player][${pkg}] ${sheet.id} name: sheet="${sheet.name}" yaml="${y.name}"`);
        diffs++;
      }
      if (sheet.job !== y.job) {
        console.log(`[player][${pkg}] ${sheet.id} job: sheet="${sheet.job}" yaml="${y.job}"`);
        diffs++;
      }
      const sLevel = sheet.level === '' || sheet.level === '-' ? undefined : Number(sheet.level);
      if (sLevel !== y.level) {
        console.log(`[player][${pkg}] ${sheet.id} level: sheet="${sLevel}" yaml="${y.level}"`);
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

console.log(`\n合計 ${diffs} 件の差分`);
process.exit(diffs > 0 ? 1 : 0);
