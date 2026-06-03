import { NextResponse } from 'next/server'
import { getVapiPhoneNumber } from '@/lib/vapi'

function redactUrl(value: string | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return `${url.protocol}//${url.host}`
  } catch {
    return 'invalid-url'
  }
}

export async function GET() {
  const webhookBase = process.env.PUBLIC_WEBHOOK_URL
  const phoneNumber = await getVapiPhoneNumber()

  let webhookReachable: boolean | null = null
  let webhookStatus: number | null = null
  if (webhookBase) {
    try {
      const res = await fetch(`${webhookBase}/api/voice/call/vapi-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      webhookStatus = res.status
      webhookReachable = res.ok
    } catch {
      webhookReachable = false
    }
  }

  return NextResponse.json({
    publicWebhookUrl: redactUrl(webhookBase),
    webhookReachable,
    webhookStatus,
    vapiPhoneNumber: phoneNumber
      ? {
          id: phoneNumber.id,
          provider: phoneNumber.provider,
          status: phoneNumber.status,
          number: phoneNumber.number,
          hasAssistant: Boolean(phoneNumber.assistantId),
          hasServerUrl: Boolean(phoneNumber.serverUrl || phoneNumber.server?.url),
        }
      : null,
  })
}
