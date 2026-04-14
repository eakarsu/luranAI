import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { getCall, addConversationTurn, storeAudio, mapLanguageToLocale } from '@/lib/call-state'
import { generateCallResponse } from '@/lib/openrouter'
import { generateSpeech } from '@/lib/whisper'
import { checkEscalationTriggers } from '@/lib/industry-config'
import { executeWorkflowTurn } from '@/lib/workflow-executor'

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
  const speechResult = formData.get('SpeechResult') as string

  const twiml = new VoiceResponse()
  const call = getCall(callSid)
  const webhookBase = process.env.PUBLIC_WEBHOOK_URL || ''

  if (!call) {
    twiml.say({ voice: 'Polly.Joanna' }, 'Sorry, there was an error. Goodbye.')
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  const locale = mapLanguageToLocale(call.language)

  if (!speechResult) {
    twiml.say({ voice: 'Polly.Joanna' }, "I didn't catch that. Could you please repeat?")
    twiml.gather({
      input: ['speech'],
      action: `${webhookBase}/api/voice/call/webhook/gather`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'experimental_conversations',
      language: locale as any,
    })
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  console.log(`Call ${callSid} - User said: "${speechResult}"`)
  addConversationTurn(callSid, 'user', speechResult)

  // Check escalation triggers (applies regardless of workflow)
  if (checkEscalationTriggers(call.industry, speechResult)) {
    const msg = "I understand this is important. Let me connect you with a team member who can better assist you. Please hold."
    addConversationTurn(callSid, 'assistant', msg)
    twiml.say({ voice: 'Polly.Joanna' }, msg)
    twiml.say({ voice: 'Polly.Joanna' }, "I apologize, but no one is available right now. Someone will call you back shortly. Thank you and goodbye.")
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Check for goodbye
  const lower = speechResult.toLowerCase()
  if (lower.includes('goodbye') || lower.includes('bye') || (lower.includes('thank') && lower.includes('all'))) {
    const msg = "Thank you for calling! Have a great day. Goodbye!"
    addConversationTurn(callSid, 'assistant', msg)
    twiml.say({ voice: 'Polly.Joanna' }, msg)
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Generate AI response — workflow-driven or freeform
  let aiResponse: string
  let shouldHangup = false

  const historyForAI = call.conversationHistory.map(t => ({ role: t.role, content: t.content }))

  if (call.workflow) {
    // Workflow-driven conversation
    console.log(`Call ${callSid} - Workflow node: ${call.workflow.currentNodeId}`)
    const result = await executeWorkflowTurn(
      call.workflow,
      speechResult,
      call.systemPrompt,
      historyForAI
    )
    aiResponse = result.response
    shouldHangup = result.shouldHangup
    call.workflow = result.updatedWorkflow
    console.log(`Call ${callSid} - Workflow advanced to: ${call.workflow.currentNodeId}`)

    if (result.shouldTransfer) {
      addConversationTurn(callSid, 'assistant', aiResponse)
      twiml.say({ voice: 'Polly.Joanna' }, aiResponse)
      twiml.say({ voice: 'Polly.Joanna' }, "I apologize, but no one is available right now. Someone will call you back shortly. Thank you and goodbye.")
      twiml.hangup()
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      })
    }
  } else {
    // Freeform conversation (no workflow attached)
    aiResponse = await generateCallResponse(call.systemPrompt, historyForAI)
  }

  console.log(`Call ${callSid} - AI responds: "${aiResponse}"`)
  addConversationTurn(callSid, 'assistant', aiResponse)

  if (shouldHangup) {
    twiml.say({ voice: 'Polly.Joanna' }, aiResponse)
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Gather wraps the audio so caller can interrupt by speaking
  const turnId = `turn-${call.turnCount}`
  const gather = twiml.gather({
    input: ['speech'],
    action: `${webhookBase}/api/voice/call/webhook/gather`,
    method: 'POST',
    speechTimeout: 'auto',
    speechModel: 'experimental_conversations',
    language: locale as any,
  })

  try {
    const ttsVoice = mapVoiceToTTS(call.voice)
    const audioBuffer = await generateSpeech(aiResponse, ttsVoice)
    storeAudio(callSid, turnId, audioBuffer)
    gather.play(`${webhookBase}/api/voice/call/audio/${callSid}/${turnId}`)
  } catch (err) {
    console.error('TTS error, falling back to Polly:', err)
    gather.say({ voice: 'Polly.Joanna' }, aiResponse)
  }

  twiml.say({ voice: 'Polly.Joanna' }, 'Is there anything else I can help you with?')
  twiml.redirect(`${webhookBase}/api/voice/call/webhook/gather`)

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  })
}
