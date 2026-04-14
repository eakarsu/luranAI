import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { getCall, storeAudio, addConversationTurn, updateCallStatus, mapLanguageToLocale } from '@/lib/call-state'
import { generateSpeech } from '@/lib/whisper'

const VoiceResponse = twilio.twiml.VoiceResponse

function mapVoiceToTTS(voice: string): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' {
  switch (voice) {
    case 'Male-1': return 'onyx'
    case 'Male-2': return 'echo'
    case 'Female-1': return 'nova'
    case 'Female-2': return 'shimmer'
    default: return 'nova'
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const callSid = formData.get('CallSid') as string

  const twiml = new VoiceResponse()
  const call = getCall(callSid)
  const webhookBase = process.env.PUBLIC_WEBHOOK_URL || ''

  if (!call) {
    twiml.say({ voice: 'Polly.Joanna' }, 'Sorry, there was an error setting up this call. Goodbye.')
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  updateCallStatus(callSid, 'in-progress')
  const turnId = 'greeting'

  addConversationTurn(callSid, 'assistant', call.greeting)

  const gather = twiml.gather({
    input: ['speech'],
    action: `${webhookBase}/api/voice/call/webhook/gather`,
    method: 'POST',
    speechTimeout: 'auto',
    speechModel: 'experimental_conversations',
    language: mapLanguageToLocale(call.language) as any,
  })

  try {
    const ttsVoice = mapVoiceToTTS(call.voice)
    const audioBuffer = await generateSpeech(call.greeting, ttsVoice)
    storeAudio(callSid, turnId, audioBuffer)
    gather.play(`${webhookBase}/api/voice/call/audio/${callSid}/${turnId}`)
  } catch (err) {
    console.error('TTS error for greeting, falling back to Polly:', err)
    gather.say({ voice: 'Polly.Joanna' }, call.greeting)
  }

  twiml.say({ voice: 'Polly.Joanna' }, "Are you still there? I'm here to help.")
  twiml.redirect(`${webhookBase}/api/voice/call/webhook/answer`)

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  })
}
