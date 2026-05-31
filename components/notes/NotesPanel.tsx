'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteEditor } from './NoteEditor';
import { db } from '@/lib/db';
import type { Note } from '@/types';

interface NotesPanelProps {
  recordingId: number;
  getCurrentTime: () => number; // snapshot fn — not a reactive prop
  onSeek: (t: number) => void;
}

export function NotesPanel({ recordingId, getCurrentTime, onSeek }: NotesPanelProps) {
  const notes = useLiveQuery(
    () =>
      db.notes
        .where('recordingId')
        .equals(recordingId)
        .sortBy('timestamp'),
    [recordingId],
  ) as (Note & { id: number })[] | undefined;

  const addNote = async () => {
    await db.notes.add({
      recordingId,
      timestamp: getCurrentTime(), // snapshot, not live
      content: '',
      images: [],
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {notes?.length ?? 0} note{notes?.length !== 1 ? 's' : ''}
        </span>
        <Button variant="outline" size="sm" className="gap-2" onClick={addNote}>
          <Plus className="w-3.5 h-3.5" />
          Add note at current time
        </Button>
      </div>

      {!notes || notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <StickyNote className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No notes yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Play the recording and click &quot;Add note at current time&quot; to annotate a moment.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <NoteEditor key={note.id} note={note} onSeek={onSeek} />
          ))}
        </div>
      )}
    </div>
  );
}
