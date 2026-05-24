'use client';

import type { TurnOrderCard } from '../../lib/turnOrder';
import { Modal } from './Modal';
import { TurnOrderCardFace } from './TurnOrderCardTile';

/**
 * 捨て札から山に戻す前の確認 Modal。対象カードを視覚的に表示する。
 */
export function TurnOrderReturnConfirmModal({
  open,
  card,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  card: TurnOrderCard | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open && card !== null} onClose={onCancel} labelledBy="return-confirm-title">
      {card && (
        <div className="space-y-5">
          <div>
            <h2 id="return-confirm-title" className="text-xl font-bold text-slate-50">
              このカードを山に戻しますか？
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              山に戻すと、ターン順カードの山が再シャッフルされます。
            </p>
          </div>

          <div className="flex justify-center py-4">
            <TurnOrderCardFace card={card} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded border border-emerald-500/60 bg-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/40"
            >
              山に戻す
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
