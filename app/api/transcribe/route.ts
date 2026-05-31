import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_LANGUAGES = new Set(['th', 'en']);
const MAX_AUDIO_BYTES = 200 * 1024 * 1024; // 200 MB — Groq's own limit

export async function POST(req: NextRequest) {
  const apiKey =
    process.env.GROQ_API_KEY ??
    req.headers.get('x-api-key') ??
    '';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'No API key. Set GROQ_API_KEY in .env or add it in Settings.' },
      { status: 401 },
    );
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Missing audio file.' }, { status: 400 });
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Audio file exceeds 200 MB limit.' }, { status: 413 });
  }

  const rawLang = (form.get('language') as string | null) ?? 'th';
  const language = ALLOWED_LANGUAGES.has(rawLang) ? rawLang : 'th';

  const upstream = new FormData();
  upstream.append('file', file, 'recording.webm');
  upstream.append('model', 'whisper-large-v3');
  upstream.append('response_format', 'verbose_json');
  upstream.append('language', language);

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstream,
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error?.message ?? 'Groq transcription failed.' },
      { status: res.status },
    );
  }

  return NextResponse.json(data);
}
