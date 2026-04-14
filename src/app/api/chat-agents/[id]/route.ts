import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const chatAgent = await prisma.chatAgent.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!chatAgent) {
      return NextResponse.json({ error: 'Chat agent not found' }, { status: 404 })
    }
    return NextResponse.json(chatAgent)
  } catch (error) {
    console.error('Error fetching chat agent:', error)
    return NextResponse.json({ error: 'Failed to fetch chat agent' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const existing = await prisma.chatAgent.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Chat agent not found' }, { status: 404 })
    }
    const body = await request.json()
    const chatAgent = await prisma.chatAgent.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(chatAgent)
  } catch (error) {
    console.error('Error updating chat agent:', error)
    return NextResponse.json({ error: 'Failed to update chat agent' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const existing = await prisma.chatAgent.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Chat agent not found' }, { status: 404 })
    }
    await prisma.chatAgent.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Chat agent deleted successfully' })
  } catch (error) {
    console.error('Error deleting chat agent:', error)
    return NextResponse.json({ error: 'Failed to delete chat agent' }, { status: 500 })
  }
}
