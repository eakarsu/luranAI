import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { lookupSalesforceRecords } from '@/lib/salesforce'

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext()
    const body = await request.json()
    const result = await lookupSalesforceRecords({
      orgId: tenant?.orgId,
      phone: body.phone || body.phoneNumber,
      email: body.email,
      company: body.company,
    })

    return NextResponse.json({
      configured: result !== null,
      result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Salesforce lookup failed' },
      { status: 500 }
    )
  }
}
