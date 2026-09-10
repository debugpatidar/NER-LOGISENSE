'use client'

import { AlertOctagon, Flame, Clock, CheckCircle2 } from 'lucide-react'
import type { FieldIncidentItem } from '@/types/incident'

interface FieldStatsProps {
  incidents: FieldIncidentItem[]
  selectedState: string
}

export function FieldStats({ incidents, selectedState }: FieldStatsProps) {
  const activeIncidents = incidents.filter((i) => i.status === 'ACTIVE').length
  const criticalOrHigh = incidents.filter(
    (i) =>
      (i.severity === 'CRITICAL' || i.severity === 'HIGH') &&
      (i.status === 'ACTIVE' || i.status === 'INVESTIGATING')
  ).length
  const openReports = incidents.filter(
    (i) => i.status === 'ACTIVE' || i.status === 'INVESTIGATING'
  ).length
  const resolvedReports = incidents.filter((i) => i.status === 'RESOLVED').length

  const stats = [
    {
      label: 'ACTIVE INCIDENTS',
      value: activeIncidents,
      icon: AlertOctagon,
      color: 'text-[#DC2626]',
      badgeBg: 'bg-[#FEF2F2] border-[#FECACA]',
      description: 'Requiring active operational attention',
    },
    {
      label: 'CRITICAL / HIGH HAZARDS',
      value: criticalOrHigh,
      icon: Flame,
      color: 'text-[#D97706]',
      badgeBg: 'bg-[#FFFBEB] border-[#FDE68A]',
      description: 'Major transit or structural threats',
    },
    {
      label: 'OPEN FIELD REPORTS',
      value: openReports,
      icon: Clock,
      color: 'text-[#2563EB]',
      badgeBg: 'bg-[#EFF6FF] border-[#BFDBFE]',
      description: 'Under investigation or awaiting clearance',
    },
    {
      label: 'RESOLVED REPORTS',
      value: resolvedReports,
      icon: CheckCircle2,
      color: 'text-[#059669]',
      badgeBg: 'bg-[#ECFDF5] border-[#A7F3D0]',
      description: 'Cleared & verified route corridors',
    },
  ]

  return (
    <section aria-label="Field Operations Summary" className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 shadow-sm rounded-xl p-4 sm:p-5 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#475569] font-semibold">
                  {s.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-md border flex items-center justify-center ${s.badgeBg} ${s.color}`}
                >
                  <Icon size={14} />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${s.color}`}>
                  {s.value}
                </span>
                {selectedState !== 'ALL' && (
                  <span className="text-[10px] font-mono text-[#64748B] truncate">
                    in {selectedState}
                  </span>
                )}
              </div>

              <p className="mt-1 text-[11px] text-[#64748B] leading-tight truncate">
                {s.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
