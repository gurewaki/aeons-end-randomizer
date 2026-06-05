'use client';

import { QRCodeSVG } from 'qrcode.react';

/**
 * Modal 内で使う想定の QR コード + URL 表示。
 * 共有 URL を受け取り、QR と URL のテキストを並べて表示する。
 */
export function SupplyShareQR({
  url,
  titleId,
  onClose,
}: {
  url: string;
  titleId?: string;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-xl font-bold text-slate-50">
            このサプライを共有
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            QR コードまたは URL を相手に渡してください
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-base leading-none text-slate-200 hover:bg-slate-700/70"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-md bg-white p-3 shadow-md">
          <QRCodeSVG value={url} size={200} level="M" />
        </div>
        <a
          href={url}
          className="block max-w-full break-all text-center text-xs text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
        >
          {url}
        </a>
      </div>
    </div>
  );
}
