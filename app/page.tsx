import type { Metadata } from 'next';
import { SupplyRandomizer } from './components/SupplyRandomizer';

export const metadata: Metadata = {
  title: 'サプライランダマイザ',
};

export default function Page() {
  return <SupplyRandomizer />;
}
