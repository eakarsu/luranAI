export interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface WorkflowState {
  workflowId: string
  executionId: string
  currentNodeId: string
  nodes: any[]
  edges: any[]
  variables: Record<string, unknown>
  collectedInfo: Record<string, string>
}

export interface ActiveCall {
  callSid: string
  agentId: string
  industry: string
  systemPrompt: string
  greeting: string
  voice: string
  language: string
  conversationHistory: ConversationTurn[]
  status: 'initiating' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer'
  phoneNumber: string
  startedAt: number
  turnCount: number
  conversationGoal?: string
  provider: 'twilio' | 'vapi' | 'bland'
  transferNumber?: string
  workflow?: WorkflowState
}

// Map display language names to Twilio locale codes
export function mapLanguageToLocale(language: string): string {
  const map: Record<string, string> = {
    'english': 'en-US',
    'en-us': 'en-US',
    'spanish': 'es-ES',
    'es-mx': 'es-MX',
    'es-es': 'es-ES',
    'french': 'fr-FR',
    'fr-fr': 'fr-FR',
    'german': 'de-DE',
    'de-de': 'de-DE',
    'portuguese': 'pt-BR',
    'pt-br': 'pt-BR',
  }
  return map[language.toLowerCase()] || 'en-US'
}

const activeCalls = new Map<string, ActiveCall>()
const audioBuffers = new Map<string, Buffer>()
const audioCleanupTimers = new Map<string, NodeJS.Timeout>()

// Maps parent callSid → specialist role (Twilio <Dial> transfers)
const pendingTransfers = new Map<string, string>()

export function setPendingTransfer(parentCallSid: string, role: string): void {
  pendingTransfers.set(parentCallSid, role)
  setTimeout(() => pendingTransfers.delete(parentCallSid), 5 * 60 * 1000)
}

export function getPendingTransfer(parentCallSid: string): string | undefined {
  return pendingTransfers.get(parentCallSid)
}

// Maps customer phone → specialist role (Vapi/Bland transfers — caller ID is preserved)
const pendingTransfersByPhone = new Map<string, string>()

export function setPendingTransferByPhone(customerPhone: string, role: string): void {
  pendingTransfersByPhone.set(customerPhone, role)
  setTimeout(() => pendingTransfersByPhone.delete(customerPhone), 2 * 60 * 1000)
}

export function getPendingTransferByPhone(customerPhone: string): string | undefined {
  const role = pendingTransfersByPhone.get(customerPhone)
  if (role) pendingTransfersByPhone.delete(customerPhone)
  return role
}

export function createCall(params: {
  callSid: string
  agentId: string
  industry: string
  systemPrompt: string
  greeting: string
  voice: string
  language: string
  phoneNumber: string
  conversationGoal?: string
  provider?: 'twilio' | 'vapi' | 'bland'
  transferNumber?: string
  workflow?: WorkflowState
}): ActiveCall {
  const call: ActiveCall = {
    callSid: params.callSid,
    agentId: params.agentId,
    industry: params.industry,
    systemPrompt: params.systemPrompt,
    greeting: params.greeting,
    voice: params.voice,
    language: params.language,
    conversationHistory: [],
    status: 'initiating',
    phoneNumber: params.phoneNumber,
    startedAt: Date.now(),
    turnCount: 0,
    conversationGoal: params.conversationGoal,
    provider: params.provider || 'twilio',
    transferNumber: params.transferNumber,
    workflow: params.workflow,
  }
  activeCalls.set(params.callSid, call)
  return call
}

export function getCall(callSid: string): ActiveCall | undefined {
  return activeCalls.get(callSid)
}

export function updateCallStatus(callSid: string, status: ActiveCall['status']): void {
  const call = activeCalls.get(callSid)
  if (call) {
    call.status = status
  }
}

export function addConversationTurn(callSid: string, role: 'user' | 'assistant', content: string): void {
  const call = activeCalls.get(callSid)
  if (call) {
    call.conversationHistory.push({ role, content, timestamp: Date.now() })
    if (role === 'user') {
      call.turnCount++
    }
  }
}

export function storeAudio(callSid: string, turnId: string, audioBuffer: Buffer): void {
  const key = `${callSid}:${turnId}`
  audioBuffers.set(key, audioBuffer)

  const existingTimer = audioCleanupTimers.get(key)
  if (existingTimer) clearTimeout(existingTimer)

  const timer = setTimeout(() => {
    audioBuffers.delete(key)
    audioCleanupTimers.delete(key)
  }, 5 * 60 * 1000)
  audioCleanupTimers.set(key, timer)
}

export function getAudio(callSid: string, turnId: string): Buffer | undefined {
  return audioBuffers.get(`${callSid}:${turnId}`)
}

export function removeCall(callSid: string): void {
  activeCalls.delete(callSid)

  const keysToDelete: string[] = []
  audioCleanupTimers.forEach((timer, key) => {
    if (key.startsWith(`${callSid}:`)) {
      clearTimeout(timer)
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach(key => {
    audioCleanupTimers.delete(key)
    audioBuffers.delete(key)
  })
}
