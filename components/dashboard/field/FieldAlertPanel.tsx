'use client'

import { AlertTriangle, ShieldAlert, ArrowUpRight } from 'lucide-react'
import type { FieldIncidentItem } from '@/types/incident'

interface FieldAlertPanelProps {
  incidents: FieldIncidentItem[]
  onSelectIncident: (incident: FieldIncidentItem) => void
}

export function FieldAlertPanel({ incidents, onSelectIncident }: FieldAlertPanelProps) {
  // Deterministically extract high-priority active hazards from current data
  const criticalIncidents = incidents.filter(
    (i) => i.severity === 'CRITICAL' && (i.status === 'ACTIVE' || i.status === 'INVESTIGATING')
  )

  const bridgeOrLandslides = incidents.filter(
    (i) =>
      (i.category === 'BRIDGE_HAZARD' || i.category === 'LANDSLIDE') &&
      i.status === 'ACTIVE' &&
      i.severity !== 'CRITICAL'
  )

  const urgentAlerts = [...criticalIncidents, ...bridgeOrLandslides].slice(0, 3)

  if (urgentAlerts.length === 0) {
    return null
  }

  return (
    <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 sm:p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#DC2626] font-bold">
            OPERATIONAL ALERT DISPATCH
          </span>
          <span className="text-[10px] font-mono text-[#475569]">
            ({urgentAlerts.length} CRITICAL/HIGH VULNERABILITY {urgentAlerts.length === 1 ? 'SECTOR' : 'SECTORS'})
          </span>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#64748B] hidden sm:inline font-semibold">
          DETERMINISTIC FIELD OBSERVATIONS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {urgentAlerts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectIncident(item)}
            className="text-left bg-white hover:bg-[#FEF2F2] border border-[#FECACA] hover:border-[#DC2626]/50 rounded-lg p-2.5 shadow-sm transition-all group flex items-start justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                <span className="font-mono text-[9px] tracking-wider uppercase text-[#DC2626] font-bold truncate">
                  {item.severity} · {item.category.replace('_', ' ')}
                </span>
                <span className="font-mono text-[8px] text-[#475569] ml-auto shrink-0 font-semibold">
                  {item.state}
                </span>
              </div>
              <p className="text-xs text-[#172554] font-medium truncate group-hover:text-[#DC2626] transition-colors">
                {item.title}
              </p>
              <p className="text-[10px] text-[#475569] font-mono truncate mt-0.5">
                {item.locationName}
              </p>
            </div>
            <ArrowUpRight size={14} className="text-[#475569] group-hover:text-[#DC2626] shrink-0 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        ))}
      </div>
    </div>
  )
}
