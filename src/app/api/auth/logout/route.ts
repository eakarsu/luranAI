import { NextResponse } from 'next/server'

// The auth token is set with httpOnly: true on login, so JS cannot delete it.
// Only the server can clear it. Logout must hit this endpoint.
export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
