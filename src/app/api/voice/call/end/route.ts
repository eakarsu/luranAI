import { NextRequest, NextResponse } from 'next/server'
import { getCall, updateCallStatus, removeCall, addConversationTurn } from '@/lib/call-state'
import { prisma } from '@/lib/prisma'
import twilio from 'twilio'

const VAPI_API_KEY = process.env.VAPI_API_KEY
const BLAND_API_KEY = process.env.BLAND_API_KEY

async function endVapiCall(callId: string) {
  if (!VAPI_API_KEY) return false
  try {
    // Vapi uses DELETE to end a call
    const res = await fetch(`https://api.vapi.ai/call/${callId}/hang`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    if (res.ok) return true

    // Fallback: try PATCH with status
    const res2 = await fetch(`https://api.vapi.ai/call/${callId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'ended' }),
    })
    if (res2.ok) return true

    // Fallback: try DELETE
    const res3 = await fetch(`https://api.vapi.ai/call/${callId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
    })
    return res3.ok
  } catch {
    return false
  }
}

async function getVapiTranscript(callId: string): Promise<{ role: string; content: string }[]> {
  if (!VAPI_API_KEY) return []
  try {
    const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
    })
    if (!res.ok) return []
    const data = await res.json()
    console.log('Vapi call data keys:', Object.keys(data))
    console.log('Vapi transcript field:', data.transcript ? 'exists' : 'missing')
    console.log('Vapi messages field:', data.messages ? `${data.messages.length} items` : 'missing')
    console.log('Vapi artifact field:', data.artifact ? Object.keys(data.artifact) : 'missing')

    // Try messages array first
    const messages = data.messages || data.artifact?.messages || []
    if (Array.isArray(messages) && messages.length > 0) {
      return messages
        .filter((m: any) => (m.role === 'assistant' || m.role === 'user' || m.role === 'bot') && (m.message || m.content || m.text))
        .map((m: any) => ({
          role: (m.role === 'bot' || m.role === 'assistant') ? 'assistant' : 'user',
          content: m.message || m.content || m.text || '',
        }))
    }

    // Fallback: plain transcript string
    if (data.transcript) {
      const result: { role: string; content: string }[] = []
      const lines = data.transcript.split('\n').filter((l: string) => l.trim())
      for (const line of lines) {
        if (line.match(/^(AI|Bot|Assistant):/i)) {
          result.push({ role: 'assistant', content: line.replace(/^(AI|Bot|Assistant):\s*/i, '') })
        } else if (line.match(/^(User|Caller|Customer):/i)) {
          result.push({ role: 'user', content: line.replace(/^(User|Caller|Customer):\s*/i, '') })
        }
      }
      if (result.length > 0) return result
    }

    // Last resort: artifact.transcript
    if (data.artifact?.transcript) {
      return [{ role: 'assistant', content: data.artifact.transcript }]
    }

    return []
  } catch {
    return []
  }
}

async function getBlandTranscript(callId: string): Promise<{ role: string; content: string }[]> {
  if (!BLAND_API_KEY) return []
  try {
    const res = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
      headers: { Authorization: BLAND_API_KEY },
    })
    if (!res.ok) return []
    const data = await res.json()
    console.log('Bland call data keys:', Object.keys(data))
    console.log('Bland transcripts:', data.transcripts ? `${data.transcripts.length} items` : 'missing')
    console.log('Bland concatenated_transcript:', data.concatenated_transcript ? 'exists' : 'missing')

    // Try transcripts array
    if (data.transcripts && Array.isArray(data.transcripts) && data.transcripts.length > 0) {
      return data.transcripts
        .filter((t: any) => t.user === 'assistant' || t.user === 'user')
        .map((t: any) => ({
          role: t.user === 'assistant' ? 'assistant' : 'user',
          content: t.text || '',
        }))
    }

    // Fallback: concatenated_transcript
    if (data.concatenated_transcript) {
      const result: { role: string; content: string }[] = []
      const parts = data.concatenated_transcript.split(/(?=user:|assistant:)/i)
      for (const part of parts) {
        const trimmed = part.trim()
        if (!trimmed) continue
        if (trimmed.toLowerCase().startsWith('assistant:')) {
          result.push({ role: 'assistant', content: trimmed.replace(/^assistant:\s*/i, '') })
        } else if (trimmed.toLowerCase().startsWith('user:')) {
          result.push({ role: 'user', content: trimmed.replace(/^user:\s*/i, '') })
        }
      }
      return result
    }

    return []
  } catch {
    return []
  }
}

