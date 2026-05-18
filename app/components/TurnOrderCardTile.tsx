import type { TurnOrderCard, PlayerValue } from '../../lib/turnOrder';

/** プレイヤー値ごとのゲーム内配色 (1:黄, 2:橙, 3:青, 4:紫) */
const PLAYER_FRAME: Record<PlayerValue, string> = {
  1: 'border-yellow-400 bg-yellow-500/30 text-yellow-100',
  2: 'border-orange-400 bg-orange-500/30 text-orange-100',
  3: 'border-blue-400 bg-blue-500/30 text-blue-100',
  4: 'border-purple-400 bg-purple-500/30 text-purple-100',
};

/** ペアカードの半分用 (背景 + 文字色のみ) */
const PLAYER_HALF: Record<PlayerValue, string> = {
  1: 'bg-yellow-500/50 text-yellow-50',
  2: 'bg-orange-500/50 text-orange-50',
  3: 'bg-blue-500/50 text-blue-50',
  4: 'bg-purple-500/50 text-purple-50',
};

function cardFace(card: TurnOrderCard): {
  frame: string;
  label: string;
  sub?: string;
} {
  switch (card.kind) {
    case 'player':
      return {
        frame: PLAYER_FRAME[card.value as PlayerValue],
        label: String(card.value),
      };
    case 'nemesis':
      return {
        frame: 'border-red-500 bg-red-600/30 text-red-100',
        label: 'N',
        sub: 'ネメシス',
      };
    case 'doom':
      return {
        frame: 'border-red-500 bg-red-600/40 text-red-100',
        label: '急襲',
      };
    case 'wild':
      return {
        frame: 'border-slate-200 bg-slate-100 text-slate-900',
        label: 'W',
        sub: card.revealedAs !== undefined ? `→ P${card.revealedAs}` : 'ワイルド',
      };
    case 'pair':
      // ペアカードは構造が異なるので別経路で描画。ここでは使用されない。
      return { frame: '', label: '' };
  }
}

/** ペアカードを縦半分割で描画 */
function PairFace({
  card,
  size,
}: {
  card: TurnOrderCard;
  size: 'normal' | 'small';
}) {
  const [top, bottom] = card.pairValues as [PlayerValue, PlayerValue];
  const chosen = card.revealedAs;
  const sizeBox =
    size === 'small' ? 'h-20 w-14 text-xl' : 'h-32 w-24 text-4xl';
  const dim = (v: PlayerValue) =>
    chosen !== undefined && chosen !== v ? 'opacity-25' : '';
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-md border-2 border-slate-200 shadow-md ${sizeBox}`}
    >
      <div
        className={`flex flex-1 items-center justify-center font-bold ${PLAYER_HALF[top]} ${dim(top)}`}
      >
        {top}
      </div>
      <div className="h-px w-full bg-slate-300/70" />
      <div
        className={`flex flex-1 items-center justify-center font-bold ${PLAYER_HALF[bottom]} ${dim(bottom)}`}
      >
        {bottom}
      </div>
    </div>
  );
}

/** 共通の表サイズ・形状 */
const FACE_BASE =
  'flex h-32 w-24 flex-col items-center justify-center rounded-md border-2 shadow-md select-none';

/** カード表 (公開済み) */
export function TurnOrderCardFace({
  card,
  size = 'normal',
}: {
  card: TurnOrderCard;
  size?: 'normal' | 'small';
}) {
  if (card.kind === 'pair') {
    return <PairFace card={card} size={size} />;
  }
  const face = cardFace(card);
  const sizeClass =
    size === 'small'
      ? 'h-20 w-14 text-2xl'
      : 'h-32 w-24 text-5xl';
  return (
    <div
      className={`${FACE_BASE.replace('h-32 w-24', '')} ${sizeClass} ${face.frame}`}
    >
      <span className="font-bold leading-none">{face.label}</span>
      {face.sub && (
        <span className="mt-1 text-[10px] font-medium opacity-90">
          {face.sub}
        </span>
      )}
    </div>
  );
}

/** カード裏 (山札表示用) */
export function TurnOrderCardBack({
  size = 'normal',
}: {
  size?: 'normal' | 'small';
}) {
  const sizeClass =
    size === 'small'
      ? 'h-20 w-14 text-[10px]'
      : 'h-32 w-24 text-xs';
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-md border-2 border-slate-500 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-slate-400 shadow-md ${sizeClass}`}
    >
      <span className="text-2xl">✦</span>
      <span className="mt-1 tracking-widest">TURN</span>
    </div>
  );
}
