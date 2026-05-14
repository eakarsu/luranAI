import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { generateSpeech } from '@/lib/whisper'
import { createCall, storeAudio, getPendingTransfer, getPendingTransferByPhone } from '@/lib/call-state'
import { INDUSTRY_CONFIGS } from '@/lib/industry-config'

const VoiceResponse = twilio.twiml.VoiceResponse

const SPECIALISTS: Record<string, { greeting: string; systemPrompt: string; voice: 'nova' | 'shimmer' | 'onyx' | 'echo' | 'alloy' | 'fable' }> = {
  loan_specialist: {
    greeting: "Hi, this is Alex from the loan team. I hear you're interested in a loan — I'm here to help. What type of loan are you looking for?",
    systemPrompt: `You are Alex, a friendly and knowledgeable loan specialist. Keep responses to 2-3 spoken sentences.
- Help with personal loans, auto loans, HELOCs, and mortgages
- Collect: loan purpose, amount, employment status, and timeline
- Explain rates depend on credit profile — formal rate provided after application within 1 business day
- Guide next steps: credit check, rate offer, application online or at branch
- Be warm, confident, and never pushy`,
    voice: 'nova',
  },
  card_specialist: {
    greeting: "Hi, this is Jordan from card services. I'm here to help you with your card — what's going on?",
    systemPrompt: `You are Jordan, a card services specialist. Keep responses to 2-3 spoken sentences.
- Lost/stolen: confirm cancellation, replacement in 5-7 business days
- Disputes: collect amount, merchant, date — open a Regulation E claim
- Activation and PIN reset: guide through app or ATM steps
- Be calm, empathetic, and efficient`,
    voice: 'shimmer',
  },
  account_specialist: {
    greeting: "Hi, this is Sam from new accounts — so excited to help you get started! What type of account are you interested in?",
    systemPrompt: `You are Sam, an enthusiastic new accounts specialist. Keep responses to 2-3 spoken sentences.
- Help open checking, savings, or both
- Collect: full name, phone, email, account type
- Account active within 1 business day, debit card in 5-7 days, online banking immediately
- Be warm, welcoming, and energetic`,
    voice: 'shimmer',
  },
  general: {
    greeting: "Hi, thanks for calling. I'm your bank's virtual assistant — how can I help you today?",
    systemPrompt: INDUSTRY_CONFIGS['banking']?.systemPrompt || 'You are a professional bank AI assistant.',
    voice: 'nova',
  },
}

// Inbound call handler — answers calls on your transfer number as an AI specialist.
// Set your Twilio number's Voice webhook to: POST https://your-domain/api/voice/inbound
// Twilio passes ParentCallSid when the call comes from a <Dial> transfer — we use it
// to look up which specialist was requested.
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const callSid = formData.get('CallSid') as string
  const parentCallSid = formData.get('ParentCallSid') as string | null
  const callerNumber = formData.get('From') as string || ''

  const webhookBase = process.env.PUBLIC_WEBHOOK_URL || ''
  const twiml = new VoiceResponse()

  // Lookup priority:
  // 1. ParentCallSid → role (Twilio <Dial> transfers — most reliable)
  // 2. Caller's phone → role (Vapi/Bland transfers — set by prepareTransfer tool)
  // 3. ?role= query param
  // 4. Default
  const role = (parentCallSid ? getPendingTransfer(parentCallSid) : null)
    ?? getPendingTransferByPhone(callerNumber)
    ?? new URL(request.url).searchParams.get('role')
    ?? 'loan_specialist'

  const specialist = SPECIALISTS[role] || SPECIALISTS['loan_specialist']

  createCall({
    callSid,
    agentId: `inbound-${role}`,
    industry: 'banking',
    systemPrompt: specialist.systemPrompt,
    greeting: specialist.greeting,
    voice: specialist.voice,
    language: 'english',
    phoneNumber: callerNumber,
    provider: 'twilio',
  })

  try {
    const audioBuffer = await generateSpeech(specialist.greeting, specialist.voice)
    storeAudio(callSid, 'greeting', audioBuffer)
    const gather = twiml.gather({
      input: ['speech'],
      action: `${webhookBase}/api/voice/call/webhook/gather`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'experimental_conversations',
    })
    gather.play(`${webhookBase}/api/voice/call/audio/${callSid}/greeting`)
  } catch {
    twiml.gather({
      input: ['speech'],
      action: `${webhookBase}/api/voice/call/webhook/gather`,
      method: 'POST',
      speechTimeout: 'auto',
    }).say({ voice: 'Polly.Joanna' }, specialist.greeting)
  }

  return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } })
}
