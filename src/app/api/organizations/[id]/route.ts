import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const org = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: {
          select: {
            voiceAgents: true,
            chatAgents: true,
            emailAgents: true,
            contacts: true,
            conversations: true,
            integrations: true,
          },
        },
      },
    })
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    return NextResponse.json(org)
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
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
    const org = await prisma.organization.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(org)
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }
}

export async function DELETE(
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
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can delete organizations' }, { status: 403 })
    }
    await prisma.organization.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Organization deleted' })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 })
  }
}
