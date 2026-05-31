'use client';

import { Mic, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaptureMode } from '@/types';

interface ModeToggleProps {
  mode: CaptureMode;
  onChange: (mode: CaptureMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
      {(['mic', 'screen'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            mode === m
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {m === 'mic' ? <Mic className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
          {m === 'mic' ? 'Microphone' : 'Screen / Tab'}
        </button>
      ))}
    </div>
  );
}
