import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
  validateMediaFile,
  saveIncidentMedia,
  MAX_FILES_PER_INCIDENT,
} from '@/lib/storage'
import type { MediaType } from '@prisma/client'

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateFieldOfficer()
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      )
    }

    const { id: incidentId } = await context.params
    if (!incidentId) {
      return NextResponse.json(
        { success: false, message: 'Incident ID is required.' },
        { status: 400 }
      )
    }

    // Verify incident exists
    const incident = await prisma.fieldIncident.findUnique({
      where: { id: incidentId },
      include: {
        _count: {
          select: { media: true },
        },
      },
    })

    if (!incident) {
      return NextResponse.json(
        { success: false, message: 'Incident report not found.' },
        { status: 404 }
      )
    }

    // Read form data
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
      if (value instanceof File && (key === 'files' || key === 'media' || key === 'file' || key.startsWith('file_'))) {
        files.push(value)
      }
    }

    // Fallback if key didn't match the specific names
    if (files.length === 0) {
      for (const value of formData.values()) {
        if (value instanceof File) {
          files.push(value)
        }
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No media files provided.' },
        { status: 400 }
      )
    }

    // Check count limit
    const currentMediaCount = incident._count.media
    if (currentMediaCount + files.length > MAX_FILES_PER_INCIDENT) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot upload ${files.length} file(s). Incident already has ${currentMediaCount} files (maximum ${MAX_FILES_PER_INCIDENT}).`,
        },
        { status: 400 }
      )
    }

    // Validate each file
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
          { success: false, message: validation.error || 'Invalid file.' },
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

    // Save files to disk and create database records
    const savedRecords = []
    for (const item of validatedFiles) {
      const saved = await saveIncidentMedia(
        incidentId,
        item.originalName,
        item.buffer,
        item.mimeType,
        item.type
      )

      const mediaRecord = await prisma.incidentMedia.create({
        data: {
          incidentId,
          type: saved.type as MediaType,
          url: saved.url,
          filename: saved.filename,
          mimeType: saved.mimeType,
          size: saved.size,
        },
      })

      savedRecords.push(mediaRecord)
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully uploaded ${savedRecords.length} media file(s).`,
        media: savedRecords,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API/FIELD/REPORTS/[ID]/MEDIA/POST]', error)
    return NextResponse.json(
      { success: false, message: 'Failed to upload incident media.' },
      { status: 500 }
    )
  }
}
