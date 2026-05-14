import { NextRequest, NextResponse } from 'next/server'
import { generateAgentCoaching } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { transcript, agentName } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
    }

    const result = await generateAgentCoaching(transcript, agentName)
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error generating agent coaching:', error)
    return NextResponse.json({ error: 'Failed to generate agent coaching' }, { status: 500 })
  }
}
