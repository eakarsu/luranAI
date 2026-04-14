import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const smsCampaign = await prisma.smsCampaign.findUnique({
      where: { id: params.id },
    })
    if (!smsCampaign) {
      return NextResponse.json({ error: 'SMS campaign not found' }, { status: 404 })
    }
    return NextResponse.json(smsCampaign)
  } catch (error) {
    console.error('Error fetching SMS campaign:', error)
    return NextResponse.json({ error: 'Failed to fetch SMS campaign' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const smsCampaign = await prisma.smsCampaign.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(smsCampaign)
  } catch (error) {
    console.error('Error updating SMS campaign:', error)
    return NextResponse.json({ error: 'Failed to update SMS campaign' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.smsCampaign.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ message: 'SMS campaign deleted successfully' })
  } catch (error) {
    console.error('Error deleting SMS campaign:', error)
    return NextResponse.json({ error: 'Failed to delete SMS campaign' }, { status: 500 })
  }
}
