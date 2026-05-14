import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { getCall, addConversationTurn } from '@/lib/call-state'

const VoiceResponse = twilio.twiml.VoiceResponse

// Called by Twilio when a transfer dial completes without being answered
// (no-answer, busy, failed, or the specialist hung up).
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const callSid = formData.get('CallSid') as string
  const dialStatus = formData.get('DialCallStatus') as string // completed, no-answer, busy, failed

  const twiml = new VoiceResponse()
  const webhookBase = process.env.PUBLIC_WEBHOOK_URL || ''
  const call = getCall(callSid)

  // If the specialist answered and the conversation completed normally, just hang up.
  if (dialStatus === 'completed') {
    twiml.hangup()
    return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } })
  }

  // Specialist didn't answer — come back to the AI and offer to take a message.
  const fallbackMsg = "I'm sorry, our specialist isn't available right now. Let me take your details and have someone call you back as soon as possible."

  if (call) {
    addConversationTurn(callSid, 'assistant', fallbackMsg)
  }

  twiml.say({ voice: 'Polly.Joanna' }, fallbackMsg)
  twiml.gather({
    input: ['speech'],
    action: `${webhookBase}/api/voice/call/webhook/gather`,
    method: 'POST',
    speechTimeout: 'auto',
    speechModel: 'experimental_conversations',
  })

  return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } })
}
