// Workflow Executor - processes each conversation turn through the workflow graph
// Called by the gather webhook (voice) and the chat-response API (chat) when a
// workflow is attached to the session.

import type { WorkflowState } from './call-state'
import { getNextNode, buildNodePrompt } from './workflow-engine'
import type { WorkflowNode, WorkflowEdge } from './workflow-engine'
import { generateCallResponse, generateChatTurnResponse } from './openrouter'

export type Channel = 'voice' | 'chat'

interface ExecutionResult {
  response: string
  shouldHangup: boolean
  shouldTransfer: boolean
  transferNumber?: string
  transferRole?: string
  updatedWorkflow: WorkflowState
}

// Channel-aware LLM call. Voice = spoken-tuned, chat = readable-tuned.
async function generateTurnResponse(
  channel: Channel,
  prompt: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  return channel === 'chat'
    ? generateChatTurnResponse(prompt, conversationHistory.slice(-12))
    : generateCallResponse(prompt, conversationHistory.slice(-10))
}

// Channel-specific suffix appended to per-node prompts.
function turnResponseSuffix(channel: Channel): string {
  return channel === 'chat'
    ? 'Respond conversationally in 1-3 short sentences or a brief paragraph. Plain text only — no markdown.'
    : 'Respond in 1-2 natural spoken sentences. Do NOT use lists, bullet points, or markdown. This is a phone call.'
}

// Resolve the effective system prompt for a node.
// Priority: node-level persona → branch-level active_persona variable → base agent prompt.
function resolveSystemPrompt(
  baseSystemPrompt: string,
  currentNode: WorkflowNode,
  workflow: WorkflowState
): string {
  const nodeLevelPersona = currentNode.config.persona as string | undefined
  if (nodeLevelPersona) return nodeLevelPersona
  const branchPersona = workflow.variables.active_persona as string | undefined
  if (branchPersona) return branchPersona
  return baseSystemPrompt
}

// Build an ExecutionContext compatible with workflow-engine functions
function buildContext(workflow: WorkflowState, conversationHistory: { role: string; content: string }[]) {
  return {
    workflowId: workflow.workflowId,
    currentNodeId: workflow.currentNodeId,
    variables: workflow.variables,
    collectedInfo: workflow.collectedInfo,
    conversationHistory,
    log: [],
  }
}

