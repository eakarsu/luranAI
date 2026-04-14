const VAPI_API_KEY = process.env.VAPI_API_KEY
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID

interface VapiCallResult {
  id: string
  status: string
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (phone.startsWith('+')) return '+' + digits
  if (digits.length === 10) return '+1' + digits
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits
  return '+' + digits
}

export async function makeVapiCall(params: {
  phoneNumber: string
  systemPrompt: string
  greeting: string
  agentName: string
  webhookUrl: string
}): Promise<{ sid: string; status: string }> {
  if (!VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY not configured')
  }
  if (!VAPI_PHONE_NUMBER_ID) {
    throw new Error('VAPI_PHONE_NUMBER_ID not configured')
  }

  const e164Number = toE164(params.phoneNumber)

  const response = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customer: {
        number: e164Number,
      },
      assistant: {
        name: params.agentName,
        firstMessage: params.greeting,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: params.systemPrompt,
            },
          ],
        },
        voice: {
          provider: 'azure',
          voiceId: 'en-US-JennyMultilingualV2Neural',
        },
        serverUrl: params.webhookUrl,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Vapi API error (${response.status}): ${errorBody}`)
  }

  const data: VapiCallResult = await response.json()
  return { sid: data.id, status: mapVapiStatus(data.status) }
}

export async function getVapiCallStatus(callId: string): Promise<any | null> {
  if (!VAPI_API_KEY) return null
  try {
    const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function mapVapiStatus(vapiStatus: string): string {
  const statusMap: Record<string, string> = {
    queued: 'initiating',
    ringing: 'ringing',
    'in-progress': 'in-progress',
    forwarding: 'in-progress',
    ended: 'completed',
  }
  return statusMap[vapiStatus] || vapiStatus
}
