import { toE164 } from '@/lib/phone'

const RETELL_API_KEY = process.env.RETELL_API_KEY
const RETELL_FROM_NUMBER = process.env.RETELL_FROM_NUMBER
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID
const RETELL_API_URL = 'https://api.retellai.com/v2'
const RETELL_CONFIG_API_URL = 'https://api.retellai.com'

interface RetellCallResult {
  call_id: string
  call_status: string
}

export async function makeRetellCall(params: {
  phoneNumber: string
  systemPrompt: string
  greeting: string
  agentName: string
  industry: string
  retellAgentId?: string
}): Promise<{ sid: string; status: string }> {
  if (!RETELL_API_KEY) throw new Error('RETELL_API_KEY not configured')
  if (!RETELL_FROM_NUMBER) throw new Error('RETELL_FROM_NUMBER not configured')

  const agentId = params.retellAgentId || getRetellAgentIdForIndustry(params.industry) || RETELL_AGENT_ID
  if (!agentId) {
    throw new Error('RETELL_AGENT_ID not configured')
  }

  await assertRetellAgentAcceptsDynamicPrompt(agentId)

  const body: Record<string, unknown> = {
    from_number: toE164(RETELL_FROM_NUMBER),
    to_number: toE164(params.phoneNumber),
    metadata: {
      agentName: params.agentName,
      industry: params.industry,
      source: 'luran-ai',
    },
    retell_llm_dynamic_variables: {
      system_prompt: params.systemPrompt,
      SYSTEM_PROMPT: params.systemPrompt,
      greeting: params.greeting,
      GREETING: params.greeting,
      agent_name: params.agentName,
      AGENT_NAME: params.agentName,
      industry: params.industry,
      INDUSTRY: params.industry,
    },
  }

  body.override_agent_id = agentId

  const response = await fetch(`${RETELL_API_URL}/create-phone-call`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Retell API error (${response.status}): ${errorBody}`)
  }

  const data: RetellCallResult = await response.json()
  return { sid: data.call_id, status: mapRetellStatus(data.call_status) }
}

async function assertRetellAgentAcceptsDynamicPrompt(agentId: string) {
  if (process.env.RETELL_VALIDATE_AGENT_PROMPT === 'false') return

  const agent = await fetchRetellConfig<{
    response_engine?: { llm_id?: string }
  }>(`/get-agent/${agentId}`)
  const llmId = agent?.response_engine?.llm_id
  if (!llmId) return

  const llm = await fetchRetellConfig<{
    general_prompt?: string | null
    begin_message?: string | null
    states?: Array<{ state_prompt?: string | null }>
  }>(`/get-retell-llm/${llmId}`)
  if (!llm) return

  const promptText = [
    llm.general_prompt,
    llm.begin_message,
    ...(llm.states || []).map((state) => state.state_prompt),
  ].filter(Boolean).join('\n')

  const usesLuranVariables = /\{\{\s*(system_prompt|SYSTEM_PROMPT)\s*\}\}/.test(promptText)
  const looksBusinessSpecific = /\b(real estate|property|retell lane|palo alto)\b/i.test(promptText)

  if (looksBusinessSpecific && !usesLuranVariables) {
    throw new Error(
      'Retell is using a hardcoded real-estate LLM. Update the Retell LLM prompt to {{system_prompt}} and begin message to {{greeting}}, or set RETELL_VALIDATE_AGENT_PROMPT=false to bypass.'
    )
  }
}

async function fetchRetellConfig<T>(path: string): Promise<T | null> {
  if (!RETELL_API_KEY) return null

  try {
    const response = await fetch(`${RETELL_CONFIG_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${RETELL_API_KEY}` },
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

function getRetellAgentIdForIndustry(industry: string): string | undefined {
  const key = `RETELL_AGENT_ID_${toEnvSuffix(industry)}`
  return process.env[key]
}

function toEnvSuffix(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export async function getRetellCallStatus(callId: string): Promise<any | null> {
  if (!RETELL_API_KEY) return null

  try {
    const response = await fetch(`${RETELL_API_URL}/get-call/${callId}`, {
      headers: { Authorization: `Bearer ${RETELL_API_KEY}` },
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export function mapRetellStatus(status?: string): string {
  const statusMap: Record<string, string> = {
    registered: 'initiating',
    not_connected: 'failed',
    ongoing: 'in-progress',
    ended: 'completed',
    error: 'failed',
  }
  return status ? statusMap[status] || status : 'initiating'
}
