'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LogOut,
  User as UserIcon,
  MapPin,
  Send,
  CheckCircle2,
  UploadCloud,
  FileImage,
  Film,
  Trash2,
  Crosshair,
  Radio,
  Check,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldAlert,
  Wifi,
  WifiOff,
  CloudUpload,
  Loader2,
  DatabaseZap,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  NER_STATES,
  type IncidentCategory,
  type IncidentSeverity,
  type LocationSource,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
} from '@/types/incident'
import { saveOfflineIncident, saveOfflineMedia, getAllOfflineIncidents, isIndexedDBAvailable, type OfflineIncident } from '@/lib/offline/db'
import { syncPendingIncidents } from '@/lib/offline/sync'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { FieldOperationsMap } from './FieldOperationsMap'



interface FieldDashboardWorkspaceProps {
  initialUser: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface SelectedMediaFile {
  id: string
  file: File
  previewUrl: string
  type: 'PHOTO' | 'VIDEO'
  sizeFormatted: string
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50MB
const MAX_TOTAL_FILES = 10

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface SubmittedReportSummary {
  id: string
  title: string
  category: IncidentCategory
  severity: IncidentSeverity
  state: string
  locationName: string
  latitude: number
  longitude: number
  locationAccuracy: number | null
  mediaCount: number
  submittedAt: string
  /** True when saved to IndexedDB offline (no server contact yet). */
  isOfflineSaved?: boolean
  /** The offline clientIncidentId when saved locally. */
  clientIncidentId?: string
}


export function FieldDashboardWorkspace({ initialUser }: FieldDashboardWorkspaceProps) {
  const [loggingOut, setLoggingOut] = useState(false)

  // Prevent back-forward cache (bfcache) restoration after logout
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload()
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.replace('/login')
    } catch {
      setLoggingOut(false)
    }
  }

  // Form states
  const [category, setCategory] = useState<IncidentCategory>('LANDSLIDE')
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH')
  const [title, setTitle] = useState('')
  const [state, setState] = useState<string>('Assam')
  const [locationName, setLocationName] = useState('')
  const [description, setDescription] = useState('')

