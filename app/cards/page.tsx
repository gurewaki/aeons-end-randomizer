import type { Metadata } from 'next';
import { CardList } from '../components/CardList';

export const metadata: Metadata = {
  title: 'カード一覧',
};

export default function Page() {
  return <CardList />;
}
