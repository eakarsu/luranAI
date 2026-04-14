import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        brandName: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        accentColor: true,
        customDomain: true,
        emailFrom: true,
        supportEmail: true,
        footerText: true,
        loginMessage: true,
      },
    })
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    return NextResponse.json(org)
  } catch (error) {
    console.error('Error fetching branding:', error)
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const membership = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId: params.id, userId: user.id } },
    })
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    const body = await request.json()
    const allowedFields = [
      'brandName', 'logoUrl', 'faviconUrl', 'primaryColor', 'accentColor',
      'customDomain', 'emailFrom', 'supportEmail', 'footerText', 'loginMessage',
    ]
    const data: Record<string, string> = {}
    for (const field of allowedFields) {
      if (field in body) data[field] = body[field]
    }
    const org = await prisma.organization.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json(org)
  } catch (error) {
    console.error('Error updating branding:', error)
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
  }
}