// Process the current node and advance the workflow.
// `channel` defaults to 'voice' to preserve the existing voice webhook behavior.
export async function executeWorkflowTurn(
  workflow: WorkflowState,
  userInput: string,
  systemPrompt: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  channel: Channel = 'voice'
): Promise<ExecutionResult> {
  const nodes = workflow.nodes as WorkflowNode[]
  const edges = workflow.edges as WorkflowEdge[]
  const context = buildContext(workflow, conversationHistory)

  // Find current node
  let currentNode = nodes.find(n => n.id === workflow.currentNodeId)

  // If we're on trigger or play_message, advance to the next actionable node.
  // For chat, capture the play_message text so the user sees it prepended to the next reply.
  let pendingPlayMessage: string | null = null
  if (currentNode && (currentNode.type === 'trigger' || currentNode.type === 'play_message')) {
    if (channel === 'chat' && currentNode.type === 'play_message') {
      const msg = substituteVars(currentNode.config.message as string | undefined, workflow)
      if (msg) pendingPlayMessage = msg
    }
    const nextId = getNextNode(currentNode.id, edges, context)
    if (nextId) {
      currentNode = nodes.find(n => n.id === nextId)
      workflow.currentNodeId = nextId
    }
  }

  if (!currentNode) {
    // Fallback to freeform if workflow state is broken
    const response = await generateTurnResponse(channel, systemPrompt, conversationHistory)
    return {
      response: pendingPlayMessage ? `${pendingPlayMessage}\n\n${response}` : response,
      shouldHangup: false,
      shouldTransfer: false,
      updatedWorkflow: workflow,
    }
  }

  // Process the node based on type
  let response = ''
  let shouldHangup = false
  let shouldTransfer = false
  let transferNumber: string | undefined
  let transferRole: string | undefined

  switch (currentNode.type) {
    case 'ai_response': {
      const nodePrompt = buildNodePrompt(currentNode, context)
      const effectivePrompt = resolveSystemPrompt(systemPrompt, currentNode, workflow)
      const fullPrompt = `${effectivePrompt}\n\nCURRENT TASK: ${nodePrompt}\n\nIMPORTANT: ${turnResponseSuffix(channel)}`
      response = await generateTurnResponse(channel, fullPrompt, conversationHistory)

      // If the node sets a variable, use AI to extract it
      if (currentNode.config.setVariable) {
        const varName = currentNode.config.setVariable as string
        workflow.variables[varName] = extractVariable(userInput, varName)
      }

      // Advance to next node
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) workflow.currentNodeId = nextId
      break
    }

    case 'collect_info': {
      const fields = (currentNode.config.fields as string[]) || []
      const questions = (currentNode.config.questions as string[]) || []
      const nodePrompt = buildNodePrompt(currentNode, context)

      // Check if user's response contains info we need
      const uncollected = fields.filter(f => !workflow.collectedInfo[f])

      if (uncollected.length > 0) {
        // Try to extract info from user input
        extractInfoFromInput(userInput, uncollected, workflow.collectedInfo)

        // Check what's still missing — ask for the FIRST unfilled field, in order
        const nextFieldIdx = fields.findIndex(f => !workflow.collectedInfo[f])

        if (nextFieldIdx >= 0 && workflow.currentNodeId === currentNode.id) {
          // Per-field question takes precedence (deterministic, single-question flow)
          const targetedQuestion = questions[nextFieldIdx]

          if (targetedQuestion) {
            const hasPriorAnswers = Object.values(workflow.collectedInfo).some(v => !!v)
            const ackInstruction = hasPriorAnswers
              ? 'Briefly acknowledge what the user just said in one short clause (e.g., "Got it" or echoing the value). Then ask the question.'
              : 'Ask the question warmly.'
            const effectivePrompt = resolveSystemPrompt(systemPrompt, currentNode, workflow)
            const prompt = `${effectivePrompt}\n\nCURRENT TASK: Ask the user this single question. Do NOT ask anything else, do NOT batch multiple questions.\n\nQUESTION TO ASK: "${targetedQuestion}"\n\n${ackInstruction}\n\n${turnResponseSuffix(channel)}`
            response = await generateTurnResponse(channel, prompt, conversationHistory)
            break
          }

          // Fallback for nodes without a questions array — original bundled prompt logic
          const stillMissing = fields.filter(f => !workflow.collectedInfo[f])
          const collectedSummary = Object.entries(workflow.collectedInfo)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
          const effectivePrompt = resolveSystemPrompt(systemPrompt, currentNode, workflow)
          const prompt = `${effectivePrompt}\n\nCURRENT TASK: ${nodePrompt}\n\nAlready collected: ${collectedSummary || 'nothing yet'}\nStill need: ${stillMissing.join(', ')}\n\nAsk for the missing information naturally. Ask ONE question at a time. ${turnResponseSuffix(channel)}`
          response = await generateTurnResponse(channel, prompt, conversationHistory)
          // Stay on this node
          break
        }
      }

      // All info collected — advance
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) {
        workflow.currentNodeId = nextId
        // Process the next node immediately if it's not another collect/ai node
        const nextNode = nodes.find(n => n.id === nextId)
        if (nextNode && (nextNode.type === 'condition' || nextNode.type === 'book_appointment' || nextNode.type === 'create_contact' || nextNode.type === 'send_sms')) {
          const nested = await executeWorkflowTurn(workflow, userInput, systemPrompt, conversationHistory, channel)
          // Prepend any pending play_message text we captured before this branch
          if (pendingPlayMessage) {
            nested.response = `${pendingPlayMessage}\n\n${nested.response}`
          }
          return nested
        }
        // For ai_response or collect_info, generate response for the new node
        const newNodePrompt = nextNode ? buildNodePrompt(nextNode, context) : ''
        const prompt = `${systemPrompt}\n\nCURRENT TASK: ${newNodePrompt}\n\n${turnResponseSuffix(channel)}`
        response = await generateTurnResponse(channel, prompt, conversationHistory)
      } else {
        response = "Thank you! I have all the information I need."
      }
      break
    }

    case 'condition': {
      // Evaluate conditions and advance
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) {
        workflow.currentNodeId = nextId
        // Process the next node
        const nested = await executeWorkflowTurn(workflow, userInput, systemPrompt, conversationHistory, channel)
        if (pendingPlayMessage) {
          nested.response = `${pendingPlayMessage}\n\n${nested.response}`
        }
        return nested
      }
      // No matching condition — use default prompt
      response = await generateTurnResponse(channel, systemPrompt, conversationHistory)
      break
    }

    case 'escalate': {
      response = (currentNode.config.message as string) || (channel === 'chat'
        ? "Let me connect you with someone who can better help you. A human agent will follow up shortly."
        : "Let me connect you with someone who can better help you. Please hold.")
      shouldTransfer = true
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) workflow.currentNodeId = nextId
      break
    }

    case 'transfer_call': {
      // For chat, "transfer" becomes an escalation message (no telephony transfer possible).
      response = (currentNode.config.message as string) || (channel === 'chat'
        ? "I'll have a team member reach out to you directly to help with this."
        : "I'm transferring you now. Please hold.")
      shouldTransfer = true
      transferRole = currentNode.config.role as string | undefined
      if (channel === 'voice') {
        const rawNumber = currentNode.config.transferNumber as string | undefined
        const resolved = rawNumber ? substituteVars(rawNumber, workflow) : undefined
        transferNumber = resolved && !resolved.includes('{{') ? resolved : undefined
      }
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) workflow.currentNodeId = nextId
      break
    }

    case 'end_call': {
      response = (currentNode.config.message as string) || (channel === 'chat'
        ? "Thanks for chatting! Feel free to reach out anytime."
        : "Thank you for calling! Have a great day. Goodbye!")
      shouldHangup = true
      break
    }

    case 'send_sms': {
      // In a real system, this would trigger an SMS send
      // For now, acknowledge and advance
      console.log(`Workflow SMS: ${substituteVars(currentNode.config.message as string, workflow)}`)
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) {
        workflow.currentNodeId = nextId
        const nested = await executeWorkflowTurn(workflow, userInput, systemPrompt, conversationHistory, channel)
        if (pendingPlayMessage) {
          nested.response = `${pendingPlayMessage}\n\n${nested.response}`
        }
        return nested
      }
      response = channel === 'chat'
        ? "I've queued a confirmation message to send to you."
        : "I've sent you a confirmation message."
      break
    }

    case 'book_appointment': {
      console.log(`Workflow booking: type=${substituteVars(currentNode.config.type as string, workflow)}, notes=${substituteVars(currentNode.config.notes as string, workflow)}`)
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) {
        workflow.currentNodeId = nextId
        const nested = await executeWorkflowTurn(workflow, userInput, systemPrompt, conversationHistory, channel)
        if (pendingPlayMessage) {
          nested.response = `${pendingPlayMessage}\n\n${nested.response}`
        }
        return nested
      }
      response = "Your appointment has been booked!"
      break
    }

    case 'create_contact':
    case 'lookup_contact':
    case 'set_variable':
    case 'check_calendar':
    case 'webhook': {
      // Infrastructure nodes — silently advance
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) {
        workflow.currentNodeId = nextId
        const nested = await executeWorkflowTurn(workflow, userInput, systemPrompt, conversationHistory, channel)
        if (pendingPlayMessage) {
          nested.response = `${pendingPlayMessage}\n\n${nested.response}`
        }
        return nested
      }
      response = await generateTurnResponse(channel, systemPrompt, conversationHistory)
      break
    }

    default: {
      // Unknown node type — fallback to freeform
      response = await generateTurnResponse(channel, systemPrompt, conversationHistory)
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) workflow.currentNodeId = nextId
    }
  }

  // If we captured a play_message earlier, prepend it (chat only).
  if (pendingPlayMessage && response) {
    response = `${pendingPlayMessage}\n\n${response}`
  }

  return {
    response,
    shouldHangup,
    shouldTransfer,
    transferNumber,
    transferRole,
    updatedWorkflow: workflow,
  }
}

