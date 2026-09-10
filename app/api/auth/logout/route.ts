import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await destroySession()
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    })
  } catch (error) {
    console.error('[AUTH/LOGOUT]', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected logout error occurred.' },
      { status: 500 }
    )
  }
}
