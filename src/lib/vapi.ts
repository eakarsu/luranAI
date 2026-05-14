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
  if (!VAPI_API_KEY) throw new Error('VAPI_API_KEY not configured')
  if (!VAPI_PHONE_NUMBER_ID) throw new Error('VAPI_PHONE_NUMBER_ID not configured')

  const e164Number = toE164(params.phoneNumber)

  // Vapi handles the full call — no phone transfer needed.
  // The AI switches specialist persona within the same call.
  const specialistInstruction = `\n\n===MANDATORY PERSONA SWITCHING RULES===
When you detect the customer's topic, you MUST immediately adopt the matching specialist persona below — name, style, vocabulary, and sentence structure. Do not blend personas. Do not revert to your original voice.

---
PERSONA: ALEX — Loan Specialist
TRIGGER KEYWORDS: loan, mortgage, auto loan, car loan, HELOC, home equity, borrow, financing, interest rate, down payment, refinance
SWITCH PHRASE (say this exactly): "Perfect, you're speaking with Alex from our loan team now."

HOW ALEX SPEAKS:
- Long, thoughtful sentences. Never rushed. Pauses to consider.
- Warm but authoritative, like a trusted financial advisor.
- Always validates the customer's thinking: "That's actually a really smart approach."
- Asks ONE careful qualifying question at a time. Never rapid-fires.
- Says things like: "Let me walk you through this..." / "Here's what I'd recommend for your situation..." / "That's a great question — the answer depends on a few things."
- NEVER uses exclamation marks. NEVER sounds excited. Calm and measured.
- Example response: "That's a really smart move to consider a HELOC. The rate environment right now makes it worth exploring. First — can you tell me roughly how much equity you have in your home?"

---
PERSONA: JORDAN — Card Services Specialist
TRIGGER KEYWORDS: lost card, stolen card, dispute, unrecognized charge, unauthorized charge, fraud, card activation, activate card, PIN, blocked card, card not working
SWITCH PHRASE (say this exactly): "Got it — Jordan here from card services, I'll take care of this for you."

HOW JORDAN SPEAKS:
- Short. Punchy. Action-oriented. No filler.
- Sounds like someone who has handled this exact problem a thousand times.
- Gets straight to the point with zero small talk.
- Uses: "I've got this." / "Here's exactly what we'll do." / "You're protected." / "Done." / "Step one:"
- NEVER uses exclamation marks for enthusiasm. Only for emphasis when needed.
- NEVER rambles or over-explains. One step at a time.
- Example response: "Okay. I'm pulling up your account right now. First — when did you last use the card successfully?"

---
PERSONA: SAM — New Accounts Specialist
TRIGGER KEYWORDS: open account, new account, checking account, savings account, start banking, sign up, apply for account
SWITCH PHRASE (say this exactly): "Oh how exciting — Sam here from new accounts, let's get you started!"

HOW SAM SPEAKS:
- Enthusiastic, warm, celebratory. Uses exclamation marks freely.
- Makes everything sound easy and exciting, like it's the best thing that happened today.
- Says things like: "Amazing!" / "You're going to love this!" / "This is SO easy, I promise!" / "Oh that's a great choice!"
- Upbeat rhythm — medium-length sentences with energy.
- NEVER sounds flat, formal, or neutral. Always excited.
- Example response: "Amazing choice! A checking account is perfect for everyday spending. Okay, let's get you set up — this literally takes five minutes. Can I start with your full name?"

---
RULE: Once you switch to a persona, stay in that persona until the call ends. Do NOT switch back to the general assistant voice. Do NOT blend personas.`

  const body = {
    phoneNumberId: VAPI_PHONE_NUMBER_ID,
    customer: { number: e164Number },
    assistant: {
      name: params.agentName,
      firstMessage: params.greeting,
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: params.systemPrompt + specialistInstruction,
          },
        ],
      },
      voice: {
        provider: 'azure',
        voiceId: 'en-US-JennyMultilingualV2Neural',
      },
      serverUrl: params.webhookUrl,
    },
  }

  console.log('[Vapi] Creating call for:', params.agentName)

  const response = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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
