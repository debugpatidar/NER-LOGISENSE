'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import type { RouteSuggestion, RoutePoint, RiskLevel } from '@/types/routing'
import { Navigation, Maximize2, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react'
import { LIGHT_MAP_STYLE } from '@/components/map/NorthEastMap'


export interface RoutePlannerMapProps {
  routes?: RouteSuggestion[]
  selectedRouteId?: string | null
  onSelectRoute?: (routeId: string) => void
  originCoord?: RoutePoint | null
  destinationCoord?: RoutePoint | null
  originName?: string
  destinationName?: string
  className?: string
  isLoading?: boolean
}

const NER_CENTER = { lat: 25.5, lng: 93.5 }
const NER_ZOOM = 6

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#059669',       // Emerald green
  MODERATE: '#D97706',  // Amber
  HIGH: '#DC2626',      // Red
}

let googleMapsOptionsSet = false

export function RoutePlannerMap({
  routes = [],
  selectedRouteId,
  onSelectRoute,
  originCoord,
  destinationCoord,
  originName = 'Origin',
  destinationName = 'Destination',
  className = '',
  isLoading = false,
}: RoutePlannerMapProps) {

  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylinesRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glowPolylinesRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const infoWindowRef = useRef<any>(null)

  const [status, setStatus] = useState<'loading' | 'loaded' | 'error' | 'no-key'>('loading')

  // Theme is always light — no dynamic style update needed

  // Initialize Map
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
      } catch {
        // Options already set
      }
    }

    importLibrary('maps')
      .then((mapsLib) => {
        if (!mapRef.current) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Map } = mapsLib as any

        const map = new Map(mapRef.current, {
          center: NER_CENTER,
          zoom: NER_ZOOM,
          styles: LIGHT_MAP_STYLE,
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
        setStatus('loaded')
      })
      .catch((err) => {
        console.warn('[RoutePlannerMap] Failed to load Google Maps:', err)
        setStatus('error')
      })

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null))
      polylinesRef.current = []
      glowPolylinesRef.current.forEach((g) => g.setMap(null))
      glowPolylinesRef.current = []
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
      if (infoWindowRef.current) infoWindowRef.current.close()
    }
  }, [])

  // Draw Polylines & Markers when routes or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google

    if (!map || !google?.maps || status !== 'loaded') return

    // 1. Clear existing polylines & glow polylines
    polylinesRef.current.forEach((p) => p.setMap(null))
    polylinesRef.current = []
    glowPolylinesRef.current.forEach((g) => g.setMap(null))
    glowPolylinesRef.current = []

    // 2. Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    if (infoWindowRef.current) infoWindowRef.current.close()

    if (routes.length === 0) return

    const bounds = new google.maps.LatLngBounds()

    // 3. Draw All Routes as Polylines
    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId
      const color = RISK_COLORS[route.riskLevel] || '#059669'
      const path = route.geometry.map((pt) => ({ lat: pt.lat, lng: pt.lng }))

      // Extend bounds
      path.forEach((pt) => bounds.extend(pt))

      // If selected: draw soft glow background polyline
      if (isSelected) {
        const glowLine = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.25,
          strokeWeight: 14,
          map,
          zIndex: 50,
        })
        glowPolylinesRef.current.push(glowLine)
      }

      // Draw Main Route Line
      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: isSelected ? 0.95 : 0.4,
        strokeWeight: isSelected ? 6 : 4,
        map,
        zIndex: isSelected ? 100 : 20,
        cursor: 'pointer',
      })

      // Clicking any route line directly on map selects it
      polyline.addListener('click', () => {
        onSelectRoute?.(route.id)
      })

      polylinesRef.current.push(polyline)
    })

    // 4. Add Origin & Destination Markers
    const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]
    const startCoord = originCoord || activeRoute?.originCoord
    const endCoord = destinationCoord || activeRoute?.destinationCoord

    if (startCoord) {
      const originMarker = new google.maps.Marker({
        position: { lat: startCoord.lat, lng: startCoord.lng },
        map,
        title: `ORIGIN: ${originName}`,
        label: {
          text: 'A',
          color: '#FFFFFF',
          fontWeight: 'bold',
          fontSize: '12px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#059669',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
        zIndex: 200,
      })

      originMarker.addListener('click', () => {
        if (!infoWindowRef.current) infoWindowRef.current = new google.maps.InfoWindow()
        infoWindowRef.current.setContent(`
          <div style="background:#FFFFFF;color:#172554;padding:8px 12px;border-radius:8px;font-family:monospace;font-size:11px;border:1px solid #059669;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <div style="color:#059669;font-size:9px;font-weight:bold;text-transform:uppercase;">ORIGIN POINT</div>
            <div style="font-weight:bold;margin-top:2px;color:#172554;">${originName}</div>
          </div>
        `)
        infoWindowRef.current.open(map, originMarker)
      })

      markersRef.current.push(originMarker)
    }

    if (endCoord) {
      const destMarker = new google.maps.Marker({
        position: { lat: endCoord.lat, lng: endCoord.lng },
        map,
        title: `DESTINATION: ${destinationName}`,
        label: {
          text: 'B',
          color: '#FFFFFF',
          fontWeight: 'bold',
          fontSize: '12px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
        zIndex: 200,
      })

      destMarker.addListener('click', () => {
        if (!infoWindowRef.current) infoWindowRef.current = new google.maps.InfoWindow()
        infoWindowRef.current.setContent(`
          <div style="background:#FFFFFF;color:#172554;padding:8px 12px;border-radius:8px;font-family:monospace;font-size:11px;border:1px solid #2563EB;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <div style="color:#2563EB;font-size:9px;font-weight:bold;text-transform:uppercase;">DESTINATION POINT</div>
            <div style="font-weight:bold;margin-top:2px;color:#172554;">${destinationName}</div>
          </div>
        `)
        infoWindowRef.current.open(map, destMarker)
      })

      markersRef.current.push(destMarker)
    }

    // 5. Fit Viewport so complete route is clearly visible
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      })
    }
  }, [routes, selectedRouteId, originCoord, destinationCoord, originName, destinationName, onSelectRoute, status])

  const handleFitRoute = useCallback(() => {
    const map = mapInstanceRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google
    if (!map || !google?.maps || routes.length === 0) return

    const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]
    if (activeRoute && activeRoute.geometry.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      activeRoute.geometry.forEach((pt) => bounds.extend(pt))
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 })
    }
  }, [routes, selectedRouteId])

  const handleResetNERView = useCallback(() => {
    const map = mapInstanceRef.current
    if (map) {
      map.panTo(NER_CENTER)
      map.setZoom(NER_ZOOM)
    }
  }, [])

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]

  if (status === 'no-key' || status === 'error') {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-white border border-[#E2E8F0] rounded-3xl p-8 text-center min-h-[420px] shadow-sm ${className}`}
      >
        <div className="w-12 h-12 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
          <Navigation size={22} className="text-[#2563EB]" />
        </div>
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-[#2563EB] mb-2 font-bold">
          GEOSPATIAL ROUTE MAP READY
        </p>
        <p className="font-mono text-xs text-[#475569] max-w-sm mb-4">
          {status === 'error'
            ? 'Map tiles loading temporarily unavailable. Route calculation and road corridor geometry operate normally.'
            : 'Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable Google Maps visual layer.'}
        </p>
        {routes.length > 0 && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 text-left max-w-md w-full shadow-sm">
            <div className="font-mono text-[10px] text-[#059669] uppercase tracking-wider mb-1 font-bold">
              Calculated Route Geometry
            </div>
            <div className="text-[#172554] text-sm font-semibold">
              {selectedRoute.summary}
            </div>
            <div className="text-[#475569] text-xs mt-1">
              Distance: {selectedRoute.distanceKm} km · Est. Time: {selectedRoute.durationFormatted} · Risk: {selectedRoute.riskLevel}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-[#E2E8F0] bg-white shadow-sm ${className}`}>
      {/* Loading overlay */}
      {(status === 'loading' || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-sm z-30">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin mx-auto mb-3" />
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-[#475569]">
              {isLoading ? 'CALCULATING ROAD GEOMETRY...' : 'INITIALIZING REGIONAL MAP...'}
            </p>
          </div>
        </div>
      )}

      {/* Map DOM Element */}
      <div
        ref={mapRef}
        className="w-full h-full min-h-[480px] lg:min-h-[620px]"
        aria-label="Interactive Route Planner Map"
      />

      {/* Top Left: Active Route Telemetry Overlay */}
      {selectedRoute && (
        <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-sm sm:max-w-md">
          <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: RISK_COLORS[selectedRoute.riskLevel] }}
                />
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#475569] font-semibold">
                  ACTIVE ROUTE ON MAP
                </span>
              </div>
              <span
                className="font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 rounded border font-bold"
                style={{
                  color: RISK_COLORS[selectedRoute.riskLevel],
                  borderColor: `${RISK_COLORS[selectedRoute.riskLevel]}40`,
                  backgroundColor: `${RISK_COLORS[selectedRoute.riskLevel]}15`,
                }}
              >
                {selectedRoute.riskLevel === 'LOW' && '🟢 LOW RISK'}
                {selectedRoute.riskLevel === 'MODERATE' && '🟠 MODERATE RISK'}
                {selectedRoute.riskLevel === 'HIGH' && '🔴 HIGH RISK'}
              </span>
            </div>

            <div className="text-sm sm:text-base font-black tracking-tight text-[#172554] line-clamp-1">
              {selectedRoute.name}
            </div>

            <div className="flex items-center gap-4 mt-2 font-mono text-xs">
              <div>
                <span className="text-[#475569] text-[10px] uppercase font-semibold">DISTANCE: </span>
                <span className="text-[#172554] font-bold">{selectedRoute.distanceKm} km</span>
              </div>
              <div className="text-[#CBD5E1]">·</div>
              <div>
                <span className="text-[#475569] text-[10px] uppercase font-semibold">EST. TIME: </span>
                <span className="text-[#172554] font-bold">{selectedRoute.durationFormatted}</span>
              </div>
              <div className="text-[#CBD5E1]">·</div>
              <div>
                <span className="text-[#475569] text-[10px] uppercase font-semibold">SCORE: </span>
                <span className="text-[#172554] font-bold">{selectedRoute.riskScore}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Left: Map Controls */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto flex items-center gap-2">
        {routes.length > 0 && (
          <button
            type="button"
            onClick={handleFitRoute}
            title="Fit view to active route"
            className="bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB]/40 text-[#172554] px-3.5 py-1.5 rounded-xl text-[10px] font-mono flex items-center gap-1.5 transition-all shadow-md"
          >
            <Maximize2 size={11} className="text-[#2563EB]" />
            <span>FIT ROUTE</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleResetNERView}
          title="Reset to Northeast India overview"
          className="bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB]/40 text-[#475569] hover:text-[#172554] px-3.5 py-1.5 rounded-xl text-[10px] font-mono flex items-center gap-1.5 transition-all shadow-md"
        >
          <Navigation size={11} className="text-[#475569]" />
          <span>NER REGION</span>
        </button>
      </div>

      {/* Bottom Right: Tactical Map Legend */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xl font-mono text-[9px]">
          <div className="text-[#475569] uppercase tracking-[0.15em] mb-2 font-bold">
            ROUTE RISK CLASSIFICATION
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-[#059669]" />
              <span className="text-[#172554] flex items-center gap-1">
                <ShieldCheck size={10} className="text-[#059669]" />
                Safe / Low Risk Corridor
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-[#D97706]" />
              <span className="text-[#172554] flex items-center gap-1">
                <AlertTriangle size={10} className="text-[#D97706]" />
                Moderate Risk / Valley Pass
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-[#DC2626]" />
              <span className="text-[#172554] flex items-center gap-1">
                <ShieldAlert size={10} className="text-[#DC2626]" />
                High / Monsoon Alert Sector
              </span>
            </div>
          </div>
          <div className="border-t border-[#E2E8F0] mt-2 pt-1.5 flex items-center gap-3 text-[#475569]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#059669] inline-block" />
              Origin (A)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] inline-block" />
              Dest (B)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
