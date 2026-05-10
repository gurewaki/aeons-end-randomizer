import type { Metadata } from 'next';
import { Library } from '../components/Library';

export const metadata: Metadata = {
  title: '図鑑',
};

export default function Page() {
  return <Library />;
}
