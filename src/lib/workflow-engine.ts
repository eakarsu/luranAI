// Workflow Engine - Executes workflow graphs for AI agent conversations
// Nodes are steps in the conversation, edges define transitions between them

export type NodeType =
  | 'trigger'        // Entry point: inbound_call, sms_received, etc.
  | 'ai_response'    // AI generates a response using a prompt
  | 'collect_info'   // Ask caller for specific information (name, phone, etc.)
  | 'condition'      // Branch based on a condition (sentiment, keyword, variable)
  | 'check_calendar' // Check availability in connected calendar
  | 'book_appointment' // Book an appointment
  | 'send_sms'       // Send an SMS message
  | 'send_email'     // Send an email
  | 'transfer_call'  // Transfer to a human agent
  | 'create_contact' // Create or update a contact record
  | 'lookup_contact' // Look up existing contact by phone/email
  | 'play_message'   // Play a specific message (greeting, hold music, etc.)
  | 'set_variable'   // Set a workflow variable
  | 'webhook'        // Call external webhook/API
  | 'end_call'       // End the conversation
  | 'escalate'       // Escalate to human with context

export interface WorkflowNode {
  id: string
  type: NodeType
  label: string
  config: Record<string, unknown>
  position: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string      // Source node ID
  target: string      // Target node ID
  condition?: string  // Optional condition for branching (e.g., "sentiment=negative")
  label?: string      // Display label for the edge
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables: Record<string, unknown>
}

export interface ExecutionContext {
  workflowId: string
  callSid?: string
  contactPhone?: string
  currentNodeId: string
  variables: Record<string, unknown>
  collectedInfo: Record<string, string>
  conversationHistory: { role: string; content: string }[]
  log: { nodeId: string; type: string; message: string; timestamp: number }[]
}

// Determine the next node based on edges and conditions
export function getNextNode(
  currentNodeId: string,
  edges: WorkflowEdge[],
  context: ExecutionContext
): string | null {
  const outgoingEdges = edges.filter((e) => e.source === currentNodeId)

  if (outgoingEdges.length === 0) return null
  if (outgoingEdges.length === 1) return outgoingEdges[0].target

  // Multiple edges = conditional branching
  for (const edge of outgoingEdges) {
    if (!edge.condition) continue
    if (evaluateCondition(edge.condition, context)) {
      return edge.target
    }
  }

  // Default: take the first edge without a condition (fallback)
  const defaultEdge = outgoingEdges.find((e) => !e.condition)
  return defaultEdge?.target || outgoingEdges[0].target
}

export function evaluateCondition(
  condition: string,
  context: ExecutionContext
): boolean {
  // Format: "variable operator value"
  // e.g., "sentiment = negative", "has_insurance = true", "caller_intent contains appointment"
  const parts = condition.split(/\s+/)
  if (parts.length < 3) return false

  const [varName, operator, ...valueParts] = parts
  const value = valueParts.join(' ')
  const actual = String(context.variables[varName] || context.collectedInfo[varName] || '')

  switch (operator) {
    case '=':
    case '==':
      return actual.toLowerCase() === value.toLowerCase()
    case '!=':
      return actual.toLowerCase() !== value.toLowerCase()
    case 'contains':
      return actual.toLowerCase().includes(value.toLowerCase())
    case 'not_contains':
      return !actual.toLowerCase().includes(value.toLowerCase())
    case 'exists':
      return actual !== ''
    case 'empty':
      return actual === ''
    default:
      return false
  }
}

// Build a system prompt from a workflow node for AI response generation
export function buildNodePrompt(
  node: WorkflowNode,
  context: ExecutionContext
): string {
  const basePrompt = (node.config.prompt as string) || ''
  const collectedStr = Object.entries(context.collectedInfo)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  let prompt = basePrompt

  if (collectedStr) {
    prompt += `\n\nInformation collected so far:\n${collectedStr}`
  }

  // Variable substitution: replace {{variable_name}} with values
  prompt = prompt.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
    return String(context.variables[varName] || context.collectedInfo[varName] || `{{${varName}}}`)
  })

  return prompt
}

