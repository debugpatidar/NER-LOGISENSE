import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const ALLOWED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
]

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
export const MAX_FILES_PER_INCIDENT = 10

export interface ValidatedMedia {
  type: 'PHOTO' | 'VIDEO'
  mimeType: string
  buffer: Buffer
  originalName: string
  size: number
}

export function validateMediaFile(
  file: { name: string; type: string; size: number },
  bufferLength: number
): { valid: boolean; type?: 'PHOTO' | 'VIDEO'; error?: string } {
  const mime = file.type.toLowerCase()
  const name = file.name.toLowerCase()

  // Detect type based on mime or file extension fallback
  const isPhotoMime = ALLOWED_PHOTO_MIME_TYPES.includes(mime)
  const isVideoMime = ALLOWED_VIDEO_MIME_TYPES.includes(mime)

  const isPhotoExt = /\.(jpe?g|png|webp)$/i.test(name)
  const isVideoExt = /\.(mp4|webm|mov)$/i.test(name)

  let detectedType: 'PHOTO' | 'VIDEO' | null = null

  if (isPhotoMime || (isPhotoExt && mime.startsWith('image/'))) {
    detectedType = 'PHOTO'
  } else if (isVideoMime || (isVideoExt && (mime.startsWith('video/') || mime === 'application/octet-stream'))) {
    detectedType = 'VIDEO'
  }

  if (!detectedType) {
    return {
      valid: false,
      error: `Unsupported file type for "${file.name}". Allowed: JPEG, PNG, WEBP, MP4, WEBM, MOV.`,
    }
  }

  if (detectedType === 'PHOTO' && bufferLength > MAX_PHOTO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Photo "${file.name}" exceeds maximum allowed size of 10MB (${(bufferLength / (1024 * 1024)).toFixed(1)}MB).`,
    }
  }

  if (detectedType === 'VIDEO' && bufferLength > MAX_VIDEO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Video "${file.name}" exceeds maximum allowed size of 50MB (${(bufferLength / (1024 * 1024)).toFixed(1)}MB).`,
    }
  }

  return {
    valid: true,
    type: detectedType,
  }
}

export async function saveIncidentMedia(
  incidentId: string,
  originalFilename: string,
  buffer: Buffer,
  mimeType: string,
  type: 'PHOTO' | 'VIDEO'
): Promise<{
  url: string
  filename: string
  mimeType: string
  size: number
  type: 'PHOTO' | 'VIDEO'
}> {
  // Base storage directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'incidents', incidentId)
  await fs.mkdir(uploadsDir, { recursive: true })

  // Sanitize filename & create unique name
  const ext = path.extname(originalFilename) || (type === 'PHOTO' ? '.jpg' : '.mp4')
  const baseName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
  const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}-${baseName}${ext.toLowerCase()}`

  const targetPath = path.join(uploadsDir, uniqueName)
  await fs.writeFile(targetPath, buffer)

  // Public relative URL
  const publicUrl = `/uploads/incidents/${incidentId}/${uniqueName}`

  return {
    url: publicUrl,
    filename: originalFilename,
    mimeType,
    size: buffer.length,
    type,
  }
}
