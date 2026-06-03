// ROI attribution dashboard (touchpoint → opportunity → revenue).
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Touch = { id: string; campaignId: string; channel: string; contactId: string; at: number; valueUSD?: number };
const touches: Touch[] = [];

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { action } = body;

  if (action === 'log-touch') {
    const { campaignId, channel, contactId } = body;
    if (!campaignId || !channel || !contactId) return NextResponse.json({ error: 'campaignId, channel, contactId required' }, { status: 400 });
    touches.push({ id: `t_${Date.now()}`, campaignId, channel, contactId, at: Date.now() });
    return NextResponse.json({ ok: true, total: touches.length });
  }

  if (action === 'log-revenue') {
    const { contactId, valueUSD } = body;
    if (!contactId || valueUSD == null) return NextResponse.json({ error: 'contactId and valueUSD required' }, { status: 400 });
    const t = touches.filter(x => x.contactId === contactId).pop();
    if (t) t.valueUSD = valueUSD;
    return NextResponse.json({ ok: true });
  }

  if (action === 'report') {
    const byCampaign: Record<string, { touches: number; revenue: number; lastTouchAttributed: number }> = {};
    const byChannel: Record<string, { touches: number; revenue: number }> = {};

    for (const t of touches) {
      byCampaign[t.campaignId] = byCampaign[t.campaignId] || { touches: 0, revenue: 0, lastTouchAttributed: 0 };
      byCampaign[t.campaignId].touches++;
      byChannel[t.channel] = byChannel[t.channel] || { touches: 0, revenue: 0 };
      byChannel[t.channel].touches++;
    }

    // Last-touch attribution.
    const lastTouchPerContact: Record<string, Touch> = {};
    for (const t of touches) {
      const cur = lastTouchPerContact[t.contactId];
      if (!cur || t.at > cur.at) lastTouchPerContact[t.contactId] = t;
    }
    for (const t of Object.values(lastTouchPerContact)) {
      if (t.valueUSD) {
        byCampaign[t.campaignId].lastTouchAttributed += t.valueUSD;
        byChannel[t.channel].revenue += t.valueUSD;
      }
    }
    return NextResponse.json({ byCampaign, byChannel, totalTouches: touches.length });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
