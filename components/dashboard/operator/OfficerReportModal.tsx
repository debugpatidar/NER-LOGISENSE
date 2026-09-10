'use client'

import type { FieldOfficerItem } from './types'
import { Shield, CheckCircle2, AlertTriangle, X, MapPin, Clock, FileText, User, AlertCircle, ArrowRight } from 'lucide-react'

interface OfficerReportModalProps {
  officer: FieldOfficerItem | null
  onClose: () => void
}

export function OfficerReportModal({ officer, onClose }: OfficerReportModalProps) {
  if (!officer) return null

  const report = officer.report
  const hasIncident = officer.hasIncident && report

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div
        className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs ${
                hasIncident ? 'bg-[#DC2626]' : 'bg-[#16A34A]'
              }`}
            >
              {hasIncident ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Field Officer Ground Report
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight">{officer.name}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700 font-sans">
          {/* Officer Details Metadata Strip */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Officer ID</span>
              <span className="font-bold text-slate-900 font-mono text-xs">{officer.badgeId}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Station / Sector</span>
              <span className="font-bold text-slate-900">{officer.state}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Location</span>
              <span className="font-semibold text-blue-700 truncate block" title={officer.locationName}>
                {officer.locationName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Last Telemetry Update</span>
              <span className="font-medium text-slate-600">{officer.lastUpdate}</span>
            </div>
          </div>

          {/* INCIDENT CASE 1: NO INCIDENTS AT THIS LOCATION */}
          {!hasIncident ? (
            <div className="p-6 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase font-bold text-emerald-800 tracking-wider">
                  Status Nominal · All Clear
                </div>
                <h4 className="text-lg font-bold text-emerald-950">
                  No problems at this location yet.
                </h4>
              </div>
              <p className="text-xs text-emerald-800/80 max-w-xs mx-auto leading-relaxed font-sans">
                Field Officer {officer.name} has conducted regular surveillance and verified zero hazards, landslides, or transit blockages along this corridor segment.
              </p>
            </div>
          ) : (
            /* INCIDENT CASE 2: ACTIVE INCIDENT REPORT */
            <div className="space-y-4 font-sans">
              {/* Incident Header Card */}
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase">
                    Severity: {report.severity}
                  </span>
                  <span className="text-xs text-red-700 font-semibold">
                    {report.category.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-base font-bold text-red-950 leading-snug">
                  {report.title}
                </h4>
                <div className="text-xs text-red-800 flex items-center gap-1.5 pt-1">
                  <MapPin size={13} className="text-red-600 shrink-0" />
                  <span>{report.locationName}</span>
                </div>
              </div>

              {/* Ground Observation Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Ground Observation Report
                </span>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed font-sans">
                  {report.description}
                </div>
              </div>

              {/* Route Impact Alert Tag if applicable */}
              {report.affectsRoute && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Impact on Active Cargo Corridor
                    </span>
                    <p className="text-xs font-medium text-amber-900 mt-0.5">
                      Affects Route: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 text-amber-950 font-mono">{report.affectsRoute}</code>
                      {report.affectedVehicleId && (
                        <span> · Target Vehicle: <strong className="text-amber-950">{report.affectedVehicleId}</strong></span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-slate-50/70 flex items-center justify-end gap-3 font-sans">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
