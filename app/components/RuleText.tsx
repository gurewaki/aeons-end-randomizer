import { Fragment } from 'react';
import { renderRichText } from './EffectText';

/**
 * 行頭が `- ` または `・` の連続行を箇条書きとみなして `<ul>` に変換する。
 * それ以外の行は通常段落として描画。空行は段落の区切りとして無視する。
 *
 * シートで `- 文字列` 形式の bullet を使う前提だが、過渡期や手動編集での
 * `・` も同じく bullet として認識する。
 */
function isBullet(line: string): string | null {
  // 行頭スペース許容で `- ` あるいは `・`
  const m = line.match(/^\s*(?:- |・)(.*)$/);
  return m ? m[1] : null;
}

type Block =
  | { kind: 'para'; lines: string[] }
  | { kind: 'list'; items: string[] };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    const item = isBullet(line);
    if (item !== null) {
      if (current?.kind === 'list') current.items.push(item);
      else {
        if (current) blocks.push(current);
        current = { kind: 'list', items: [item] };
      }
    } else if (line.trim() === '') {
      if (current) {
        blocks.push(current);
        current = null;
      }
    } else {
      if (current?.kind === 'para') current.lines.push(line);
      else {
        if (current) blocks.push(current);
        current = { kind: 'para', lines: [line] };
      }
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

export function RuleText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseBlocks(text);
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      {blocks.map((b, i) => (
        <Fragment key={i}>
          {b.kind === 'para' ? (
            <p className="whitespace-pre-line">
              {renderRichText(b.lines.join('\n'))}
            </p>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {b.items.map((item, j) => (
                <li key={j}>{renderRichText(item)}</li>
              ))}
            </ul>
          )}
        </Fragment>
      ))}
    </div>
  );
}
