import { Capacitor } from '@capacitor/core';
import { groqProcess } from './groqClient';
import type { ActionItem, TranscriptSegment } from '@/types';

export interface ProcessedResult {
  summary: string;
  actionItems: ActionItem[];
  mindMap: string;
}

export async function processTranscript(
  segments: TranscriptSegment[],
  localApiKey?: string,
  templateId?: string,
  language: 'th' | 'en' = 'th',
): Promise<ProcessedResult> {
  // Native WebView: call Groq directly
  if (Capacitor.isNativePlatform()) {
    if (!localApiKey) throw new Error('Add a Groq API key in Settings first.');
    return groqProcess(segments, localApiKey, templateId, language);
  }

  // Web: route through server proxy
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (localApiKey) headers['x-api-key'] = localApiKey;

  const transcriptText = segments.map((s) => s.text).join(' ');
  const res = await fetch('/api/process', {
    method: 'POST',
    headers,
    body: JSON.stringify({ transcriptText, templateId, language }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `AI processing failed (${res.status})`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  let parsed: Partial<ProcessedResult>;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Could not parse AI response.'); }

  return {
    summary: parsed.summary ?? '',
    actionItems: (parsed.actionItems ?? []).map(
      (item: ActionItem, i: number) => ({
        id: item.id ?? String(i + 1),
        text: item.text ?? '',
        done: item.done ?? false,
      }),
    ),
    mindMap: parsed.mindMap ?? '',
  };
}
