'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  AudioWaveform, Star, LayoutTemplate, Settings, ListMusic, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RecorderSheet } from '@/components/recorder/RecorderSheet';

const navItems = [
  { href: '/recordings', label: 'All Recordings', icon: ListMusic },
  { href: '/favorites',  label: 'Favorites',      icon: Star },
  { href: '/templates',  label: 'Templates',      icon: LayoutTemplate },
  { href: '/settings',   label: 'Settings',        icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [recorderOpen, setRecorderOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col border-r border-border bg-card z-40">
        {/* Shell bar brand area */}
        <div className="flex items-center gap-2.5 px-4 h-12 bg-primary text-primary-foreground shrink-0">
          <AudioWaveform className="w-5 h-5" />
          <span className="font-semibold text-sm tracking-tight">Distill</span>
        </div>

        {/* New Recording CTA */}
        <div className="px-3 py-3 border-b border-border">
          <Button
            className="w-full gap-2 h-8 text-sm"
            onClick={() => setRecorderOpen(true)}
          >
            <Plus className="w-4 h-4" />
            New Recording
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 h-9 rounded-sm text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground">Distill · Free · Local</p>
        </div>
      </aside>

      <RecorderSheet open={recorderOpen} onOpenChange={setRecorderOpen} />
    </>
  );
}
