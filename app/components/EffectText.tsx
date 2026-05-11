import { Fragment } from 'react';

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

/**
 * 効果文を「または」divider で区切って表示する。
 * 単独行に「または」を含む場合のみ divider に変換され、それ以外は通常の改行。
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
          <p className="whitespace-pre-line">{seg}</p>
        </Fragment>
      ))}
    </div>
  );
}
