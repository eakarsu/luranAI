import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET() {
  try {
    const tenant = await getTenantContext()
    const integrations = await prisma.integration.findMany({
      where: tenant ? { orgId: tenant.orgId } : {},
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(integrations)
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext()
    const body = await request.json()
    const integration = await prisma.integration.create({
      data: { ...body, orgId: tenant?.orgId || null },
    })
    return NextResponse.json(integration, { status: 201 })
  } catch (error) {
    console.error('Error creating integration:', error)
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
  }
}
