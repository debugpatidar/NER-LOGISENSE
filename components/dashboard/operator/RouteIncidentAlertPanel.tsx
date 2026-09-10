'use client'

import { useState } from 'react'
import type { RouteIncidentImpactAlert } from './types'
import { AlertTriangle, ShieldAlert, CheckCircle2, Navigation, Send, ArrowRight, User, Truck, MapPin } from 'lucide-react'

interface RouteIncidentAlertPanelProps {
  alerts: RouteIncidentImpactAlert[]
  onAcknowledgeAlert?: (alertId: string) => void
}

export function RouteIncidentAlertPanel({
  alerts,
  onAcknowledgeAlert,
}: RouteIncidentAlertPanelProps) {
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([])

  const handleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => [...prev, id])
    onAcknowledgeAlert?.(id)
  }

  return (
    <div className="bg-white border border-amber-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <div className="p-5 border-b border-amber-200/60 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-950">
                Incident Impact Analysis
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700 text-xs font-semibold">
                Action Required
              </span>
            </div>
            <p className="text-xs text-amber-800/80 mt-0.5 font-sans">
              Active field incidents intersecting with live cargo transportation routes
            </p>
          </div>
        </div>
      </div>

      {/* Alert Card Items */}
      <div className="p-6 space-y-4 bg-white font-sans">
        {alerts.map((alert) => {
          const isAcked = acknowledgedIds.includes(alert.id)

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border transition-all duration-200 ${
                isAcked
                  ? 'bg-slate-50 border-slate-200 opacity-80'
                  : 'bg-amber-50/40 border-amber-200/80 shadow-2xs'
              }`}
            >
              {/* Alert Title & Severity Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-amber-200/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <h4 className="text-base font-bold text-slate-900">
                    Route Incident — <span className="text-red-600">{alert.severity} Severity</span>
                  </h4>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-500">Reported By:</span>
                  <span className="px-2.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-medium">
                    {alert.reportingOfficer}
                  </span>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-4 text-xs text-slate-700 font-sans">
                {/* Affected Driver */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block flex items-center gap-1">
                    <User size={12} className="text-amber-600" />
                    Affected Driver
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{alert.affectedDriver}</p>
                </div>

                {/* Vehicle ID */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block flex items-center gap-1">
                    <Truck size={12} className="text-amber-600" />
                    Vehicle ID
                  </span>
                  <p className="font-bold text-[#2563EB] text-sm font-mono">{alert.vehicleId}</p>
                </div>

                {/* Affected Route */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block flex items-center gap-1">
                    <Navigation size={12} className="text-amber-600" />
                    Affected Route
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{alert.affectedRoute}</p>
                </div>

                {/* Severity */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block flex items-center gap-1">
                    <AlertTriangle size={12} className="text-red-600" />
                    Severity Level
                  </span>
                  <p className="font-bold text-red-600 text-sm">{alert.severity}</p>
                </div>
              </div>

              {/* Short Incident Description */}
              <div className="p-3.5 rounded-lg bg-white border border-amber-200 text-xs text-slate-800 flex items-center gap-2 font-sans">
                <span className="font-bold text-amber-900">Incident:</span>
                <span className="font-medium text-slate-900">{alert.shortIncidentDescription}</span>
              </div>

              {/* Action Toolbar */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 font-sans">
                <div className="text-xs text-slate-500">
                  Timestamp: <strong className="text-slate-700">{alert.timestamp}</strong> · Location: <strong className="text-slate-700">{alert.location}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isAcked}
                    onClick={() => handleAcknowledge(alert.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 ${
                      isAcked
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>{isAcked ? 'Alert Acknowledged' : 'Acknowledge Alert'}</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
