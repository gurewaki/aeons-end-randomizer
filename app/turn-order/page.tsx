import type { Metadata } from 'next';
import { TurnOrderRandomizer } from '../components/TurnOrderRandomizer';

export const metadata: Metadata = {
  title: 'ターン順カードシャッフラ',
};

export default function Page() {
  return <TurnOrderRandomizer />;
}
