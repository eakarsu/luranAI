import { NextRequest, NextResponse } from 'next/server'
import { sentimentRollup, isOpenRouterConfigured } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { per_channel_sentiments, contact_label } = await request.json()

    if (!Array.isArray(per_channel_sentiments) || per_channel_sentiments.length === 0) {
      return NextResponse.json({ error: 'per_channel_sentiments must be a non-empty array' }, { status: 400 })
    }
    if (per_channel_sentiments.length > 6) {
      return NextResponse.json({ error: 'per_channel_sentiments cannot exceed 6 entries' }, { status: 400 })
    }
    if (!isOpenRouterConfigured()) {
      return NextResponse.json({ error: 'OpenRouter API key not configured.' }, { status: 503 })
    }

    const result = await sentimentRollup(per_channel_sentiments, contact_label)
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error generating sentiment rollup:', error)
    return NextResponse.json({ error: 'Failed to generate sentiment rollup' }, { status: 500 })
  }
}
