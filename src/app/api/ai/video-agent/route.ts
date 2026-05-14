// Voice + screen-share video agent for technical support.
// TODO: configure credentials — DAILY_API_KEY or LIVEKIT_API_KEY/SECRET for video infra.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type Room = { id: string; createdAt: Date; joinUrl: string | null; provider: string };
const rooms = new Map<string, Room>();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { action } = body;

  if (action === 'create-room') {
    const id = `room_${Date.now()}`;
    let joinUrl: string | null = null;
    let provider = 'mock';

    if (process.env.DAILY_API_KEY) {
      try {
        const r = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ properties: { enable_screenshare: true, exp: Math.floor(Date.now() / 1000) + 3600 } })
        });
        const j = await r.json();
        joinUrl = j.url;
        provider = 'daily';
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 502 });
      }
    }

    const room: Room = { id, createdAt: new Date(), joinUrl, provider };
    rooms.set(id, room);
    return NextResponse.json(room);
  }

  if (action === 'annotate') {
    // Accept screen-capture stills + a question; route to the existing AI chat surface.
    const { roomId, imageUrl, question } = body;
    if (!roomId || !imageUrl || !question) {
      return NextResponse.json({ error: 'roomId, imageUrl, question required' }, { status: 400 });
    }
    return NextResponse.json({ status: 'queued', note: 'Wire to AI vision route in this project for the annotation step.' });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ count: rooms.size, rooms: [...rooms.values()] });
}
