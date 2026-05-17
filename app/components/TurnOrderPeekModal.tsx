'use client';

import type { TurnOrderCard } from '../../lib/turnOrder';
import { Modal } from './Modal';
import { TurnOrderCardFace } from './TurnOrderCardTile';

/**
 * 山札の一番上を「見る」モード。
 * 確認後、捨て札 / 山の上に戻す (キャンセル) / 山の底に戻す を選択する。
 */
export function TurnOrderPeekModal({
  open,
  card,
  onDiscard,
  onReturnTop,
  onReturnBottom,
}: {
  open: boolean;
  card: TurnOrderCard | null;
  onDiscard: () => void;
  onReturnTop: () => void;
  onReturnBottom: () => void;
}) {
  return (
    <Modal open={open && card !== null} onClose={onReturnTop} labelledBy="peek-title">
      {card && (
        <div className="space-y-5">
          <div>
            <h2 id="peek-title" className="text-xl font-bold text-slate-50">
              山札の一番上
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              内容を確認した後、行き先を選んでください
            </p>
          </div>

          <div className="flex justify-center py-4">
            <TurnOrderCardFace card={card} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onDiscard}
              className="rounded border border-emerald-500/60 bg-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/40"
            >
              捨て札へ送る
            </button>
            <button
              type="button"
              onClick={onReturnTop}
              className="rounded border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              山の上に戻す
            </button>
            <button
              type="button"
              onClick={onReturnBottom}
              className="rounded border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              山の底に戻す
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
