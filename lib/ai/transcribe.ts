import type { TranscriptSegment } from '@/types';

interface GroqTranscriptionResponse {
  text: string;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

export async function transcribeAudio(
  audioBlob: Blob,
  localApiKey?: string,
  language: 'th' | 'en' = 'th',
): Promise<TranscriptSegment[]> {
  const form = new FormData();
  form.append('file', audioBlob, 'recording.webm');
  form.append('language', language);

  const headers: HeadersInit = {};
  if (localApiKey) headers['x-api-key'] = localApiKey;

  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Transcription failed (${res.status})`);
  }

  const data: GroqTranscriptionResponse = await res.json();

  if (data.segments && data.segments.length > 0) {
    return data.segments.map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));
  }

  return [{ start: 0, end: 0, text: data.text.trim() }];
}
