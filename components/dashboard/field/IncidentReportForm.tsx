'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  AlertCircle,
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
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  NER_STATES,
  type IncidentCategory,
  type IncidentSeverity,
  type LocationSource,
  CATEGORY_LABELS,
} from '@/types/incident'

interface IncidentReportFormProps {
  isOpen: boolean
  onClose: () => void
  onIncidentCreated: () => void
  initialCoordinates?: { lat: number; lng: number } | null
  defaultState?: string
  onLocationPreviewChange?: (coord: { lat: number; lng: number; accuracy?: number | null } | null) => void
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

export function IncidentReportForm({
  isOpen,
  onClose,
  onIncidentCreated,
  initialCoordinates,
  defaultState,
  onLocationPreviewChange,
}: IncidentReportFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [state, setState] = useState(
    defaultState && defaultState !== 'ALL' ? defaultState : 'Assam'
  )
  const [locationName, setLocationName] = useState('')
  const [latitude, setLatitude] = useState<string>('26.1158')
  const [longitude, setLongitude] = useState<string>('91.8214')
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [locationSource, setLocationSource] = useState<LocationSource>('MAP_MANUAL')
  const [locationCapturedAt, setLocationCapturedAt] = useState<string | null>(null)
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  const [category, setCategory] = useState<IncidentCategory>('LANDSLIDE')
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH')

  // Evidence state
  const [evidenceItems, setEvidenceItems] = useState<SelectedMediaFile[]>([])
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploadStep, setUploadStep] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Sync initial coordinates if clicked on map
  useEffect(() => {
    if (initialCoordinates) {
      setLatitude(initialCoordinates.lat.toFixed(4))
      setLongitude(initialCoordinates.lng.toFixed(4))
      setLocationSource('MAP_MANUAL')
      setLocationAccuracy(null)
      setLocationCapturedAt(new Date().toISOString())
      setLocationConfirmed(false)
      onLocationPreviewChange?.({
        lat: initialCoordinates.lat,
        lng: initialCoordinates.lng,
        accuracy: null,
      })
    }
  }, [initialCoordinates, onLocationPreviewChange])

