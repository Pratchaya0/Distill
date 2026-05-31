'use client';

import { useRouter } from 'next/navigation';
import { Star, Trash2, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { formatDuration, formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Recording } from '@/types';

interface RecordingCardProps {
  recording: Recording & { id: number };
}

export function RecordingCard({ recording }: RecordingCardProps) {
  const router = useRouter();

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await db.recordings.update(recording.id, { isFavorite: !recording.isFavorite });
  };

  const deleteRecording = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${recording.title}"?`)) return;
    await db.recordings.delete(recording.id);
    await db.notes.where('recordingId').equals(recording.id).delete();
    toast.success('Recording deleted.');
  };

  return (
    <div
      onClick={() => router.push(`/recordings/${recording.id}`)}
      className="group flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-sm hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all active:scale-[0.99]"
    >
      {/* SAP status indicator strip */}
      <div className={cn(
        'w-1 self-stretch rounded-full shrink-0',
        recording.transcript ? 'bg-emerald-500' : 'bg-border',
      )} />

      {/* Waveform icon */}
      <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
        <div className="flex items-end gap-px h-4">
          {[2, 4, 3, 5, 2, 4, 3].map((h, i) => (
            <span key={i} className="w-0.5 bg-primary rounded-full" style={{ height: `${h * 3}px` }} />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{recording.title}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />{formatDuration(recording.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />{formatRelativeDate(recording.createdAt)}
          </span>
        </div>
        {recording.summary && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {recording.summary}
          </p>
        )}
        {recording.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {recording.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5 rounded-sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Status badge — always visible */}
      {recording.summary && (
        <Badge className="text-[10px] h-4 px-1.5 rounded-sm bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">
          AI Ready
        </Badge>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={toggleFavorite}
          className="p-1.5 rounded-sm hover:bg-muted transition-colors"
          title={recording.isFavorite ? 'Unfavorite' : 'Favorite'}
        >
          <Star className={cn('w-4 h-4', recording.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
        </button>
        <button
          onClick={deleteRecording}
          className="p-1.5 rounded-sm hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
