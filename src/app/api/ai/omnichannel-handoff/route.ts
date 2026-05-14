// Omnichannel handoff agent with context preservation.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type Handoff = {
  id: string;
  conversationId: string;
  fromChannel: string;
  toChannel: string;
  contextSummary: string;
  transcript: any[];
  status: 'pending' | 'accepted' | 'completed';
  createdAt: Date;
};
const handoffs = new Map<string, Handoff>();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function summarize(transcript: any[]): Promise<string> {
  if (!OPENROUTER_API_KEY) return 'AI not configured';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: 'Summarise the conversation in 5 bullets and list 3 open issues.' },
        { role: 'user', content: transcript.map((t: any) => `${t.role}: ${t.text}`).join('\n').slice(0, 8000) }
      ],
      max_tokens: 500
    })
  });
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { action } = body;

  if (action === 'initiate') {
    const { conversationId, fromChannel, toChannel, transcript = [] } = body;
    if (!conversationId || !fromChannel || !toChannel) {
      return NextResponse.json({ error: 'conversationId, fromChannel, toChannel required' }, { status: 400 });
    }
    const summary = await summarize(transcript);
    const id = `ho_${Date.now()}`;
    handoffs.set(id, { id, conversationId, fromChannel, toChannel, contextSummary: summary, transcript, status: 'pending', createdAt: new Date() });
    return NextResponse.json(handoffs.get(id));
  }

  if (action === 'accept') {
    const h = handoffs.get(body.id);
    if (!h) return NextResponse.json({ error: 'handoff not found' }, { status: 404 });
    h.status = 'accepted';
    return NextResponse.json(h);
  }

  if (action === 'complete') {
    const h = handoffs.get(body.id);
    if (!h) return NextResponse.json({ error: 'handoff not found' }, { status: 404 });
    h.status = 'completed';
    return NextResponse.json(h);
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ count: handoffs.size, handoffs: [...handoffs.values()].slice(-50) });
}
