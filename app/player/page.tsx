import type { Metadata } from 'next';
import { StubPage } from '../components/StubPage';

export const metadata: Metadata = {
  title: 'プレイヤーランダマイザ',
};

export default function Page() {
  return (
    <StubPage
      title="プレイヤーランダマイザ"
      description="人数を指定して、人数分のメイジをランダム選択します"
    />
  );
}
