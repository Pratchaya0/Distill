import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, TEMPLATE_PROMPTS } from '@/lib/ai/prompts';

const ALLOWED_LANGUAGES = new Set(['th', 'en']);
const MAX_TRANSCRIPT_CHARS = 50_000; // ~12,500 tokens — well within llama-3 context

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

  const body = await req.json() as {
    transcriptText: string;
    templateId?: string;
    language?: string;
  };

  const { transcriptText, templateId } = body;
  const language = ALLOWED_LANGUAGES.has(body.language ?? '') ? body.language! : 'th';

  if (!transcriptText?.trim()) {
    return NextResponse.json({ error: 'Missing transcript text.' }, { status: 400 });
  }

  if (transcriptText.length > MAX_TRANSCRIPT_CHARS) {
    return NextResponse.json(
      { error: `Transcript too long (max ${MAX_TRANSCRIPT_CHARS} characters).` },
      { status: 413 },
    );
  }

  // Allow only known template IDs to prevent arbitrary prompt injection via templateId
  const safeTemplateHint =
    templateId && Object.prototype.hasOwnProperty.call(TEMPLATE_PROMPTS, templateId)
      ? `\n\nContext hint: ${TEMPLATE_PROMPTS[templateId]}`
      : '';

  const langInstruction =
    language === 'th'
      ? '\n\nIMPORTANT: Write all text values in your JSON response in Thai language (ภาษาไทย). The JSON keys must remain in English.'
      : '\n\nIMPORTANT: Write all text values in your JSON response in English.';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + langInstruction + safeTemplateHint },
        { role: 'user', content: `Transcript:\n\n${transcriptText}` },
      ],
      temperature: 0.3,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error?.message ?? 'Groq LLM failed.' },
      { status: res.status },
    );
  }

  return NextResponse.json(data);
}
