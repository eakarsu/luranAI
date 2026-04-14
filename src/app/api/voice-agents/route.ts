import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET() {
  try {
    const tenant = await getTenantContext()
    const voiceAgents = await prisma.voiceAgent.findMany({
      where: tenant ? { orgId: tenant.orgId } : {},
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(voiceAgents)
  } catch (error) {
    console.error('Error fetching voice agents:', error)
    return NextResponse.json({ error: 'Failed to fetch voice agents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext()
    const body = await request.json()

    // Auto-assign workflow if industry matches and no workflowId provided
    let workflowId = body.workflowId || null
    if (!workflowId && body.industry) {
      const industryKey = body.industry.toLowerCase()
      // Find an active workflow for this industry
      const existingWorkflow = await prisma.workflow.findFirst({
        where: {
          industry: industryKey,
          status: 'active',
          ...(tenant ? { orgId: tenant.orgId } : {}),
        },
        orderBy: { updatedAt: 'desc' },
      })
      if (existingWorkflow) {
        workflowId = existingWorkflow.id
        console.log(`Auto-assigned workflow "${existingWorkflow.name}" to new voice agent`)
      }
    }

    const voiceAgent = await prisma.voiceAgent.create({
      data: {
        ...body,
        workflowId,
        orgId: tenant?.orgId || null,
      },
    })
    return NextResponse.json(voiceAgent, { status: 201 })
  } catch (error) {
    console.error('Error creating voice agent:', error)
    return NextResponse.json({ error: 'Failed to create voice agent' }, { status: 500 })
  }
}