// Pre-built workflow templates for common industry scenarios
export const WORKFLOW_TEMPLATES: Record<string, { name: string; description: string; trigger: string; industry: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] }> = {
  'dental-appointment': {
    name: 'Dental Appointment Booking',
    description: 'Complete dental appointment booking flow with patient intake',
    trigger: 'inbound_call',
    industry: 'dentistry',
    nodes: [
      { id: 'trigger', type: 'trigger', label: 'Inbound Call', config: { trigger: 'inbound_call' }, position: { x: 250, y: 0 } },
      { id: 'greet', type: 'play_message', label: 'Greeting', config: { message: 'Thank you for calling! I\'m the office assistant. How can I help you today?' }, position: { x: 250, y: 100 } },
      { id: 'identify', type: 'collect_info', label: 'Identify Caller', config: { fields: ['caller_name', 'is_existing_patient'], prompt: 'May I have your name? And are you an existing patient with us?' }, position: { x: 250, y: 200 } },
      { id: 'check_intent', type: 'ai_response', label: 'Determine Intent', config: { prompt: 'Based on the conversation, determine the caller\'s intent. Set caller_intent to: appointment, question, emergency, or other.', setVariable: 'caller_intent' }, position: { x: 250, y: 300 } },
      { id: 'emergency_check', type: 'condition', label: 'Emergency?', config: { variable: 'caller_intent', operator: '=', value: 'emergency' }, position: { x: 250, y: 400 } },
      { id: 'escalate', type: 'escalate', label: 'Emergency Transfer', config: { message: 'I understand this is urgent. Let me connect you with our team right away.', priority: 'high' }, position: { x: 50, y: 500 } },
      { id: 'collect_appt', type: 'collect_info', label: 'Appointment Details', config: { fields: ['preferred_date', 'preferred_time', 'appointment_type', 'insurance_provider'], prompt: 'I\'d be happy to help schedule an appointment. What type of visit are you looking for? Do you have a preferred date and time? And may I ask about your insurance?' }, position: { x: 400, y: 500 } },
      { id: 'confirm', type: 'ai_response', label: 'Confirm Details', config: { prompt: 'Summarize the appointment details collected and ask the caller to confirm: {{caller_name}}, {{appointment_type}} on {{preferred_date}} at {{preferred_time}}. Insurance: {{insurance_provider}}.' }, position: { x: 400, y: 600 } },
      { id: 'book', type: 'book_appointment', label: 'Book Appointment', config: { type: '{{appointment_type}}', notes: 'Insurance: {{insurance_provider}}' }, position: { x: 400, y: 700 } },
      { id: 'send_confirm_sms', type: 'send_sms', label: 'SMS Confirmation', config: { message: 'Hi {{caller_name}}! Your {{appointment_type}} appointment has been scheduled for {{preferred_date}} at {{preferred_time}}. Reply to confirm or reschedule.' }, position: { x: 400, y: 800 } },
      { id: 'end', type: 'end_call', label: 'End Call', config: { message: 'Thank you for calling! We look forward to seeing you. Have a great day!' }, position: { x: 250, y: 900 } },
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'greet' },
      { id: 'e2', source: 'greet', target: 'identify' },
      { id: 'e3', source: 'identify', target: 'check_intent' },
      { id: 'e4', source: 'check_intent', target: 'emergency_check' },
      { id: 'e5', source: 'emergency_check', target: 'escalate', condition: 'caller_intent = emergency', label: 'Emergency' },
      { id: 'e6', source: 'emergency_check', target: 'collect_appt', label: 'Normal' },
      { id: 'e7', source: 'collect_appt', target: 'confirm' },
      { id: 'e8', source: 'confirm', target: 'book' },
      { id: 'e9', source: 'book', target: 'send_confirm_sms' },
      { id: 'e10', source: 'send_confirm_sms', target: 'end' },
      { id: 'e11', source: 'escalate', target: 'end' },
    ],
  },

  'restaurant-reservation': {
    name: 'Restaurant Reservation',
    description: 'Handle restaurant reservations with party size and special requests',
    trigger: 'inbound_call',
    industry: 'restaurants',
    nodes: [
      { id: 'trigger', type: 'trigger', label: 'Inbound Call', config: { trigger: 'inbound_call' }, position: { x: 250, y: 0 } },
      { id: 'greet', type: 'play_message', label: 'Greeting', config: { message: 'Thank you for calling! Would you like to make a reservation, ask about our menu, or place a takeout order?' }, position: { x: 250, y: 100 } },
      { id: 'intent', type: 'ai_response', label: 'Determine Intent', config: { prompt: 'Determine if the caller wants: reservation, menu_info, takeout, or other. Set caller_intent accordingly.', setVariable: 'caller_intent' }, position: { x: 250, y: 200 } },
      { id: 'intent_branch', type: 'condition', label: 'Route by Intent', config: {}, position: { x: 250, y: 300 } },
      { id: 'collect_reservation', type: 'collect_info', label: 'Reservation Details', config: { fields: ['guest_name', 'party_size', 'date', 'time', 'special_requests'], prompt: 'I\'d love to help with a reservation! How many guests will be dining? And when would you like to come in? Any dietary restrictions or special requests?' }, position: { x: 50, y: 400 } },
      { id: 'menu_help', type: 'ai_response', label: 'Menu Assistance', config: { prompt: 'Help the caller with menu questions. Be knowledgeable about common dishes, allergens, and dietary options. Suggest popular items.' }, position: { x: 250, y: 400 } },
      { id: 'takeout', type: 'collect_info', label: 'Takeout Order', config: { fields: ['order_items', 'pickup_time', 'guest_name', 'phone'], prompt: 'Great! What would you like to order for pickup? And what time works for you?' }, position: { x: 450, y: 400 } },
      { id: 'confirm_reservation', type: 'ai_response', label: 'Confirm Reservation', config: { prompt: 'Confirm the reservation: {{guest_name}}, party of {{party_size}}, on {{date}} at {{time}}. Special requests: {{special_requests}}.' }, position: { x: 50, y: 550 } },
      { id: 'book_res', type: 'book_appointment', label: 'Book Reservation', config: { type: 'Reservation - Party of {{party_size}}', notes: 'Special requests: {{special_requests}}' }, position: { x: 50, y: 650 } },
      { id: 'sms_confirm', type: 'send_sms', label: 'SMS Confirmation', config: { message: 'Hi {{guest_name}}! Your reservation for {{party_size}} on {{date}} at {{time}} is confirmed. See you soon!' }, position: { x: 50, y: 750 } },
      { id: 'end', type: 'end_call', label: 'End Call', config: { message: 'Thank you for calling! We look forward to seeing you.' }, position: { x: 250, y: 850 } },
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'greet' },
      { id: 'e2', source: 'greet', target: 'intent' },
      { id: 'e3', source: 'intent', target: 'intent_branch' },
      { id: 'e4', source: 'intent_branch', target: 'collect_reservation', condition: 'caller_intent = reservation', label: 'Reservation' },
      { id: 'e5', source: 'intent_branch', target: 'menu_help', condition: 'caller_intent = menu_info', label: 'Menu' },
      { id: 'e6', source: 'intent_branch', target: 'takeout', condition: 'caller_intent = takeout', label: 'Takeout' },
      { id: 'e7', source: 'intent_branch', target: 'menu_help', label: 'Default' },
      { id: 'e8', source: 'collect_reservation', target: 'confirm_reservation' },
      { id: 'e9', source: 'confirm_reservation', target: 'book_res' },
      { id: 'e10', source: 'book_res', target: 'sms_confirm' },
      { id: 'e11', source: 'sms_confirm', target: 'end' },
      { id: 'e12', source: 'menu_help', target: 'end' },
      { id: 'e13', source: 'takeout', target: 'end' },
    ],
  },

  'lead-qualification': {
    name: 'Lead Qualification',
    description: 'Qualify inbound leads with scoring and follow-up',
    trigger: 'inbound_call',
    industry: 'real-estate',
    nodes: [
      { id: 'trigger', type: 'trigger', label: 'Inbound Call', config: { trigger: 'inbound_call' }, position: { x: 250, y: 0 } },
      { id: 'greet', type: 'play_message', label: 'Greeting', config: { message: 'Hi there! Thank you for your interest. I\'m an AI assistant and I\'d love to help you find the right property. Can I ask you a few quick questions?' }, position: { x: 250, y: 100 } },
      { id: 'qualify', type: 'collect_info', label: 'Qualification', config: { fields: ['caller_name', 'budget_range', 'property_type', 'timeline', 'pre_approved'], prompt: 'What type of property are you looking for? What\'s your budget range? Are you pre-approved for a mortgage? And what\'s your timeline for buying?' }, position: { x: 250, y: 200 } },
      { id: 'score', type: 'ai_response', label: 'Score Lead', config: { prompt: 'Based on the collected info, score this lead as hot, warm, or cold. Hot = pre-approved + buying within 30 days. Warm = interested but 1-3 months. Cold = just browsing. Set lead_score accordingly.', setVariable: 'lead_score' }, position: { x: 250, y: 300 } },
      { id: 'score_branch', type: 'condition', label: 'Lead Score', config: {}, position: { x: 250, y: 400 } },
      { id: 'hot_lead', type: 'transfer_call', label: 'Transfer to Agent', config: { message: 'Great news! Based on what you\'ve told me, I\'d love to connect you with one of our agents right away.', transferNumber: '{{transfer_number}}' }, position: { x: 50, y: 500 } },
      { id: 'warm_lead', type: 'ai_response', label: 'Schedule Showing', config: { prompt: 'Help the caller schedule a property showing or consultation. Be enthusiastic and helpful.' }, position: { x: 250, y: 500 } },
      { id: 'cold_lead', type: 'ai_response', label: 'Nurture', config: { prompt: 'Thank the caller for their interest. Offer to send property listings via email and schedule a follow-up call.' }, position: { x: 450, y: 500 } },
      { id: 'create_lead', type: 'create_contact', label: 'Save Contact', config: { source: 'inbound_call', tags: ['{{lead_score}}', '{{property_type}}'] }, position: { x: 250, y: 600 } },
      { id: 'follow_up_sms', type: 'send_sms', label: 'Follow-Up SMS', config: { message: 'Hi {{caller_name}}! Thanks for chatting with us about {{property_type}} properties. We\'ll be in touch soon with listings that match your criteria!' }, position: { x: 250, y: 700 } },
      { id: 'end', type: 'end_call', label: 'End Call', config: { message: 'Thank you for calling! We\'ll follow up with you soon.' }, position: { x: 250, y: 800 } },
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'greet' },
      { id: 'e2', source: 'greet', target: 'qualify' },
      { id: 'e3', source: 'qualify', target: 'score' },
      { id: 'e4', source: 'score', target: 'score_branch' },
      { id: 'e5', source: 'score_branch', target: 'hot_lead', condition: 'lead_score = hot', label: 'Hot' },
      { id: 'e6', source: 'score_branch', target: 'warm_lead', condition: 'lead_score = warm', label: 'Warm' },
      { id: 'e7', source: 'score_branch', target: 'cold_lead', label: 'Cold' },
      { id: 'e8', source: 'hot_lead', target: 'create_lead' },
      { id: 'e9', source: 'warm_lead', target: 'create_lead' },
      { id: 'e10', source: 'cold_lead', target: 'create_lead' },
      { id: 'e11', source: 'create_lead', target: 'follow_up_sms' },
      { id: 'e12', source: 'follow_up_sms', target: 'end' },
    ],
  },

  'appointment-reminder': {
    name: 'Appointment Reminder',
    description: 'Outbound call to confirm or reschedule appointments',
    trigger: 'outbound_call',
    industry: 'dentistry',
    nodes: [
      { id: 'trigger', type: 'trigger', label: 'Outbound Call', config: { trigger: 'outbound_call' }, position: { x: 250, y: 0 } },
      { id: 'greet', type: 'play_message', label: 'Greeting', config: { message: 'Hi {{contact_name}}! This is a courtesy call from your dental office to remind you about your upcoming appointment on {{appointment_date}} at {{appointment_time}}.' }, position: { x: 250, y: 100 } },
      { id: 'confirm', type: 'collect_info', label: 'Confirm/Reschedule', config: { fields: ['confirmation'], prompt: 'Can you confirm you\'ll be able to make it, or would you like to reschedule?' }, position: { x: 250, y: 200 } },
      { id: 'check', type: 'condition', label: 'Confirmed?', config: {}, position: { x: 250, y: 300 } },
      { id: 'confirmed', type: 'play_message', label: 'Confirmed', config: { message: 'Wonderful! We\'ll see you on {{appointment_date}}. Please remember to bring your insurance card.' }, position: { x: 100, y: 400 } },
      { id: 'reschedule', type: 'collect_info', label: 'New Time', config: { fields: ['new_date', 'new_time'], prompt: 'No problem! When would work better for you?' }, position: { x: 400, y: 400 } },
      { id: 'update_appt', type: 'book_appointment', label: 'Update Appointment', config: { type: 'Rescheduled', notes: 'Rescheduled from {{appointment_date}}' }, position: { x: 400, y: 500 } },
      { id: 'end', type: 'end_call', label: 'End Call', config: { message: 'Thank you! Have a great day!' }, position: { x: 250, y: 600 } },
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'greet' },
      { id: 'e2', source: 'greet', target: 'confirm' },
      { id: 'e3', source: 'confirm', target: 'check' },
      { id: 'e4', source: 'check', target: 'confirmed', condition: 'confirmation contains confirm', label: 'Yes' },
      { id: 'e5', source: 'check', target: 'reschedule', label: 'Reschedule' },
      { id: 'e6', source: 'confirmed', target: 'end' },
      { id: 'e7', source: 'reschedule', target: 'update_appt' },
      { id: 'e8', source: 'update_appt', target: 'end' },
    ],
  },
}

