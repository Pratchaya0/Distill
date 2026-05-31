'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Mic2 } from 'lucide-react';
import { db } from '@/lib/db';
import { RecordingCard } from './RecordingCard';
import type { Recording } from '@/types';

interface RecordingsListProps {
  favoritesOnly?: boolean;
  emptyMessage?: string;
}

export function RecordingsList({
  favoritesOnly,
  emptyMessage = 'No recordings yet. Click "New Recording" to start.',
}: RecordingsListProps) {
  const recordings = useLiveQuery(async () => {
    const all = await db.recordings.orderBy('createdAt').reverse().toArray();
    return favoritesOnly ? all.filter((r) => r.isFavorite) : all;
  }, [favoritesOnly]) as (Recording & { id: number })[] | undefined;

  if (!recordings) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const filtered = recordings;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Mic2 className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{emptyMessage}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Recordings are stored locally in your browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((recording) => (
        <RecordingCard key={recording.id} recording={recording} />
      ))}
    </div>
  );
}
