import { NextRequest, NextResponse } from 'next/server'
import { composeSms } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { context, purpose } = await request.json()

    if (!purpose) {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 })
    }

    const result = await composeSms(
      context || 'Business SMS communication',
      purpose
    )
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error composing SMS:', error)
    return NextResponse.json({ error: 'Failed to compose SMS' }, { status: 500 })
  }
}
