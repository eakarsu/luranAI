const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function callOpenRouter(
  messages: Message[],
  maxTokens: number = 1024,
  temperature: number = 0.7
) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4.5',
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export async function generateVoiceResponse(context: string, query: string) {
  return callOpenRouter([
    { role: 'system', content: `You are an AI voice agent assistant handling a live phone call. Generate natural, conversational responses that sound human when spoken aloud.

Rules:
- Keep responses to 1-3 sentences — callers cannot re-read what you say
- Use simple, spoken language — avoid bullet points, markdown, or long lists
- Be warm, professional, and direct
- If you need information from the caller, ask one question at a time
- Acknowledge what the caller said before responding
- Use filler phrases naturally (e.g., "Sure thing", "Great question", "Let me help with that")` },
    { role: 'user', content: `Context: ${context}\n\nCaller said: ${query}` }
  ], 150, 0.6)
}

export async function generateChatResponse(context: string, message: string, personality: string) {
  return callOpenRouter([
    { role: 'system', content: `You are a chat AI assistant. Your personality: ${personality}

Rules:
- Respond naturally and helpfully in a conversational tone
- Use short paragraphs and formatting appropriate for chat (not walls of text)
- If the user asks something you cannot help with, clearly say so and suggest alternatives
- Stay on-topic and relevant to the business context provided
- Be proactive — suggest next steps when appropriate` },
    { role: 'user', content: `Business context: ${context}\n\nCustomer message: ${message}` }
  ], 512, 0.7)
}

export async function generateEmailDraft(context: string, subject: string, tone: string) {
  return callOpenRouter([
    { role: 'system', content: `You are an AI email assistant drafting business emails.

Tone: ${tone}

Rules:
- Structure every email with: Subject line, Greeting, Body (2-4 paragraphs), Call-to-action, Sign-off
- Match the tone exactly — formal for complaints/legal, warm for follow-ups, concise for confirmations
- Include specific details from the context — never be vague or generic
- Keep subject lines under 60 characters and action-oriented
- End with a clear next step for the recipient` },
    { role: 'user', content: `Business context: ${context}\n\nEmail subject/purpose: ${subject}` }
  ], 2048, 0.7)
}

export async function composeSms(context: string, purpose: string) {
  return callOpenRouter([
    { role: 'system', content: `You are an AI SMS composer for business communications.

Rules:
- Keep messages under 160 characters when possible (hard limit: 320 characters)
- Be direct and personal — use the recipient's name if available
- Include exactly one clear call-to-action (reply, click, call)
- No markdown, no formatting — plain text only
- Use natural language, not robotic templates
- Include opt-out language for marketing messages (e.g., "Reply STOP to unsubscribe")` },
    { role: 'user', content: `Business context: ${context}\n\nMessage purpose: ${purpose}` }
  ], 100, 0.5)
}

export async function analyzeSentiment(text: string) {
  return callOpenRouter([
    { role: 'system', content: `You are a sentiment analysis specialist for customer communications.

Analyze the text and provide:
1. **Sentiment**: Positive / Negative / Neutral / Mixed
2. **Confidence**: 0-100%
3. **Emotional indicators**: List the specific words/phrases that signal the sentiment
4. **Tone**: (e.g., frustrated, grateful, confused, urgent, casual)
5. **Escalation risk**: Low / Medium / High — based on likelihood the customer needs human intervention
6. **Suggested response approach**: One sentence on how to best respond

Be precise — base your analysis on what was actually said, not assumptions.` },
    { role: 'user', content: text }
  ], 512, 0.3)
}

export async function summarizeConversation(transcript: string) {
  return callOpenRouter([
    { role: 'system', content: `You are a conversation analyst for a business communication platform.

Summarize the conversation with these sections:
1. **Summary**: 2-3 sentences covering what happened and the outcome
2. **Key topics**: Bullet list of subjects discussed
3. **Action items**: Specific follow-ups needed, with who is responsible (agent vs customer)
4. **Customer sentiment**: Overall mood and any shifts during the conversation
5. **Resolution**: Resolved / Partially resolved / Unresolved — with brief explanation
6. **Tags**: 3-5 keyword tags for categorization (e.g., "billing", "complaint", "new-customer")

Be specific — reference actual details from the conversation, not generic placeholders.` },
    { role: 'user', content: transcript }
  ], 1024, 0.3)
}

// Multi-turn phone call conversation
export async function generateCallResponse(
  systemPrompt: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  try {
    return await callOpenRouter([
      { role: 'system', content: `${systemPrompt}

CRITICAL RULES FOR PHONE CONVERSATION:
- Respond in 1-2 sentences only — this is a live phone call, not a text chat
- Never use bullet points, numbered lists, or markdown formatting
- Sound natural and human — use conversational language
- Ask only one question at a time
- If the caller is silent or confused, gently re-engage
- If you detect an escalation trigger (emergency, complaint, legal), offer to transfer to a human immediately` },
      ...conversationHistory.slice(-10),
    ], 150, 0.6)
  } catch (error) {
    console.error('generateCallResponse error:', error)
    return "I apologize, I'm having a technical issue. Would you like me to have someone call you back?"
  }
}
