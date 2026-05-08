import type { Metadata } from 'next';
import { StubPage } from '../components/StubPage';

export const metadata: Metadata = {
  title: 'カード一覧',
};

export default function Page() {
  return (
    <StubPage
      title="カード一覧"
      description="拡張・タイプ・コスト・名前で絞り込んでカードを閲覧します"
    />
  );
}
