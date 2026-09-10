'use client'

import { useState } from 'react'
import {
  X,
  MapPin,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  FileImage,
  Film,
  Maximize2,
  Crosshair,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type FieldIncidentItem,
  type IncidentStatus,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  STATUS_COLORS,
} from '@/types/incident'

interface IncidentDetailsModalProps {
  incident: FieldIncidentItem | null
  onClose: () => void
  onStatusUpdated: () => void
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function IncidentDetailsModal({
  incident,
  onClose,
  onStatusUpdated,
}: IncidentDetailsModalProps) {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null)

  if (!incident) return null

  const handleUpdateStatus = async (newStatus: IncidentStatus) => {
    setUpdating(true)
    setError(null)
    try {
      const res = await fetch(`/api/field/reports/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message ?? 'Failed to update status.')
        setUpdating(false)
        return
      }

      onStatusUpdated()
      onClose()
    } catch {
      setError('A network error occurred while updating status.')
    } finally {
      setUpdating(false)
    }
  }

  const severityStyle = SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.MEDIUM
  const statusStyle = STATUS_COLORS[incident.status] || STATUS_COLORS.ACTIVE

  const formattedCreated = new Date(incident.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const formattedCaptured = incident.locationCapturedAt
    ? new Date(incident.locationCapturedAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const mediaList = incident.media || []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-7 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`font-mono text-[9px] tracking-wider uppercase px-2.5 py-0.5 rounded border ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border} font-bold`}
              >
                {incident.severity} SEVERITY
              </span>
              <span
                className={`font-mono text-[9px] tracking-wider uppercase px-2.5 py-0.5 rounded border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} font-semibold`}
              >
                STATUS: {incident.status}
              </span>
              <span className="font-mono text-[9px] text-[#475569] uppercase font-medium">
                {CATEGORY_LABELS[incident.category]}
              </span>
            </div>

            <h2 id="details-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-[#172554]">
              {incident.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[#475569] font-mono mt-1">
              <MapPin size={13} className="text-[#2563EB] shrink-0" />
              <span>{incident.locationName}</span>
              <span className="text-[#CBD5E1]">·</span>
              <span className="text-[#0891B2] font-semibold">{incident.state}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#475569] hover:text-[#172554] rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="my-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2">
            <AlertCircle size={15} className="text-[#DC2626]" />
            <p className="text-xs text-[#DC2626] font-mono">{error}</p>
          </div>
        )}

        {/* Body Content */}
        <div className="mt-5 space-y-5">
          {/* Ground Observation Description */}
          <div>
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#475569] block mb-1.5 font-semibold">
              GROUND OBSERVATION & FIELD REPORT
            </span>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#172554] leading-relaxed font-sans whitespace-pre-wrap">
              {incident.description}
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            {/* GPS Coordinates & Source */}
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider text-[#475569] font-semibold">
                  SECTOR COORDINATES
                </span>
                <span
                  className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold uppercase ${
                    incident.locationSource === 'GPS'
                      ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                      : 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]'
                  }`}
                >
                  {incident.locationSource === 'GPS' ? 'DEVICE GPS' : 'MANUAL PIN'}
                </span>
              </div>
              <div className="text-[#172554] font-semibold flex items-center gap-1.5">
                <span className="text-[#2563EB]">LAT:</span> {incident.latitude.toFixed(4)}°N
                <span className="text-[#CBD5E1]">|</span>
                <span className="text-[#2563EB]">LNG:</span> {incident.longitude.toFixed(4)}°E
              </div>
              {incident.locationAccuracy !== null && incident.locationAccuracy !== undefined && (
                <div className="text-[10px] text-[#059669] flex items-center gap-1 font-semibold">
                  <Crosshair size={11} />
                  <span>±{Math.round(incident.locationAccuracy)}m GPS Accuracy</span>
                </div>
              )}
            </div>

