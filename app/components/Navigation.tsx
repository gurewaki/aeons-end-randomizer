'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChessKnight } from 'lucide-react';
import { useTurnOrderProgress } from './TurnOrderProgressContext';

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: '/', label: 'サプライ' },
  { href: '/nemesis', label: 'ネメシス' },
  { href: '/player', label: 'プレイヤー' },
  { href: '/turn-order', label: 'ターン順' },
  { href: '/library', label: '図鑑' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname() ?? '/';
  const { inProgress } = useTurnOrderProgress();

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    // ターン順カード進行中 + ターン順以外への遷移 → 確認
    if (
      inProgress &&
      pathname.startsWith('/turn-order') &&
      !href.startsWith('/turn-order')
    ) {
      const ok = window.confirm(
        'ターン順カードの公開が進行中です。離れると山と捨て札がリセットされます。よろしいですか？',
      );
      if (!ok) e.preventDefault();
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-bold text-slate-100 sm:text-lg"
        >
          <ChessKnight className="h-5 w-5 text-amber-400" aria-hidden="true" />
          イーオンズ・エンド
        </Link>
        <nav className="-mx-1 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={
                  'whitespace-nowrap rounded px-3 py-1.5 text-sm transition ' +
                  (active
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100')
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
