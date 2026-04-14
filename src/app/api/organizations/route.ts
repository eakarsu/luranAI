import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const memberships = await prisma.orgMember.findMany({
      where: { userId: user.id },
      include: {
        org: {
          include: {
            _count: {
              select: { members: true, voiceAgents: true, contacts: true },
            },
          },
        },
      },
    })
    const orgs = memberships.map((m) => ({
      ...m.org,
      role: m.role,
    }))
    return NextResponse.json(orgs)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { name, industry, slug } = await request.json()
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const existing = await prisma.organization.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        industry,
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
      include: { members: true },
    })
    return NextResponse.json(org, { status: 201 })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
