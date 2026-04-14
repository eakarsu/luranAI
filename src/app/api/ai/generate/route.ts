import { NextRequest, NextResponse } from 'next/server'
import { callOpenRouter } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const messages: { role: 'system' | 'user'; content: string }[] = []

    if (context) {
      messages.push({
        role: 'system',
        content: `You are Luran AI, a versatile AI assistant for business communications. You help with voice calls, chat, email, SMS, and analytics across multiple industries (dentistry, restaurants, health clinics, real estate, automotive, hospitality, and more).

Use the following context to inform your response:
${context}

Rules:
- Be specific and actionable — avoid generic advice
- Match the tone and formality to the industry context
- If the request involves customer communication, prioritize clarity and professionalism
- Structure longer responses with clear sections
- When suggesting scripts or templates, make them ready-to-use with realistic details`,
      })
    } else {
      messages.push({
        role: 'system',
        content: `You are Luran AI, a versatile AI assistant for business communications. You help with voice calls, chat, email, SMS, and analytics across multiple industries (dentistry, restaurants, health clinics, real estate, automotive, hospitality, and more).

Rules:
- Be specific and actionable — avoid generic advice
- Structure longer responses with clear sections
- When suggesting scripts or templates, make them ready-to-use with realistic details
- If the request is ambiguous, provide the most helpful interpretation rather than asking for clarification`,
      })
    }

    messages.push({ role: 'user', content: prompt })

    const result = await callOpenRouter(messages, 2048, 0.7)
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error generating AI response:', error)
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 })
  }
}
