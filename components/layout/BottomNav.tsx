'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListMusic, Star, LayoutTemplate, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/recordings', label: 'Recordings', icon: ListMusic },
  { href: '/favorites',  label: 'Favorites',  icon: Star },
  { href: '/templates',  label: 'Templates',  icon: LayoutTemplate },
  { href: '/settings',   label: 'Settings',   icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-card border-t border-border flex items-stretch">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
