'use client';

import { Mic, Monitor } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import type { CaptureMode } from '@/types';

interface ModeToggleProps {
  mode: CaptureMode;
  onChange: (mode: CaptureMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  // getDisplayMedia is unsupported in Capacitor WebViews
  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
      <button
        onClick={() => onChange('mic')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          mode === 'mic'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <Mic className="w-3.5 h-3.5" />
        Microphone
      </button>

      {!isNative && (
        <button
          onClick={() => onChange('screen')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            mode === 'screen'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <Monitor className="w-3.5 h-3.5" />
          Screen / Tab
        </button>
      )}
    </div>
  );
}
