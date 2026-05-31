import { Capacitor } from '@capacitor/core';
import { groqTranscribe } from './groqClient';
import type { TranscriptSegment } from '@/types';

export async function transcribeAudio(
  audioBlob: Blob,
  localApiKey?: string,
  language: 'th' | 'en' = 'th',
): Promise<TranscriptSegment[]> {
  // Native WebView: call Groq directly (no server proxy available)
  if (Capacitor.isNativePlatform()) {
    if (!localApiKey) throw new Error('Add a Groq API key in Settings first.');
    return groqTranscribe(audioBlob, localApiKey, language);
  }

  // Web: route through the server proxy (key stays server-side)
  const headers: HeadersInit = {};
  if (localApiKey) headers['x-api-key'] = localApiKey;

  const form = new FormData();
  form.append('file', audioBlob, 'recording.webm');
  form.append('language', language);

  const res = await fetch('/api/transcribe', { method: 'POST', headers, body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Transcription failed (${res.status})`);
  }

  const data = await res.json();
  if (data.segments?.length) {
    return data.segments.map((s: { start: number; end: number; text: string }) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));
  }
  return [{ start: 0, end: 0, text: (data.text ?? '').trim() }];
}
