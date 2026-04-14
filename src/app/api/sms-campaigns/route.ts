import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET() {
  try {
    const tenant = await getTenantContext()
    const smsCampaigns = await prisma.smsCampaign.findMany({
      where: tenant ? { orgId: tenant.orgId } : {},
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(smsCampaigns)
  } catch (error) {
    console.error('Error fetching SMS campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch SMS campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext()
    const body = await request.json()
    const smsCampaign = await prisma.smsCampaign.create({
      data: { ...body, orgId: tenant?.orgId || null },
    })
    return NextResponse.json(smsCampaign, { status: 201 })
  } catch (error) {
    console.error('Error creating SMS campaign:', error)
    return NextResponse.json({ error: 'Failed to create SMS campaign' }, { status: 500 })
  }
}
