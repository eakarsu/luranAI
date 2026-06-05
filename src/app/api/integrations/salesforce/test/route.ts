import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { testSalesforceConnection } from '@/lib/salesforce'

export async function GET() {
  try {
    const tenant = await getTenantContext()
    const result = await testSalesforceConnection(tenant?.orgId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, configured: true, error: error.message || 'Salesforce connection failed' },
      { status: 500 }
    )
  }
}
