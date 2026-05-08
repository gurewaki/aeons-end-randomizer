import type { Metadata } from 'next';
import { StubPage } from '../components/StubPage';

export const metadata: Metadata = {
  title: 'ネメシスランダマイザ',
};

export default function Page() {
  return (
    <StubPage
      title="ネメシスランダマイザ"
      description="拡張・難易度を指定してネメシスをランダム選択します"
    />
  );
}