            {/* Reporting Officer */}
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5">
              <span className="text-[9px] uppercase tracking-wider text-[#475569] block font-semibold">
                LOGGED BY FIELD OFFICER
              </span>
              <div className="text-[#172554] flex items-center gap-1.5 truncate">
                <User size={12} className="text-[#2563EB] shrink-0" />
                <span className="font-semibold truncate">{incident.officer.name}</span>
                <span className="text-[#64748B] text-[10px] truncate">({incident.officer.email})</span>
              </div>
              {formattedCaptured && (
                <div className="text-[10px] text-[#64748B]">
                  CAPTURED: {formattedCaptured}
                </div>
              )}
            </div>
          </div>

          {/* Media Evidence Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#475569] font-semibold">
                MEDIA EVIDENCE ({mediaList.length} FILES)
              </span>
              {mediaList.length > 0 && (
                <span className="text-[10px] font-mono text-[#64748B]">
                  Click photos to enlarge
                </span>
              )}
            </div>

            {mediaList.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center text-xs font-mono text-[#64748B]">
                NO PHOTO OR VIDEO EVIDENCE ATTACHED TO THIS REPORT
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mediaList.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] p-2 flex flex-col gap-2"
                  >
                    {item.type === 'PHOTO' ? (
                      <button
                        type="button"
                        onClick={() => setEnlargedImageUrl(item.url)}
                        className="relative w-full h-40 bg-slate-100 rounded-lg overflow-hidden group cursor-zoom-in"
                        aria-label={`Enlarge ${item.filename}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-mono text-xs font-semibold">
                          <Maximize2 size={16} />
                          <span>EXPAND</span>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white flex items-center gap-1">
                          <FileImage size={10} />
                          <span>PHOTO</span>
                        </span>
                      </button>
                    ) : (
                      <div className="relative w-full rounded-lg overflow-hidden bg-black flex flex-col">
                        <video
                          src={item.url}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-48 object-contain bg-black rounded"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white flex items-center gap-1">
                          <Film size={10} />
                          <span>VIDEO</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono px-1">
                      <span className="text-[#172554] truncate max-w-[160px]" title={item.filename}>
                        {item.filename}
                      </span>
                      <span className="text-[#64748B]">
                        {formatFileSize(item.size)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#64748B] pt-1">
            <Clock size={12} />
            <span>REPORTED: {formattedCreated}</span>
          </div>
        </div>

        {/* Status Action Buttons */}
        <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-wider uppercase text-[#475569] font-semibold">
              UPDATE STATUS:
            </span>
            {incident.status !== 'ACTIVE' && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus('ACTIVE')}
                className="px-2.5 py-1 rounded text-xs font-mono border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors disabled:opacity-50 font-semibold"
              >
                MARK ACTIVE
              </button>
            )}

            {incident.status !== 'INVESTIGATING' && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus('INVESTIGATING')}
                className="px-2.5 py-1 rounded text-xs font-mono border border-[#FDE68A] bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7] transition-colors disabled:opacity-50 font-semibold"
              >
                MARK INVESTIGATING
              </button>
            )}

            {incident.status !== 'RESOLVED' && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus('RESOLVED')}
                className="px-2.5 py-1 rounded text-xs font-mono border border-[#A7F3D0] bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5] transition-colors disabled:opacity-50 flex items-center gap-1 font-semibold"
              >
                <CheckCircle2 size={12} />
                <span>MARK RESOLVED</span>
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            DISMISS
          </Button>
        </div>

        {updating && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2 z-10 font-mono text-xs text-[#172554]">
            <LoadingSpinner className="w-5 h-5" />
            <span>SYNCING WITH DATABASE MATRIX...</span>
          </div>
        )}

        {/* Enlarged Image Lightbox Overlay */}
        {enlargedImageUrl && (
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            role="dialog"
            aria-label="Enlarged evidence image"
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
              <button
                type="button"
                onClick={() => setEnlargedImageUrl(null)}
                className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white bg-white/10 rounded-full transition-colors"
                aria-label="Close enlarged preview"
              >
                <X size={20} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enlargedImageUrl}
                alt="Enlarged evidence"
                className="max-w-full max-h-[85vh] rounded-lg object-contain border border-[#E2E8F0] shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
