/**
 * useNetworkStatus
 *
 * React hook that tracks real-time network connectivity and pending offline
 * incident count. Triggers automatic synchronization when connectivity is
 * restored.
 *
 * Browser-only — safe to use in client components.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getPendingCount, isIndexedDBAvailable } from '@/lib/offline/db'

export interface NetworkStatus {
  /** True when browser has network connectivity. */
  isOnline: boolean
  /** Number of incidents waiting to sync (PENDING_SYNC + SYNC_FAILED). */
  pendingCount: number
  /** Refreshes the pendingCount from IndexedDB. */
  refreshPendingCount: () => Promise<void>
}

export function useNetworkStatus(onOnline?: () => void): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingCount, setPendingCount] = useState(0)

  // Stable ref to the onOnline callback so we don't re-register listeners on every render
  const onOnlineRef = useRef(onOnline)
  useEffect(() => {
    onOnlineRef.current = onOnline
  }, [onOnline])

  const refreshPendingCount = useCallback(async () => {
    if (!isIndexedDBAvailable()) return
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch {
      // IndexedDB unavailable — ignore
    }
  }, [])

  useEffect(() => {
    // Initial pending count load
    refreshPendingCount()

    const handleOnline = () => {
      setIsOnline(true)
      refreshPendingCount()
      // Fire the callback — sync engine will pick this up
      if (onOnlineRef.current) {
        onOnlineRef.current()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshPendingCount])

  return { isOnline, pendingCount, refreshPendingCount }
}
