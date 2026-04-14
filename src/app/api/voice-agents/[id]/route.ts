import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const voiceAgent = await prisma.voiceAgent.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!voiceAgent) {
      return NextResponse.json({ error: 'Voice agent not found' }, { status: 404 })
    }
    return NextResponse.json(voiceAgent)
  } catch (error) {
    console.error('Error fetching voice agent:', error)
    return NextResponse.json({ error: 'Failed to fetch voice agent' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const existing = await prisma.voiceAgent.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Voice agent not found' }, { status: 404 })
    }
    const body = await request.json()
    const voiceAgent = await prisma.voiceAgent.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(voiceAgent)
  } catch (error) {
    console.error('Error updating voice agent:', error)
    return NextResponse.json({ error: 'Failed to update voice agent' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const existing = await prisma.voiceAgent.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Voice agent not found' }, { status: 404 })
    }
    await prisma.voiceAgent.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Voice agent deleted successfully' })
  } catch (error) {
    console.error('Error deleting voice agent:', error)
    return NextResponse.json({ error: 'Failed to delete voice agent' }, { status: 500 })
  }
}
