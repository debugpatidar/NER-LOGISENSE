/**
 * NER-SHIELD Offline Sync Engine
 *
 * Synchronizes PENDING_SYNC and SYNC_FAILED incidents from IndexedDB
 * to the server when connectivity is available.
 *
 * Key guarantees:
 *  - Exactly-once incident creation via `clientIncidentId` idempotency key
 *  - Atomic evidence upload (incident + files in one multipart POST)
 *  - Never deletes local data on failure
 *  - Prevents concurrent sync runs via isSyncing guard
 *  - Safe to call multiple times — duplicates are no-ops
 */

import {
  getPendingIncidents,
  updateIncidentSyncStatus,
  deleteOfflineIncident,
  getMediaForIncident,
  offlineMediaToFile,
  type OfflineIncident,
} from '@/lib/offline/db'

// ─────────────────────────────────────────────────────────────────────────────
// Duplicate-run guard
// ─────────────────────────────────────────────────────────────────────────────

let isSyncing = false

// ─────────────────────────────────────────────────────────────────────────────
// Sync result types
// ─────────────────────────────────────────────────────────────────────────────

export interface SyncResult {
  clientIncidentId: string
  success: boolean
  serverIncidentId?: string
  error?: string
}

export interface SyncSummary {
  processed: number
  succeeded: number
  failed: number
  results: SyncResult[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Main sync function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Synchronizes all PENDING_SYNC and SYNC_FAILED incidents to the server.
 *
 * @param onProgress - Optional callback invoked after each incident is processed.
 * @returns A summary of what was synced.
 */
export async function syncPendingIncidents(
  onProgress?: (result: SyncResult) => void
): Promise<SyncSummary> {
  // Prevent concurrent runs
  if (isSyncing) {
    console.log('[Sync] Already syncing — skipping concurrent run.')
    return { processed: 0, succeeded: 0, failed: 0, results: [] }
  }

  if (!navigator.onLine) {
    console.log('[Sync] Offline — skipping sync.')
    return { processed: 0, succeeded: 0, failed: 0, results: [] }
  }

  isSyncing = true
  const results: SyncResult[] = []

  try {
    const pending = await getPendingIncidents()

    if (pending.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0, results: [] }
    }

    console.log(`[Sync] Starting sync for ${pending.length} pending incident(s).`)

    for (const incident of pending) {
      const result = await syncSingleIncident(incident)
      results.push(result)
      onProgress?.(result)
    }
  } finally {
    isSyncing = false
  }

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  console.log(`[Sync] Complete. ${succeeded} succeeded, ${failed} failed.`)

  return {
    processed: results.length,
    succeeded,
    failed,
    results,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single incident sync
// ─────────────────────────────────────────────────────────────────────────────

async function syncSingleIncident(incident: OfflineIncident): Promise<SyncResult> {
  const { clientIncidentId } = incident

  // Mark as SYNCING
  await updateIncidentSyncStatus(clientIncidentId, {
    syncStatus: 'SYNCING',
    lastSyncAttemptAt: new Date().toISOString(),
    lastSyncError: null,
  })

  try {
    // Retrieve stored media blobs
    const mediaItems = await getMediaForIncident(clientIncidentId)

    if (mediaItems.length === 0) {
      throw new Error(
        'No evidence files found locally. This report requires at least one photo or video.'
      )
    }

    // Build FormData — identical shape to what the online form sends
    const formData = new FormData()
    formData.append('clientIncidentId', clientIncidentId)
    formData.append('title', incident.title)
    formData.append('description', incident.description)
    formData.append('state', incident.state)
    formData.append('locationName', incident.locationName)
    formData.append('latitude', incident.latitude.toString())
    formData.append('longitude', incident.longitude.toString())
    if (incident.locationAccuracy !== null) {
      formData.append('locationAccuracy', incident.locationAccuracy.toString())
    }
    formData.append('locationSource', incident.locationSource)
    formData.append('locationCapturedAt', incident.locationCapturedAt ?? new Date().toISOString())
    formData.append('category', incident.category)
    formData.append('severity', incident.severity)

    // Attach evidence files — reconstructed from ArrayBuffer
    for (const mediaItem of mediaItems) {
      const file = offlineMediaToFile(mediaItem)
      formData.append('files', file)
    }

    // Send to server — idempotency key ensures no duplicate if retried
    const response = await fetch('/api/field/reports', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response.' }))

    // 201 Created — new incident
    // 200 OK — existing incident (idempotent replay)
    if ((response.status === 201 || response.status === 200) && data.success && data.report?.id) {
      const serverIncidentId: string = data.report.id

      // Mark SYNCED and store the server ID
      await updateIncidentSyncStatus(clientIncidentId, {
        syncStatus: 'SYNCED',
        serverIncidentId,
        lastSyncError: null,
      })

      // Delete local data — sync confirmed
      await deleteOfflineIncident(clientIncidentId)

      console.log(`[Sync] ✓ Incident ${clientIncidentId} → server ID ${serverIncidentId}`)
      return { clientIncidentId, success: true, serverIncidentId }
    }

    // Server rejected — mark SYNC_FAILED
    const errorMsg = data.message ?? `Server responded with HTTP ${response.status}.`
    await updateIncidentSyncStatus(clientIncidentId, {
      syncStatus: 'SYNC_FAILED',
      lastSyncError: errorMsg,
    })

    console.warn(`[Sync] ✗ Incident ${clientIncidentId} failed: ${errorMsg}`)
    return { clientIncidentId, success: false, error: errorMsg }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unexpected sync error.'
    await updateIncidentSyncStatus(clientIncidentId, {
      syncStatus: 'SYNC_FAILED',
      lastSyncError: errorMsg,
    })
    console.error(`[Sync] ✗ Incident ${clientIncidentId} exception:`, err)
    return { clientIncidentId, success: false, error: errorMsg }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true if a sync run is currently in progress. */
export function isSyncRunning(): boolean {
  return isSyncing
}
