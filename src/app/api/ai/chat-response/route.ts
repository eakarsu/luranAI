import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { context, message, personality } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const result = await generateChatResponse(
      context || 'General business inquiry',
      message,
      personality || 'Professional, helpful, and friendly'
    )
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error generating chat response:', error)
    return NextResponse.json({ error: 'Failed to generate chat response' }, { status: 500 })
  }
}
