import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET() {
  try {
    const tenant = await getTenantContext()
    const chatAgents = await prisma.chatAgent.findMany({
      where: tenant ? { orgId: tenant.orgId } : {},
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(chatAgents)
  } catch (error) {
    console.error('Error fetching chat agents:', error)
    return NextResponse.json({ error: 'Failed to fetch chat agents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext()
    const body = await request.json()
    const chatAgent = await prisma.chatAgent.create({
      data: { ...body, orgId: tenant?.orgId || null },
    })
    return NextResponse.json(chatAgent, { status: 201 })
  } catch (error) {
    console.error('Error creating chat agent:', error)
    return NextResponse.json({ error: 'Failed to create chat agent' }, { status: 500 })
  }
}
