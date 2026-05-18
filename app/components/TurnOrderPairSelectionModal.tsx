'use client';

import type { PlayerValue } from '../../lib/turnOrder';
import { Modal } from './Modal';

const PLAYER_BUTTON: Record<PlayerValue, string> = {
  1: 'border-yellow-400 bg-yellow-500/30 text-yellow-100 hover:bg-yellow-500/40',
  2: 'border-orange-400 bg-orange-500/30 text-orange-100 hover:bg-orange-500/40',
  3: 'border-blue-400 bg-blue-500/30 text-blue-100 hover:bg-blue-500/40',
  4: 'border-purple-400 bg-purple-500/30 text-purple-100 hover:bg-purple-500/40',
};

/**
 * ペアカード公開時、上半分/下半分のどちらのプレイヤーが行動するか選択する Modal。
 * 同じペアの 2 枚目はこの Modal を出さず、自動割り振りされる。
 */
export function TurnOrderPairSelectionModal({
  open,
  values,
  onSelect,
}: {
  open: boolean;
  values: [PlayerValue, PlayerValue];
  onSelect: (v: PlayerValue) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={() => {
        /* 強制選択: 閉じるはできない */
      }}
      labelledBy="pair-title"
    >
      <div className="space-y-4">
        <div>
          <h2 id="pair-title" className="text-xl font-bold text-slate-50">
            ペアカード「{values[0]}/{values[1]}」を公開
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            このターンを実行するプレイヤーを選んでください。次に同じペアを引いたら、選ばなかった方が自動的に実行します
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 py-2">
          {values.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onSelect(v)}
              className={`h-20 w-16 rounded-md border-2 text-3xl font-bold transition ${PLAYER_BUTTON[v]}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
