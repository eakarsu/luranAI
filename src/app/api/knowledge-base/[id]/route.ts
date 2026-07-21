import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: id },
    })
    if (!knowledgeBase) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
    }
    return NextResponse.json(knowledgeBase)
  } catch (error) {
    console.error('Error fetching knowledge base:', error)
    return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const knowledgeBase = await prisma.knowledgeBase.update({
      where: { id: id },
      data: body,
    })
    return NextResponse.json(knowledgeBase)
  } catch (error) {
    console.error('Error updating knowledge base:', error)
    return NextResponse.json({ error: 'Failed to update knowledge base' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await prisma.knowledgeBase.delete({
      where: { id: id },
    })
    return NextResponse.json({ message: 'Knowledge base deleted successfully' })
  } catch (error) {
    console.error('Error deleting knowledge base:', error)
    return NextResponse.json({ error: 'Failed to delete knowledge base' }, { status: 500 })
  }
}
