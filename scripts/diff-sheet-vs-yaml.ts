import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';

const YAML_DIR = 'data/expansions';

const TAB_TO_FILE: Record<string, string> = {
  'イーオンズ・エンド': 'aeons-end-base.yaml',
  'イーオンズ・エンド：外より来たりし闇': 'aeons-end-outer-dark.yaml',
  'イーオンズ・エンド：埋もれた秘密': 'aeons-end-buried-secrets.yaml',
  'イーオンズ・エンド：新たな時代': 'aeons-end-new-age.yaml',
  プロモーション: 'aeons-end-promo.yaml',
};

type Row = { id: string; name: string; type: string; cost: string; effect: string };

function parseCsv(text: string): Row[] {
  // gviz CSV: each value is "..."-quoted; cells may contain newlines + escaped "" quotes
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
  const [header, ...data] = rows.filter((r) => r.length > 1 || r[0]);
  const idx = (n: string) => header.indexOf(n);
  return data
    .filter((r) => r.some((v) => v))
    .map((r) => ({
      id: r[idx('id')],
      name: r[idx('name')],
      type: r[idx('type')],
      cost: r[idx('cost')],
      effect: r[idx('effect')],
    }));
}

function loadYaml(file: string) {
  const text = readFileSync(file, 'utf8');
  const obj = yaml.load(text) as { cards: { id: string; name: string; type: string; cost: number; effect?: string }[] };
  return new Map(obj.cards.map((c) => [c.id, c]));
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\s+$/, '');
}

let diffs = 0;
const sheetDir = process.argv[2] ?? join(tmpdir(), 'aeons-end-sheets');

for (const [tab, yamlFile] of Object.entries(TAB_TO_FILE)) {
  const csvFile = join(sheetDir, `${tab.replaceAll('：', '_').replaceAll('・', '')}.csv`);
  const csv = readFileSync(csvFile, 'utf8');
  const sheetRows = parseCsv(csv);
  const yamlMap = loadYaml(join(YAML_DIR, yamlFile));

  const sheetIds = new Set(sheetRows.map((r) => r.id));
  const yamlIds = new Set(yamlMap.keys());

  for (const id of sheetIds) {
    if (!yamlIds.has(id)) {
      console.log(`[${tab}] YAML 欠落: ${id}`);
      diffs++;
    }
  }
  for (const id of yamlIds) {
    if (!sheetIds.has(id)) {
      console.log(`[${tab}] シート欠落: ${id}`);
      diffs++;
    }
  }

  for (const sheet of sheetRows) {
    const y = yamlMap.get(sheet.id);
    if (!y) continue;
    if (sheet.name !== y.name) {
      console.log(`[${tab}] ${sheet.id} name 差分: sheet="${sheet.name}" yaml="${y.name}"`);
      diffs++;
    }
    if (sheet.type !== y.type) {
      console.log(`[${tab}] ${sheet.id} type 差分: sheet="${sheet.type}" yaml="${y.type}"`);
      diffs++;
    }
    if (Number(sheet.cost) !== y.cost) {
      console.log(`[${tab}] ${sheet.id} cost 差分: sheet="${sheet.cost}" yaml="${y.cost}"`);
      diffs++;
    }
    const sheetE = normalize(sheet.effect);
    const yamlE = normalize(y.effect ?? '');
    if (sheetE !== yamlE) {
      console.log(`[${tab}] ${sheet.id} effect 差分:`);
      console.log(`  sheet: ${JSON.stringify(sheetE)}`);
      console.log(`   yaml: ${JSON.stringify(yamlE)}`);
      diffs++;
    }
  }
}

console.log(`\n合計 ${diffs} 件の差分`);
process.exit(diffs > 0 ? 1 : 0);
