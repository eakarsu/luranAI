import { NextRequest, NextResponse } from 'next/server'

const JWT_ISSUER = 'luranai'
const JWT_AUDIENCE = 'luranai-web'
const REJECTED_SECRETS = new Set([
  'default-secret',
  'luranai-jwt-secret-key-2024',
  'your-jwt-secret-here',
])

// These endpoints are called by telephony providers and cannot use the browser
// session cookie. Each provider route still needs provider-signature validation
// before an internet-facing deployment; see SECURITY.md.
const PUBLIC_PROVIDER_PATHS = new Set([
  '/api/voice/call/bland-webhook',
  '/api/voice/call/vapi-webhook',
  '/api/voice/inbound',
])
const PUBLIC_PROVIDER_PREFIXES = [
  '/api/voice/call/audio/',
  '/api/voice/call/webhook/',
]

function decodeBase64Url(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const decoded = atob(padded)
  const buffer = new ArrayBuffer(decoded.length)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index)
  }
  return buffer
}

async function hasValidSession(token: string, secret: string): Promise<boolean> {
  if (token.length > 4096) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])))
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])))
    if (header.alg !== 'HS256') return false

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const validSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    )
    if (!validSignature) return false

    const now = Math.floor(Date.now() / 1000)
    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    return (
      payload.iss === JWT_ISSUER &&
      audience.includes(JWT_AUDIENCE) &&
      typeof payload.sub === 'string' &&
      typeof payload.id === 'string' &&
      typeof payload.exp === 'number' &&
      payload.exp > now - 30 &&
      (typeof payload.nbf !== 'number' || payload.nbf <= now + 30)
    )
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    PUBLIC_PROVIDER_PATHS.has(pathname) ||
    PUBLIC_PROVIDER_PREFIXES.some((path) => pathname.startsWith(path))
  ) {
    return NextResponse.next()
  }

  const secret = process.env.JWT_SECRET?.trim()
  if (!secret || secret.length < 32 || REJECTED_SECRETS.has(secret)) {
    return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 })
  }

  const token = request.cookies.get('token')?.value
  if (!token || !(await hasValidSession(token, secret))) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
