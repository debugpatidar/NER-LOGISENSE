'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import type { FieldIncidentItem } from '@/types/incident'
import { Navigation, Radio, Crosshair } from 'lucide-react'
import { BRONZE_DARK_MAP_STYLE } from '@/components/map/NorthEastMap'

export interface FieldOperationsMapProps {
  incidents?: FieldIncidentItem[]
  selectedIncident?: FieldIncidentItem | null
  onSelectIncident?: (incident: FieldIncidentItem) => void
  onMapClick?: (lat: number, lng: number) => void
  pinnedCoordinates?: { lat: number; lng: number } | null
  liveLocationPreview?: { lat: number; lng: number; accuracy?: number | null } | null
  className?: string
  mode?: 'operations' | 'verification'
}

const NER_CENTER = { lat: 25.5, lng: 93.5 }
const NER_ZOOM = 6

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#D97706',
  MEDIUM: '#2563EB',
  LOW: '#0891B2',
  RESOLVED: '#059669',
}

let googleMapsOptionsSet = false

export function FieldOperationsMap({
  incidents = [],
  selectedIncident = null,
  onSelectIncident,
  onMapClick,
  pinnedCoordinates,
  liveLocationPreview,
  className = '',
  mode = 'operations',
}: FieldOperationsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tempPinMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveGpsMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveGpsCircleRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveGpsInfoWindowRef = useRef<any>(null)

  const [status, setStatus] = useState<'loading' | 'loaded' | 'error' | 'no-key'>('loading')
  const [clickedCoord, setClickedCoord] = useState<{ lat: number; lng: number } | null>(null)

  // Initialize map
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey.trim() === '') {
      setStatus('no-key')
      return
    }

    if (!googleMapsOptionsSet) {
      try {
        setOptions({ key: apiKey, v: 'weekly' })
        googleMapsOptionsSet = true
      } catch {}
    }

    importLibrary('maps')
      .then((mapsLib) => {
        if (!mapRef.current) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Map } = mapsLib as any

        // If liveLocationPreview exists at initialization, start centered there, else NER center
        const initialCenter = liveLocationPreview
          ? { lat: liveLocationPreview.lat, lng: liveLocationPreview.lng }
          : NER_CENTER
        const initialZoom = liveLocationPreview ? 15 : NER_ZOOM

        const map = new Map(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          styles: BRONZE_DARK_MAP_STYLE,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          rotateControl: false,
          scaleControl: true,
          backgroundColor: '#F8FAFC',
        })

        mapInstanceRef.current = map

        // Click listener for report coordinate picking
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.addListener('click', (e: any) => {
          if (e.latLng) {
            const lat = Number(e.latLng.lat().toFixed(4))
            const lng = Number(e.latLng.lng().toFixed(4))
            setClickedCoord({ lat, lng })
            onMapClick?.(lat, lng)
          }
        })

        setStatus('loaded')
      })
      .catch((err) => {
        console.warn('[FieldOperationsMap] Google Maps load error (device may be offline):', err)
        setStatus('error')
      })

    return () => {
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
      if (tempPinMarkerRef.current) tempPinMarkerRef.current.setMap(null)
      if (liveGpsMarkerRef.current) liveGpsMarkerRef.current.setMap(null)
      if (liveGpsCircleRef.current) liveGpsCircleRef.current.setMap(null)
      if (liveGpsInfoWindowRef.current) liveGpsInfoWindowRef.current.close()
    }
  }, [onMapClick])

  // Update incident markers on the map (only in operations mode or when incidents provided)
  useEffect(() => {
    if (mode === 'verification') return

    const map = mapInstanceRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google

    if (!map || !google?.maps || status !== 'loaded') return

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    incidents.forEach((inc) => {
      const isResolved = inc.status === 'RESOLVED'
      const colorKey = isResolved ? 'RESOLVED' : inc.severity
      const color = SEVERITY_COLORS[colorKey] || '#DC2626'
      const isSelected = selectedIncident?.id === inc.id

      const marker = new google.maps.Marker({
        position: { lat: inc.latitude, lng: inc.longitude },
        map,
        title: `${inc.title} (${inc.state})`,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: color,
          fillOpacity: isResolved ? 0.6 : 0.95,
          strokeColor: isSelected ? '#172554' : '#FFFFFF',
          strokeWeight: isSelected ? 2.5 : 1.5,
          scale: isSelected ? 1.6 : inc.severity === 'CRITICAL' ? 1.4 : 1.2,
          anchor: new google.maps.Point(12, 22),
        },
      })

      marker.addListener('click', () => {
        onSelectIncident?.(inc)
      })

      markersRef.current.push(marker)
    })
  }, [incidents, selectedIncident, onSelectIncident, status, mode])

  // Pan to selected incident
  useEffect(() => {
    const map = mapInstanceRef.current
    if (map && selectedIncident && status === 'loaded') {
      map.panTo({ lat: selectedIncident.latitude, lng: selectedIncident.longitude })
      if (map.getZoom() < 8) {
        map.setZoom(8)
      }
    }
  }, [selectedIncident, status])

  // Render temporary coordinate pin
  useEffect(() => {
    const map = mapInstanceRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google

    if (!map || !google?.maps) return

    if (tempPinMarkerRef.current) {
      tempPinMarkerRef.current.setMap(null)
      tempPinMarkerRef.current = null
    }

    const coord = pinnedCoordinates || clickedCoord
    if (coord && mode === 'operations') {
      tempPinMarkerRef.current = new google.maps.Marker({
        position: coord,
        map,
        title: `Pinned: ${coord.lat}, ${coord.lng}`,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 4,
          fillColor: '#172554',
          fillOpacity: 1,
          strokeColor: '#2563EB',
          strokeWeight: 2,
        },
      })
    }
  }, [pinnedCoordinates, clickedCoord, mode])

  // Render live GPS preview with marker and accuracy circle
  useEffect(() => {
    const map = mapInstanceRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google

    if (!map || !google?.maps || status !== 'loaded') return

    if (liveGpsMarkerRef.current) {
      liveGpsMarkerRef.current.setMap(null)
      liveGpsMarkerRef.current = null
    }
    if (liveGpsCircleRef.current) {
      liveGpsCircleRef.current.setMap(null)
      liveGpsCircleRef.current = null
    }
    if (liveGpsInfoWindowRef.current) {
      liveGpsInfoWindowRef.current.close()
      liveGpsInfoWindowRef.current = null
    }

    if (liveLocationPreview) {
      const pos = { lat: liveLocationPreview.lat, lng: liveLocationPreview.lng }
      const acc = liveLocationPreview.accuracy && liveLocationPreview.accuracy > 0
        ? liveLocationPreview.accuracy
        : 20

      // Outer accuracy radius circle
      liveGpsCircleRef.current = new google.maps.Circle({
        strokeColor: '#2563EB',
        strokeOpacity: 0.85,
        strokeWeight: 1.5,
        fillColor: '#2563EB',
        fillOpacity: 0.15,
        map,
        center: pos,
        radius: acc,
      })

      // Officer GPS dot marker
      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: 'This is your current location.',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
        zIndex: 1000,
      })
      liveGpsMarkerRef.current = marker

      // InfoWindow communicating exact current location
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="background:#FFFFFF;color:#172554;padding:8px 10px;border-radius:8px;font-family:monospace;font-size:11px;border:1px solid #2563EB;box-shadow:0 4px 12px rgba(0,0,0,0.1);line-height:1.4;">
            <div style="color:#2563EB;font-weight:bold;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:2px;">
              OFFICER LOCATION
            </div>
            <div style="font-weight:bold;color:#172554;">This is your current location.</div>
            <div style="color:#475569;font-size:10px;margin-top:2px;">
              Lat: ${pos.lat.toFixed(4)}° · Lng: ${pos.lng.toFixed(4)}°${liveLocationPreview.accuracy ? ` · ±${Math.round(liveLocationPreview.accuracy)}m` : ''}
            </div>
          </div>
        `,
        disableAutoPan: true,
      })

      infoWindow.open(map, marker)
      liveGpsInfoWindowRef.current = infoWindow

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      // Automatically center map on captured location and zoom to street/location level
      map.panTo(pos)
      map.setZoom(15)
    }
  }, [liveLocationPreview, status])

  const handleResetView = useCallback(() => {
    const map = mapInstanceRef.current
    if (map) {
      map.panTo(NER_CENTER)
      map.setZoom(NER_ZOOM)
    }
  }, [])

  const handleCenterOnLocation = useCallback(() => {
    const map = mapInstanceRef.current
    if (map && liveLocationPreview) {
      map.panTo({ lat: liveLocationPreview.lat, lng: liveLocationPreview.lng })
      map.setZoom(15)
    }
  }, [liveLocationPreview])

  // Offline or Error fallback HUD
  if (status === 'no-key' || status === 'error') {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-white border border-[#E2E8F0] rounded-xl p-6 text-center overflow-hidden min-h-[260px] shadow-sm ${className}`}
      >
        <div className="w-12 h-12 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] flex items-center justify-center mb-3">
          <Radio size={20} className="text-[#2563EB] animate-pulse" />
        </div>
        <p className="font-mono text-xs tracking-[0.15em] uppercase text-[#2563EB] font-bold mb-1">
          {status === 'error' ? 'OFFLINE SATELLITE HUD' : 'GEOSPATIAL TELEMETRY READY'}
        </p>
        <p className="font-mono text-[11px] text-[#475569] max-w-xs mb-3">
          {status === 'error'
            ? 'Map tiles require internet connection. Your device hardware GPS operates independently and is ready to capture.'
            : 'Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable Google Maps imagery.'}
        </p>
        {liveLocationPreview ? (
          <div className="bg-[#F8FAFC] border border-[#BFDBFE] rounded-xl px-4 py-2.5 text-left font-mono text-xs text-[#2563EB] shadow-sm">
            <div className="text-[9px] text-[#2563EB] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping" />
              SATELLITE FIX ACQUIRED
            </div>
            <div className="font-semibold text-[#172554] mt-0.5">
              {liveLocationPreview.lat.toFixed(4)}°N, {liveLocationPreview.lng.toFixed(4)}°E
            </div>
            {liveLocationPreview.accuracy && (
              <div className="text-[10px] text-[#475569] mt-0.5">
                GPS Accuracy: ±{Math.round(liveLocationPreview.accuracy)}m · Device GPS
              </div>
            )}
          </div>
        ) : (
          <p className="font-mono text-[10px] text-[#64748B]">
            Click &quot;GET MY LIVE LOCATION&quot; to acquire your real device coordinates.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/85 rounded-xl z-20 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-7 h-7 border-2 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin mx-auto mb-2.5" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569]">
              INITIALIZING GEOSPATIAL MAP
            </p>
          </div>
        </div>
      )}

      {/* Map DOM Element */}
      <div
        ref={mapRef}
        className="w-full h-full min-h-[260px]"
        aria-label="Field Operations Map"
      />

      {/* Top Tactical Status Badge */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col gap-1">
        {mode === 'verification' ? (
          <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-lg px-2.5 py-1 pointer-events-auto shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${liveLocationPreview ? 'bg-[#2563EB] animate-pulse' : 'bg-[#059669]'}`} />
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#172554] font-bold">
                {liveLocationPreview
                  ? `LIVE GPS: ${liveLocationPreview.lat.toFixed(4)}°N, ${liveLocationPreview.lng.toFixed(4)}°E`
                  : 'NORTHEAST INDIA SECTOR'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-lg px-3 py-1.5 pointer-events-auto shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
              <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#172554] font-bold">
                TACTICAL FIELD SURVEILLANCE
              </span>
              <span className="text-[#CBD5E1]">·</span>
              <span className="font-mono text-[9px] text-[#475569]">
                {incidents.length} REPORTED INCIDENTS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Map Navigation Controls Bottom Overlay */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-auto flex items-center gap-1.5">
        {liveLocationPreview && (
          <button
            type="button"
            onClick={handleCenterOnLocation}
            title="Center map on your current GPS location"
            className="bg-white hover:bg-[#F8FAFC] border border-[#BFDBFE] text-[#2563EB] px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors shadow-md"
          >
            <Crosshair size={11} className="text-[#2563EB]" />
            <span>MY LOCATION</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleResetView}
          title="Reset map view to Northeast India"
          className="bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#172554] px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors shadow-md"
        >
          <Navigation size={10} className="text-[#475569]" />
          <span>NER</span>
        </button>
      </div>
    </div>
  )
}
