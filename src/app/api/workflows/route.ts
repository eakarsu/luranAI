import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET() {
  try {
    const tenant = await getTenantContext()
    const workflows = await prisma.workflow.findMany({
      where: tenant ? { orgId: tenant.orgId } : {},
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext()
    const body = await request.json()
    const workflow = await prisma.workflow.create({
      data: {
        name: body.name,
        description: body.description || null,
        trigger: body.trigger || 'inbound_call',
        industry: body.industry || null,
        channels: body.channels || ['VOICE'],
        nodes: body.nodes || [],
        edges: body.edges || [],
        variables: body.variables || {},
        status: body.status || 'draft',
        orgId: tenant?.orgId || null,
      },
    })
    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}
