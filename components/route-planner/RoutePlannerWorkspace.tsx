'use client'

import { useState, type FormEvent, useEffect } from 'react'
import {
  ArrowRight,
  MapPin,
  Truck,
  Package,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Milestone,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react'
import { RoutePlannerMap } from './RoutePlannerMap'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { calculateRouteSuggestions, POPULAR_CORRIDORS } from '@/lib/routing/engine'
import type { RouteSuggestion, RoutePoint, RiskLevel } from '@/types/routing'

const VEHICLE_TYPES = [
  { value: 'heavy_truck', label: 'Heavy Truck (> 3.5 t / Multi-Axle)' },
  { value: 'light_truck', label: 'Light Commercial Vehicle (≤ 3.5 t)' },
  { value: 'van', label: 'Van / Minibus / Utility' },
  { value: 'car', label: 'Car / 4WD SUV' },
  { value: 'bus', label: 'Interstate Bus / Coach' },
  { value: 'other', label: 'Other Commercial Vehicle' },
]

const CARGO_TYPES = [
  { value: 'general', label: 'General Freight / Consumer Goods' },
  { value: 'medicine', label: 'Medicine / Medical Supplies' },
  { value: 'emergency', label: 'Emergency Relief / Disaster Supplies' },
  { value: 'food', label: 'Food & Perishables' },
  { value: 'construction', label: 'Construction Materials / Equipment' },
  { value: 'other', label: 'Other Cargo' },
]

const SELECT_CLASS =
  'w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm text-[#172554] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white ' +
  'transition-colors appearance-none cursor-pointer shadow-sm'

const INPUT_CLASS =
  'w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm text-[#172554] ' +
  'placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 ' +
  'focus:border-[#2563EB] focus:bg-white transition-colors shadow-sm'

const LABEL_CLASS =
  'block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-1.5 font-semibold'

export function RoutePlannerWorkspace() {
  const [origin, setOrigin] = useState('Guwahati, Assam')
  const [destination, setDestination] = useState('Shillong, Meghalaya')
  const [vehicleType, setVehicleType] = useState('heavy_truck')
  const [cargoType, setCargoType] = useState('medicine')

  const [isLoading, setIsLoading] = useState(false)
  const [routes, setRoutes] = useState<RouteSuggestion[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [originCoord, setOriginCoord] = useState<RoutePoint | null>(null)
  const [destinationCoord, setDestinationCoord] = useState<RoutePoint | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)

  // Automatically calculate initial sample corridor for instant visual map engagement
  useEffect(() => {
    handlePlanRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePlanRoute = async (
    customOrigin = origin,
    customDest = destination,
    customVehicle = vehicleType,
    customCargo = cargoType
  ) => {
    if (!customOrigin.trim() || !customDest.trim()) return

    setIsLoading(true)
    try {
      const result = await calculateRouteSuggestions(
        customOrigin,
        customDest,
        customVehicle,
        customCargo
      )
      setRoutes(result.routes)
      setOriginCoord(result.origin)
      setDestinationCoord(result.destination)

      // Default to recommended route (safest)
      const recommended = result.routes.find((r) => r.isRecommended) || result.routes[0]
      setSelectedRouteId(recommended ? recommended.id : null)
      setHasCalculated(true)
    } catch (err) {
      console.error('Failed to calculate routes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handlePlanRoute()
  }

  const handleSelectPreset = (preset: { origin: string; destination: string }) => {
    setOrigin(preset.origin)
    setDestination(preset.destination)
    handlePlanRoute(preset.origin, preset.destination, vehicleType, cargoType)
  }

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Main Responsive Grid: Controls on left (40%), Dominant Interactive Map on right (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* ── LEFT PANEL: Form & Route Suggestions (5 cols on lg) ── */}
        <div className="lg:col-span-5 space-y-5">

          {/* Route Search Form Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] font-bold">
                  ROUTE CALCULATION PARAMETERS
                </span>
              </div>
              <span className="font-mono text-[9px] text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded font-semibold">
                PUBLIC ACCESS
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Origin */}
              <div>
                <label className={LABEL_CLASS}>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#059669]" />
                    Origin City / Hub
                  </span>
                </label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="e.g. Guwahati, Assam"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  required
                />
              </div>

              {/* Destination */}
              <div>
                <label className={LABEL_CLASS}>
                  <span className="flex items-center gap-1.5">
                    <Navigation size={12} className="text-[#2563EB]" />
                    Destination Hub / Sector
                  </span>
                </label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="e.g. Shillong, Tawang, Silchar..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>

              {/* Quick Preset Corridors */}
              <div>
                <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#475569] mb-1.5 font-semibold">
                  POPULAR NORTHEAST CORRIDORS:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CORRIDORS.slice(0, 4).map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="font-mono text-[9px] px-2.5 py-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:text-[#2563EB] hover:border-[#2563EB]/40 hover:bg-[#EFF6FF] transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle & Cargo dropdowns in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className={LABEL_CLASS}>
                    <span className="flex items-center gap-1.5">
                      <Truck size={12} className="text-[#475569]" />
                      Vehicle Type
                    </span>
                  </label>
                  <select
                    className={SELECT_CLASS}
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    <span className="flex items-center gap-1.5">
                      <Package size={12} className="text-[#475569]" />
                      Cargo Profile
                    </span>
                  </label>
                  <select
                    className={SELECT_CLASS}
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                  >
                    {CARGO_TYPES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Action */}
              <Button
                type="submit"
                variant="amber"
                size="lg"
                className="w-full mt-2 font-sans"
                disabled={isLoading || !origin.trim() || !destination.trim()}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    CALCULATING ROAD GEOMETRY...
                  </>
                ) : (
                  <>
                    PLAN ROUTE & DRAW ON MAP
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* ── Suggested Routes Comparison List ── */}
          {routes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#2563EB]" />
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#172554] font-bold">
                    SUGGESTED ROUTES ({routes.length})
                  </span>
                </div>
                <span className="font-mono text-[9px] text-[#475569]">
                  SELECT TO EMPHASIZE ON MAP
                </span>
              </div>

              <div className="space-y-2.5">
                {routes.map((route) => {
                  const isSelected = route.id === selectedRouteId
                  const isLowRisk = route.riskLevel === 'LOW'
                  const isModRisk = route.riskLevel === 'MODERATE'
                  const isHighRisk = route.riskLevel === 'HIGH'

                  return (
                    <Card
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      glow={isSelected}
                      className={`p-4 transition-all duration-200 cursor-pointer border ${
                        isSelected
                          ? isLowRisk
                            ? 'border-[#059669] bg-[#ECFDF5] shadow-[0_0_20px_rgba(5,150,105,0.12)]'
                            : isModRisk
                            ? 'border-[#D97706] bg-[#FFFBEB] shadow-[0_0_20px_rgba(217,119,6,0.12)]'
                            : 'border-[#DC2626] bg-[#FEF2F2] shadow-[0_0_20px_rgba(220,38,38,0.12)]'
                          : 'border-[#E2E8F0] bg-white hover:border-[#2563EB]/40 hover:shadow-md'
                      }`}
                    >
                      {/* Top status badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          {route.isRecommended ? (
                            <span className="font-mono text-[9px] tracking-wider uppercase font-black bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              RECOMMENDED · SAFEST
                            </span>
                          ) : (
                            <span className="font-mono text-[9px] tracking-wider uppercase text-[#475569] bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded font-medium">
                              ALTERNATIVE ROUTE
                            </span>
                          )}
                        </div>

                        {/* Risk status badge */}
                        <div
                          className={`font-mono text-[9px] tracking-wider uppercase font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                            isLowRisk
                              ? 'text-[#059669] border-[#A7F3D0] bg-[#ECFDF5]'
                              : isModRisk
                              ? 'text-[#D97706] border-[#FDE68A] bg-[#FFFBEB]'
                              : 'text-[#DC2626] border-[#FECACA] bg-[#FEF2F2]'
                          }`}
                        >
                          {isLowRisk && <ShieldCheck size={10} />}
                          {isModRisk && <AlertTriangle size={10} />}
                          {isHighRisk && <ShieldAlert size={10} />}
                          <span>{route.riskLevel} RISK ({route.riskScore}/100)</span>
                        </div>
                      </div>

                      {/* Route Title */}
                      <h3 className="text-sm font-bold text-[#172554] mb-1">
                        {route.name}
                      </h3>

                      <p className="text-xs text-[#475569] mb-3 leading-relaxed font-light">
                        {route.summary}
                      </p>

                      {/* Distance & Travel Time Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0] mb-3 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <Milestone size={14} className="text-[#475569]" />
                          <div>
                            <div className="text-[9px] text-[#475569] uppercase font-semibold">Distance</div>
                            <div className="font-bold text-[#172554]">{route.distanceKm} km</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-[#475569]" />
                          <div>
                            <div className="text-[9px] text-[#475569] uppercase font-semibold">Est. Duration</div>
                            <div className="font-bold text-[#172554]">{route.durationFormatted}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                          <Sparkles size={14} className="text-[#2563EB]" />
                          <div>
                            <div className="text-[9px] text-[#475569] uppercase font-semibold">Live Weather</div>
                            <div className="font-bold text-[#172554] text-[11px]">
                              {route.weather ? `${route.weather.temperature}°C · ${route.weather.condition}` : 'Live Radar'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Corridor details */}
                      <div className="space-y-1 text-[11px] text-[#475569]">
                        <div className="flex items-start gap-1.5">
                          <span className="font-mono text-[9px] uppercase text-[#475569] shrink-0 mt-0.5 font-semibold">Terrain:</span>
                          <span className="text-[#475569]">{route.riskReason}</span>
                        </div>
                      </div>

                      {/* Selection indicator */}
                      <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] font-mono">
                        <span className={isSelected ? 'text-[#059669] font-bold' : 'text-[#475569]'}>
                          {isSelected ? '● ACTIVE ON INTERACTIVE MAP' : '○ Click to display on map'}
                        </span>
                        <span className="text-[#64748B] uppercase tracking-wider">
                          {route.geometry.length} ROAD WAYPOINTS
                        </span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Active Route Deep-Dive Card */}
          {activeRoute && (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-[#2563EB] font-bold">
                <Info size={12} />
                OPERATIONAL HAZARDS & ADVISORIES
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="font-mono text-[9px] text-[#475569] uppercase tracking-wider mb-1 font-semibold">
                    Known Corridor Hazards:
                  </div>
                  <ul className="space-y-1">
                    {activeRoute.hazards.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#475569]">
                        <span className="w-1 h-1 rounded-full bg-[#D97706] mt-1.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0]">
                  <div className="font-mono text-[9px] text-[#475569] uppercase tracking-wider mb-1 font-semibold">
                    Logistics Advisories:
                  </div>
                  <ul className="space-y-1">
                    {activeRoute.advisories.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#059669]">
                        <span className="w-1 h-1 rounded-full bg-[#059669] mt-1.5 shrink-0" />
                        <span className="text-[#475569]">{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Main Prominent Interactive Map (7 cols on lg) ── */}
        <div className="lg:col-span-7 space-y-3 sticky top-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] font-bold">
                NORTHEAST INDIA ROAD GEOMETRY & RISK VISUALIZER
              </span>
            </div>
            {hasCalculated && (
              <span className="font-mono text-[9px] text-[#64748B] hidden sm:inline">
                ROAD-ALIGNED VECTOR POLYLINES
              </span>
            )}
          </div>

          {/* Map Viewport Container */}
          <div className="h-[520px] sm:h-[620px] lg:h-[720px] w-full shadow-2xl">
            <RoutePlannerMap
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => setSelectedRouteId(id)}
              originCoord={originCoord}
              destinationCoord={destinationCoord}
              originName={origin}
              destinationName={destination}
              isLoading={isLoading}
              className="h-full w-full"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] px-1">
            <span>MAP ENGINE: GOOGLE MAPS JS & OSRM VECTOR TILES</span>
            <span>REAL ROAD GEOMETRY · NO SIMULATED STRAIGHT LINES</span>
          </div>
        </div>

      </div>
    </div>
  )
}
