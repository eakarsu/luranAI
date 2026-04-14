import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET() {
  try {
    const tenant = await getTenantContext()
    const emailAgents = await prisma.emailAgent.findMany({
      where: tenant ? { orgId: tenant.orgId } : {},
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(emailAgents)
  } catch (error) {
    console.error('Error fetching email agents:', error)
    return NextResponse.json({ error: 'Failed to fetch email agents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext()
    const body = await request.json()
    const emailAgent = await prisma.emailAgent.create({
      data: { ...body, orgId: tenant?.orgId || null },
    })
    return NextResponse.json(emailAgent, { status: 201 })
  } catch (error) {
    console.error('Error creating email agent:', error)
    return NextResponse.json({ error: 'Failed to create email agent' }, { status: 500 })
  }
}
