import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const emailAgent = await prisma.emailAgent.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!emailAgent) {
      return NextResponse.json({ error: 'Email agent not found' }, { status: 404 })
    }
    return NextResponse.json(emailAgent)
  } catch (error) {
    console.error('Error fetching email agent:', error)
    return NextResponse.json({ error: 'Failed to fetch email agent' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const existing = await prisma.emailAgent.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Email agent not found' }, { status: 404 })
    }
    const body = await request.json()
    const emailAgent = await prisma.emailAgent.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(emailAgent)
  } catch (error) {
    console.error('Error updating email agent:', error)
    return NextResponse.json({ error: 'Failed to update email agent' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const existing = await prisma.emailAgent.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Email agent not found' }, { status: 404 })
    }
    await prisma.emailAgent.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Email agent deleted successfully' })
  } catch (error) {
    console.error('Error deleting email agent:', error)
    return NextResponse.json({ error: 'Failed to delete email agent' }, { status: 500 })
  }
}
