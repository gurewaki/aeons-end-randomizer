import type { Metadata } from 'next';
import { NemesisRandomizer } from '../components/NemesisRandomizer';

export const metadata: Metadata = {
  title: 'ネメシスランダマイザ',
};

export default function Page() {
  return <NemesisRandomizer />;
}
