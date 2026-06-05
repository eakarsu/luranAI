import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const callLog = await prisma.callLog.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
      include: {
        voiceAgent: true,
        contact: true,
      },
    })
    if (!callLog) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 })
    }
    return NextResponse.json(callLog)
  } catch (error) {
    console.error('Error fetching call log:', error)
    return NextResponse.json({ error: 'Failed to fetch call log' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const existing = await prisma.callLog.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 })
    }

    const body = await request.json()
    const callLog = await prisma.callLog.update({
      where: { id: params.id },
      data: {
        duration: Number(body.duration) || 0,
        outcome: body.outcome,
        sentiment: body.sentiment || null,
        recordingUrl: body.recordingUrl || null,
        transcript: body.transcript || null,
      },
      include: {
        voiceAgent: true,
        contact: true,
      },
    })
    return NextResponse.json(callLog)
  } catch (error) {
    console.error('Error updating call log:', error)
    return NextResponse.json({ error: 'Failed to update call log' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const existing = await prisma.callLog.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 })
    }

    await prisma.callLog.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Call log deleted successfully' })
  } catch (error) {
    console.error('Error deleting call log:', error)
    return NextResponse.json({ error: 'Failed to delete call log' }, { status: 500 })
  }
}
