'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TurnOrderCard } from '../../lib/turnOrder';
import { Modal } from './Modal';
import { TurnOrderCardFace } from './TurnOrderCardTile';

function SortableRow({ card, index }: { card: TurnOrderCard; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-3 rounded-md border border-slate-700 bg-slate-800/60 p-2 active:cursor-grabbing"
    >
      <span className="w-8 text-center text-xs text-slate-400">
        {index + 1}
      </span>
      <TurnOrderCardFace card={card} size="small" />
      <span className="ml-2 text-xs text-slate-400">
        {index === 0 ? '一番上' : ''}
      </span>
    </div>
  );
}

export function TurnOrderReorderModal({
  open,
  cards,
  onClose,
  onApply,
}: {
  open: boolean;
  cards: TurnOrderCard[];
  onClose: () => void;
  onApply: (next: TurnOrderCard[]) => void;
}) {
  const [items, setItems] = useState<TurnOrderCard[]>(cards);

  // 開かれるたびに最新の cards で初期化
  useEffect(() => {
    if (open) setItems(cards);
    // open の遷移時のみリセットしたいので cards を deps から外す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((c) => c.id === active.id);
    const newIdx = items.findIndex((c) => c.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    setItems(arrayMove(items, oldIdx, newIdx));
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="reorder-title">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="reorder-title"
              className="text-xl font-bold text-slate-50"
            >
              ターン順カードの山を並べ替える
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              ドラッグして順番を変更してください。一番上のカードが次に公開されます
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-base leading-none text-slate-200 hover:bg-slate-700/70"
          >
            ×
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((c, i) => (
                <SortableRow key={c.id} card={c} index={i} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-600 bg-slate-800 px-4 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(items);
              onClose();
            }}
            className="rounded border border-emerald-500/60 bg-emerald-500/30 px-4 py-1.5 text-sm font-medium text-emerald-100 hover:bg-emerald-500/40"
          >
            この順序で確定
          </button>
        </div>
      </div>
    </Modal>
  );
}
