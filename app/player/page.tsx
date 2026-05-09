import type { Metadata } from 'next';
import { PlayerRandomizer } from '../components/PlayerRandomizer';

export const metadata: Metadata = {
  title: 'プレイヤーランダマイザ',
};

export default function Page() {
  return <PlayerRandomizer />;
}
