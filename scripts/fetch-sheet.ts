import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// 統合スプレッドシート (9 タブ構成)
// SHEET_ID は .env.local から注入される (package.json の fetch:sheet が --env-file で読み込む)
const SHEET_ID = process.env.SHEET_ID;
if (!SHEET_ID) {
  throw new Error(
    'SHEET_ID が未設定です。.env.local に SHEET_ID=<spreadsheet id> を記入してください (.env.example 参照)',
  );
}

const TABS = [
  'season',
  'setup',
  'card',
  'nemesis',
  'player',
  'nemesis_card',
  'nemesis_specific_card',
  'treasure',
  'player_unique_card',
];

const OUT_DIR = process.argv[2] ?? join(tmpdir(), 'aeons-end-sheets');
mkdirSync(OUT_DIR, { recursive: true });

async function fetchTab(name: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return await res.text();
}

async function main() {
  for (const tab of TABS) {
    const csv = await fetchTab(tab);
    const file = join(OUT_DIR, `${tab}.csv`);
    writeFileSync(file, csv, 'utf8');
    const lines = csv.split('\n').length;
    console.log(`[${tab}] ${lines} 行 → ${file}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
