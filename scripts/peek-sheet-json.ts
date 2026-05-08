import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const sheetId = process.argv[2];
const tabName = process.argv[3];
if (!sheetId || !tabName) {
  console.error('Usage: tsx scripts/peek-sheet-json.ts <sheetId> <tabName>');
  process.exit(1);
}

const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
const outDir = join(tmpdir(), 'aeons-end-peek');
mkdirSync(outDir, { recursive: true });
const slug = tabName.replaceAll('：', '_').replaceAll('・', '');
const outFile = join(outDir, `${slug}.json.txt`);
const csvFile = join(outDir, `${slug}.parsed.csv`);

(async () => {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  writeFileSync(outFile, text, 'utf8');

  const m = text.match(/setResponse\(([\s\S]+)\)/);
  if (!m) {
    console.error('Could not extract JSON payload');
    process.exit(1);
  }
  const payload = JSON.parse(m[1]);
  const cols = payload.table.cols.map((c: { label?: string; id?: string }) => c.label || c.id);
  const rows = payload.table.rows.map((r: { c: ({ v?: unknown } | null)[] }) =>
    r.c.map((cell) => (cell?.v ?? '').toString()),
  );
  const csv = [cols, ...rows]
    .map((r: string[]) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(','))
    .join('\n');
  writeFileSync(csvFile, csv, 'utf8');
  console.log(`raw JSON: ${outFile}`);
  console.log(`parsed CSV (${cols.length} cols, ${rows.length} rows): ${csvFile}`);
})();
