import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import prisma from './prisma'

export interface TenantContext {
  userId: string
  orgId: string
  orgRole: string
  org: {
    id: string
    name: string
    slug: string
    plan: string
    brandName: string | null
    primaryColor: string
    accentColor: string
    logoUrl: string | null
    customDomain: string | null
  }
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const membership = await prisma.orgMember.findFirst({
    where: { userId: payload.id },
    include: {
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          brandName: true,
          primaryColor: true,
          accentColor: true,
          logoUrl: true,
          customDomain: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (!membership) return null

  return {
    userId: payload.id,
    orgId: membership.orgId,
    orgRole: membership.role,
    org: membership.org,
  }
}

export function orgWhere(orgId: string | undefined) {
  return orgId ? { orgId } : {}
}
