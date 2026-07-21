import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const callLogs = await prisma.callLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        voiceAgent: true,
        contact: true,
      },
    })
    return NextResponse.json(callLogs)
  } catch (error) {
    console.error('Error fetching call logs:', error)
    return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 })
  }
}
