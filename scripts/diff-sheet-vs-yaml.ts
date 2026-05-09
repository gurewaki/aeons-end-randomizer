import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';

const YAML_DIR = 'data/expansions';
const SEASON_TABS = [
  'シーズン1',
  'シーズン2',
  'シーズン3',
  'シーズン4',
  'プロモーション',
];

type Row = {
  package: string;
  badge?: string;
  id: string;
  name: string;
  type: string;
  cost: string;
  effect: string;
};

type YamlCard = {
  id: string;
  name: string;
  type: string;
  cost: number;
  effect?: string;
};

type YamlExpansion = {
  id: string;
  name: string;
  badge?: string;
  cards: YamlCard[];
};

function parseCsv(text: string): Row[] {
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
  const idx = (n: string) => header.indexOf(n);
  return data
    .filter((r) => r.some((v) => v))
    .map((r) => ({
      package: r[idx('package')] ?? '',
      badge: r[idx('badge')] ?? undefined,
      id: r[idx('id')] ?? '',
      name: r[idx('name')] ?? '',
      type: r[idx('type')] ?? '',
      cost: r[idx('cost')] ?? '',
      effect: r[idx('effect')] ?? '',
    }));
}

function loadYamlByName(): Map<
  string,
  { file: string; expansion: YamlExpansion; cardsById: Map<string, YamlCard> }
> {
  const out = new Map<
    string,
    { file: string; expansion: YamlExpansion; cardsById: Map<string, YamlCard> }
  >();
  const files = readdirSync(YAML_DIR).filter(
    (f) => f.endsWith('.yaml') || f.endsWith('.yml'),
  );
  for (const file of files) {
    const text = readFileSync(join(YAML_DIR, file), 'utf8');
    const exp = yaml.load(text) as YamlExpansion;
    const cardsById = new Map(exp.cards.map((c) => [c.id, c]));
    out.set(exp.name, { file, expansion: exp, cardsById });
  }
  return out;
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\s+$/, '');
}

const sheetDir = process.argv[2] ?? join(tmpdir(), 'aeons-end-sheets');
const yamlByName = loadYamlByName();

let diffs = 0;

// Collect all sheet rows across all season tabs, grouped by package
const sheetByPackage = new Map<string, Row[]>();
for (const tab of SEASON_TABS) {
  const csvFile = join(sheetDir, `${tab.replaceAll('：', '_').replaceAll('・', '')}.csv`);
  const csv = readFileSync(csvFile, 'utf8');
  const rows = parseCsv(csv);
  for (const row of rows) {
    if (!row.package) {
      console.log(`[${tab}] ${row.id}: package 空欄`);
      diffs++;
      continue;
    }
    const arr = sheetByPackage.get(row.package) ?? [];
    arr.push(row);
    sheetByPackage.set(row.package, arr);
  }
}

// 1) シート上に出てくる package が YAML に存在するか
for (const pkg of sheetByPackage.keys()) {
  if (!yamlByName.has(pkg)) {
    console.log(`シートの package "${pkg}" に対応する YAML が見つかりません`);
    diffs++;
  }
}

// 2) YAML 側にある package がシートで触れられているか
for (const pkg of yamlByName.keys()) {
  if (!sheetByPackage.has(pkg)) {
    console.log(`YAML の package "${pkg}" がシートに含まれていません`);
    diffs++;
  }
}

// 3) 各 package について card 単位で diff
for (const [pkg, sheetRows] of sheetByPackage.entries()) {
  const target = yamlByName.get(pkg);
  if (!target) continue; // 1 で報告済み

  const sheetIds = new Set(sheetRows.map((r) => r.id));
  const yamlIds = new Set(target.cardsById.keys());

  for (const id of sheetIds) {
    if (!yamlIds.has(id)) {
      console.log(`[${pkg}] YAML 欠落: ${id}`);
      diffs++;
    }
  }
  for (const id of yamlIds) {
    if (!sheetIds.has(id)) {
      console.log(`[${pkg}] シート欠落: ${id}`);
      diffs++;
    }
  }

  for (const sheet of sheetRows) {
    const y = target.cardsById.get(sheet.id);
    if (!y) continue;
    if (sheet.name !== y.name) {
      console.log(`[${pkg}] ${sheet.id} name 差分: sheet="${sheet.name}" yaml="${y.name}"`);
      diffs++;
    }
    if (sheet.type !== y.type) {
      console.log(`[${pkg}] ${sheet.id} type 差分: sheet="${sheet.type}" yaml="${y.type}"`);
      diffs++;
    }
    if (Number(sheet.cost) !== y.cost) {
      console.log(`[${pkg}] ${sheet.id} cost 差分: sheet="${sheet.cost}" yaml="${y.cost}"`);
      diffs++;
    }
    const sheetE = normalize(sheet.effect);
    const yamlE = normalize(y.effect ?? '');
    if (sheetE !== yamlE) {
      console.log(`[${pkg}] ${sheet.id} effect 差分:`);
      console.log(`  sheet: ${JSON.stringify(sheetE)}`);
      console.log(`   yaml: ${JSON.stringify(yamlE)}`);
      diffs++;
    }
  }

  // 4) badge 列が YAML の badge と一致するか (カード行の最初の値で代表)
  if (sheetRows.length > 0 && sheetRows[0].badge !== undefined) {
    const sheetBadge = sheetRows[0].badge;
    const yamlBadge = target.expansion.badge;
    if (sheetBadge !== yamlBadge) {
      console.log(
        `[${pkg}] badge 差分: sheet="${sheetBadge}" yaml="${yamlBadge}"`,
      );
      diffs++;
    }
  }
}

console.log(`\n合計 ${diffs} 件の差分`);
process.exit(diffs > 0 ? 1 : 0);
