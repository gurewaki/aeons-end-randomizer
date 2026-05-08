import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'イーオンズ・エンド サプライランダマイザ',
  description: 'イーオンズ・エンドのサプライをランダム生成します',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
