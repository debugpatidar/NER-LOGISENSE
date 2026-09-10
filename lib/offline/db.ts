/**
 * NER-SHIELD Offline Storage Layer
 *
 * Browser-only IndexedDB wrapper using `idb`.
 * Stores pending Field Officer incident reports and evidence files locally
 * so they can be submitted when connectivity is restored.
 *
 * NEVER import this file on the server side (API routes, server components).
 * All functions are async and safe to call from React client components.
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { IncidentCategory, IncidentSeverity, LocationSource } from '@/types/incident'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DB_NAME = 'ner-shield-offline'
const DB_VERSION = 1

const STORE_INCIDENTS = 'offlineIncidents'
const STORE_MEDIA = 'offlineMedia'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type OfflineSyncStatus =
  | 'PENDING_SYNC'
  | 'SYNCING'
  | 'SYNCED'
  | 'SYNC_FAILED'

export interface OfflineIncident {
  /** Unique client-generated ID (UUID). This is the primary key. */
  clientIncidentId: string
  /** Server-assigned ID, populated after successful sync. */
  serverIncidentId: string | null
  /** Current sync lifecycle state. */
  syncStatus: OfflineSyncStatus
  /** Human-readable error message from the last failed sync attempt. */
  lastSyncError: string | null
  /** ISO timestamp of the last sync attempt. */
  lastSyncAttemptAt: string | null
  /** ISO timestamp when the report was saved offline. */
  savedAt: string

  // ── Form fields ──────────────────────────────────────────────
  title: string
  description: string
  state: string
  locationName: string
  latitude: number
  longitude: number
  locationAccuracy: number | null
  locationSource: LocationSource
  locationCapturedAt: string | null
  category: IncidentCategory
  severity: IncidentSeverity
}

export interface OfflineMediaItem {
  /** Unique ID for this media item. */
  id: string
  /** Foreign key to `OfflineIncident.clientIncidentId`. */
  clientIncidentId: string
  /** Original file name. */
  filename: string
  /** MIME type. */
  mimeType: string
  /** File size in bytes. */
  size: number
  /** Media type classification. */
  type: 'PHOTO' | 'VIDEO'
  /** Raw binary data. Stored as ArrayBuffer — survives IndexedDB serialization. */
  data: ArrayBuffer
}

interface NerShieldDB {
  [STORE_INCIDENTS]: {
    key: string
    value: OfflineIncident
    indexes: {
      'by-syncStatus': string
      'by-savedAt': string
    }
  }
  [STORE_MEDIA]: {
    key: string
    value: OfflineMediaItem
    indexes: {
      'by-clientIncidentId': string
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DB Singleton
// ─────────────────────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<NerShieldDB>> | null = null

function getDB(): Promise<IDBPDatabase<NerShieldDB>> {
  if (typeof window === 'undefined') {
    throw new Error('[OfflineDB] IndexedDB is not available on the server.')
  }

  if (!dbPromise) {
    dbPromise = openDB<NerShieldDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // ── offlineIncidents store ────────────────────────────
        if (!db.objectStoreNames.contains(STORE_INCIDENTS)) {
          const incidentStore = db.createObjectStore(STORE_INCIDENTS, {
            keyPath: 'clientIncidentId',
          })
          incidentStore.createIndex('by-syncStatus', 'syncStatus')
          incidentStore.createIndex('by-savedAt', 'savedAt')
        }

        // ── offlineMedia store ────────────────────────────────
        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          const mediaStore = db.createObjectStore(STORE_MEDIA, {
            keyPath: 'id',
          })
          mediaStore.createIndex('by-clientIncidentId', 'clientIncidentId')
        }
      },
      blocked() {
        console.warn('[OfflineDB] Database upgrade blocked — close other NER-SHIELD tabs.')
      },
      blocking() {
        dbPromise = null
      },
    })
  }

  return dbPromise
}

// ─────────────────────────────────────────────────────────────────────────────
// Incident CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Saves a new offline incident record with PENDING_SYNC status.
 */
export async function saveOfflineIncident(
  incident: Omit<OfflineIncident, 'syncStatus' | 'serverIncidentId' | 'lastSyncError' | 'lastSyncAttemptAt' | 'savedAt'>
): Promise<OfflineIncident> {
  const db = await getDB()
  const record: OfflineIncident = {
    ...incident,
    syncStatus: 'PENDING_SYNC',
    serverIncidentId: null,
    lastSyncError: null,
    lastSyncAttemptAt: null,
    savedAt: new Date().toISOString(),
  }
  await db.put(STORE_INCIDENTS, record)
  return record
}

/**
 * Retrieves a single offline incident by its client ID.
 */
