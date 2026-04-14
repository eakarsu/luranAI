// Workflow Executor - processes each conversation turn through the workflow graph
// Called by the gather webhook when a workflow is attached to a call

import type { WorkflowState } from './call-state'
import { getNextNode, evaluateCondition, buildNodePrompt } from './workflow-engine'
import type { WorkflowNode, WorkflowEdge } from './workflow-engine'
import { generateCallResponse } from './openrouter'

interface ExecutionResult {
  response: string
  shouldHangup: boolean
  shouldTransfer: boolean
  transferNumber?: string
  updatedWorkflow: WorkflowState
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

// Process the current node and advance the workflow
export async function executeWorkflowTurn(
  workflow: WorkflowState,
  userInput: string,
  systemPrompt: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<ExecutionResult> {
  const nodes = workflow.nodes as WorkflowNode[]
  const edges = workflow.edges as WorkflowEdge[]
  const context = buildContext(workflow, conversationHistory)

  // Find current node
  let currentNode = nodes.find(n => n.id === workflow.currentNodeId)

  // If we're on trigger or play_message, advance to the next actionable node
  if (currentNode && (currentNode.type === 'trigger' || currentNode.type === 'play_message')) {
    const nextId = getNextNode(currentNode.id, edges, context)
    if (nextId) {
      currentNode = nodes.find(n => n.id === nextId)
      workflow.currentNodeId = nextId
    }
  }

  if (!currentNode) {
    // Fallback to freeform if workflow state is broken
    const response = await generateCallResponse(systemPrompt, conversationHistory.slice(-10))
    return {
      response,
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

  switch (currentNode.type) {
    case 'ai_response': {
      const nodePrompt = buildNodePrompt(currentNode, context)
      const fullPrompt = `${systemPrompt}\n\nCURRENT TASK: ${nodePrompt}\n\nIMPORTANT: Respond in 1-2 natural spoken sentences. Do NOT use lists, bullet points, or markdown. This is a phone call.`
      response = await generateCallResponse(fullPrompt, conversationHistory.slice(-10))

      // If the node sets a variable, use AI to extract it
      if (currentNode.config.setVariable) {
        const varName = currentNode.config.setVariable as string
        // Use the user's input to determine the variable value
        workflow.variables[varName] = extractVariable(userInput, varName)
      }

      // Advance to next node
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) workflow.currentNodeId = nextId
      break
    }

    case 'collect_info': {
      const fields = (currentNode.config.fields as string[]) || []
      const nodePrompt = buildNodePrompt(currentNode, context)

      // Check if user's response contains info we need
      const uncollected = fields.filter(f => !workflow.collectedInfo[f])

      if (uncollected.length > 0) {
        // Try to extract info from user input
        extractInfoFromInput(userInput, uncollected, workflow.collectedInfo)

        // Check what's still missing
        const stillMissing = fields.filter(f => !workflow.collectedInfo[f])

        if (stillMissing.length > 0 && workflow.currentNodeId === currentNode.id) {
          // Still need more info — ask for it
          const collectedSummary = Object.entries(workflow.collectedInfo)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
          const prompt = `${systemPrompt}\n\nCURRENT TASK: ${nodePrompt}\n\nAlready collected: ${collectedSummary || 'nothing yet'}\nStill need: ${stillMissing.join(', ')}\n\nAsk the caller for the missing information naturally. Ask ONE question at a time. Keep it conversational.`
          response = await generateCallResponse(prompt, conversationHistory.slice(-10))
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
          return executeWorkflowTurn(workflow, userInput, systemPrompt, conversationHistory)
        }
        // For ai_response or collect_info, generate response for the new node
        const newNodePrompt = nextNode ? buildNodePrompt(nextNode, context) : ''
        const prompt = `${systemPrompt}\n\nCURRENT TASK: ${newNodePrompt}\n\nRespond naturally in 1-2 spoken sentences.`
        response = await generateCallResponse(prompt, conversationHistory.slice(-10))
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
        return executeWorkflowTurn(workflow, userInput, systemPrompt, conversationHistory)
      }
      // No matching condition — use default prompt
      response = await generateCallResponse(systemPrompt, conversationHistory.slice(-10))
      break
    }

    case 'escalate': {
      response = (currentNode.config.message as string) || "Let me connect you with someone who can better help you. Please hold."
      shouldTransfer = true
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) workflow.currentNodeId = nextId
      break
    }

    case 'transfer_call': {
      response = (currentNode.config.message as string) || "I'm transferring you now. Please hold."
      shouldTransfer = true
      transferNumber = currentNode.config.transferNumber as string
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) workflow.currentNodeId = nextId
      break
    }

    case 'end_call': {
      response = (currentNode.config.message as string) || "Thank you for calling! Have a great day. Goodbye!"
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
        return executeWorkflowTurn(workflow, userInput, systemPrompt, conversationHistory)
      }
      response = "I've sent you a confirmation message."
      break
    }

    case 'book_appointment': {
      console.log(`Workflow booking: type=${substituteVars(currentNode.config.type as string, workflow)}, notes=${substituteVars(currentNode.config.notes as string, workflow)}`)
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) {
        workflow.currentNodeId = nextId
        return executeWorkflowTurn(workflow, userInput, systemPrompt, conversationHistory)
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
        return executeWorkflowTurn(workflow, userInput, systemPrompt, conversationHistory)
      }
      response = await generateCallResponse(systemPrompt, conversationHistory.slice(-10))
      break
    }

    default: {
      // Unknown node type — fallback to freeform
      response = await generateCallResponse(systemPrompt, conversationHistory.slice(-10))
      const nextId = getNextNode(currentNode.id, edges, context)
      if (nextId) workflow.currentNodeId = nextId
    }
  }

  return {
    response,
    shouldHangup,
    shouldTransfer,
    transferNumber,
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

    const fieldLower = field.toLowerCase().replace(/_/g, ' ')

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