  // Location / GPS states
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [locationSource, setLocationSource] = useState<LocationSource>('GPS')
  const [locationCapturedAt, setLocationCapturedAt] = useState<string | null>(null)
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [gpsCaptured, setGpsCaptured] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)


  // Evidence states
  const [evidenceItems, setEvidenceItems] = useState<SelectedMediaFile[]>([])
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Submission & Toast states
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string; type?: 'success' | 'offline' | 'error' } | null>(null)
  const [submittedReport, setSubmittedReport] = useState<SubmittedReportSummary | null>(null)

  // ── Offline / Sync states ─────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [offlineReports, setOfflineReports] = useState<OfflineIncident[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  /** Network status hook — will call syncOnReconnect when online state fires. */
  const networkStatus = useNetworkStatus()
  const { isOnline, pendingCount, refreshPendingCount } = networkStatus
  const activeOnline = mounted ? isOnline : true


  /** Refresh the offline report list from IndexedDB. */
  const refreshOfflineReports = useCallback(async () => {
    if (!isIndexedDBAvailable()) return
    try {
      const all = await getAllOfflineIncidents()
      setOfflineReports(all)
    } catch {
      // ignore
    }
  }, [])

  /** Run the sync engine and refresh state. */
  const handleSync = useCallback(async () => {
    if (syncing || !navigator.onLine) return
    setSyncing(true)
    setSyncMessage('Syncing pending reports...')
    try {
      const summary = await syncPendingIncidents()
      await Promise.all([refreshOfflineReports(), refreshPendingCount()])
      if (summary.succeeded > 0) {
        setSyncMessage(`${summary.succeeded} report(s) synced to Operator Center.`)
        setTimeout(() => setSyncMessage(null), 5000)
      } else if (summary.failed > 0) {
        setSyncMessage(`${summary.failed} report(s) failed to sync — will retry on next connection.`)
        setTimeout(() => setSyncMessage(null), 7000)
      } else {
        setSyncMessage(null)
      }
    } catch {
      setSyncMessage('Sync encountered an error. Will retry automatically.')
      setTimeout(() => setSyncMessage(null), 6000)
    } finally {
      setSyncing(false)
    }
  }, [syncing, refreshOfflineReports, refreshPendingCount])

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline && !syncing) {
      handleSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  // Load offline reports on mount + trigger sync if online
  useEffect(() => {
    refreshOfflineReports()
    if (isIndexedDBAvailable() && navigator.onLine) {
      handleSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



  // Clean up object URLs on unmount or reset
  useEffect(() => {
    return () => {
      evidenceItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [evidenceItems])



  // Geolocation trigger — capture real device GPS
  const handleGetMyLiveLocation = () => {
    setGpsError(null)
    setErrorMessage(null)

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.')
      return
    }

    setGpsLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false)
        const lat = Number(position.coords.latitude.toFixed(4))
        const lng = Number(position.coords.longitude.toFixed(4))
        const acc = Math.round(position.coords.accuracy)

        setLatitude(lat.toString())
        setLongitude(lng.toString())
        setLocationAccuracy(acc)
        setLocationSource('GPS')
        setLocationCapturedAt(new Date().toISOString())
        setGpsCaptured(true)
        setLocationConfirmed(false)
      },
      (geoErr) => {
        setGpsLoading(false)
        let msg = 'Unable to determine your current location. Please move to an area with better GPS signal and try again.'
        if (geoErr.code === 1) {
          msg = 'Location permission was denied. Please allow location access in your browser settings and try again.'
        } else if (geoErr.code === 2) {
          msg = 'Unable to determine your current location. Please move to an area with better GPS signal and try again.'
        } else if (geoErr.code === 3) {
          msg = 'GPS location request timed out. Please try again.'
        }
        setGpsError(msg)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleConfirmLiveLocation = () => {
    setErrorMessage(null)
    setGpsError(null)

    if (!gpsCaptured || !latitude || !longitude) {
      setErrorMessage('Please capture your live GPS location using [ GET MY LIVE LOCATION ] before confirming.')
      return
    }

    const latNum = parseFloat(latitude)
    const lngNum = parseFloat(longitude)

    if (isNaN(latNum) || isNaN(lngNum)) {
      setErrorMessage('Invalid coordinates acquired. Please click [ GET MY LIVE LOCATION ] again.')
      return
    }

    setLocationConfirmed(true)
  }


  // Handle media file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvidenceError(null)
    const files = e.target.files
    if (!files || files.length === 0) return

    if (evidenceItems.length + files.length > MAX_TOTAL_FILES) {
      setEvidenceError(`Maximum ${MAX_TOTAL_FILES} evidence files allowed per incident report.`)
      return
    }

    const newItems: SelectedMediaFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const mime = file.type.toLowerCase()
      const name = file.name.toLowerCase()

      const isPhoto =
        mime.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(name)
      const isVideo =
        mime.startsWith('video/') ||
        mime === 'application/octet-stream' ||
        /\.(mp4|webm|mov)$/i.test(name)

      if (!isPhoto && !isVideo) {
        setEvidenceError(`"${file.name}" is not a supported image or video format.`)
        continue
      }

      if (isPhoto && file.size > MAX_PHOTO_BYTES) {
        setEvidenceError(`Photo "${file.name}" exceeds 10MB limit (${formatFileSize(file.size)}).`)
        continue
      }

      if (isVideo && file.size > MAX_VIDEO_BYTES) {
        setEvidenceError(`Video "${file.name}" exceeds 50MB limit (${formatFileSize(file.size)}).`)
        continue
      }

      const previewUrl = URL.createObjectURL(file)
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        type: isPhoto ? 'PHOTO' : 'VIDEO',
        sizeFormatted: formatFileSize(file.size),
      })
    }

    setEvidenceItems((prev) => [...prev, ...newItems])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveMedia = (id: string) => {
    setEvidenceItems((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((item) => item.id !== id)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setEvidenceError(null)

    if (!gpsCaptured || !latitude || !longitude) {
      setErrorMessage('Real device GPS location is required. Please click [ GET MY LIVE LOCATION ] to acquire your coordinates.')
      return
    }

    const latNum = parseFloat(latitude)
    const lngNum = parseFloat(longitude)

    if (isNaN(latNum) || isNaN(lngNum)) {
      setErrorMessage('Please provide valid numerical coordinates.')
      return
    }

    if (!locationConfirmed) {
      setErrorMessage('Please confirm your live coordinates using [ CONFIRM LIVE LOCATION ] before transmitting.')
      return
    }


    if (evidenceItems.length === 0) {
      setErrorMessage('Photo or video evidence is required to submit an incident report.')
      return
    }

    if (!title.trim()) {
      setErrorMessage('Incident title is required.')
      return
    }

    if (!locationName.trim()) {
      setErrorMessage('Corridor / landmark location name is required.')
      return
    }

    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage('Please provide at least 5 characters of ground observation notes.')
      return
    }

    setSubmitting(true)

    // ── OFFLINE PATH ──────────────────────────────────────────────────────────
    if (!navigator.onLine) {
      setStatusMessage('SAVING REPORT OFFLINE...')
      try {
        const clientIncidentId = crypto.randomUUID()

        // Save incident metadata to IndexedDB
        await saveOfflineIncident({
          clientIncidentId,
          title: title.trim(),
          description: description.trim(),
          state,
          locationName: locationName.trim(),
          latitude: latNum,
          longitude: lngNum,
          locationAccuracy,
          locationSource,
          locationCapturedAt,
          category,
          severity,
        })

        // Save each evidence file as ArrayBuffer in IndexedDB
        for (const item of evidenceItems) {
          await saveOfflineMedia(clientIncidentId, item.file, item.type)
        }

        // Refresh offline list
        await refreshOfflineReports()
        await refreshPendingCount()

        // Show offline saved confirmation
        setToastMessage({
          title: 'Report saved offline.',
          subtitle: 'Will sync to Operator Center when internet is restored.',
          type: 'offline',
        })

        setSubmittedReport({
          id: clientIncidentId,
          title: title.trim(),
          category,
          severity,
          state,
          locationName: locationName.trim(),
          latitude: latNum,
          longitude: lngNum,
          locationAccuracy,
          mediaCount: evidenceItems.length,
          submittedAt: new Date().toLocaleTimeString(),
          isOfflineSaved: true,
          clientIncidentId,
        })

        setTimeout(() => setToastMessage(null), 10000)
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? `Failed to save offline: ${err.message}`
            : 'Failed to save report offline. Please try again.'
        )
      } finally {
        setSubmitting(false)
        setStatusMessage(null)
      }
      return
    }

    // ── ONLINE PATH ───────────────────────────────────────────────────────────
    setStatusMessage('TRANSMITTING FIELD INCIDENT REPORT WITH EVIDENCE...')

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('state', state)
      formData.append('locationName', locationName.trim())
      formData.append('latitude', latNum.toString())
      formData.append('longitude', lngNum.toString())
      if (locationAccuracy !== null) {
        formData.append('locationAccuracy', locationAccuracy.toString())
      }
      formData.append('locationSource', locationSource)
      formData.append('locationCapturedAt', locationCapturedAt || new Date().toISOString())
      formData.append('category', category)
      formData.append('severity', severity)

      evidenceItems.forEach((item) => {
        formData.append('files', item.file)
      })

      const res = await fetch('/api/field/reports', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!data.success || !data.report?.id) {
        setErrorMessage(data.message ?? 'Incident submission failed. Please check connection and retry.')
        setSubmitting(false)
        setStatusMessage(null)
        return
      }

      const createdReport = data.report

      // Show confirmed toast & transition to submitted summary screen
      setToastMessage({
        title: 'Incident data submitted to Logistics Operator Center.',
        subtitle: 'Your report and incident evidence have been received.',
        type: 'success',
      })

      setSubmittedReport({
        id: createdReport.id,
        title: title.trim(),
        category,
        severity,
        state,
        locationName: locationName.trim(),
        latitude: latNum,
        longitude: lngNum,
        locationAccuracy,
        mediaCount: evidenceItems.length,
        submittedAt: new Date().toLocaleTimeString(),
        isOfflineSaved: false,
      })

      // Auto dismiss toast after 8 seconds
      setTimeout(() => {
        setToastMessage(null)
      }, 8000)
    } catch {
      setErrorMessage('Incident submission failed. Please check connection and retry.')
    } finally {
      setSubmitting(false)
      setStatusMessage(null)
    }
  }


  const handleResetForAnother = () => {
    // Revoke preview URLs
    evidenceItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setEvidenceItems([])
    setTitle('')
    setDescription('')
    setLocationName('')
    setLatitude('')
    setLongitude('')
    setLocationAccuracy(null)
    setLocationSource('GPS')
    setLocationCapturedAt(null)
    setGpsCaptured(false)
    setLocationConfirmed(false)
    setCategory('LANDSLIDE')
    setSeverity('HIGH')
    setSubmittedReport(null)
    setErrorMessage(null)
    setEvidenceError(null)
    setGpsError(null)

  }

  const inputClass =
    'w-full min-h-[44px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#172554] placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-colors font-mono shadow-sm'

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172554] flex flex-col selection:bg-[#2563EB]/20 selection:text-[#172554]">
      {/* Background Grid Pattern */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(23,37,84,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(23,37,84,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-[#2563EB] flex items-center justify-center shadow-sm">
            <div className="w-2 h-2 rounded-sm bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-[#172554] font-bold">
              NER / LOGISENSE
            </span>
            <span className="text-[#CBD5E1]">·</span>
            <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#2563EB] font-bold">
              FIELD OPERATIONS PORTAL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[10px] font-bold tracking-[0.12em] uppercase shrink-0 transition-all duration-300 ${
              activeOnline
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
            }`}
            title={activeOnline ? 'Connected to network' : 'No network — reports will be saved locally'}
          >
            {activeOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
            <span className="hidden sm:inline">{activeOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>


          {/* Pending Count + Sync Button */}
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing || !isOnline}
              title={isOnline ? `Sync ${pendingCount} pending report(s)` : 'Offline — sync will start when connected'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[10px] font-bold tracking-[0.12em] uppercase shrink-0 transition-all bg-red-950/40 border-red-500/40 text-red-400 hover:border-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <DatabaseZap size={11} />
              )}
              <span>{pendingCount} PENDING</span>
              {isOnline && !syncing && <CloudUpload size={11} />}
            </button>
          )}

          {/* Syncing indicator (when syncing with no pending count yet) */}
          {syncing && pendingCount === 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-[#2563EB] border-[#2563EB]/40 bg-[#2563EB]/10">
              <Loader2 size={11} className="animate-spin" />
              <span className="hidden sm:inline">SYNCING</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] text-xs font-mono">
            <UserIcon size={13} className="text-[#2563EB]" />
            <span className="text-[#172554] font-medium">{initialUser.name || 'Field Officer'}</span>
            <span className="text-[#CBD5E1]">·</span>
            <span className="text-[#64748B]">{initialUser.email}</span>
          </div>

          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#2563EB] px-2.5 py-1 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] font-bold shrink-0">
            FIELD OFFICER
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="min-h-[38px] px-3 text-xs gap-1.5 border border-[#E2E8F0] hover:border-[#2563EB]/50 text-[#475569] hover:text-[#172554]"
            aria-label="Sign out"
          >
            {loggingOut ? (
              <LoadingSpinner className="w-3.5 h-3.5" />
            ) : (
              <LogOut size={14} />
            )}
            <span className="font-mono text-[10px] tracking-wider uppercase">
              {loggingOut ? 'SIGNING OUT...' : 'SIGN OUT'}
            </span>
          </Button>
        </div>
      </header>


      {/* Sync Status Banner */}
      {syncMessage && (
        <div className="fixed top-[60px] left-0 right-0 z-40 flex justify-center px-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#2563EB]/40 text-[#2563EB] font-mono text-[11px] shadow-lg">
            {syncing && <Loader2 size={12} className="animate-spin" />}
            {!syncing && <Check size={12} className="text-[#059669]" />}
            <span>{syncMessage}</span>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-4 sm:right-8 z-50 max-w-md p-4 rounded-xl bg-[#FFFFFF] border-2 shadow-[0_10px_35px_rgba(7,17,31,0.8)] animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            toastMessage.type === 'offline'
              ? 'border-amber-500 shadow-amber-500/10'
              : toastMessage.type === 'error'
              ? 'border-red-500 shadow-red-500/10'
              : 'border-emerald-500 shadow-emerald-500/10'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-1 rounded-full shrink-0 mt-0.5 ${
              toastMessage.type === 'offline'
                ? 'bg-amber-500/20 text-amber-400'
                : toastMessage.type === 'error'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {toastMessage.type === 'offline' ? (
                <Save size={18} />
              ) : toastMessage.type === 'error' ? (
                <AlertTriangle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-[#172554] font-mono leading-tight">
                {toastMessage.title}
              </p>
              {toastMessage.subtitle && (
                <p className="text-[11px] text-[#475569] mt-1 font-mono">
                  {toastMessage.subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-[#475569] hover:text-[#172554] p-1 text-xs font-mono ml-2"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </aside>
      )}


      {/* Main Responsive Operations Workspace */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col">
        {/* POST-SUBMISSION DESKTOP / RESPONSIVE SUMMARY VIEW */}
        {submittedReport ? (
          <div className="w-full max-w-4xl mx-auto my-auto bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-[#E2E8F0]">
              <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 ${
                submittedReport.isOfflineSaved
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
              }`}>
                {submittedReport.isOfflineSaved ? <Save size={36} /> : <CheckCircle2 size={36} />}
              </div>
              <div className="flex-1 text-center sm:text-left">
                {submittedReport.isOfflineSaved ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
                      <WifiOff size={10} />
                      <span>SAVED OFFLINE — PENDING SYNC</span>
                    </div>
                    <h1 className="text-xl sm:text-3xl font-black text-[#172554] mt-2 tracking-tight">
                      REPORT SAVED OFFLINE
                    </h1>
                    <p className="text-xs sm:text-sm font-mono text-amber-300 font-semibold mt-1">
                      Report saved to device. Will sync to Operator Center when internet is restored.
                    </p>
                    <p className="text-xs text-[#475569] mt-0.5">
                      All data — including GPS coordinates and evidence — is stored securely on this device.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
                      <span>DISPATCH CONFIRMED TO OPERATOR CENTER</span>
                    </div>
                    <h1 className="text-xl sm:text-3xl font-black text-[#172554] mt-2 tracking-tight">
                      FIELD INCIDENT TRANSMITTED SUCCESSFULLY
                    </h1>
                    <p className="text-xs sm:text-sm font-mono text-emerald-300 font-semibold mt-1">
                      Incident data submitted to Logistics Operator Center.
                    </p>
                    <p className="text-xs text-[#475569] mt-0.5">
                      Your report, verified coordinates, and incident evidence have been logged for operational routing.
                    </p>
                  </>
                )}
              </div>
            </div>


            {/* Structured Multi-Column Receipt */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#475569] block tracking-wider">
                  CLASSIFICATION
                </span>
                <p className="text-sm font-bold text-[#172554] truncate" title={submittedReport.title}>
                  {submittedReport.title}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[10px] font-mono text-[#475569] border border-[#E2E8F0]">
                    {CATEGORY_LABELS[submittedReport.category]}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${SEVERITY_COLORS[submittedReport.severity].bg} ${SEVERITY_COLORS[submittedReport.severity].text} ${SEVERITY_COLORS[submittedReport.severity].border}`}>
                    {submittedReport.severity}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#475569] block tracking-wider">
                  SPATIAL FIX & SECTOR
                </span>
                <p className="text-sm font-bold text-[#172554]">
                  {submittedReport.state}
                </p>
                <p className="text-xs text-[#475569] truncate" title={submittedReport.locationName}>
                  {submittedReport.locationName}
                </p>
                <div className="text-[10px] font-mono text-[#2563EB] flex items-center gap-1 pt-1">
                  <MapPin size={12} className="text-[#2563EB]" />
                  <span>{submittedReport.latitude.toFixed(4)}°N, {submittedReport.longitude.toFixed(4)}°E</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#475569] block tracking-wider">
                  AUDIT & TELEMETRY
                </span>
                <div className="text-xs font-mono text-[#172554]">
                  ID: <span className="text-[#475569]">{submittedReport.id.slice(0, 16)}...</span>
                </div>
                <div className="text-xs font-mono text-[#475569]">
                  EVIDENCE: <span className="text-[#2563EB] font-bold">{submittedReport.mediaCount} attached</span>
                </div>
                <div className="text-[10px] font-mono text-[#475569] flex items-center gap-1 pt-1">
                  <Clock size={12} />
                  <span>DISPATCHED AT {submittedReport.submittedAt}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-mono text-[#475569]">
                Operator center has been notified for fleet rerouting consideration.
              </span>
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleResetForAnother}
                className="w-full sm:w-auto min-h-[48px] px-6 font-mono tracking-wider text-xs sm:text-sm font-bold gap-2 shadow-[0_0_20px_rgba(0,217,255,0.3)]"
              >
                <RefreshCw size={15} />
                <span>REPORT ANOTHER INCIDENT</span>
              </Button>
            </div>
          </div>
        ) : (
          /* RESPONSIVE FULL WEB APPLICATION FORM */
          <div className="w-full space-y-6">
            {/* Desktop Operational Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-[#E2E8F0]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#2563EB] font-bold">
                    INCIDENT TRANSMISSION CONSOLE
                  </span>
                  <span className="text-[#E2E8F0]">|</span>
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569]">
                    NORTH EASTERN REGION
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#172554] mt-1">
                  FIELD HAZARD REPORTING
                </h1>
                <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                  Log real-time road obstructions, natural hazards, and infrastructure damage with verified GPS and evidence.
                </p>
              </div>

              {/* Status Bar */}
              <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                <div className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] font-mono text-[10px] text-[#475569] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  <span>SECURE CHANNEL ACTIVE</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] font-mono text-[10px] text-[#2563EB] flex items-center gap-2">
                  <Radio size={12} className="text-[#2563EB]" />
                  <span>TARGET: OPERATOR CENTER</span>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-start gap-3">
                <ShieldAlert size={18} className="text-[#DC2626] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-[#DC2626] font-mono font-bold">TRANSMISSION REJECTED</p>
                  <p className="text-xs text-[#DC2626]/90 font-mono mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TWO-COLUMN RESPONSIVE GRID (DESKTOP: 12-COL, TABLET/MOBILE: 1-COL) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT PRIMARY PANEL (7 COLS ON DESKTOP) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Card 1: Classification & Severity */}
                  <div className="p-5 sm:p-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-4 rounded-full bg-[#2563EB]" />
                        <h2 className="font-mono text-xs tracking-[0.15em] uppercase text-[#172554] font-bold">
                          1. INCIDENT CLASSIFICATION & SEVERITY
                        </h2>
                      </div>
                      <span className="text-[10px] font-mono text-[#475569]">REQUIRED</span>
                    </div>

                    <div>
                      <label
                        htmlFor="incident-category-select"
                        className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-1.5"
                      >
                        HAZARD CATEGORY
                      </label>
                      <select
                        id="incident-category-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                        className={inputClass}
                      >
                        {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                          <option key={catKey} value={catKey} className="bg-[#FFFFFF] text-[#172554]">
                            {catLabel}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-2">
                        OPERATIONAL SEVERITY LEVEL
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as IncidentSeverity[]).map((sev) => {
                          const isSelected = severity === sev
                          const conf = SEVERITY_COLORS[sev]
                          return (
                            <button
                              key={sev}
                              type="button"
                              onClick={() => setSeverity(sev)}
                              className={`min-h-[48px] px-3 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all flex flex-col justify-center items-center gap-1 border ${
                                isSelected
                                  ? `${conf.bg} ${conf.text} ${conf.border} shadow-[0_0_15px_rgba(0,217,255,0.15)] ring-1 ring-[#2563EB]`
                                  : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#2563EB]/40'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: conf.dot }}
                                />
                                <span>{sev}</span>
                              </div>
                              <span className="text-[9px] font-normal opacity-70">
                                {sev === 'CRITICAL' ? 'Impasse' : sev === 'HIGH' ? 'Severe' : sev === 'MEDIUM' ? 'Caution' : 'Minor'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Ground Observation Details */}
                  <div className="p-5 sm:p-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-4 rounded-full bg-[#2563EB]" />
                        <h2 className="font-mono text-xs tracking-[0.15em] uppercase text-[#172554] font-bold">
                          2. GROUND OBSERVATION DETAILS
                        </h2>
                      </div>
                      <span className="text-[10px] font-mono text-[#475569]">GROUND TRUTH</span>
                    </div>

                    <div>
                      <label
                        htmlFor="field-title"
                        className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#71717a] mb-1.5"
                      >
                        INCIDENT TITLE / SUMMARY
                      </label>
                      <input
                        id="field-title"
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Major Landslide Blockage near Sela Tunnel Approach"
                        className={inputClass}
                        maxLength={120}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="field-state"
                          className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#71717a] mb-1.5"
                        >
                          NORTHEAST STATE
                        </label>
                        <select
                          id="field-state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className={inputClass}
                        >
                          {NER_STATES.map((st) => (
                            <option key={st} value={st} className="bg-[#FFFFFF] text-[#172554]">
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="field-corridor"
                          className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-1.5"
                        >
                          CORRIDOR / ROUTE SECTOR
                        </label>
                        <input
                          id="field-corridor"
                          type="text"
                          required
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          placeholder="e.g., NH-13 Km 42 / Tawang Sector"
                          className={inputClass}
                          maxLength={150}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="field-notes"
                        className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-1.5"
                      >
                        DETAILED OBSERVATION / GROUND FIELD NOTES
                      </label>
                      <textarea
                        id="field-notes"
                        required
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe ground observation, physical obstruction width, machinery required, weather factors, estimated clearance window..."
                        className={`${inputClass} resize-none min-h-[110px] leading-relaxed`}
                        maxLength={1000}
                      />
                      <div className="flex justify-between text-[10px] font-mono text-[#475569] mt-1">
                        <span>Minimum 5 characters required</span>
                        <span>{description.length}/1000</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT TELEMETRY & EVIDENCE PANEL (5 COLS ON DESKTOP) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Card 3: Location Verification with Live Map */}
                  <div className="p-5 sm:p-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]/60">
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-[#2563EB]" />
                        <h2 className="font-mono text-xs tracking-[0.15em] uppercase text-[#172554] font-bold">
                          3. LOCATION VERIFICATION
                        </h2>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="text-[#475569] hidden sm:inline">Location Status:</span>
                        {!gpsCaptured ? (
                          <span className="text-[#475569] font-medium bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#E2E8F0]">
                            Awaiting GPS
                          </span>
                        ) : !locationConfirmed ? (
                          <span className="text-[#D97706] font-semibold bg-[#D97706]/10 px-2 py-0.5 rounded border border-[#D97706]/30 flex items-center gap-1">
                            <Clock size={11} />
                            Awaiting confirmation
                          </span>
                        ) : (
                          <span className="text-[#059669] font-bold bg-[#059669]/10 px-2 py-0.5 rounded border border-[#059669]/30 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Confirmed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interactive Live GPS Map */}
                    <div className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]">
                      <FieldOperationsMap
                        mode="verification"
                        liveLocationPreview={
                          gpsCaptured && latitude && longitude
                            ? {
                                lat: parseFloat(latitude),
                                lng: parseFloat(longitude),
                                accuracy: locationAccuracy,
                              }
                            : null
                        }
                        className="w-full h-[260px] sm:h-[300px] lg:h-[340px]"
                      />
                    </div>

                    {/* Prominent "GET MY LIVE LOCATION" Button */}
                    <button
                      type="button"
                      onClick={handleGetMyLiveLocation}
                      disabled={gpsLoading || submitting}
                      className="w-full min-h-[48px] rounded-xl bg-[#2563EB]/15 border-2 border-[#2563EB]/50 hover:bg-[#2563EB]/25 text-[#2563EB] font-mono text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(0,217,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                    >
                      {gpsLoading ? (
                        <>
                          <LoadingSpinner className="w-4 h-4 text-[#2563EB]" />
                          <span>ACQUIRING SATELLITE FIX...</span>
                        </>
                      ) : (
                        <>
                          <Crosshair size={17} className="text-[#2563EB]" />
                          <span>GET MY LIVE LOCATION</span>
                        </>
                      )}
                    </button>

                    {/* Geolocation Error Alert */}
                    {gpsError && (
                      <div className="p-3.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/40 text-[#DC2626] font-mono text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                        <AlertTriangle size={16} className="text-[#DC2626] shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold block uppercase text-[10px] text-[#DC2626] tracking-wider">
                            LOCATION ERROR
                          </span>
                          <span className="leading-relaxed">{gpsError}</span>
                        </div>
                      </div>
                    )}

                    {/* GPS Telemetry Information Readout (Section 4 requirement) */}
                    {gpsCaptured && latitude && longitude && (
                      <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#2563EB]/30 space-y-2.5 font-mono shadow-inner animate-in fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-[#E2E8F0]/60 pb-2">
                          <span className="text-[11px] font-bold text-[#2563EB] tracking-wider uppercase flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                            LIVE LOCATION VERIFIED
                          </span>
                          <span className="text-[10px] text-[#475569]">
                            Source: <strong className="text-[#172554]">Device GPS</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <span className="text-[10px] text-[#475569] block uppercase">Latitude:</span>
                            <span className="text-[#172554] font-semibold text-xs sm:text-sm">
                              {parseFloat(latitude).toFixed(4)}° N
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#475569] block uppercase">Longitude:</span>
                            <span className="text-[#172554] font-semibold text-xs sm:text-sm">
                              {parseFloat(longitude).toFixed(4)}° E
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#475569] block uppercase">GPS Accuracy:</span>
                            <span className="text-[#2563EB] font-semibold">
                              {locationAccuracy !== null ? `±${locationAccuracy} m` : '±8 m'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#475569] block uppercase">Captured:</span>
                            <span className="text-[#475569] font-medium">
                              {locationCapturedAt ? new Date(locationCapturedAt).toLocaleTimeString() : 'Just now'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Confirmation Section (Section 5 requirement) */}
                    <div className="pt-2 border-t border-[#E2E8F0]/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#475569]">Location Status:</span>
                        {!locationConfirmed ? (
                          <span className="text-[#D97706] font-semibold flex items-center gap-1">
                            <Clock size={11} />
                            Awaiting confirmation
                          </span>
                        ) : (
                          <span className="text-[#059669] font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Confirmed
                          </span>
                        )}
                      </div>

                      {!locationConfirmed ? (
                        <button
                          type="button"
                          onClick={handleConfirmLiveLocation}
                          disabled={!gpsCaptured || submitting}
                          className="w-full min-h-[46px] rounded-xl bg-[#059669]/15 border-2 border-[#059669]/40 text-[#059669] hover:bg-[#059669]/25 text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.15)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
                        >
                          <Check size={16} />
                          <span>CONFIRM LIVE LOCATION</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#059669]/10 border border-[#059669]/30">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-[#059669]" />
                            <span className="text-xs font-mono font-bold text-[#059669] uppercase tracking-wider">
                              LOCATION CONFIRMED FOR REPORT
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLocationConfirmed(false)}
                            className="px-2.5 py-1 rounded bg-[#EFF6FF] hover:bg-[#E2E8F0] text-[#475569] hover:text-[#172554] text-[10px] font-mono uppercase transition-colors"
                          >
                            Re-verify
                          </button>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Card 4: Photo & Video Evidence */}
                  <div className="p-5 sm:p-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]/60">
                      <div className="flex items-center gap-2">
                        <UploadCloud size={15} className="text-[#2563EB]" />
                        <h2 className="font-mono text-xs tracking-[0.15em] uppercase text-[#172554] font-bold">
                          4. EVIDENCE *
                        </h2>
                      </div>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase font-semibold ${
                          evidenceItems.length > 0
                            ? 'bg-[#059669]/10 text-[#059669] border-[#059669]/30'
                            : 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30'
                        }`}
                      >
                        {evidenceItems.length > 0
                          ? `${evidenceItems.length}/${MAX_TOTAL_FILES} ATTACHED`
                          : 'REQUIRED (MIN 1 FILE)'}
                      </span>
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                      onChange={handleFileChange}
                      className="hidden"
                      id="evidence-file-input"
                    />

                    {/* Evidence Dropzone */}
                    <label
                      htmlFor="evidence-file-input"
                      className="w-full min-h-[70px] flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E2E8F0] hover:border-[#2563EB]/50 rounded-xl bg-[#F8FAFC] cursor-pointer transition-colors group text-center"
                    >
                      <div className="flex items-center gap-2 text-xs font-mono text-[#475569] group-hover:text-[#172554] transition-colors">
                        <UploadCloud size={18} className="text-[#475569] group-hover:text-[#2563EB] transition-colors" />
                        <span className="font-bold">ATTACH PHOTOS OR VIDEOS</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#475569] mt-1">
                        JPEG, PNG, WEBP (≤10MB) · MP4, WEBM, MOV (≤50MB)
                      </span>
                    </label>

                    {/* Evidence Error */}
                    {evidenceError && (
                      <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-center gap-2 text-[#DC2626] font-mono text-xs">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>{evidenceError}</span>
                      </div>
                    )}

                    {/* Evidence Previews Grid */}
                    {evidenceItems.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 pt-1">
                        {evidenceItems.map((item) => (
                          <div
                            key={item.id}
                            className="relative group rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] p-1.5 flex flex-col gap-1"
                          >
                            <div className="relative w-full h-24 bg-[#F1F5F9] rounded-lg overflow-hidden flex items-center justify-center">
                              {item.type === 'PHOTO' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.previewUrl}
                                  alt={item.file.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <video
                                  src={item.previewUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                />
                              )}

                              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[8px] font-mono text-white flex items-center gap-1">
                                {item.type === 'PHOTO' ? <FileImage size={10} /> : <Film size={10} />}
                                <span>{item.type}</span>
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRemoveMedia(item.id)}
                                className="absolute top-1 right-1 p-1.5 rounded-full bg-black/80 hover:bg-[#DC2626] text-white transition-colors"
                                aria-label="Remove media item"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            <div className="px-1 text-[10px] font-mono truncate">
                              <p className="text-[#172554] truncate" title={item.file.name}>
                                {item.file.name}
                              </p>
                              <p className="text-[9px] text-[#475569]">{item.sizeFormatted}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FULL-WIDTH OPERATIONAL TRANSMISSION BAR */}
              <div className="p-4 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
                <div className="text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#172554]">
                      DISPATCH READINESS:
                    </span>
                    {locationConfirmed ? (
                      <span className="text-xs font-mono text-[#059669] font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        COORDINATES CONFIRMED
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#D97706] font-semibold flex items-center gap-1">
                        <AlertTriangle size={13} />
                        COORDINATES UNCONFIRMED
                      </span>
                    )}
                    <span className="text-[#E2E8F0]">·</span>
                    {evidenceItems.length > 0 ? (
                      <span className="text-xs font-mono text-[#059669] font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        {evidenceItems.length} EVIDENCE {evidenceItems.length === 1 ? 'FILE' : 'FILES'} ATTACHED
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#DC2626] font-bold flex items-center gap-1">
                        <AlertTriangle size={13} />
                        EVIDENCE REQUIRED (MIN 1 FILE)
                      </span>
                    )}
                  </div>
                  {evidenceItems.length === 0 && (
                    <p className="text-xs text-[#DC2626] font-mono font-semibold">
                      Photo or video evidence is required to submit an incident report.
                    </p>
                  )}
                  <p className="text-xs text-[#475569] font-mono">
                    Direct submission to Central Operations Center for dynamic route intelligence.
                  </p>
                </div>

                <div className="w-full sm:w-auto">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={submitting || !locationConfirmed || evidenceItems.length === 0}
                    className="w-full sm:min-w-[280px] min-h-[52px] font-mono tracking-wider text-xs sm:text-sm font-bold gap-2 shadow-[0_0_25px_rgba(0,217,255,0.25)] disabled:opacity-40"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner className="w-4 h-4" />
                        <span>{statusMessage || 'TRANSMITTING...'}</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>TRANSMIT TO OPERATOR CENTER</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