  // Sync default state
  useEffect(() => {
    if (defaultState && defaultState !== 'ALL') {
      setState(defaultState)
    }
  }, [defaultState])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      evidenceItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [evidenceItems])

  if (!isOpen) return null

  // Geolocation trigger
  const handleUseLiveLocation = () => {
    setGpsError(null)

    if (!navigator.geolocation) {
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
        setLocationConfirmed(false)

        // Pass live location preview to map
        onLocationPreviewChange?.({ lat, lng, accuracy: acc })
      },
      (geoErr) => {
        setGpsLoading(false)
        let msg = 'Failed to acquire GPS location.'
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow access or specify coordinates manually.'
        } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
          msg = 'Location position is unavailable. Please verify GPS device/network.'
        } else if (geoErr.code === geoErr.TIMEOUT) {
          msg = 'Location request timed out. Please retry or pick sector on map.'
        }
        setGpsError(msg)
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    )
  }

  const handleConfirmLocation = () => {
    setError(null)
    const latNum = parseFloat(latitude)
    const lngNum = parseFloat(longitude)

    if (isNaN(latNum) || isNaN(lngNum)) {
      setError('Please provide valid numeric coordinates before confirming.')
      return
    }

    if (latNum < 20.0 || latNum > 30.0 || lngNum < 87.0 || lngNum > 98.0) {
      setError(
        'Coordinates must be within the North Eastern Region of India (20°N–30°N, 87°E–98°E).'
      )
      return
    }

    setLocationConfirmed(true)
    onLocationPreviewChange?.({
      lat: latNum,
      lng: lngNum,
      accuracy: locationAccuracy,
    })
  }

  const handleReEditLocation = () => {
    setLocationConfirmed(false)
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
    // Reset file input
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
    setError(null)
    setEvidenceError(null)

    const latNum = parseFloat(latitude)
    const lngNum = parseFloat(longitude)

    if (isNaN(latNum) || isNaN(lngNum)) {
      setError('Please provide valid numerical coordinates.')
      return
    }

    if (!locationConfirmed) {
      setError('Please confirm the incident coordinates using the [ CONFIRM LOCATION ] button before submitting.')
      return
    }

    if (!title.trim()) {
      setError('Incident title is required.')
      return
    }

    if (!locationName.trim()) {
      setError('Corridor / location name is required.')
      return
    }

    if (!description.trim() || description.trim().length < 5) {
      setError('Please provide at least 5 characters of ground observation description.')
      return
    }

    setLoading(true)
    setUploadStep('TRANSMITTING FIELD REPORT...')

    try {
      // 1. Submit incident report
      const res = await fetch('/api/field/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          state,
          locationName: locationName.trim(),
          latitude: latNum,
          longitude: lngNum,
          locationAccuracy,
          locationSource,
          locationCapturedAt: locationCapturedAt || new Date().toISOString(),
          category,
          severity,
        }),
      })

      const data = await res.json()

      if (!data.success || !data.report?.id) {
        setError(data.message ?? 'Failed to submit report.')
        setLoading(false)
        setUploadStep(null)
        return
      }

      const createdIncidentId = data.report.id

      // 2. Upload media if present
      if (evidenceItems.length > 0) {
        setUploadStep(`UPLOADING EVIDENCE (${evidenceItems.length} FILES)...`)
        const formData = new FormData()
        evidenceItems.forEach((item) => {
          formData.append('files', item.file)
        })

        const mediaRes = await fetch(`/api/field/reports/${createdIncidentId}/media`, {
          method: 'POST',
          body: formData,
        })

        const mediaData = await mediaRes.json()
        if (!mediaData.success) {
          console.warn('[IncidentReportForm] Media upload warning:', mediaData.message)
        }
      }

      setSuccess(true)
      setUploadStep(null)

      setTimeout(() => {
        setSuccess(false)
        onIncidentCreated()
        onClose()
        // Reset form
        setTitle('')
        setDescription('')
        setLocationName('')
        evidenceItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
        setEvidenceItems([])
        setLocationConfirmed(false)
        setLocationAccuracy(null)
        setLocationSource('MAP_MANUAL')
        onLocationPreviewChange?.(null)
      }, 1000)
    } catch {
      setError('A network error occurred while transmitting the report and evidence.')
    } finally {
      setLoading(false)
      setUploadStep(null)
    }
  }

  const inputClass =
    'w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs sm:text-sm text-[#172554] placeholder-[#475569] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors font-mono'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#2563EB] font-bold">
                GROUND INCIDENT TRANSMISSION
              </span>
            </div>
            <h2 id="report-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-[#172554] mt-1">
              REPORT FIELD INCIDENT
            </h2>
            <p className="text-xs text-[#475569] mt-0.5">
              Submit verified ground observation with media evidence & GPS telemetry.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#475569] hover:text-[#172554] rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="my-4 p-4 rounded-xl bg-[#059669]/15 border border-[#059669]/30 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-[#059669] shrink-0" />
            <span className="text-xs font-mono text-[#059669] font-semibold uppercase">
              INCIDENT TRANSMITTED & LOGGED WITH EVIDENCE & GPS TELEMETRY
            </span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="my-4 p-3.5 rounded-xl bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-[#DC2626] shrink-0 mt-0.5" />
            <p className="text-xs text-[#DC2626] font-mono leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Row 1: Category & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category-select"
                className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-1.5"
              >
                INCIDENT CATEGORY
              </label>
              <select
                id="category-select"
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
              <label
                htmlFor="severity-select"
                className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-1.5"
              >
                SEVERITY LEVEL
              </label>
              <select
                id="severity-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className={`${inputClass} ${
                  severity === 'CRITICAL'
                    ? 'border-[#DC2626] text-[#DC2626]'
                    : severity === 'HIGH'
                    ? 'border-[#D97706] text-[#D97706]'
                    : severity === 'MEDIUM'
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-[#2563EB] text-[#2563EB]'
                }`}
              >
                <option value="CRITICAL" className="bg-[#FFFFFF] text-[#DC2626]">
                  CRITICAL (Road impassable / structural collapse)
                </option>
                <option value="HIGH" className="bg-[#FFFFFF] text-[#D97706]">
                  HIGH (Severe delay / single-lane restriction)
                </option>
                <option value="MEDIUM" className="bg-[#FFFFFF] text-[#2563EB]">
                  MEDIUM (Caution advised / slow movement)
                </option>
                <option value="LOW" className="bg-[#FFFFFF] text-[#2563EB]">
                  LOW (Minor hazard / advisory)
                </option>
              </select>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label
              htmlFor="incident-title"
              className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-1.5"
            >
              INCIDENT TITLE
            </label>
            <input
              id="incident-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Major Landslide Blockage near Sela Tunnel Approach"
              className={inputClass}
              maxLength={120}
            />
          </div>

          {/* Row 3: State & Corridor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="incident-state"
                className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-1.5"
              >
                NORTHEAST STATE
              </label>
              <select
                id="incident-state"
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
                htmlFor="incident-location"
                className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-1.5"
              >
                LOCATION / ROAD CORRIDOR
              </label>
              <input
                id="incident-location"
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

          {/* Row 4: Live Location Confirmation Section */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#2563EB]" />
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#172554] font-bold">
                  INCIDENT LOCATION & GPS TELEMETRY
                </span>
              </div>

              {/* Action: Use Live GPS Location */}
              <button
                type="button"
                onClick={handleUseLiveLocation}
                disabled={gpsLoading || loading}
                className="px-2.5 py-1 rounded bg-[#2563EB]/10 border border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/20 text-[10px] font-mono font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
              >
                {gpsLoading ? (
                  <LoadingSpinner className="w-3 h-3 text-[#2563EB]" />
                ) : (
                  <Crosshair size={12} className="text-[#2563EB]" />
                )}
                <span>USE MY LIVE LOCATION</span>
              </button>
            </div>

            {/* GPS Error Notification */}
            {gpsError && (
              <div className="p-2.5 rounded-lg bg-[#D97706]/10 border border-[#D97706]/30 flex items-center gap-2 text-[#D97706] font-mono text-[11px]">
                <Radio size={13} className="shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Coordinate Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="coord-lat"
                  className="block font-mono text-[9px] uppercase text-[#475569] mb-1"
                >
                  LATITUDE (°N)
                </label>
                <input
                  id="coord-lat"
                  type="number"
                  step="0.0001"
                  required
                  disabled={locationConfirmed}
                  value={latitude}
                  onChange={(e) => {
                    setLatitude(e.target.value)
                    setLocationSource('MAP_MANUAL')
                    setLocationAccuracy(null)
                    setLocationConfirmed(false)
                  }}
                  placeholder="25.5000"
                  className={`${inputClass} ${locationConfirmed ? 'opacity-60 cursor-not-allowed bg-[#F1F5F9]' : ''}`}
                />
              </div>

              <div>
                <label
                  htmlFor="coord-lng"
                  className="block font-mono text-[9px] uppercase text-[#475569] mb-1"
                >
                  LONGITUDE (°E)
                </label>
                <input
                  id="coord-lng"
                  type="number"
                  step="0.0001"
                  required
                  disabled={locationConfirmed}
                  value={longitude}
                  onChange={(e) => {
                    setLongitude(e.target.value)
                    setLocationSource('MAP_MANUAL')
                    setLocationAccuracy(null)
                    setLocationConfirmed(false)
                  }}
                  placeholder="93.5000"
                  className={`${inputClass} ${locationConfirmed ? 'opacity-60 cursor-not-allowed bg-[#F1F5F9]' : ''}`}
                />
              </div>
            </div>

            {/* Location Status & Confirmation Bar */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Source Badge */}
                <span
                  className={`font-mono text-[9px] px-2 py-0.5 rounded border uppercase font-semibold ${
                    locationSource === 'GPS'
                      ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30'
                      : 'bg-[#EFF6FF] text-[#475569] border-[#E2E8F0]'
                  }`}
                >
                  SOURCE: {locationSource === 'GPS' ? 'DEVICE GPS' : 'MANUAL SECTOR'}
                </span>

                {/* Accuracy Badge */}
                {locationAccuracy !== null && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/30">
                    ±{locationAccuracy}m ACCURACY
                  </span>
                )}
              </div>

              {/* Confirmation Control */}
              <div>
                {!locationConfirmed ? (
                  <button
                    type="button"
                    onClick={handleConfirmLocation}
                    className="px-3 py-1.5 rounded-lg bg-[#059669]/15 border border-[#059669]/40 text-[#059669] hover:bg-[#059669]/25 text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                  >
                    <Check size={13} />
                    <span>CONFIRM LOCATION</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#059669] font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>LOCATION CONFIRMED</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleReEditLocation}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[#475569] hover:text-[#172554] text-[10px] font-mono uppercase transition-colors"
                    >
                      EDIT
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 5: Evidence Section (Photos & Videos) */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <UploadCloud size={14} className="text-[#2563EB]" />
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#172554] font-bold">
                  EVIDENCE (PHOTOS & VIDEOS)
                </span>
              </div>
              <span className="font-mono text-[9px] text-[#475569]">
                {evidenceItems.length}/{MAX_TOTAL_FILES} FILES ATTACHED
              </span>
            </div>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
              id="evidence-file-input"
            />

            {/* Evidence Selector Button */}
            <div>
              <label
                htmlFor="evidence-file-input"
                className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E2E8F0] hover:border-[#2563EB]/50 rounded-xl bg-[#F8FAFC] cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2 text-xs font-mono text-[#475569] group-hover:text-[#172554] transition-colors">
                  <UploadCloud size={18} className="text-[#475569] group-hover:text-[#2563EB] transition-colors" />
                  <span className="font-semibold">ATTACH PHOTOS OR VIDEOS</span>
                </div>
                <span className="font-mono text-[10px] text-[#475569] mt-1 text-center">
                  JPEG, PNG, WEBP (up to 10MB) · MP4, WEBM, MOV (up to 50MB)
                </span>
              </label>
            </div>

            {/* Evidence Error Banner */}
            {evidenceError && (
              <div className="p-2.5 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-center gap-2 text-[#DC2626] font-mono text-[11px]">
                <AlertCircle size={13} className="shrink-0" />
                <span>{evidenceError}</span>
              </div>
            )}

            {/* Previews Grid */}
            {evidenceItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {evidenceItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative group rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#FFFFFF] p-1.5 flex flex-col gap-1.5"
                  >
                    {/* Media Preview Box */}
                    <div className="relative w-full h-24 bg-[#F1F5F9] rounded overflow-hidden flex items-center justify-center">
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

                      {/* Badge indicator */}
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[8px] font-mono text-white flex items-center gap-1">
                        {item.type === 'PHOTO' ? <FileImage size={10} /> : <Film size={10} />}
                        <span>{item.type}</span>
                      </span>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(item.id)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/80 hover:bg-[#DC2626] text-white transition-colors"
                        title="Remove file"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* File Meta */}
                    <div className="px-1">
                      <p className="text-[10px] font-mono text-[#172554] truncate" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <p className="text-[9px] font-mono text-[#475569]">
                        {item.sizeFormatted}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 6: Ground Observation Description */}
          <div>
            <label
              htmlFor="incident-desc"
              className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-1.5"
            >
              FIELD OBSERVATION / GROUND NOTES
            </label>
            <textarea
              id="incident-desc"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe ground observation, physical road width obstructed, machinery presence, weather factors..."
              className={`${inputClass} resize-none`}
              maxLength={1000}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <div className="text-[10px] font-mono text-[#475569]">
              {!locationConfirmed ? (
                <span className="text-[#D97706] font-medium">⚠️ Confirm location before submit</span>
              ) : (
                <span className="text-[#059669]">✓ Coordinates confirmed</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={loading}
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading || !locationConfirmed}
                className="gap-2 shadow-[0_0_20px_rgba(0,217,255,0.25)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner className="w-4 h-4" />
                    <span>{uploadStep || 'TRANSMITTING...'}</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>SUBMIT REPORT</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
