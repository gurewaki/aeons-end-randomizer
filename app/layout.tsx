import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from './components/Navigation';
import { TurnOrderProgressProvider } from './components/TurnOrderProgressContext';

export const metadata: Metadata = {
  title: {
    default: 'イーオンズ・エンド ツール',
    template: '%s | イーオンズ・エンド',
  },
  description: 'イーオンズ・エンドのサプライ・カード・ネメシス・プレイヤーを扱う非公式ユーティリティ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">
        <TurnOrderProgressProvider>
          <Navigation />
          {children}
        </TurnOrderProgressProvider>
      </body>
    </html>
  );
}
