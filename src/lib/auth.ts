import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_ISSUER = 'luranai'
const JWT_AUDIENCE = 'luranai-web'
const REJECTED_SECRETS = new Set([
  'default-secret',
  'luranai-jwt-secret-key-2024',
  'your-jwt-secret-here',
])

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret || secret.length < 32 || REJECTED_SECRETS.has(secret)) {
    throw new Error('JWT_SECRET must be a non-placeholder secret of at least 32 characters')
  }
  return secret
}

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  orgId?: string
}

export function signToken(payload: AuthenticatedUser) {
  return jwt.sign(payload, jwtSecret(), {
    algorithm: 'HS256',
    audience: JWT_AUDIENCE,
    expiresIn: '7d',
    issuer: JWT_ISSUER,
    subject: payload.id,
  })
}

export function verifyToken(token: string) {
  try {
    const value = jwt.verify(token, jwtSecret(), {
      algorithms: ['HS256'],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    })
    if (
      typeof value === 'string' ||
      typeof value.id !== 'string' ||
      typeof value.email !== 'string' ||
      typeof value.name !== 'string'
    ) {
      return null
    }
    return value as unknown as AuthenticatedUser
  } catch {
    return null
  }
}

export async function getUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}
