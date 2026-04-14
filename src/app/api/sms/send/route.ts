import { NextRequest, NextResponse } from 'next/server'
import { sendSms } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const { to, body } = await request.json()
    if (!to || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, body' }, { status: 400 })
    }
    const result = await sendSms(to, body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('SMS send error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send SMS'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
