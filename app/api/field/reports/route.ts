import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { CreateIncidentSchema } from '@/lib/validation/incident'
import { validateMediaFile, saveIncidentMedia, MAX_FILES_PER_INCIDENT } from '@/lib/storage'
import type { IncidentCategory, IncidentSeverity, IncidentStatus, LocationSource, MediaType } from '@prisma/client'

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

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateFieldOfficer()
    if ('error' in auth) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}

    if (state && state !== 'ALL') {
      where.state = state
    }
    if (severity && severity !== 'ALL') {
      where.severity = severity as IncidentSeverity
    }
    if (status && status !== 'ALL') {
      where.status = status as IncidentStatus
    }
    if (category && category !== 'ALL') {
      where.category = category as IncidentCategory
    }

    const reports = await prisma.fieldIncident.findMany({
      where,
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        media: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports,
    })
  } catch (error) {
    console.error('[API/FIELD/REPORTS/GET]', error)
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve field reports.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateFieldOfficer()
    if ('error' in auth) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status })
    }

    const contentType = request.headers.get('content-type') || ''

    // 1. MULTIPART FORM DATA SUBMISSION (Standard Field Officer Flow with Evidence)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData().catch(() => null)
      if (!formData) {
        return NextResponse.json(
          { success: false, message: 'Invalid multipart form data.' },
          { status: 400 }
        )
      }

      // Collect all uploaded files from form data
      const files: File[] = []
      for (const [key, value] of formData.entries()) {
        if (
          value instanceof File &&
          (key === 'files' || key === 'media' || key === 'file' || key.startsWith('file_'))
        ) {
          files.push(value)
        }
      }

      if (files.length === 0) {
        for (const value of formData.values()) {
          if (value instanceof File) {
            files.push(value)
          }
        }
      }

      // MANDATORY EVIDENCE REQUIREMENT: Rejects zero evidence
      if (files.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Photo or video evidence is required to submit an incident report.' },
          { status: 400 }
        )
      }

      if (files.length > MAX_FILES_PER_INCIDENT) {
        return NextResponse.json(
          {
            success: false,
            message: `Maximum ${MAX_FILES_PER_INCIDENT} evidence files allowed per incident report.`,
          },
          { status: 400 }
        )
      }

      // Validate every media file
      const validatedFiles: {
        originalName: string
        buffer: Buffer
        mimeType: string
        size: number
        type: 'PHOTO' | 'VIDEO'
      }[] = []

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const validation = validateMediaFile(
          { name: file.name, type: file.type, size: file.size },
          buffer.length
        )

        if (!validation.valid || !validation.type) {
          return NextResponse.json(
            { success: false, message: validation.error || 'Invalid file format or size.' },
            { status: 400 }
          )
        }

        validatedFiles.push({
          originalName: file.name,
          buffer,
          mimeType: file.type || (validation.type === 'PHOTO' ? 'image/jpeg' : 'video/mp4'),
          size: buffer.length,
          type: validation.type,
        })
      }

      if (validatedFiles.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Photo or video evidence is required to submit an incident report.' },
          { status: 400 }
        )
      }

      // Extract metadata fields
      const clientIncidentId = ((formData.get('clientIncidentId') as string) || '').trim() || null
      const title = ((formData.get('title') as string) || '').trim()
      const description = ((formData.get('description') as string) || '').trim()
      const state = ((formData.get('state') as string) || '').trim()
      const locationName = ((formData.get('locationName') as string) || '').trim()
      const latRaw = formData.get('latitude')
      const lngRaw = formData.get('longitude')
      const accRaw = formData.get('locationAccuracy')
      const locationSource = (formData.get('locationSource') as string) || 'MAP_MANUAL'
      const locationCapturedAt = (formData.get('locationCapturedAt') as string) || null
      const category = formData.get('category') as string
      const severity = formData.get('severity') as string

      const latitude = latRaw ? parseFloat(latRaw as string) : NaN
      const longitude = lngRaw ? parseFloat(lngRaw as string) : NaN
      const locationAccuracy = accRaw ? parseFloat(accRaw as string) : null


      const parsed = CreateIncidentSchema.safeParse({
        title,
        description,
        state,
        locationName,
        latitude,
        longitude,
        locationAccuracy,
        locationSource,
        locationCapturedAt,
        category,
        severity,
      })

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, message: parsed.error.issues[0]?.message || 'Validation failed.' },
          { status: 400 }
        )
      }

      // IDEMPOTENCY: If clientIncidentId is present, check whether this incident
      // was already created (e.g., sync retry). Return the existing record — do NOT create a duplicate.
      if (clientIncidentId) {
        const existing = await prisma.fieldIncident.findUnique({
          where: { clientIncidentId },
          include: {
            officer: { select: { id: true, name: true, email: true } },
            media: true,
          },
        })
        if (existing) {
          return NextResponse.json(
            {
              success: true,
              message: 'Incident data submitted to Logistics Operator Center.',
              report: existing,
            },
            { status: 200 }
          )
        }
      } else {
        // No clientIncidentId — online submission. Apply simple 10-second time-based duplicate guard.
        const recentDuplicate = await prisma.fieldIncident.findFirst({
          where: {
            officerId: auth.user.id,
            title: parsed.data.title,
            latitude: parsed.data.latitude,
            longitude: parsed.data.longitude,
            createdAt: {
              gte: new Date(Date.now() - 10000),
            },
          },
        })

        if (recentDuplicate) {
          return NextResponse.json(
            {
              success: false,
              message: 'Duplicate incident report detected. This incident has already been submitted.',
            },
            { status: 409 }
          )
        }
      }

      // Atomic transaction: Create incident and associated media

      const report = await prisma.$transaction(async (tx) => {
        const incident = await tx.fieldIncident.create({
          data: {
            clientIncidentId: clientIncidentId ?? undefined,
            title: parsed.data.title,
            description: parsed.data.description,
            state: parsed.data.state,
            locationName: parsed.data.locationName,
            latitude: parsed.data.latitude,
            longitude: parsed.data.longitude,
            locationAccuracy: parsed.data.locationAccuracy ?? null,
            locationSource: (parsed.data.locationSource ?? 'MAP_MANUAL') as LocationSource,
            locationCapturedAt: parsed.data.locationCapturedAt
              ? new Date(parsed.data.locationCapturedAt)
              : null,
            category: parsed.data.category as IncidentCategory,
            severity: parsed.data.severity as IncidentSeverity,
            status: 'ACTIVE' as IncidentStatus,
            officerId: auth.user.id,
          },
        })


        // Save files to disk and create IncidentMedia records
        for (const item of validatedFiles) {
          const saved = await saveIncidentMedia(
            incident.id,
            item.originalName,
            item.buffer,
            item.mimeType,
            item.type
          )

          await tx.incidentMedia.create({
            data: {
              incidentId: incident.id,
              type: saved.type as MediaType,
              url: saved.url,
              filename: saved.filename,
              mimeType: saved.mimeType,
              size: saved.size,
            },
          })
        }

        return tx.fieldIncident.findUnique({
          where: { id: incident.id },
          include: {
            officer: {
              select: { id: true, name: true, email: true },
            },
            media: true,
          },
        })
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Incident data submitted to Logistics Operator Center.',
          report,
        },
        { status: 201 }
      )
    }

    // 2. RAW JSON SUBMISSION (Direct API calls or pre-associated media)
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Invalid request payload.' },
        { status: 400 }
      )
    }

    // Independent verification of actual media records (never trust client flags like hasEvidence)
    let verifiedMediaRecords: { id: string }[] = []
    if (Array.isArray(body.mediaIds) && body.mediaIds.length > 0) {
      verifiedMediaRecords = await prisma.incidentMedia.findMany({
        where: {
          id: { in: body.mediaIds },
        },
        select: { id: true },
      })
    }

    // Reject if zero verified media records exist
    if (verifiedMediaRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Photo or video evidence is required to submit an incident report.',
        },
        { status: 400 }
      )
    }

    const parsed = CreateIncidentSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Validation failed.'
      return NextResponse.json(
        { success: false, message: firstError },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check for duplicate submission within 10 seconds
    const recentDuplicate = await prisma.fieldIncident.findFirst({
      where: {
        officerId: auth.user.id,
        title: data.title,
        latitude: data.latitude,
        longitude: data.longitude,
        createdAt: {
          gte: new Date(Date.now() - 10000),
        },
      },
    })

    if (recentDuplicate) {
      return NextResponse.json(
        {
          success: false,
          message: 'Duplicate incident report detected. This incident has already been submitted.',
        },
        { status: 409 }
      )
    }

    // Enforce authenticated officer ID from session - never trust request body
    const report = await prisma.fieldIncident.create({
      data: {
        title: data.title,
        description: data.description,
        state: data.state,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        locationAccuracy: data.locationAccuracy ?? null,
        locationSource: (data.locationSource ?? 'MAP_MANUAL') as LocationSource,
        locationCapturedAt: data.locationCapturedAt ? new Date(data.locationCapturedAt) : null,
        category: data.category as IncidentCategory,
        severity: data.severity as IncidentSeverity,
        status: (data.status ?? 'ACTIVE') as IncidentStatus,
        officerId: auth.user.id,
      },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        media: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Incident data submitted to Logistics Operator Center.',
        report,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API/FIELD/REPORTS/POST]', error)
    return NextResponse.json(
      { success: false, message: 'Failed to submit field incident report.' },
      { status: 500 }
    )
  }
}