// Extract a variable value from user input based on the variable name
function extractVariable(input: string, varName: string): string {
  const lower = input.toLowerCase()

  // Intent detection
  if (varName.includes('intent')) {
    if (lower.match(/schedul|appoint|book|reserve|reserv/)) return 'appointment'
    if (lower.match(/emergenc|urgent|pain|bleed|hurt/)) return 'emergency'
    if (lower.match(/cancel|reschedul|change.*time|move.*appoint/)) return 'cancel'
    if (lower.match(/insur|coverage|copay|deductible/)) return 'insurance_question'
    if (lower.match(/new.*patient|first.*time|never.*been/)) return 'new_patient'
    if (lower.match(/menu|food|dish|special|allergen/)) return 'menu_info'
    if (lower.match(/takeout|pick.?up|to.?go|deliver/)) return 'takeout'
    if (lower.match(/reserv|table|book|seat|dine|dinner/)) return 'reservation'
    if (lower.match(/test.?drive|see.*car|look.*vehicle/)) return 'test_drive'
    if (lower.match(/price|cost|financ|payment|lease/)) return 'pricing'
    return 'other'
  }

  // Lead scoring
  if (varName.includes('score') || varName.includes('lead')) {
    if (lower.match(/pre.?approv|ready.*buy|asap|this.*week|urgent/)) return 'hot'
    if (lower.match(/few.*month|looking|interest|thinking/)) return 'warm'
    return 'cold'
  }

  // Default: return the raw input
  return input.trim()
}

