import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import type { UserRole } from '@/types/user'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    // Fetch fresh user data (strictly exclude passwordHash)
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error('[AUTH/SESSION]', error)
    return NextResponse.json(
      { authenticated: false, user: null, message: 'An unexpected session check error occurred.' },
      { status: 500 }
    )
  }
}
