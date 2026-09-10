'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Clock,
  ChevronRight,
  FilterX,
} from 'lucide-react'
import {
  type FieldIncidentItem,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentCategory,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  STATUS_COLORS,
  NER_STATES,
} from '@/types/incident'

interface FieldIncidentFeedProps {
  incidents: FieldIncidentItem[]
  selectedIncident: FieldIncidentItem | null
  onSelectIncident: (incident: FieldIncidentItem) => void
  onOpenReportModal: () => void
  selectedStateFilter: string
  onStateFilterChange: (st: string) => void
}

export function FieldIncidentFeed({
  incidents,
  selectedIncident,
  onSelectIncident,
  onOpenReportModal,
  selectedStateFilter,
  onStateFilterChange,
}: FieldIncidentFeedProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  // Filter and search logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        const matchesTitle = item.title.toLowerCase().includes(term)
        const matchesLocation = item.locationName.toLowerCase().includes(term)
        const matchesDesc = item.description.toLowerCase().includes(term)
        if (!matchesTitle && !matchesLocation && !matchesDesc) return false
      }

      // State filter
      if (selectedStateFilter !== 'ALL' && item.state !== selectedStateFilter) {
        return false
      }

      // Severity filter
      if (severityFilter !== 'ALL' && item.severity !== severityFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false
      }

      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false
      }

      return true
    })
  }, [incidents, searchTerm, selectedStateFilter, severityFilter, statusFilter, categoryFilter])

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedStateFilter !== 'ALL' ||
    severityFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    categoryFilter !== 'ALL'

  const handleResetFilters = () => {
    setSearchTerm('')
    onStateFilterChange('ALL')
    setSeverityFilter('ALL')
    setStatusFilter('ALL')
    setCategoryFilter('ALL')
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
      {/* Feed Header */}
      <div className="p-4 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-[#172554] font-bold">
              GROUND INCIDENT FEED
            </h3>
            <span className="font-mono text-[10px] text-[#475569] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0] font-semibold">
              {filteredIncidents.length} OF {incidents.length}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[10px] font-mono text-[#2563EB] hover:text-[#0891B2] flex items-center gap-1 transition-colors font-semibold"
            >
              <FilterX size={12} />
              <span>CLEAR FILTERS</span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search corridors, highways, landslides, towns..."
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg pl-9 pr-3 py-2 text-xs text-[#172554] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white font-mono transition-colors shadow-sm"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {/* State */}
          <div>
            <select
              value={selectedStateFilter}
              onChange={(e) => onStateFilterChange(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#475569] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="ALL">ALL STATES</option>
              {NER_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#475569] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="ALL">ALL SEVERITY</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#475569] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="ALL">ALL STATUS</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1 text-[11px] text-[#475569] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="ALL">ALL CATEGORIES</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                <option key={catKey} value={catKey}>
                  {catLabel}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Incident List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0] min-h-[300px] max-h-[550px]">
        {filteredIncidents.length === 0 ? (
          <div className="p-8 text-center">
            <SlidersHorizontal size={24} className="text-[#94A3B8] mx-auto mb-2" />
            <p className="font-mono text-xs text-[#475569] uppercase tracking-wider mb-1 font-semibold">
              NO INCIDENTS MATCH CRITERIA
            </p>
            <p className="text-[11px] text-[#64748B] max-w-xs mx-auto mb-4">
              Try adjusting your sector or severity filters, or log a fresh ground incident report.
            </p>
            <button
              type="button"
              onClick={onOpenReportModal}
              className="font-mono text-[11px] text-[#2563EB] hover:underline font-bold"
            >
              + REPORT INCIDENT NOW
            </button>
          </div>
        ) : (
          filteredIncidents.map((item) => {
            const isSelected = selectedIncident?.id === item.id
            const severityStyle = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.MEDIUM
            const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.ACTIVE

            const timeAgo = (() => {
              const diffMs = Date.now() - new Date(item.createdAt).getTime()
              const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
              if (diffHrs < 1) return 'Just now'
              if (diffHrs < 24) return `${diffHrs}h ago`
              const diffDays = Math.floor(diffHrs / 24)
              return `${diffDays}d ago`
            })()

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectIncident(item)}
                className={`w-full text-left p-3.5 sm:p-4 hover:bg-[#EFF6FF]/60 transition-colors flex items-start justify-between gap-3 group ${
                  isSelected ? 'bg-[#EFF6FF] border-l-2 border-[#2563EB]' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  {/* Tags row */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span
                      className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded border ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border} font-bold`}
                    >
                      {item.severity}
                    </span>

                    <span
                      className={`font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {item.status}
                    </span>

                    <span className="font-mono text-[8px] uppercase text-[#475569]">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>

                    <span className="text-[#CBD5E1]">·</span>
                    <span className="font-mono text-[9px] text-[#0891B2] font-semibold">
                      {item.state}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs sm:text-sm font-semibold text-[#172554] group-hover:text-[#2563EB] transition-colors truncate">
                    {item.title}
                  </h4>

                  {/* Location corridor */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#475569] font-mono mt-1 truncate">
                    <MapPin size={11} className="text-[#475569] shrink-0" />
                    <span className="truncate">{item.locationName}</span>
                  </div>

                  {/* Snippet & Timestamp */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#E2E8F0] text-[10px] font-mono text-[#64748B]">
                    <span className="truncate max-w-[200px] text-[#64748B]">
                      Observed by {item.officer?.name || 'Officer'}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock size={10} />
                      <span>{timeAgo}</span>
                    </span>
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="text-[#94A3B8] group-hover:text-[#2563EB] shrink-0 self-center transition-transform group-hover:translate-x-0.5"
                />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
