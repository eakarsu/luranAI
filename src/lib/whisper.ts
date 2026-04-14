import OpenAI, { toFile } from 'openai'

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in .env')
  }
  return new OpenAI({ apiKey })
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string = 'audio.webm') {
  const client = getClient()

  const file = await toFile(audioBuffer, filename)
  const transcription = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  })

  return {
    text: transcription.text,
  }
}

export async function transcribeFromUrl(audioUrl: string) {
  const response = await fetch(audioUrl)
  if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  const ext = audioUrl.split('.').pop()?.split('?')[0] || 'wav'
  return transcribeAudio(buffer, `recording.${ext}`)
}

export async function generateSpeech(text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy') {
  const client = getClient()
  const mp3 = await client.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
  })
  const buffer = Buffer.from(await mp3.arrayBuffer())
  return buffer
}
