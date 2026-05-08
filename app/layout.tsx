import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from './components/Navigation';

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
        <Navigation />
        {children}
      </body>
    </html>
  );
}
