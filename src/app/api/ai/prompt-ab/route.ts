// Prompt A/B testing harness with statistical significance.
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

type Experiment = {
  id: string;
  promptA: string;
  promptB: string;
  results: { variant: 'A' | 'B'; output: string; rating?: number; at: Date }[];
};
const experiments = new Map<string, Experiment>();

function tStat(a: number[], b: number[]) {
  if (a.length < 2 || b.length < 2) return null;
  const mean = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;
  const variance = (x: number[]) => {
    const m = mean(x);
    return x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1);
  };
  const mA = mean(a), mB = mean(b), vA = variance(a), vB = variance(b);
  const se = Math.sqrt(vA / a.length + vB / b.length);
  if (se === 0) return null;
  return (mA - mB) / se;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { action } = body;

  if (action === 'create') {
    const { promptA, promptB } = body;
    if (!promptA || !promptB) return NextResponse.json({ error: 'promptA and promptB required' }, { status: 400 });
    const id = `exp_${Date.now()}`;
    experiments.set(id, { id, promptA, promptB, results: [] });
    return NextResponse.json(experiments.get(id));
  }

  if (action === 'run-one') {
    if (!openai) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    const { id, userInput } = body;
    const exp = experiments.get(id);
    if (!exp) return NextResponse.json({ error: 'experiment not found' }, { status: 404 });
    const variant: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
    const r = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: variant === 'A' ? exp.promptA : exp.promptB },
        { role: 'user', content: userInput }
      ],
      max_tokens: 600,
      temperature: 0.5
    });
    const output = r.choices[0]?.message?.content || '';
    exp.results.push({ variant, output, at: new Date() });
    return NextResponse.json({ variant, output });
  }

  if (action === 'rate') {
    const { id, index, rating } = body;
    const exp = experiments.get(id);
    if (!exp || !exp.results[index]) return NextResponse.json({ error: 'result not found' }, { status: 404 });
    exp.results[index].rating = Number(rating);
    return NextResponse.json({ ok: true });
  }

  if (action === 'analyze') {
    const exp = experiments.get(body.id);
    if (!exp) return NextResponse.json({ error: 'experiment not found' }, { status: 404 });
    const a = exp.results.filter(r => r.variant === 'A' && r.rating != null).map(r => r.rating!);
    const b = exp.results.filter(r => r.variant === 'B' && r.rating != null).map(r => r.rating!);
    const t = tStat(a, b);
    return NextResponse.json({
      experimentId: exp.id,
      countA: a.length,
      countB: b.length,
      meanA: a.length ? a.reduce((s, v) => s + v, 0) / a.length : null,
      meanB: b.length ? b.reduce((s, v) => s + v, 0) / b.length : null,
      tStat: t,
      significant: t != null && Math.abs(t) > 1.96
    });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
