import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SHEET_ID = '1XINA8TPodoFbw5LQv8dlbjL4JfKMCqiY0dkvkv5YrzI';

// シート上のタブ名 (シーズン区切り + プロモーション)。各タブには複数 package が混在しうる
const TABS = [
  'シーズン1',
  'シーズン2',
  'シーズン3',
  'シーズン4',
  'プロモーション',
];

const OUT_DIR = process.argv[2] ?? join(tmpdir(), 'aeons-end-sheets');
mkdirSync(OUT_DIR, { recursive: true });

async function fetchTab(name: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return await res.text();
}

function slug(name: string): string {
  return name.replaceAll('：', '_').replaceAll('・', '');
}

async function main() {
  for (const tab of TABS) {
    const csv = await fetchTab(tab);
    const file = join(OUT_DIR, `${slug(tab)}.csv`);
    writeFileSync(file, csv, 'utf8');
    const lines = csv.split('\n').length;
    console.log(`[${tab}] ${lines} 行 → ${file}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
