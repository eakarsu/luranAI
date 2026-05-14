// Real-time sales / support coaching for human agents (sibling to existing agent-coaching).
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const hasKey = !!process.env.OPENROUTER_API_KEY;
const openai = hasKey ? new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
}) : null;
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!openai) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
  const { utterance, conversationContext, mode = 'support', customerSentiment } = await req.json();
  if (!utterance) return NextResponse.json({ error: 'utterance required' }, { status: 400 });

  const sys = mode === 'sales'
    ? 'You whisper coaching to a live sales agent. Return JSON {"next_best_answer":string,"objection_handler":string,"talk_listen_ratio_target":number,"upsell_opportunity":string|null}.'
    : 'You whisper coaching to a live support agent. Return JSON {"empathy_phrase":string,"resolution_steps":[string],"escalate":bool,"dossier_lookup":string|null}.';
  const r = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Utterance: ${utterance}\nSentiment: ${customerSentiment || 'unknown'}\nContext: ${(conversationContext || '').slice(0, 4000)}` }
    ],
    max_tokens: 500,
    temperature: 0.3
  });
  let parsed: any;
  try { parsed = JSON.parse(r.choices[0].message.content!.match(/\{[\s\S]*\}/)![0]); } catch { parsed = { raw: r.choices[0].message.content }; }
  return NextResponse.json(parsed);
}
