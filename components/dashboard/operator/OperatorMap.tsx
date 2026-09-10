'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { LIGHT_MAP_STYLE } from '@/components/map/NorthEastMap'
import type { FieldOfficerItem, CargoVehicleItem } from './types'
import { JABALPUR_CENTER } from './mockData'
import { Shield, Truck, Navigation, AlertTriangle, Info, X } from 'lucide-react'

interface OperatorMapProps {
  officers: FieldOfficerItem[]
  vehicles: CargoVehicleItem[]
  selectedItem: { type: 'officer' | 'vehicle' | 'incident'; id: string } | null
  onSelectItem: (item: { type: 'officer' | 'vehicle' | 'incident'; id: string } | null) => void
  onOpenOfficerReport: (officer: FieldOfficerItem) => void
  className?: string
}

// Singleton guard – Google Maps API options must only be set once per page load
let _gmOptionsSet = false

export function OperatorMap({
  officers,
  vehicles,
  selectedItem,
  onSelectItem,
  onOpenOfficerReport,
}: OperatorMapProps) {
  // The map container gets an explicit inline height so Google Maps always has
  // a concrete pixel value to render into (avoids the "thin strip" bug).
  const MAP_HEIGHT = 520

  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylinesRef = useRef<Record<string, any>>({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const infoWindowRef = useRef<any>(null)

  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'no-key' | 'error'>('loading')

  // ─── Selected entity (for the side-panel overlay) ─────────────────────────
  const activeOfficer =
    selectedItem?.type === 'officer'
      ? officers.find((o) => o.id === selectedItem.id) ?? null
      : null

  const activeVehicle =
    selectedItem?.type === 'vehicle'
      ? vehicles.find((v) => v.id === selectedItem.id) ?? null
      : null

  // ─── 1. Initialise Google Maps once ──────────────────────────────────────
  useEffect(() => {
    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      ''

    if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setMapStatus('no-key')
      return
    }

    if (!_gmOptionsSet) {
      try {
        setOptions({ key: apiKey, v: 'weekly' })
        _gmOptionsSet = true
      } catch {
        // setOptions throws if called after the API is already loaded — safe to ignore
      }
    }

    importLibrary('maps')
      .then((mapsLib) => {
        if (!mapContainerRef.current) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Map, InfoWindow } = mapsLib as any

        const map = new Map(mapContainerRef.current, {
          center: JABALPUR_CENTER,
          zoom: 9,
          styles: LIGHT_MAP_STYLE,
          // Minimal UI — only zoom controls and fullscreen
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          scrollwheel: true,
          gestureHandling: 'cooperative',
          backgroundColor: '#F8FAFC',
        })

        mapRef.current = map
        infoWindowRef.current = new InfoWindow()
        setMapStatus('ready')
      })
      .catch((err) => {
        console.warn('[OperatorMap] Maps load error:', err)
        setMapStatus('error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── 2. Draw / update route polylines ────────────────────────────────────
  useEffect(() => {
    if (mapStatus !== 'ready') return
    const map = mapRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google
    if (!map || !google?.maps) return

    vehicles.forEach((vehicle) => {
      const key = `poly-${vehicle.id}`
      const strokeColor = vehicle.isAffected ? '#DC2626' : vehicle.routeColor ?? '#2563EB'
      const strokeWeight = vehicle.isAffected ? 5 : 3.5
      const strokeOpacity = vehicle.isAffected ? 1 : 0.8
      const strokeDashArray = vehicle.isAffected ? [8, 5] : undefined

      if (!polylinesRef.current[key]) {
        const options: Record<string, unknown> = {
          path: vehicle.routePath,
          geodesic: true,
          strokeColor,
          strokeOpacity,
          strokeWeight,
          map,
        }
        if (strokeDashArray) {
          options.icons = [
            {
              icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: strokeWeight },
              offset: '0',
              repeat: '14px',
            },
          ]
          options.strokeOpacity = 0
        }
        polylinesRef.current[key] = new google.maps.Polyline(options)
      } else {
        polylinesRef.current[key].setOptions({ strokeColor, strokeWeight, strokeOpacity })
      }
    })
  }, [vehicles, mapStatus])

  // ─── Helper: build InfoWindow HTML content ─────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildOfficerInfoHtml = (officer: FieldOfficerItem) => `
    <div style="font-family:system-ui,sans-serif;min-width:200px;max-width:260px;padding:2px 0">
      <div style="display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid #E2E8F0;margin-bottom:10px">
        <div style="background:${officer.hasIncident ? '#DC2626' : '#2563EB'};border-radius:8px;padding:7px;display:flex;align-items:center;justify-content:center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <div style="font-weight:700;font-size:13px;color:#0F172A">${officer.name}</div>
          <div style="font-size:11px;color:#64748B">${officer.badgeId} · ${officer.locationName}</div>
        </div>
      </div>
      <div style="font-size:11px;color:#334155;display:flex;flex-direction:column;gap:5px">
        <div style="display:flex;justify-content:space-between">
          <span style="color:#94A3B8">Status</span>
          <span style="font-weight:600;color:${officer.hasIncident ? '#DC2626' : '#16A34A'}">${officer.status.replace('_', ' ')}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#94A3B8">Last update</span>
          <span style="font-weight:500">${officer.lastUpdate}</span>
        </div>
        ${officer.hasIncident && officer.report ? `
        <div style="margin-top:6px;padding:8px;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;font-size:11px;color:#991B1B">
          <div style="font-weight:700;margin-bottom:2px">⚠ ${officer.report.title}</div>
          <div style="color:#B91C1C;font-size:10px">${officer.report.category} · Severity: ${officer.report.severity}</div>
        </div>` : ''}
      </div>
    </div>
  `

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildVehicleInfoHtml = (vehicle: CargoVehicleItem) => `
    <div style="font-family:system-ui,sans-serif;min-width:200px;max-width:260px;padding:2px 0">
      <div style="display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid #E2E8F0;margin-bottom:10px">
        <div style="background:${vehicle.isAffected ? '#D97706' : '#16A34A'};border-radius:8px;padding:7px;display:flex;align-items:center;justify-content:center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        </div>
        <div>
          <div style="font-weight:700;font-size:13px;color:#0F172A">Vehicle ${vehicle.vehicleId}</div>
          <div style="font-size:11px;color:#64748B">Driver: ${vehicle.driverName}</div>
        </div>
      </div>
      <div style="font-size:11px;color:#334155;display:flex;flex-direction:column;gap:5px">
        <div style="display:flex;justify-content:space-between">
          <span style="color:#94A3B8">Route</span>
          <span style="font-weight:600">${vehicle.routeString}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#94A3B8">Cargo</span>
          <span style="font-weight:500;max-width:140px;text-align:right">${vehicle.cargo}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#94A3B8">Speed</span>
          <span style="font-weight:500">${vehicle.speedKmH} km/h</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#94A3B8">GPS</span>
          <span style="font-family:monospace;font-size:10px">${vehicle.currentLat.toFixed(4)}°N, ${vehicle.currentLng.toFixed(4)}°E</span>
        </div>
        ${vehicle.isAffected ? `
        <div style="margin-top:6px;padding:8px;background:#FEF3C7;border:1px solid #FDE68A;border-radius:6px;font-size:11px;color:#92400E">
          <div style="font-weight:700">⚠ Route Warning Active</div>
          <div style="font-size:10px;margin-top:2px">Incident reported on this route</div>
        </div>` : ''}
      </div>
    </div>
  `

  // ─── 3. Place / update markers ────────────────────────────────────────────
  const placeMarkers = useCallback(() => {
    if (mapStatus !== 'ready') return
    const map = mapRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google
    if (!map || !google?.maps) return

    // ── Field Officer markers (circle pins) ──────────────────────────────
    officers.forEach((officer) => {
      const key = `off-${officer.id}`
      const isSelected = selectedItem?.type === 'officer' && selectedItem.id === officer.id
      const fillColor = officer.hasIncident ? '#DC2626' : '#2563EB'
      const scale = isSelected ? 13 : 10

      if (!markersRef.current[key]) {
        const marker = new google.maps.Marker({
          position: { lat: officer.latitude, lng: officer.longitude },
          map,
          title: `${officer.name} (${officer.badgeId})`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale,
            fillColor,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2.5,
          },
          zIndex: isSelected ? 30 : 20,
        })

        marker.addListener('click', () => {
          onSelectItem({ type: 'officer', id: officer.id })
          infoWindowRef.current?.setContent(buildOfficerInfoHtml(officer))
          infoWindowRef.current?.open(map, marker)
        })

        markersRef.current[key] = marker
      } else {
        // Update icon when selection changes
        markersRef.current[key].setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale,
          fillColor,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        })
        markersRef.current[key].setZIndex(isSelected ? 30 : 20)
      }

      // Pulse animation outer ring for incidents
      const incKey = `inc-ring-${officer.id}`
      if (officer.hasIncident && !markersRef.current[incKey]) {
        markersRef.current[incKey] = new google.maps.Marker({
          position: { lat: officer.latitude, lng: officer.longitude },
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 18,
            fillColor: '#DC2626',
            fillOpacity: 0.18,
            strokeColor: '#DC2626',
            strokeWeight: 1.5,
            strokeOpacity: 0.5,
          },
          clickable: false,
          zIndex: 10,
        })
      }
    })

    // ── Cargo vehicle markers (arrow pins) ───────────────────────────────
    vehicles.forEach((vehicle) => {
      const key = `veh-${vehicle.id}`
      const isSelected = selectedItem?.type === 'vehicle' && selectedItem.id === vehicle.id
      const fillColor = vehicle.isAffected ? '#D97706' : '#16A34A'
      const scale = isSelected ? 9 : 7

      if (!markersRef.current[key]) {
        const marker = new google.maps.Marker({
          position: { lat: vehicle.currentLat, lng: vehicle.currentLng },
          map,
          title: `${vehicle.vehicleId} — ${vehicle.driverName}`,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale,
            fillColor,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            rotation: 45,
          },
          zIndex: isSelected ? 30 : 25,
        })

        marker.addListener('click', () => {
          onSelectItem({ type: 'vehicle', id: vehicle.id })
          infoWindowRef.current?.setContent(buildVehicleInfoHtml(vehicle))
          infoWindowRef.current?.open(map, marker)
        })

        markersRef.current[key] = marker
      } else {
        // Update live position
        markersRef.current[key].setPosition({ lat: vehicle.currentLat, lng: vehicle.currentLng })
        markersRef.current[key].setIcon({
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale,
          fillColor,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          rotation: 45,
        })
        markersRef.current[key].setZIndex(isSelected ? 30 : 25)

        // Update InfoWindow content if this vehicle is active
        if (isSelected && infoWindowRef.current?.getMap()) {
          infoWindowRef.current.setContent(buildVehicleInfoHtml(vehicle))
        }
      }
    })
  }, [officers, vehicles, selectedItem, onSelectItem, mapStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    placeMarkers()
  }, [placeMarkers])

  // ─── Reset map view ───────────────────────────────────────────────────────
  const handleResetView = () => {
    onSelectItem(null)
    infoWindowRef.current?.close()
    if (mapRef.current) {
      mapRef.current.panTo(JABALPUR_CENTER)
      mapRef.current.setZoom(9)
    }
  }

  // ─── Fallback SVG map (shown while Google Maps loads or if no API key) ────
  const FallbackMap = () => (
    <div className="absolute inset-0 bg-[#F1F5F9] flex flex-col items-center justify-center gap-4 select-none">
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-op" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#CBD5E1" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-op)" />
        {/* Schematic routes */}
        <path d="M 42% 50% L 52% 30% L 64% 16%" fill="none" stroke="#DC2626" strokeWidth="5" strokeDasharray="8 5" />
        <path d="M 42% 50% L 62% 58% L 76% 63%" fill="none" stroke="#2563EB" strokeWidth="4" />
        <path d="M 42% 50% L 30% 63% L 22% 76%" fill="none" stroke="#16A34A" strokeWidth="4" />
      </svg>

      {/* Marker dots overlay */}
      <div className="absolute inset-0">
        {officers.map((off) => {
          const leftPct = Math.min(88, Math.max(8, ((off.longitude - 79.0) / (81.0 - 79.0)) * 100))
          const topPct = Math.min(88, Math.max(8, ((24.4 - off.latitude) / (24.4 - 21.8)) * 100))
          return (
            <button
              key={off.id}
              type="button"
              onClick={() => onSelectItem({ type: 'officer', id: off.id })}
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className={`w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center ${off.hasIncident ? 'bg-red-600' : 'bg-blue-600'}`}>
                <Shield size={9} className="text-white" />
              </div>
            </button>
          )
        })}
        {vehicles.map((veh) => {
          const leftPct = Math.min(88, Math.max(8, ((veh.currentLng - 79.0) / (81.0 - 79.0)) * 100))
          const topPct = Math.min(88, Math.max(8, ((24.4 - veh.currentLat) / (24.4 - 21.8)) * 100))
          return (
            <button
              key={veh.id}
              type="button"
              onClick={() => onSelectItem({ type: 'vehicle', id: veh.id })}
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className={`px-2 py-0.5 rounded-full border-2 border-white shadow-md flex items-center gap-1 text-white text-[10px] font-bold ${veh.isAffected ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                <Truck size={9} />
                {veh.vehicleId}
              </div>
            </button>
          )
        })}
      </div>

      <div className="z-10 flex flex-col items-center gap-2 pointer-events-none">
        {mapStatus === 'no-key' ? (
          <>
            <div className="bg-white/95 border border-[#E2E8F0] rounded-xl px-5 py-3 shadow-sm text-center">
              <p className="font-semibold text-slate-700 text-sm">Google Maps API key not configured</p>
              <p className="text-xs text-slate-500 mt-1">Set <code className="bg-slate-100 px-1 rounded text-[11px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your .env.local</p>
            </div>
          </>
        ) : mapStatus === 'error' ? (
          <div className="bg-white/95 border border-[#E2E8F0] rounded-xl px-5 py-3 shadow-sm text-center">
            <p className="font-semibold text-slate-700 text-sm">Map failed to load</p>
            <p className="text-xs text-slate-500 mt-1">Check your API key and network connection</p>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm border border-[#E2E8F0] rounded-xl px-4 py-2 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-600">Loading Google Maps…</span>
          </div>
        )}
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] text-slate-400 pointer-events-none">
        <span>Guwahati – NE India Schematic Preview</span>
        <span>Live Positioning Active</span>
      </div>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white shadow-sm"
      style={{ height: MAP_HEIGHT }}
    >
      {/* Google Maps canvas */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        aria-label="Logistics Operations Map — Jabalpur Corridor"
      />

      {/* Fallback shown when maps not ready */}
      {mapStatus !== 'ready' && <FallbackMap />}

      {/* ── Top-left: Status badge ─────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-sm border border-[#E2E8F0] rounded-xl px-3.5 py-2 shadow-sm flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${mapStatus === 'ready' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <div>
            <div className="text-[11px] font-bold text-slate-800 leading-none">
              Guwahati–Silchar Corridor
              {mapStatus === 'ready' && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-semibold border border-emerald-200">
                  LIVE
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              6 Officers · 3 Vehicles · {officers.filter(o => o.hasIncident).length} Incidents
            </div>
          </div>
        </div>
      </div>

      {/* ── Top-left legend (below status badge, only when map loaded) ─── */}
      {mapStatus === 'ready' && (
        <div className="absolute top-[62px] left-3 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm border border-[#E2E8F0] rounded-xl p-3 shadow-sm text-[10px] font-sans text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-[#DC2626] inline-block rounded" />
              <span className="text-[#DC2626] font-semibold">Affected route (NH-6)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-[#2563EB] inline-block rounded" />
              <span>Shillong → Guwahati</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-[#059669] inline-block rounded" />
              <span>Silchar → Agartala</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="w-3 h-3 rounded-full bg-[#2563EB] inline-block" />
              <span>Field Officer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#DC2626] inline-block" />
              <span>Incident</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#16A34A] inline-block" />
              <span>Vehicle (OK)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#D97706] inline-block" />
              <span>Vehicle (Warning)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Top-right: Reset button ────────────────────────────────────── */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={handleResetView}
          className="bg-white hover:bg-slate-50 border border-[#E2E8F0] text-slate-700 px-3 py-2 rounded-xl text-[11px] font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Navigation size={12} className="text-[#2563EB]" />
          Reset View
        </button>
      </div>

      {/* ── Bottom panel: Selected Officer details ─────────────────────── */}
      {activeOfficer && (
        <div className="absolute bottom-4 right-4 z-20 w-[280px] bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xl font-sans">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E2E8F0] mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg text-white ${activeOfficer.hasIncident ? 'bg-[#DC2626]' : 'bg-[#2563EB]'}`}>
                <Shield size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm leading-none">{activeOfficer.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{activeOfficer.badgeId} · {activeOfficer.locationName}</p>
              </div>
            </div>
            <button type="button" onClick={() => { onSelectItem(null); infoWindowRef.current?.close() }} className="text-slate-400 hover:text-slate-700 p-0.5">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2 text-[11px] text-slate-700 mb-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${activeOfficer.hasIncident ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {activeOfficer.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Update</span>
              <span className="font-medium">{activeOfficer.lastUpdate}</span>
            </div>
            {activeOfficer.hasIncident && activeOfficer.report && (
              <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg text-[10px] text-red-800">
                <div className="font-bold flex items-center gap-1"><AlertTriangle size={10} /> {activeOfficer.report.title}</div>
                <div className="text-red-600 mt-0.5">{activeOfficer.report.category} · {activeOfficer.report.severity}</div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenOfficerReport(activeOfficer)}
            className="w-full bg-[#2563EB] hover:bg-blue-700 text-white py-2 px-3 rounded-xl text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Info size={12} />
            View Full Report
          </button>
        </div>
      )}

      {/* ── Bottom panel: Selected Vehicle details ─────────────────────── */}
      {activeVehicle && (
        <div className="absolute bottom-4 right-4 z-20 w-[280px] bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xl font-sans">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E2E8F0] mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg text-white ${activeVehicle.isAffected ? 'bg-[#D97706]' : 'bg-[#16A34A]'}`}>
                <Truck size={15} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-slate-900 text-sm leading-none">Vehicle {activeVehicle.vehicleId}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">{activeVehicle.speedKmH} km/h</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Driver: {activeVehicle.driverName}</p>
              </div>
            </div>
            <button type="button" onClick={() => { onSelectItem(null); infoWindowRef.current?.close() }} className="text-slate-400 hover:text-slate-700 p-0.5">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2 text-[11px] text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Route</span>
              <span className="font-semibold text-slate-800">{activeVehicle.routeString}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cargo</span>
              <span className="font-medium text-right max-w-[150px]">{activeVehicle.cargo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Live GPS</span>
              <span className="font-mono text-[10px] text-slate-700">{activeVehicle.currentLat.toFixed(4)}°N, {activeVehicle.currentLng.toFixed(4)}°E</span>
            </div>
            {activeVehicle.isAffected && (
              <div className="mt-1 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800">
                <div className="font-bold flex items-center gap-1"><AlertTriangle size={10} /> Route Warning Active</div>
                <div className="text-amber-700 mt-0.5">Incident on Jabalpur → Katni corridor</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
