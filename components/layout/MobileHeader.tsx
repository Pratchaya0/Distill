'use client';

import { useState } from 'react';
import { AudioWaveform, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecorderSheet } from '@/components/recorder/RecorderSheet';

export function MobileHeader() {
  const [recorderOpen, setRecorderOpen] = useState(false);

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4 bg-primary text-primary-foreground shadow-sm">
        <div className="flex items-center gap-2">
          <AudioWaveform className="w-5 h-5" />
          <span className="font-semibold text-sm tracking-tight">Distill</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5 h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
          onClick={() => setRecorderOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Record
        </Button>
      </header>
      <RecorderSheet open={recorderOpen} onOpenChange={setRecorderOpen} />
    </>
  );
}