async function endTwilioCall(callSid: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) return false
  try {
    const client = twilio(accountSid, authToken)
    await client.calls(callSid).update({ status: 'completed' })
    return true
  } catch {
    return false
  }
}

async function endBlandCall(callId: string) {
  if (!BLAND_API_KEY) return false
  try {
    const res = await fetch(`https://api.bland.ai/v1/calls/${callId}/stop`, {
      method: 'POST',
      headers: { Authorization: BLAND_API_KEY },
    })
    return res.ok
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { callSid } = await request.json()

    if (!callSid) {
      return NextResponse.json({ error: 'callSid is required' }, { status: 400 })
    }

    const call = getCall(callSid)
    const provider = call?.provider || 'twilio'

    let ended = false
    let transcript: { role: string; content: string }[] = []

    // End the call
    if (provider === 'vapi') {
      ended = await endVapiCall(callSid)
    } else if (provider === 'bland') {
      ended = await endBlandCall(callSid)
    } else {
      ended = await endTwilioCall(callSid)
    }

    // Wait for provider to process the end
    await new Promise(r => setTimeout(r, 4000))

    // Fetch transcript from provider
    if (provider === 'vapi') {
      transcript = await getVapiTranscript(callSid)
    } else if (provider === 'bland') {
      transcript = await getBlandTranscript(callSid)
    }

    // Store transcript in call state
    if (call && transcript.length > 0) {
      call.conversationHistory.length = 0
      call.turnCount = 0
      for (const t of transcript) {
        addConversationTurn(callSid, t.role as 'user' | 'assistant', t.content)
      }
    }

    // Update in-memory state
    updateCallStatus(callSid, 'completed')

    // Save to database
    if (call) {
      try {
        const phoneNumber = call.phoneNumber || ''
        const duration = Math.round((Date.now() - call.startedAt) / 1000)
        const transcriptText = transcript.length > 0
          ? transcript.map(t => `${t.role === 'user' ? 'Caller' : 'AI'}: ${t.content}`).join('\n')
          : call.conversationHistory.length > 0
            ? call.conversationHistory.map(t => `${t.role === 'user' ? 'Caller' : 'AI'}: ${t.content}`).join('\n')
            : null

        // Find or create contact
        let contact = await prisma.contact.findFirst({ where: { phone: phoneNumber } })
        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              firstName: 'Unknown',
              lastName: 'Caller',
              phone: phoneNumber,
              industry: call.industry,
              source: 'outbound-call',
            },
          })
        }

        // Avoid duplicate logs (check last 60s)
        const existing = await prisma.callLog.findFirst({
          where: { voiceAgentId: call.agentId, contactId: contact.id },
          orderBy: { createdAt: 'desc' },
        })
        const isDuplicate = existing && (Date.now() - new Date(existing.createdAt).getTime()) < 60_000

        if (!isDuplicate) {
          await prisma.callLog.create({
            data: {
              voiceAgentId: call.agentId,
              contactId: contact.id,
              duration,
              outcome: 'completed',
              transcript: transcriptText,
              sentiment: null,
            },
          })
          console.log(`CallLog saved: ${provider} call to ${phoneNumber}, ${duration}s, ${transcript.length} transcript entries`)
        }
      } catch (dbError) {
        console.error('Failed to save CallLog:', dbError)
      }
    }

    setTimeout(() => removeCall(callSid), 60_000)

    return NextResponse.json({
      success: true,
      ended,
      provider,
      transcript: transcript.map(t => ({
        role: t.role,
        content: t.content,
        timestamp: Date.now(),
      })),
    })
  } catch (error: any) {
    console.error('End call error:', error)
    return NextResponse.json({ error: error.message || 'Failed to end call' }, { status: 500 })
  }
}
