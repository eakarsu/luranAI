import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const knowledgeBases = await prisma.knowledgeBase.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(knowledgeBases)
  } catch (error) {
    console.error('Error fetching knowledge bases:', error)
    return NextResponse.json({ error: 'Failed to fetch knowledge bases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const knowledgeBase = await prisma.knowledgeBase.create({
      data: body,
    })
    return NextResponse.json(knowledgeBase, { status: 201 })
  } catch (error) {
    console.error('Error creating knowledge base:', error)
    return NextResponse.json({ error: 'Failed to create knowledge base' }, { status: 500 })
  }
}
