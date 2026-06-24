'use client';

import { Modal } from './Modal';

/**
 * ネメシスデッキ破棄の確認 Modal。
 * - 新規ゲーム押下時
 * - turn-order の settings 変更等で再構築が必要なとき
 */
export function NemesisDeckResetConfirmModal({
  open,
  title = 'ネメシスデッキをリセットしますか？',
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      labelledBy="nemesis-deck-reset-title"
    >
      <div className="space-y-5">
        <div>
          <h2
            id="nemesis-deck-reset-title"
            className="text-xl font-bold text-slate-50"
          >
            {title}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {description ??
              'デッキとドロー履歴がすべて破棄され、新しいデッキが構築されます。'}
          </p>
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
            className="rounded border border-red-500/60 bg-red-500/30 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/40"
          >
            リセットして再構築
          </button>
        </div>
      </div>
    </Modal>
  );
}
