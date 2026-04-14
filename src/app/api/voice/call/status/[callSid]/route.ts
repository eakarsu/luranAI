import { NextRequest, NextResponse } from 'next/server'
import { getCall, updateCallStatus, addConversationTurn, removeCall } from '@/lib/call-state'
import { prisma } from '@/lib/prisma'
import { mapBlandStatus } from '@/lib/bland'
import { getVapiCallStatus, mapVapiStatus } from '@/lib/vapi'
import twilio from 'twilio'

async function pollBlandStatus(callId: string) {
  const apiKey = process.env.BLAND_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
      headers: { Authorization: apiKey },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function pollTwilioStatus(callSid: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) return null

  try {
    const client = twilio(accountSid, authToken)
    const twilioCall = await client.calls(callSid).fetch()
    return {
      status: twilioCall.status,
      duration: twilioCall.duration ? parseInt(twilioCall.duration) : 0,
      to: twilioCall.to,
    }
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callSid: string }> }
) {
  const { callSid } = await params
  const call = getCall(callSid)

  if (!call) {
    return NextResponse.json({ callSid, status: 'unknown', transcript: [] })
  }

  // For Twilio calls, poll their API for status (webhooks may not reach localhost without ngrok)
  const twilioNeedsPoll = call.provider === 'twilio' && (
    call.status !== 'completed' && call.status !== 'failed' &&
    call.status !== 'busy' && call.status !== 'no-answer'
  )
  if (twilioNeedsPoll) {
    const twilioData = await pollTwilioStatus(callSid)
    if (twilioData) {
      const statusMap: Record<string, string> = {
        'initiated': 'initiating',
        'queued': 'initiating',
        'ringing': 'ringing',
        'in-progress': 'in-progress',
        'completed': 'completed',
        'busy': 'busy',
        'no-answer': 'no-answer',
        'failed': 'failed',
        'canceled': 'failed',
      }
      const mappedStatus = statusMap[twilioData.status] || twilioData.status
      if (mappedStatus !== call.status) {
        updateCallStatus(callSid, mappedStatus as any)
      }

      // Handle terminal status
      if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(twilioData.status)) {
        updateCallStatus(callSid, mappedStatus as any)

        try {
          const phoneNumber = call.phoneNumber || twilioData.to || ''
          const duration = twilioData.duration || Math.round((Date.now() - call.startedAt) / 1000)
          const transcriptText = call.conversationHistory.length > 0
            ? call.conversationHistory.map(t => `${t.role === 'user' ? 'Caller' : 'AI'}: ${t.content}`).join('\n')
            : null

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

          const existing = await prisma.callLog.findFirst({
            where: { voiceAgentId: call.agentId, contactId: contact.id },
            orderBy: { createdAt: 'desc' },
          })
          const recentEnough = existing && (Date.now() - new Date(existing.createdAt).getTime()) < 60_000
          if (!recentEnough) {
            await prisma.callLog.create({
              data: {
                voiceAgentId: call.agentId,
                contactId: contact.id,
                duration,
                outcome: twilioData.status === 'completed' ? 'completed' : twilioData.status,
                transcript: transcriptText,
              },
            })
            console.log(`Twilio CallLog saved from poll: ${phoneNumber}, ${duration}s`)
          }
        } catch (dbError) {
          console.error('Failed to save Twilio CallLog from poll:', dbError)
        }

        setTimeout(() => removeCall(callSid), 30_000)
      }
    }
  }

  // For Vapi calls, poll their API for status (webhooks may not reach localhost)
  // Also poll after completion if we have no transcript yet
  const vapiNeedsPoll = call.provider === 'vapi' && (
    (call.status !== 'completed' && call.status !== 'failed') ||
    (call.status === 'completed' && call.conversationHistory.length === 0)
  )
  if (vapiNeedsPoll) {
    const vapiData = await getVapiCallStatus(callSid)
    if (vapiData) {
      const mappedStatus = mapVapiStatus(vapiData.status)
      if (mappedStatus !== call.status) {
        updateCallStatus(callSid, mappedStatus as any)
      }

      // Sync transcript from Vapi — check multiple possible locations
      const vapiMessages = vapiData.messages
        || vapiData.artifact?.messages
        || vapiData.analysis?.structuredData?.messages
        || null

      if (vapiMessages && Array.isArray(vapiMessages)) {
        const transcriptMessages = vapiMessages.filter(
          (m: any) => (m.role === 'assistant' || m.role === 'user' || m.role === 'bot') && (m.message || m.content || m.text)
        )
        if (transcriptMessages.length > call.conversationHistory.length) {
          call.conversationHistory.length = 0
          call.turnCount = 0
          for (const m of transcriptMessages) {
            const role = (m.role === 'bot' || m.role === 'assistant') ? 'assistant' : 'user'
            addConversationTurn(callSid, role, m.message || m.content || m.text || '')
          }
        }
      } else if (vapiData.transcript && call.conversationHistory.length === 0) {
        // Fallback: parse plain text transcript "User: ... Bot: ..."
        const lines = vapiData.transcript.split('\n').filter((l: string) => l.trim())
        for (const line of lines) {
          if (line.startsWith('AI:') || line.startsWith('Bot:') || line.startsWith('Assistant:')) {
            addConversationTurn(callSid, 'assistant', line.replace(/^(AI|Bot|Assistant):\s*/, ''))
          } else if (line.startsWith('User:') || line.startsWith('Caller:')) {
            addConversationTurn(callSid, 'user', line.replace(/^(User|Caller):\s*/, ''))
          }
        }
      }

      // Handle ended call
      if (vapiData.status === 'ended') {
        updateCallStatus(callSid, 'completed')

        try {
          const phoneNumber = call.phoneNumber || vapiData.customer?.number || ''
          const duration = vapiData.costBreakdown?.durationSeconds
            ? Math.round(vapiData.costBreakdown.durationSeconds)
            : vapiData.endedAt && vapiData.startedAt
              ? Math.round((new Date(vapiData.endedAt).getTime() - new Date(vapiData.startedAt).getTime()) / 1000)
              : 0

          const transcriptText = call.conversationHistory.length > 0
            ? call.conversationHistory.map(t => `${t.role === 'user' ? 'Caller' : 'AI'}: ${t.content}`).join('\n')
            : vapiData.transcript || null

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

          const existing = await prisma.callLog.findFirst({
            where: { voiceAgentId: call.agentId, contactId: contact.id },
            orderBy: { createdAt: 'desc' },
          })
          const recentEnough = existing && (Date.now() - new Date(existing.createdAt).getTime()) < 60_000
          if (!recentEnough) {
            await prisma.callLog.create({
              data: {
                voiceAgentId: call.agentId,
                contactId: contact.id,
                duration,
                outcome: 'completed',
                transcript: transcriptText,
              },
            })
          }
        } catch (dbError) {
          console.error('Failed to save Vapi CallLog from poll:', dbError)
        }

        setTimeout(() => removeCall(callSid), 30_000)
      }
    }
  }

  // For Bland calls, poll their API for live status and transcript
  // Also poll once after completion to grab final transcript
  const blandNeedsPoll = call.provider === 'bland' && (
    call.status !== 'completed' && call.status !== 'failed'
    || (call.status === 'completed' && call.conversationHistory.length === 0)
  )
  if (blandNeedsPoll) {
    const blandData = await pollBlandStatus(callSid)
    if (blandData) {
      const mappedStatus = mapBlandStatus(blandData.status || blandData.queue_status)
      updateCallStatus(callSid, mappedStatus as any)

      // Sync transcript from Bland
      if (blandData.transcripts && Array.isArray(blandData.transcripts) && blandData.transcripts.length > 0) {
        const existingCount = call.conversationHistory.length
        const newTranscripts = blandData.transcripts
          .filter((t: any) => t.user === 'assistant' || t.user === 'user')
        if (newTranscripts.length > existingCount) {
          call.conversationHistory.length = 0
          call.turnCount = 0
          for (const t of newTranscripts) {
            const role = t.user === 'assistant' ? 'assistant' : 'user'
            addConversationTurn(callSid, role as 'user' | 'assistant', t.text)
          }
        }
      } else if (blandData.concatenated_transcript && call.conversationHistory.length === 0) {
        // Fallback: parse concatenated transcript
        const parts = blandData.concatenated_transcript.split(/(?=user:|assistant:)/i)
        for (const part of parts) {
          const trimmed = part.trim()
          if (!trimmed) continue
          if (trimmed.toLowerCase().startsWith('assistant:')) {
            addConversationTurn(callSid, 'assistant', trimmed.replace(/^assistant:\s*/i, ''))
          } else if (trimmed.toLowerCase().startsWith('user:')) {
            addConversationTurn(callSid, 'user', trimmed.replace(/^user:\s*/i, ''))
          }
        }
      }

      // Handle completed call
      if (blandData.completed || blandData.status === 'completed' || blandData.status === 'complete') {
        updateCallStatus(callSid, 'completed')

        // Save to DB
        try {
          const phoneNumber = call.phoneNumber || blandData.to || ''
          const duration = blandData.call_length ? Math.round(blandData.call_length) : 0
          const transcriptText = call.conversationHistory
            .map(t => `${t.role === 'user' ? 'Caller' : 'AI'}: ${t.content}`)
            .join('\n') || blandData.concatenated_transcript || null

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

          // Check if already saved
          const existing = await prisma.callLog.findFirst({
            where: { voiceAgentId: call.agentId, contactId: contact.id, transcript: transcriptText },
          })
          if (!existing) {
            await prisma.callLog.create({
              data: {
                voiceAgentId: call.agentId,
                contactId: contact.id,
                duration,
                outcome: 'completed',
                transcript: transcriptText,
              },
            })
          }
        } catch (dbError) {
          console.error('Failed to save Bland CallLog from poll:', dbError)
        }

        setTimeout(() => removeCall(callSid), 30_000)
      }
    }
  }

  return NextResponse.json({
    callSid: call.callSid,
    status: call.status,
    industry: call.industry,
    phoneNumber: call.phoneNumber,
    startedAt: call.startedAt,
    turnCount: call.turnCount,
    transcript: call.conversationHistory.map(t => ({
      role: t.role,
      content: t.content,
      timestamp: t.timestamp,
    })),
  })
}
