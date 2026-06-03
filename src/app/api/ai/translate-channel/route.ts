// Multilingual auto-translation across channels.
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import OpenAI from 'openai';

const hasKey = !!process.env.OPENROUTER_API_KEY;
const openai = hasKey ? new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
}) : null;
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!openai) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

  const { text, sourceLanguage = 'auto', targetLanguage, channel = 'chat', preserveFormatting = true } = await req.json();
  if (!text || !targetLanguage) return NextResponse.json({ error: 'text and targetLanguage required' }, { status: 400 });

  const r = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `Translate ${sourceLanguage} → ${targetLanguage} for ${channel} channel. ${preserveFormatting ? 'Preserve newlines & emoji.' : 'Plain text only.'} Return JSON {"text":string,"detected_source":string,"glossary_used":[string]}.`
      },
      { role: 'user', content: String(text).slice(0, 6000) }
    ],
    max_tokens: 1500,
    temperature: 0.2
  });
  let parsed: any;
  try { parsed = JSON.parse(r.choices[0].message.content!.match(/\{[\s\S]*\}/)![0]); }
  catch { parsed = { text: r.choices[0].message.content }; }
  return NextResponse.json(parsed);
}
