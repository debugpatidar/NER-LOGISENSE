import { redirect } from 'next/navigation'
import { getSession, destroySession } from './session'
import { prisma } from '@/lib/db'
import { ROLE_DASHBOARD_PATHS, type UserRole } from '@/types/user'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  role: UserRole
}

/**
 * Ensures the incoming request is from a valid, authenticated user.
 * Queries the database using the session's userId to guarantee the user exists.
 * Redirects to /login if unauthenticated or user is missing.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await getSession()
  if (!session?.userId) {
    redirect('/login')
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      await destroySession()
      redirect('/login')
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    }
  } catch (error) {
    // If it's a redirect thrown by Next.js, let it propagate
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    console.error('[AUTH/REQUIRE_AUTH]', error)
    redirect('/login')
  }
}

/**
 * Ensures the incoming request is from an authenticated user with the specified role.
 * The database role is the ONLY trusted source of truth.
 *
 * If unauthenticated: redirects to /login.
 * If logged in with a different role: redirects to that user's own authorized dashboard.
 */
export async function requireRole(allowedRole: UserRole): Promise<AuthenticatedUser> {
  const user = await requireAuth()

  if (user.role !== allowedRole) {
    const targetPath = ROLE_DASHBOARD_PATHS[user.role] ?? '/login'
    redirect(targetPath)
  }

  return user
}
