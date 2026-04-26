import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getIndustryConfig } from '@/lib/industry-config'
import { summarizeConversation, analyzeSentiment } from '@/lib/openrouter'

interface TranscriptEntry {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface SaveBody {
  industry: string
  transcript: TranscriptEntry[]
  visitorName?: string
  visitorEmail?: string
  visitorPhone?: string
}

// Saves a chat-playground transcript as a Conversation (channel=CHAT) plus an
// associated Contact. If no visitor info is provided, an anonymous "Playground"
// contact is created (one per industry per save) so transcripts always link to
// a real contact row — required by the schema.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveBody
    const { industry, transcript, visitorName, visitorEmail, visitorPhone } = body

    if (!industry || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json(
        { error: 'industry and a non-empty transcript are required' },
        { status: 400 }
      )
    }

    const config = getIndustryConfig(industry)
    const industryLabel = config?.name || industry
    const agentName = `${industryLabel} Chat Assistant`

    // Resolve contact: either use provided visitor info, or create an anonymous one
    let firstName = 'Playground'
    let lastName = `Visitor (${industryLabel})`
    if (visitorName && visitorName.trim().length > 0) {
      const parts = visitorName.trim().split(/\s+/)
      firstName = parts[0]
      lastName = parts.slice(1).join(' ') || '—'
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email: visitorEmail?.trim() || null,
        phone: visitorPhone?.trim() || null,
        industry: industryLabel,
        source: 'chat-playground',
        notes: visitorName ? null : 'Anonymous chat playground session',
      },
    })

    // Build a plain-text version of the transcript for sentiment + summary
    const flat = transcript
      .map((t) => `${t.role === 'assistant' ? 'Agent' : 'Visitor'}: ${t.content}`)
      .join('\n')

    let sentiment: string | null = null
    let summary: string | null = null
    try {
      sentiment = await analyzeSentiment(flat)
    } catch (e) {
      console.error('sentiment analysis failed', e)
    }
    try {
      summary = await summarizeConversation(flat)
    } catch (e) {
      console.error('summarization failed', e)
    }

    const conversation = await prisma.conversation.create({
      data: {
        channel: 'CHAT',
        contactId: contact.id,
        agentName,
        transcript: transcript as unknown as object,
        sentiment,
        summary,
        status: 'closed',
      },
      include: { contact: true },
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Error saving chat-playground conversation:', error)
    return NextResponse.json(
      { error: 'Failed to save chat conversation' },
      { status: 500 }
    )
  }
}
