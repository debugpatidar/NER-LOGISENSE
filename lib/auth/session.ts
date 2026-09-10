import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { UserRole } from '@/types/user'
import type { SessionPayload } from '@/types/auth'

const SESSION_COOKIE = 'ner_session'
const SESSION_DURATION_HOURS = 24

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET environment variable must be at least 32 characters.')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Creates an encrypted JWT session and attaches it as a secure HTTP-only cookie.
 */
export async function createSession(userId: string, role: UserRole): Promise<void> {
  const secret = getSecret()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
    expires: expiresAt,
  })
}

/**
 * Reads and verifies the JWT session from the HTTP-only cookie.
 * Returns null if the cookie is missing, tampered with, or expired.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const secret = getSecret()
    const { payload } = await jwtVerify(token, secret)

    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/**
 * Clears the session cookie across all browsers.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  })
}
