'use client';

import { QRCodeSVG } from 'qrcode.react';

/**
 * 生成されたサプライ構成を URL + QR コードで共有するためのパネル。
 * 親側で組み立てた共有 URL を受け取る。
 */
export function SupplyShareQR({ url }: { url: string }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <h3 className="mb-3 text-lg font-semibold text-slate-100">
        このサプライを共有
        <span className="ml-2 text-xs font-normal text-slate-400">
          QR コードまたは URL を相手に渡してください
        </span>
      </h3>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="rounded-md bg-white p-3 shadow-md">
          <QRCodeSVG value={url} size={160} level="M" />
        </div>
        <a
          href={url}
          className="break-all text-xs text-slate-300 underline-offset-2 hover:text-slate-100 hover:underline"
        >
          {url}
        </a>
      </div>
    </section>
  );
}
