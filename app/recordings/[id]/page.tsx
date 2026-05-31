import { RecordingDetailClient } from './RecordingDetailClient';

// Static export (Capacitor): generate a shell page; real data loads from Dexie client-side.
// Web builds with `output: standalone` ignore this export entirely.
export function generateStaticParams() {
  if (process.env.NEXT_BUILD_TARGET === 'capacitor') {
    return [{ id: '0' }];
  }
  return [];
}

export default function RecordingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <RecordingDetailClient params={params} />;
}
