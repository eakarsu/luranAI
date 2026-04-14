import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCall, updateCallStatus, removeCall } from '@/lib/call-state'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const callSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const duration = formData.get('CallDuration') as string

    console.log(`Call status update: ${callSid} -> ${callStatus}`)

    const statusMap: Record<string, any> = {
      'initiated': 'initiating',
      'ringing': 'ringing',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'busy': 'busy',
      'no-answer': 'no-answer',
      'failed': 'failed',
      'canceled': 'failed',
    }

    updateCallStatus(callSid, statusMap[callStatus] || callStatus)

    // On terminal status, save CallLog to database
    if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(callStatus)) {
      const call = getCall(callSid)

      if (call) {
        const transcript = call.conversationHistory
          .map(t => `${t.role === 'user' ? 'Caller' : 'AI'}: ${t.content}`)
          .join('\n') || null

        try {
          // Find or create a contact by phone number
          let contact = await prisma.contact.findFirst({ where: { phone: to } })
          if (!contact) {
            contact = await prisma.contact.create({
              data: {
                firstName: 'Unknown',
                lastName: 'Caller',
                phone: to,
                industry: call.industry,
                source: 'outbound-call',
              },
            })
          }

          await prisma.callLog.create({
            data: {
              voiceAgentId: call.agentId,
              contactId: contact.id,
              duration: duration ? parseInt(duration) : 0,
              outcome: callStatus,
              transcript,
            },
          })
        } catch (dbError) {
          console.error('Failed to save CallLog:', dbError)
        }
      }

      // Clean up in-memory state after 30s
      setTimeout(() => removeCall(callSid), 30_000)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Status callback error:', error)
    return NextResponse.json({ error: 'Failed to process status' }, { status: 500 })
  }
}
