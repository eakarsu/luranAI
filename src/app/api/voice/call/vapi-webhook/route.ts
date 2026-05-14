import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCall, updateCallStatus, addConversationTurn, removeCall, setPendingTransferByPhone } from '@/lib/call-state'
import { mapVapiStatus } from '@/lib/vapi'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ success: true })
    }

    const callId = message.call?.id
    if (!callId) {
      return NextResponse.json({ success: true })
    }

    console.log(`Vapi webhook: ${message.type} for call ${callId}`)

    switch (message.type) {
      case 'tool-calls': {
        // Handle prepareTransfer: store {customerPhone → role} so the inbound
        // /api/voice/inbound webhook can look up which specialist to use.
        const toolCalls: { id: string; function: { name: string; arguments: string } }[] = message.toolCallList || message.toolCalls || []
        const results: { toolCallId: string; result: string }[] = []

        for (const tc of toolCalls) {
          if (tc.function?.name === 'prepareTransfer') {
            try {
              const args = JSON.parse(tc.function.arguments || '{}')
              const role = args.role as string
              const call = getCall(callId)
              if (call?.phoneNumber && role) {
                setPendingTransferByPhone(call.phoneNumber, role)
                console.log(`[Vapi] prepareTransfer: ${call.phoneNumber} → ${role}`)
              }
              results.push({ toolCallId: tc.id, result: 'Transfer prepared. Now call transferCall immediately.' })
            } catch {
              results.push({ toolCallId: tc.id, result: 'Error parsing arguments.' })
            }
          }
        }

        if (results.length > 0) {
          return NextResponse.json({ results })
        }
        break
      }

      case 'status-update': {
        const mappedStatus = mapVapiStatus(message.status)
        updateCallStatus(callId, mappedStatus as any)
        break
      }

      case 'transcript': {
        if (message.transcriptType === 'final') {
          const role = message.role === 'assistant' ? 'assistant' : 'user'
          addConversationTurn(callId, role, message.transcript)
        }
        break
      }

      case 'end-of-call-report': {
        updateCallStatus(callId, 'completed')

        const call = getCall(callId)
        const phoneNumber = call?.phoneNumber || message.call?.customer?.number || ''
        const duration = message.durationSeconds ? Math.round(message.durationSeconds) : 0

        let transcriptText: string | null = null
        if (call?.conversationHistory?.length) {
          transcriptText = call.conversationHistory
            .map(t => `${t.role === 'user' ? 'Caller' : 'AI'}: ${t.content}`)
            .join('\n')
        } else if (message.transcript) {
          transcriptText = message.transcript
        }

        if (call) {
          try {
            // Find or create a contact by phone number
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
            console.error('Failed to save Vapi CallLog:', dbError)
          }
        }

        // Clean up in-memory state after 30s
        setTimeout(() => removeCall(callId), 30_000)
        break
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vapi webhook error:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}
