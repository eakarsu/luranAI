import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCall, updateCallStatus, addConversationTurn, removeCall } from '@/lib/call-state'
import { mapBlandStatus } from '@/lib/bland'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const callId = body.call_id
    if (!callId) {
      return NextResponse.json({ success: true })
    }

    console.log(`Bland webhook: status=${body.status} for call ${callId}`)

    // Update status
    if (body.status) {
      const mappedStatus = mapBlandStatus(body.status)
      updateCallStatus(callId, mappedStatus as any)
    }

    // Process completed call
    if (body.completed || body.status === 'completed' || body.status === 'complete') {
      updateCallStatus(callId, 'completed')

      const call = getCall(callId)
      const phoneNumber = call?.phoneNumber || body.to || ''
      const duration = body.call_length ? Math.round(body.call_length) : 0

      // Build transcript from Bland's concatenated_transcript or from in-memory
      let transcriptText: string | null = null
      if (call?.conversationHistory?.length) {
        transcriptText = call.conversationHistory
          .map(t => `${t.role === 'user' ? 'Caller' : 'AI'}: ${t.content}`)
          .join('\n')
      } else if (body.concatenated_transcript) {
        transcriptText = body.concatenated_transcript
        // Also populate in-memory transcript from Bland's transcripts array
        if (body.transcripts && Array.isArray(body.transcripts)) {
          for (const t of body.transcripts) {
            const role = t.user === 'assistant' ? 'assistant' : 'user'
            addConversationTurn(callId, role, t.text)
          }
        }
      }

      if (call) {
        try {
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

          await prisma.callLog.create({
            data: {
              voiceAgentId: call.agentId,
              contactId: contact.id,
              duration,
              outcome: 'completed',
              transcript: transcriptText,
            },
          })
        } catch (dbError) {
          console.error('Failed to save Bland CallLog:', dbError)
        }
      }

      // Clean up in-memory state after 30s
      setTimeout(() => removeCall(callId), 30_000)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bland webhook error:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}
