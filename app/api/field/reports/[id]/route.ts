import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { UpdateIncidentStatusSchema } from '@/lib/validation/incident'
import type { IncidentStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

async function authenticateFieldOfficer() {
  const session = await getSession()
  if (!session?.userId) {
    return { error: 'Authentication required.', status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!user) {
    return { error: 'User account not found.', status: 401 }
  }

  if (user.role !== 'FIELD_OFFICER') {
    return { error: 'Access restricted to Field Officers.', status: 403 }
  }

  return { user }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateFieldOfficer()
    if ('error' in auth) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status })
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Incident ID is required.' },
        { status: 400 }
      )
    }

    const existing = await prisma.fieldIncident.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Incident record not found.' },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.' },
        { status: 400 }
      )
    }

    const parsed = UpdateIncidentStatusSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid status payload.'
      return NextResponse.json(
        { success: false, message: firstError },
        { status: 400 }
      )
    }

    const updated = await prisma.fieldIncident.update({
      where: { id },
      data: {
        status: parsed.data.status as IncidentStatus,
      },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Incident status updated to ${updated.status}.`,
      report: updated,
    })
  } catch (error) {
    console.error('[API/FIELD/REPORTS/PATCH]', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update incident status.' },
      { status: 500 }
    )
  }
}
