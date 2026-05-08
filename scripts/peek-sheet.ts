import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const sheetId = process.argv[2];
const tabName = process.argv[3];
if (!sheetId) {
  console.error('Usage: tsx scripts/peek-sheet.ts <sheetId> [tabName]');
  process.exit(1);
}

const url = tabName
  ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tabName)}`
  : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

const outDir = join(tmpdir(), 'aeons-end-peek');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `${(tabName ?? 'default').replaceAll('：', '_').replaceAll('・', '')}.csv`);

(async () => {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    console.error(`HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const text = await res.text();
  writeFileSync(outFile, text, 'utf8');
  console.log(`saved (${text.length} bytes, ${text.split('\n').length} lines) → ${outFile}`);
})();
