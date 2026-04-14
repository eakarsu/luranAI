import { NextRequest, NextResponse } from 'next/server'
import { industryIntegrations, getIntegrationsForIndustry } from '@/lib/industry-integrations'

export async function GET(request: NextRequest) {
  const industry = request.nextUrl.searchParams.get('industry')

  if (industry) {
    return NextResponse.json(getIntegrationsForIndustry(industry))
  }

  return NextResponse.json(industryIntegrations)
}
