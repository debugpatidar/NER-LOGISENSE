'use client'

import { useState, useEffect } from 'react'
import {
  LogOut,
  User as UserIcon,
  Shield,
  Truck,
  AlertTriangle,
  Compass,
  Activity,
  CheckCircle2,
  RefreshCw,
  Radio,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { FieldOfficerItem, CargoVehicleItem, RouteIncidentImpactAlert } from './types'
import {
  INITIAL_FIELD_OFFICERS,
  INITIAL_CARGO_VEHICLES,
  INITIAL_ROUTE_ALERTS,
  advanceVehiclePositions,
} from './mockData'
import { OperatorMap } from './OperatorMap'
import { FieldOfficersTable } from './FieldOfficersTable'
import { CargoVehiclesTable } from './CargoVehiclesTable'
import { OfficerReportModal } from './OfficerReportModal'
import { RouteIncidentAlertPanel } from './RouteIncidentAlertPanel'

interface LogisticsOperatorWorkspaceProps {
  initialUser: {
    id: string
    name: string
    email: string
    role: string
  }
}

export function LogisticsOperatorWorkspace({ initialUser }: LogisticsOperatorWorkspaceProps) {
  const [loggingOut, setLoggingOut] = useState(false)

  // State management
  const [officers, setOfficers] = useState<FieldOfficerItem[]>(INITIAL_FIELD_OFFICERS)
  const [vehicles, setVehicles] = useState<CargoVehicleItem[]>(INITIAL_CARGO_VEHICLES)
  const [routeAlerts, setRouteAlerts] = useState<RouteIncidentImpactAlert[]>(INITIAL_ROUTE_ALERTS)

  // Selected map entity or active modal officer report
  const [selectedMapEntity, setSelectedMapEntity] = useState<{
    type: 'officer' | 'vehicle' | 'incident'
    id: string
  } | null>(null)
  const [activeReportOfficer, setActiveReportOfficer] = useState<FieldOfficerItem | null>(null)

  // Simulated live coordinate movement for cargo vehicles (updates lat/lng live every 1.8s)
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prevVehicles) => advanceVehiclePositions(prevVehicles))
    }, 1800)

    return () => clearInterval(interval)
  }, [])

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

  // Calculate high level metrics
  const activeIncidentsCount = officers.filter((o) => o.hasIncident).length

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 sm:px-8 py-4 border-b border-[#E2E8F0] bg-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
            <Compass size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">NER / LOGISENSE</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-[#2563EB]">Logistics Operations Center</span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Real-time route monitoring & field incident dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs">
            <UserIcon size={14} className="text-[#2563EB]" />
            <span className="text-slate-900 font-semibold">{initialUser.name || 'Logistics Operator'}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">{initialUser.email}</span>
          </div>

          <span className="text-xs font-semibold text-[#2563EB] px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50">
            Logistics Operator
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="min-h-[38px] px-3.5 text-xs gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white shadow-2xs"
            aria-label="Sign out"
          >
            {loggingOut ? <LoadingSpinner className="w-3.5 h-3.5" /> : <LogOut size={14} />}
            <span className="font-medium">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1480px] w-full mx-auto px-6 sm:px-8 py-8 space-y-8">
        {/* KPI Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Active Field Officers */}
          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Field Officers
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#172033]">{officers.length}</span>
                <span className="text-xs font-semibold text-[#16A34A]">100% Active</span>
              </div>
              <span className="text-xs text-slate-500 block">6 NE India Patrol Sectors</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center">
              <Shield size={22} />
            </div>
          </div>

          {/* Live Cargo Vehicles */}
          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Cargo Vehicles
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#172033]">{vehicles.length}</span>
                <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                  Live GPS
                </span>
              </div>
              <span className="text-xs text-slate-500 block">Medical, Food & Electronics</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-[#16A34A] flex items-center justify-center">
              <Truck size={22} />
            </div>
          </div>

          {/* Reported Field Incidents */}
          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Field Incidents
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#DC2626]">{activeIncidentsCount}</span>
                <span className="text-xs font-semibold text-[#DC2626]">Action Required</span>
              </div>
              <span className="text-xs text-slate-500 block">Silchar NH-6 Road Blockage</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-[#DC2626] flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
          </div>

          {/* Route Impact Alerts */}
          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Route Impact Alerts
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#F59E0B]">{routeAlerts.length}</span>
                <span className="text-xs font-semibold text-[#F59E0B]">High Severity</span>
              </div>
              <span className="text-xs text-slate-500 block">Affects Vehicle AS-03</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-[#F59E0B] flex items-center justify-center">
              <Activity size={22} />
            </div>
          </div>
        </div>

        {/* 1. MAP SECTION */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <h2 className="text-lg font-bold text-[#172033]">Regional Route Control Map</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Google Maps API · NE India Corridor · Live GPS
            </span>
          </div>

          <OperatorMap
            officers={officers}
            vehicles={vehicles}
            selectedItem={selectedMapEntity}
            onSelectItem={setSelectedMapEntity}
            onOpenOfficerReport={(off) => setActiveReportOfficer(off)}
          />
        </section>

        {/* 2. FIELD OFFICERS TABLE SECTION */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <h2 className="text-lg font-bold text-[#172033]">Field Officers Directory</h2>
          </div>

          <FieldOfficersTable
            officers={officers}
            onOpenReport={(off) => setActiveReportOfficer(off)}
            onSelectOfficerOnMap={(off) => setSelectedMapEntity({ type: 'officer', id: off.id })}
          />
        </section>

        {/* 3. CARGO VEHICLES TABLE SECTION */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
              <h2 className="text-lg font-bold text-[#172033]">Cargo Vehicles Live Fleet</h2>
            </div>
            <div className="text-xs font-semibold text-[#16A34A] flex items-center gap-1.5">
              <RefreshCw size={12} className="animate-spin text-[#16A34A]" />
              <span>Live Coordinates Synchronized</span>
            </div>
          </div>

          <CargoVehiclesTable
            vehicles={vehicles}
            onSelectVehicleOnMap={(veh) => setSelectedMapEntity({ type: 'vehicle', id: veh.id })}
          />
        </section>

        {/* 4. ROUTE INCIDENT IMPACT ALERT SECTION */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            <h2 className="text-lg font-bold text-[#172033]">Incident Impact Analysis</h2>
          </div>

          <RouteIncidentAlertPanel
            alerts={routeAlerts}
            onAcknowledgeAlert={(alertId) => {
              setRouteAlerts((prev) =>
                prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
              )
            }}
          />
        </section>
      </main>

      {/* OFFICER REPORT MODAL DIALOG */}
      <OfficerReportModal
        officer={activeReportOfficer}
        onClose={() => setActiveReportOfficer(null)}
      />
    </div>
  )
}
