import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const contact = await prisma.contact.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const existing = await prisma.contact.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    const body = await request.json()
    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantContext()
    const existing = await prisma.contact.findFirst({
      where: { id: params.id, ...(tenant ? { orgId: tenant.orgId } : {}) },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    await prisma.contact.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
