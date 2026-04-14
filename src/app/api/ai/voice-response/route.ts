import { NextRequest, NextResponse } from 'next/server'
import { generateVoiceResponse } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { context, query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const result = await generateVoiceResponse(
      context || 'General business phone call',
      query
    )
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error generating voice response:', error)
    return NextResponse.json({ error: 'Failed to generate voice response' }, { status: 500 })
  }
}
