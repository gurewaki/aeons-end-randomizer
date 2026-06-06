'use client';

import type { Card } from '../../lib/types';
import { Modal } from './Modal';
import { CardTile } from './CardTile';

/**
 * サプライの 1 枚を再抽選する前の確認 Modal。対象カードを表示する。
 */
export function SupplyRerollConfirmModal({
  open,
  card,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  card: Card | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open && card !== null}
      onClose={onCancel}
      labelledBy="reroll-confirm-title"
    >
      {card && (
        <div className="space-y-5">
          <div>
            <h2
              id="reroll-confirm-title"
              className="text-xl font-bold text-slate-50"
            >
              このカードを再抽選しますか？
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              同じスロット制約 (タイプ・コスト範囲) の中から別のカードを 1
              枚抽選し直します。他のカードは変わりません。
            </p>
          </div>

          <div className="mx-auto max-w-md py-2">
            <CardTile card={card} />
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
              再抽選する
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
