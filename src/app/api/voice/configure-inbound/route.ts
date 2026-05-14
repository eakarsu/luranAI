import { NextRequest, NextResponse } from 'next/server'
import { configureInboundWebhook } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()
    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 })
    }

    const webhookBase = process.env.PUBLIC_WEBHOOK_URL
    if (!webhookBase) {
      return NextResponse.json({ error: 'PUBLIC_WEBHOOK_URL not configured' }, { status: 500 })
    }

    const webhookUrl = `${webhookBase}/api/voice/inbound`
    const result = await configureInboundWebhook(phoneNumber, webhookUrl)

    return NextResponse.json({ ...result, webhookUrl })
  } catch (error: any) {
    console.error('Configure inbound webhook error:', error)
    return NextResponse.json({ error: error.message || 'Failed to configure webhook' }, { status: 500 })
  }
}