// Node type metadata for the UI
export const NODE_TYPE_CONFIG: Record<NodeType, { label: string; color: string; icon: string; description: string }> = {
  trigger:          { label: 'Trigger',           color: '#10B981', icon: 'M13 10V3L4 14h7v7l9-11h-7z', description: 'Starting point of the workflow' },
  ai_response:      { label: 'AI Response',       color: '#8B5CF6', icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5', description: 'Generate AI response with custom prompt' },
  collect_info:     { label: 'Collect Info',      color: '#3B82F6', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25', description: 'Ask caller for specific information' },
  condition:        { label: 'Condition',         color: '#F59E0B', icon: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z', description: 'Branch based on conditions' },
  check_calendar:   { label: 'Check Calendar',   color: '#06B6D4', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', description: 'Check availability in calendar' },
  book_appointment: { label: 'Book Appointment',  color: '#06B6D4', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008z', description: 'Create an appointment' },
  send_sms:         { label: 'Send SMS',          color: '#22C55E', icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z', description: 'Send an SMS message' },
  send_email:       { label: 'Send Email',        color: '#22C55E', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75', description: 'Send an email' },
  transfer_call:    { label: 'Transfer Call',     color: '#EF4444', icon: 'M20.25 3.75v4.5m0-4.5h-4.5m4.5 0l-6 6m3 12c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z', description: 'Transfer to human agent' },
  create_contact:   { label: 'Create Contact',   color: '#6366F1', icon: 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z', description: 'Create or update contact' },
  lookup_contact:   { label: 'Lookup Contact',   color: '#6366F1', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z', description: 'Look up existing contact' },
  play_message:     { label: 'Play Message',     color: '#A855F7', icon: 'M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z', description: 'Play a specific message' },
  set_variable:     { label: 'Set Variable',     color: '#64748B', icon: 'M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.104.401l1.445-.889', description: 'Set a workflow variable' },
  webhook:          { label: 'Webhook',           color: '#64748B', icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244', description: 'Call external API/webhook' },
  end_call:         { label: 'End Call',          color: '#EF4444', icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z', description: 'End the conversation' },
  escalate:         { label: 'Escalate',          color: '#F97316', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z', description: 'Escalate to human with context' },
}
