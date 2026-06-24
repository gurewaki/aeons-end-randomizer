import { NEMESIS_CARD_TYPE_LABEL } from '../../lib/types';
import type { NemesisDeckCard } from '../../lib/types';

/**
 * ターン順カードの reveal エリアと同じサイズ (h-48 w-36) で、
 * ネメシスカードのタイプ・名前・体力だけを大きく表示する「face」コンポーネント。
 * 詳細効果は別パネルで全文表示する想定。
 */

const TYPE_FACE_STYLES: Record<'Attack' | 'Minion' | 'Power', string> = {
  Attack: 'border-violet-400 bg-violet-700/70 text-violet-50',
  Minion: 'border-sky-400 bg-sky-700/70 text-sky-50',
  Power: 'border-yellow-400 bg-yellow-700/70 text-yellow-50',
};

const TYPE_ICON: Record<'Attack' | 'Minion' | 'Power', string> = {
  Attack: '⚔',
  Minion: '✦',
  Power: '★',
};

type Size = 'normal' | 'large';

export function NemesisDeckCardFace({
  card,
  size = 'large',
}: {
  card: NemesisDeckCard;
  size?: Size;
}) {
  const type = card.card.type;
  const inner = card.card;
  const styles = type
    ? TYPE_FACE_STYLES[type]
    : 'border-slate-500 bg-slate-700/70 text-slate-50';
  const sizeClass = size === 'large' ? 'h-48 w-36' : 'h-32 w-24';
  const icon = type ? TYPE_ICON[type] : '?';

  return (
    <div
      className={`flex flex-col items-center justify-between rounded-md border-2 p-2 shadow-md ${styles} ${sizeClass}`}
    >
      <div className="text-[10px] uppercase tracking-wider opacity-80">
        {type ? NEMESIS_CARD_TYPE_LABEL[type] : 'カード'}
      </div>
      <div className="text-3xl">{icon}</div>
      <div className="line-clamp-3 text-center text-xs font-bold leading-tight">
        {inner.name}
      </div>
      {inner.life !== undefined && (
        <div className="text-[10px] opacity-90">体力 {inner.life}</div>
      )}
    </div>
  );
}

/** デッキ裏面: ターン順の N (nemesis) カードと同じ赤系で、大きな "N" を中央に表示 */
export function NemesisDeckBack({ size = 'large' }: { size?: Size }) {
  const sizeClass = size === 'large' ? 'h-48 w-36' : 'h-32 w-24';
  const labelClass = size === 'large' ? 'text-7xl' : 'text-5xl';
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-md border-2 border-red-500 bg-red-600/30 text-red-100 shadow-md ${sizeClass}`}
    >
      <span className={`font-bold leading-none ${labelClass}`}>N</span>
      <span className="mt-1 text-[10px] font-medium opacity-90">ネメシス</span>
    </div>
  );
}
