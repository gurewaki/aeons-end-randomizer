'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: '/', label: 'サプライ' },
  { href: '/cards', label: 'カード一覧' },
  { href: '/nemesis', label: 'ネメシス' },
  { href: '/player', label: 'プレイヤー' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname() ?? '/';
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
        <Link
          href="/"
          className="text-base font-bold text-slate-100 sm:text-lg"
        >
          イーオンズ・エンド
        </Link>
        <nav className="-mx-1 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
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
