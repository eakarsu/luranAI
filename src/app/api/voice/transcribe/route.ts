import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio, transcribeFromUrl } from '@/lib/whisper'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const { audioUrl } = await request.json()
      if (!audioUrl) {
        return NextResponse.json({ error: 'Missing audioUrl' }, { status: 400 })
      }
      const result = await transcribeFromUrl(audioUrl)
      return NextResponse.json(result)
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('audio') as File
      if (!file) {
        return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await transcribeAudio(buffer, file.name)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unsupported content type. Use application/json with audioUrl or multipart/form-data with audio file.' }, { status: 400 })
  } catch (error) {
    console.error('Transcription error:', error)
    const message = error instanceof Error ? error.message : 'Failed to transcribe audio'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
