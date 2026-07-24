import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const prompt = String(body?.prompt || '').trim()
  if (!prompt || prompt.length > 8000) return NextResponse.json({ error: 'Prompt must contain 1 through 8000 characters' }, { status: 400 })
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL
  const baseUrl = process.env.OPENROUTER_BASE_URL
  if (!apiKey || !model || !baseUrl) return NextResponse.json({ error: 'OpenRouter is not configured' }, { status: 503 })
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are a customer-engagement operations reviewer. Return concise risks, evidence gaps, next actions, uncertainty, and decisions requiring human approval.' },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  })
  if (!response.ok) return NextResponse.json({ error: `OpenRouter returned ${response.status}` }, { status: 502 })
  const payload = await response.json()
  const content = String(payload?.choices?.[0]?.message?.content || '').trim()
  const providerReceipt = {
    id: String(payload?.id || response.headers.get('x-request-id') || ''),
    created: payload?.created ?? null,
    upstreamModel: String(payload?.model || model),
  }
  if (!content || !providerReceipt.id) return NextResponse.json({ error: 'OpenRouter returned an incomplete response' }, { status: 502 })
  const saved = await prisma.runtimeAiResult.create({
    data: { userId: user.id, prompt, content, provider: 'openrouter', model, providerReceipt },
    select: { id: true },
  })
  return NextResponse.json({ id: saved.id, content, provider: 'openrouter', model, providerReceipt })
}
