import { RecordingsList } from '@/components/recordings/RecordingsList';
import { Mic2 } from 'lucide-react';

export default function RecordingsPage() {
  return (
    <div className="flex flex-col h-full">
      {/* SAP-style object page header */}
      <div className="px-4 md:px-8 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center">
            <Mic2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold">All Recordings</h1>
            <p className="text-xs text-muted-foreground">Your voice recordings, stored locally</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-8 py-4">
        <RecordingsList />
      </div>
    </div>
  );
}
