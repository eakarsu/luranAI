import { NextRequest, NextResponse } from 'next/server'
import { summarizeConversation } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 })
    }

    const result = await summarizeConversation(transcript)
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error summarizing conversation:', error)
    return NextResponse.json({ error: 'Failed to summarize conversation' }, { status: 500 })
  }
}
