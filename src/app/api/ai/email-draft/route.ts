import { NextRequest, NextResponse } from 'next/server'
import { generateEmailDraft } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { context, subject, tone } = await request.json()

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    const result = await generateEmailDraft(
      context || 'Business email communication',
      subject,
      tone || 'professional'
    )
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error generating email draft:', error)
    return NextResponse.json({ error: 'Failed to generate email draft' }, { status: 500 })
  }
}
