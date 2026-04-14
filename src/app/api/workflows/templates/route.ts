import { NextRequest, NextResponse } from 'next/server'
import { ALL_INDUSTRY_WORKFLOWS } from '@/lib/workflow-templates'

export async function GET(request: NextRequest) {
  const industry = request.nextUrl.searchParams.get('industry')

  const templates = ALL_INDUSTRY_WORKFLOWS.map((template, index) => ({
    id: `template-${index}`,
    ...template,
  }))

  if (industry) {
    return NextResponse.json(templates.filter((t) => t.industry === industry))
  }

  return NextResponse.json(templates)
}
