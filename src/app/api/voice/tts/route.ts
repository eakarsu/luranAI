import { NextRequest, NextResponse } from 'next/server'
import { generateSpeech } from '@/lib/whisper'

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'alloy' } = await request.json()
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }
    const audioBuffer = await generateSpeech(text, voice)
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate speech'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
