import type { Metadata } from 'next';
import { TurnOrderTrial } from '../components/TurnOrderTrial';

export const metadata: Metadata = {
  title: 'ターン順+ネメシス (β)',
};

export default function Page() {
  return <TurnOrderTrial />;
}
