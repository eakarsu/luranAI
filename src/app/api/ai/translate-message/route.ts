import { NextRequest, NextResponse } from 'next/server'
import { translateMessage, isOpenRouterConfigured } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { text, target_language, source_language, channel } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }
    if (!target_language || typeof target_language !== 'string') {
      return NextResponse.json({ error: 'target_language is required' }, { status: 400 })
    }
    if (!isOpenRouterConfigured()) {
      return NextResponse.json({ error: 'OpenRouter API key not configured.' }, { status: 503 })
    }

    const result = await translateMessage(text, target_language, source_language, channel)
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error translating message:', error)
    return NextResponse.json({ error: 'Failed to translate message' }, { status: 500 })
  }
}
