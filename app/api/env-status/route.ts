import { NextResponse } from 'next/server';

// Returns only a boolean — never exposes the key value itself
export async function GET() {
  return NextResponse.json({
    groqEnvSet: !!process.env.GROQ_API_KEY,
  });
}
