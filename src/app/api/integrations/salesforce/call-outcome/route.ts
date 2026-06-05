import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { syncSalesforceCallOutcome } from '@/lib/salesforce'

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext()
    const body = await request.json()

    if (!body.phoneNumber && !body.phone) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 })
    }
    if (!body.callSid) {
      return NextResponse.json({ error: 'callSid is required' }, { status: 400 })
    }

    const result = await syncSalesforceCallOutcome({
      orgId: tenant?.orgId,
      phoneNumber: body.phoneNumber || body.phone,
      email: body.email,
      company: body.company,
      callSid: body.callSid,
      provider: body.provider || 'manual',
      outcome: body.outcome || 'completed',
      duration: Number(body.duration || 0),
      transcript: body.transcript,
      conversationGoal: body.conversationGoal,
      industry: body.industry,
      agentName: body.agentName,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Salesforce call outcome sync failed' },
      { status: 500 }
    )
  }
}
