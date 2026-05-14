import { NextRequest, NextResponse } from 'next/server'
import { generateHandoffSummary } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { transcript, channel, urgency } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
    }

    const result = await generateHandoffSummary(transcript, channel || 'unspecified', urgency)
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error generating handoff summary:', error)
    return NextResponse.json({ error: 'Failed to generate handoff summary' }, { status: 500 })
  }
}
