import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aeons End マーケットランダマイザー',
  description: 'Aeons End のマーケット (サプライ) をランダム生成します',
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
