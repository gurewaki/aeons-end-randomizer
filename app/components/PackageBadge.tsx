import type { Expansion } from '../../lib/types';
import { getExpansion } from '../../lib/data';

interface Props {
  expansionId: string;
}

/**
 * パッケージバッジ。Expansion.theme (hex) があればテーマカラーで着色、
 * 無ければ neutral な slate 配色にフォールバック。
 */
export function PackageBadge({ expansionId }: Props) {
  const expansion: Expansion | undefined = getExpansion(expansionId);
  const label = expansion?.badge ?? expansion?.name ?? expansionId;
  const theme = expansion?.theme;

  if (theme) {
    return (
      <span
        className="rounded border px-2 py-0.5 text-xs font-medium"
        style={{
          borderColor: `${theme}99`,
          backgroundColor: `${theme}33`,
          color: theme,
        }}
      >
        {label}
      </span>
    );
  }
  return (
    <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5 text-xs text-slate-300">
      {label}
    </span>
  );
}
