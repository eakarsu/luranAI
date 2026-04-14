const BLAND_API_KEY = process.env.BLAND_API_KEY

interface BlandCallResult {
  call_id: string
  status: string
}

export async function makeBlandCall(params: {
  phoneNumber: string
  systemPrompt: string
  greeting: string
  agentName: string
  webhookUrl: string
}): Promise<{ sid: string; status: string }> {
  if (!BLAND_API_KEY) {
    throw new Error('BLAND_API_KEY not configured')
  }

  const response = await fetch('https://api.bland.ai/v1/calls', {
    method: 'POST',
    headers: {
      Authorization: BLAND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: params.phoneNumber,
      task: params.systemPrompt,
      first_sentence: params.greeting,
      voice: 'nat',
      model: 'enhanced',
      webhook: params.webhookUrl,
      record: true,
      max_duration: 300,
      wait_for_greeting: true,
      answered_by_enabled: true,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Bland API error (${response.status}): ${errorBody}`)
  }

  const data: BlandCallResult = await response.json()
  return { sid: data.call_id, status: mapBlandStatus(data.status) }
}

export function mapBlandStatus(blandStatus: string): string {
  const statusMap: Record<string, string> = {
    queued: 'initiating',
    ringing: 'ringing',
    'in-progress': 'in-progress',
    complete: 'completed',
    completed: 'completed',
    failed: 'failed',
    'no-answer': 'no-answer',
    busy: 'busy',
  }
  return statusMap[blandStatus] || blandStatus
}