// Try to extract structured info from natural speech
function extractInfoFromInput(input: string, fields: string[], collected: Record<string, string>) {
  const lower = input.toLowerCase()

  for (const field of fields) {
    if (collected[field]) continue

    // Name extraction
    if (field.match(/name|full.?name|caller.?name|guest.?name/i)) {
      // Look for "my name is X" or "I'm X" or "this is X"
      const nameMatch = input.match(/(?:my name is|i'm|i am|this is|it's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
      if (nameMatch) {
        collected[field] = nameMatch[1]
        continue
      }
      // If the whole input looks like a name (1-3 capitalized words)
      if (input.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/)) {
        collected[field] = input.trim()
        continue
      }
    }

    // Phone extraction
    if (field.match(/phone|number|cell|mobile/i)) {
      const phoneMatch = input.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
      if (phoneMatch) {
        collected[field] = phoneMatch[0]
        continue
      }
    }

    // Date extraction
    if (field.match(/date|day|when|preferred.?date/i)) {
      const dateMatch = input.match(/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|next\s+\w+|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i)
      if (dateMatch) {
        collected[field] = dateMatch[0]
        continue
      }
    }

    // Time extraction
    if (field.match(/time|hour|preferred.?time/i)) {
      const timeMatch = input.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?/i)
      if (timeMatch) {
        collected[field] = timeMatch[0]
        continue
      }
    }

    // Party size
    if (field.match(/party.?size|guests|people|how.?many/i)) {
      const sizeMatch = input.match(/(\d+)\s*(?:people|guests|persons|of us)?/i)
      if (sizeMatch) {
        collected[field] = sizeMatch[1]
        continue
      }
    }

    // Yes/no fields
    if (field.match(/existing|confirm|pre.?approv/i)) {
      if (lower.match(/yes|yeah|correct|that's right|i am|i do/)) {
        collected[field] = 'yes'
      } else if (lower.match(/no|nope|not|i'm not|i don't/)) {
        collected[field] = 'no'
      }
    }

    // Generic: if the user gave a short answer and we're only collecting one field, use it
    if (fields.filter(f => !collected[f]).length === 1 && input.trim().length < 100) {
      collected[field] = input.trim()
    }
  }
}

// Substitute {{variable}} placeholders with actual values
function substituteVars(template: string | undefined, workflow: WorkflowState): string {
  if (!template) return ''
  return template.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
    return String(workflow.variables[varName] || workflow.collectedInfo[varName] || `{{${varName}}}`)
  })
}
