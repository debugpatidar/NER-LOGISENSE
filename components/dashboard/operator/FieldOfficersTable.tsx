'use client'

import { useState } from 'react'
import type { FieldOfficerItem } from './types'
import { Shield, FileText, Search, AlertCircle, CheckCircle2, User, MapPin, Clock } from 'lucide-react'

interface FieldOfficersTableProps {
  officers: FieldOfficerItem[]
  onOpenReport: (officer: FieldOfficerItem) => void
  onSelectOfficerOnMap?: (officer: FieldOfficerItem) => void
}

export function FieldOfficersTable({
  officers,
  onOpenReport,
  onSelectOfficerOnMap,
}: FieldOfficersTableProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOfficers = officers.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.badgeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.state.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden flex flex-col font-sans">
      {/* Table Header & Search Bar */}
      <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
            <Shield size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Field Officers Directory
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                {officers.length} Active
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Deployed officers monitoring regional transport corridors
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search officers or location..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] shadow-2xs"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-[#E2E8F0] text-xs font-semibold text-slate-600">
              <th className="py-3.5 px-5">Officer Name</th>
              <th className="py-3.5 px-5">Current Location</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5">Last Update</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-xs text-slate-700 font-sans">
            {filteredOfficers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                  No field officers found matching &quot;{searchQuery}&quot;.
                </td>
              </tr>
            ) : (
              filteredOfficers.map((officer) => (
                <tr
                  key={officer.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => onSelectOfficerOnMap?.(officer)}
                >
                  {/* Officer Name */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
                        {officer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{officer.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {officer.badgeId} · {officer.state}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Current Location */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <MapPin size={14} className="text-blue-600 shrink-0" />
                      <span className="font-medium">{officer.locationName}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        officer.hasIncident
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : officer.status === 'ON_PATROL'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {officer.hasIncident ? (
                        <>
                          <AlertCircle size={13} className="text-red-600" />
                          <span>Incident Reported</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>{officer.status.replace('_', ' ')}</span>
                        </>
                      )}
                    </span>
                  </td>

                  {/* Last Update */}
                  <td className="py-4 px-5 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span>{officer.lastUpdate}</span>
                    </div>
                  </td>

                  {/* Action Button: Report */}
                  <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onOpenReport(officer)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                        officer.hasIncident
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                      }`}
                    >
                      <FileText size={14} />
                      <span>Report</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
