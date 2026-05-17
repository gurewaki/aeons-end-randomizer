import { Fragment, type ReactNode } from 'react';

/**
 * 効果文を「または」を区切り行とみなして分割する。
 * "または" だけの行が segment の境界になる。
 */
export function splitOrSegments(effect: string): string[] {
  const lines = effect.split('\n');
  const segments: string[] = [];
  let buf: string[] = [];
  for (const line of lines) {
    if (line.trim() === 'または') {
      segments.push(buf.join('\n').trim());
      buf = [];
    } else {
      buf.push(line);
    }
  }
  segments.push(buf.join('\n').trim());
  return segments.filter((s) => s.length > 0);
}

export function OrDivider() {
  return (
    <div className="my-1.5 flex items-center gap-2">
      <span className="h-px flex-1 bg-slate-600/80" />
      <span className="text-[10px] tracking-widest text-slate-400">または</span>
      <span className="h-px flex-1 bg-slate-600/80" />
    </div>
  );
}

// ----------------------------------------------------------------------------
// 効果文中のゲーム用語を太字化する処理
//
// 用語追加はここに足す。ネメシス固有用語 (例: 群舞) は将来パッケージ別に
// 分割できるが、今は全カード共通の単一リストで運用する。
// ----------------------------------------------------------------------------

const FIXED_TERMS = [
  // 共通名詞
  'プレイヤー',
  '仲間',
  '破孔',
  '破壊',
  'グレイヴホールド',
  '体力',
  '接続',
  // フェーズ・効果マーカー (コロン込みで太字化)
  'キャスト：',
  'セット中：',
  '継続：',
  '廃棄：',
  // キーワード
  'リンク',
  'エコー',
  '暴走',
  // パッケージ固有 (甲殻の女王)
  '群舞',
];

const VARIABLE_PATTERNS = [
  'パワー\\d+：', // パワーN：
  '<[^>]+>', // <XXX> (カッコ込みで太字化)
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 長い用語を先にマッチさせるためソート
const sortedFixed = [...FIXED_TERMS].sort((a, b) => b.length - a.length);
const EMPHASIS_RE = new RegExp(
  [...VARIABLE_PATTERNS, ...sortedFixed.map(escapeRegex)].join('|'),
  'g',
);

function renderEmphasized(text: string): ReactNode {
  const matches = [...text.matchAll(EMPHASIS_RE)];
  if (matches.length === 0) return text;
  const nodes: ReactNode[] = [];
  let lastIdx = 0;
  matches.forEach((m, i) => {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (start > lastIdx) nodes.push(text.slice(lastIdx, start));
    nodes.push(
      <strong key={i} className="font-bold text-slate-100">
        {m[0]}
      </strong>,
    );
    lastIdx = end;
  });
  if (lastIdx < text.length) nodes.push(text.slice(lastIdx));
  return <>{nodes}</>;
}

/**
 * 効果文を「または」divider で区切って表示する。
 * 単独行に「または」を含む場合のみ divider に変換され、それ以外は通常の改行。
 * ゲーム用語 (プレイヤー / 破孔 / キャスト： / パワーN： / <XXX> 等) は太字化される。
 */
export function EffectText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const segments = splitOrSegments(text);
  return (
    <div className={className}>
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {i > 0 && <OrDivider />}
          <p className="whitespace-pre-line">{renderEmphasized(seg)}</p>
        </Fragment>
      ))}
    </div>
  );
}
