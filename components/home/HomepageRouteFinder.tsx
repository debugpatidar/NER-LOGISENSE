'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Navigation,
  Truck,
  Package,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Milestone,
  Compass,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { POPULAR_CORRIDORS, calculateRouteSuggestions } from '@/lib/routing/engine'
import type { RouteSuggestion } from '@/types/routing'

const VEHICLE_OPTIONS = [
  { value: 'heavy_truck', label: 'Heavy Truck (> 3.5 t / Freight)' },
  { value: 'light_truck', label: 'Light Commercial Vehicle' },
  { value: 'van', label: 'Van / Utility' },
  { value: 'car', label: 'Car / 4WD SUV' },
  { value: 'bus', label: 'Passenger Bus' },
]

const CARGO_OPTIONS = [
  { value: 'general', label: 'General Freight' },
  { value: 'medicine', label: 'Medicine / Medical Supplies' },
  { value: 'emergency', label: 'Emergency Relief Supplies' },
  { value: 'food', label: 'Food & Perishables' },
  { value: 'construction', label: 'Construction Materials' },
]

export function HomepageRouteFinder() {
  const [origin, setOrigin] = useState('Guwahati, Assam')
  const [destination, setDestination] = useState('Shillong, Meghalaya')
  const [vehicle, setVehicle] = useState('heavy_truck')
  const [cargo, setCargo] = useState('medicine')

  const [loading, setLoading] = useState(false)
  const [routeResult, setRouteResult] = useState<RouteSuggestion | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (orig = origin, dest = destination) => {
    if (!orig.trim() || !dest.trim()) return
    setLoading(true)
    try {
      const res = await calculateRouteSuggestions(orig, dest, vehicle, cargo)
      if (res.routes && res.routes.length > 0) {
        setRouteResult(res.routes[0])
        setSearched(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePreset = (preset: { origin: string; destination: string }) => {
    setOrigin(preset.origin)
    setDestination(preset.destination)
    handleSearch(preset.origin, preset.destination)
  }

  return (
    <section id="route-finder" className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">

        {/* Section Header with Editorial Serif */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569]">
              PUBLIC ROUTE INTELLIGENCE
            </span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-[#172554] leading-tight mb-4">
            Plan safer routes across <span className="italic text-[#2563EB]">Northeast India.</span>
          </h2>
          <p className="text-[#475569] text-sm sm:text-base leading-relaxed font-light">
            No account required. Calculate road distances, estimated transit times, and terrain risk scores across all 8 North Eastern states.
          </p>
        </div>

        {/* Route Finder Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
            className="space-y-6"
          >
            {/* Quick Preset Corridors */}
            <div>
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-2 font-medium">
                POPULAR REGIONAL CORRIDORS:
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CORRIDORS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePreset(p)}
                    className="font-mono text-[10px] px-3.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:text-[#2563EB] hover:border-[#2563EB]/50 hover:bg-[#EFF6FF] transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Origin */}
              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#475569] mb-1.5">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-[#059669]" />
                    Origin
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm text-[#172554] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  placeholder="e.g. Guwahati, Assam"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  required
                />
              </div>

              {/* Destination */}
              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#475569] mb-1.5">
                  <span className="flex items-center gap-1">
                    <Navigation size={11} className="text-[#2563EB]" />
                    Destination
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm text-[#172554] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  placeholder="e.g. Shillong, Tawang..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>

              {/* Vehicle */}
              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#475569] mb-1.5">
                  <span className="flex items-center gap-1">
                    <Truck size={11} className="text-[#475569]" />
                    Vehicle Type
                  </span>
                </label>
                <select
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm text-[#172554] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors cursor-pointer"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                >
                  {VEHICLE_OPTIONS.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cargo */}
              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-[#475569] mb-1.5">
                  <span className="flex items-center gap-1">
                    <Package size={11} className="text-[#475569]" />
                    Cargo Profile
                  </span>
                </label>
                <select
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm text-[#172554] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors cursor-pointer"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                >
                  {CARGO_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs text-[#475569] font-light">
                Instant calculations based on real road geometries, elevation, and live weather radar.
              </span>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-sans"
                disabled={loading || !origin.trim() || !destination.trim()}
              >
                {loading ? 'CALCULATING CORRIDOR...' : 'CALCULATE ROUTE & ASSESS RISK'}
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>

          {/* Quick Route Preview Result Card */}
          {searched && routeResult && (
            <div className="mt-8 pt-6 border-t border-[#E2E8F0] space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#2563EB]" />
                  <span className="font-mono text-xs tracking-wider uppercase text-[#172554] font-bold">
                    RECOMMENDED ROUTE: {routeResult.name}
                  </span>
                </div>

                {/* Risk Badge */}
                <div
                  className={`font-mono text-xs px-3.5 py-1 rounded-full border flex items-center gap-1.5 font-bold ${
                    routeResult.riskLevel === 'LOW'
                      ? 'text-[#059669] border-[#059669]/30 bg-[#059669]/10'
                      : routeResult.riskLevel === 'MODERATE'
                      ? 'text-[#D97706] border-[#D97706]/30 bg-[#D97706]/10'
                      : 'text-[#DC2626] border-[#DC2626]/30 bg-[#DC2626]/10'
                  }`}
                >
                  {routeResult.riskLevel === 'LOW' && <ShieldCheck size={13} />}
                  {routeResult.riskLevel === 'MODERATE' && <AlertTriangle size={13} />}
                  {routeResult.riskLevel === 'HIGH' && <ShieldAlert size={13} />}
                  <span>{routeResult.riskLevel} RISK ({routeResult.riskScore}/100)</span>
                </div>
              </div>

              {/* Stats & Live Weather Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                    <Milestone size={16} />
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase text-[#475569]">Road Distance</div>
                    <div className="text-base font-bold text-[#172554] font-mono">{routeResult.distanceKm} km</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase text-[#475569]">Est. Duration</div>
                    <div className="text-base font-bold text-[#172554] font-mono">{routeResult.durationFormatted}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                    <Sparkles size={16} className="text-[#2563EB]" />
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase text-[#475569]">Live Weather (Radar)</div>
                    <div className="text-xs font-bold text-[#172554] font-mono">
                      {routeResult.weather ? `${routeResult.weather.temperature}°C · ${routeResult.weather.condition}` : '24°C · Mild'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                    <Compass size={16} />
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase text-[#475569]">Terrain & Risk</div>
                    <div className="text-xs text-[#172554] font-medium line-clamp-1">{routeResult.riskReason}</div>
                  </div>
                </div>
              </div>

              {/* Link to Full Interactive Map */}
              <div className="flex justify-end pt-2">
                <Link href="/route-planner">
                  <Button variant="secondary" size="md" className="gap-2 font-mono text-xs">
                    VIEW ON FULL INTERACTIVE MAP
                    <ArrowRight size={14} className="text-[#2563EB]" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
