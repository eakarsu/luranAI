import { NextRequest, NextResponse } from 'next/server'
import { getMessageHistory } from '@/lib/twilio'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const messages = await getMessageHistory(limit)
    return NextResponse.json(messages)
  } catch (error) {
    console.error('SMS history error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch SMS history'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
