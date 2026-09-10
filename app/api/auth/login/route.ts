import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth/session'
import { LoginSchema } from '@/lib/validation/auth'
import { ROLE_DASHBOARD_PATHS, type UserRole } from '@/types/user'

export const dynamic = 'force-dynamic'

// Dummy hash for constant-time comparison when email is unknown
const DUMMY_HASH = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.' },
        { status: 400 }
      )
    }

    // Validate input schema
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input.'
      return NextResponse.json(
        { success: false, message: firstError },
        { status: 400 }
      )
    }

    const { email, password, role } = parsed.data

    // Find user by normalized email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      // Timing-safe comparison to prevent username enumeration
      await bcrypt.compare(password, DUMMY_HASH)
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Verify password against secure bcrypt hash
    const passwordValid = await bcrypt.compare(password, user.passwordHash)
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Compare selected role hint against the user's actual database role
    // The database role is the ONLY trusted source
    if (user.role !== role) {
      return NextResponse.json(
        {
          success: false,
          message: 'This account is not registered for the selected role.',
        },
        { status: 403 }
      )
    }

    // Create session using verified database role
    await createSession(user.id, user.role as UserRole)

    const redirectTo = ROLE_DASHBOARD_PATHS[user.role as UserRole]

    return NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectTo,
    })
  } catch (error) {
    console.error('[AUTH/LOGIN]', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected authentication error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
