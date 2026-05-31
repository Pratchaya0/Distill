'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RecorderPanel } from './RecorderPanel';

interface RecorderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecorderSheet({ open, onOpenChange }: RecorderSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>New Recording</SheetTitle>
        </SheetHeader>
        <RecorderPanel onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
