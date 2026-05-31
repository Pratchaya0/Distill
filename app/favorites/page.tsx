import { RecordingsList } from '@/components/recordings/RecordingsList';
import { Star } from 'lucide-react';

export default function FavoritesPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-amber-100 flex items-center justify-center">
            <Star className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Favorites</h1>
            <p className="text-xs text-muted-foreground">Recordings you&apos;ve starred</p>
          </div>
        </div>
      </div>
      <div className="flex-1 px-4 md:px-8 py-4">
        <RecordingsList
          favoritesOnly
          emptyMessage="No favorites yet. Star a recording to find it here."
        />
      </div>
    </div>
  );
}