export async function getOfflineIncident(clientIncidentId: string): Promise<OfflineIncident | undefined> {
  const db = await getDB()
  return db.get(STORE_INCIDENTS, clientIncidentId)
}

/**
 * Returns all incidents with the given sync status, ordered by savedAt ascending.
 */
export async function getIncidentsByStatus(status: OfflineSyncStatus): Promise<OfflineIncident[]> {
  const db = await getDB()
  const results = await db.getAllFromIndex(STORE_INCIDENTS, 'by-syncStatus', status)
  return results.sort((a, b) => a.savedAt.localeCompare(b.savedAt))
}

/**
 * Returns all incidents that need syncing: PENDING_SYNC and SYNC_FAILED.
 */
export async function getPendingIncidents(): Promise<OfflineIncident[]> {
  const [pending, failed] = await Promise.all([
    getIncidentsByStatus('PENDING_SYNC'),
    getIncidentsByStatus('SYNC_FAILED'),
  ])
  return [...pending, ...failed].sort((a, b) => a.savedAt.localeCompare(b.savedAt))
}

/**
 * Returns ALL offline incidents regardless of status, newest first.
 */
export async function getAllOfflineIncidents(): Promise<OfflineIncident[]> {
  const db = await getDB()
  const all = await db.getAll(STORE_INCIDENTS)
  return all.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

/**
 * Returns the count of incidents in PENDING_SYNC or SYNC_FAILED state.
 */
export async function getPendingCount(): Promise<number> {
  const pending = await getPendingIncidents()
  return pending.length
}

/**
 * Updates the sync status and optional fields of an incident.
 */
export async function updateIncidentSyncStatus(
  clientIncidentId: string,
  update: {
    syncStatus: OfflineSyncStatus
    serverIncidentId?: string | null
    lastSyncError?: string | null
    lastSyncAttemptAt?: string
  }
): Promise<void> {
  const db = await getDB()
  const existing = await db.get(STORE_INCIDENTS, clientIncidentId)
  if (!existing) {
    console.warn(`[OfflineDB] Incident ${clientIncidentId} not found for status update.`)
    return
  }
  const updated: OfflineIncident = {
    ...existing,
    syncStatus: update.syncStatus,
    serverIncidentId: update.serverIncidentId !== undefined ? update.serverIncidentId : existing.serverIncidentId,
    lastSyncError: update.lastSyncError !== undefined ? update.lastSyncError : existing.lastSyncError,
    lastSyncAttemptAt: update.lastSyncAttemptAt ?? existing.lastSyncAttemptAt,
  }
  await db.put(STORE_INCIDENTS, updated)
}

/**
 * Deletes an incident and all its associated media from IndexedDB.
 * Only call this after confirmed server sync.
 */
export async function deleteOfflineIncident(clientIncidentId: string): Promise<void> {
  await deleteMediaForIncident(clientIncidentId)
  const db = await getDB()
  await db.delete(STORE_INCIDENTS, clientIncidentId)
}

// ─────────────────────────────────────────────────────────────────────────────
// Media CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Saves a media file for an offline incident.
 * The File's binary content is read into an ArrayBuffer for IndexedDB storage.
 */
export async function saveOfflineMedia(
  clientIncidentId: string,
  file: File,
  type: 'PHOTO' | 'VIDEO'
): Promise<OfflineMediaItem> {
  const data = await file.arrayBuffer()
  const item: OfflineMediaItem = {
    id: `${clientIncidentId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    clientIncidentId,
    filename: file.name,
    mimeType: file.type || (type === 'PHOTO' ? 'image/jpeg' : 'video/mp4'),
    size: file.size,
    type,
    data,
  }
  const db = await getDB()
  await db.put(STORE_MEDIA, item)
  return item
}

/**
 * Retrieves all media items for a given offline incident.
 */
export async function getMediaForIncident(clientIncidentId: string): Promise<OfflineMediaItem[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORE_MEDIA, 'by-clientIncidentId', clientIncidentId)
}

/**
 * Deletes all media stored for a given offline incident.
 */
export async function deleteMediaForIncident(clientIncidentId: string): Promise<void> {
  const db = await getDB()
  const items = await db.getAllFromIndex(STORE_MEDIA, 'by-clientIncidentId', clientIncidentId)
  const tx = db.transaction(STORE_MEDIA, 'readwrite')
  await Promise.all(items.map((item) => tx.store.delete(item.id)))
  await tx.done
}

/**
 * Converts a stored OfflineMediaItem back into a File object for API upload.
 */
export function offlineMediaToFile(item: OfflineMediaItem): File {
  return new File([item.data], item.filename, { type: item.mimeType })
}

/**
 * Checks whether IndexedDB is available in the current environment.
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}
