import { NextRequest, NextResponse } from 'next/server'
import { sendBulkSms } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const { recipients, body } = await request.json()
    if (!recipients?.length || !body) {
      return NextResponse.json({ error: 'Missing required fields: recipients (array), body' }, { status: 400 })
    }
    const result = await sendBulkSms(recipients, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Bulk SMS error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send bulk SMS'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
