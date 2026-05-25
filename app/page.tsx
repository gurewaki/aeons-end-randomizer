import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SupplyRandomizer } from './components/SupplyRandomizer';

export const metadata: Metadata = {
  title: 'サプライランダマイザ',
};

export default function Page() {
  // SupplyRandomizer は内部で useSearchParams を使っているため
  // 静的エクスポート時の prerender を回避するため Suspense でラップする
  return (
    <Suspense>
      <SupplyRandomizer />
    </Suspense>
  );
}
