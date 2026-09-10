'use client'

import { useState } from 'react'
import { LogOut, Plus, User as UserIcon, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { NER_STATES } from '@/types/incident'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface FieldCommandBarProps {
  userName: string
  userEmail: string
  selectedState: string
  onStateChange: (state: string) => void
  onOpenReportModal: () => void
}

export function FieldCommandBar({
  userName,
  userEmail,
  selectedState,
  onStateChange,
  onOpenReportModal,
}: FieldCommandBarProps) {
  const [loggingOut, setLoggingOut] = useState(false)

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

  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Brand & Module */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-[#2563EB] flex items-center justify-center shadow-sm">
                <div className="w-2.5 h-2.5 rounded-sm bg-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs tracking-[0.2em] uppercase text-[#172554] font-bold">
                    NER / LOGISENSE
                  </span>
                  <span className="text-[#CBD5E1]">|</span>
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#2563EB] font-bold">
                    FIELD OPERATIONS
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                  <span className="font-mono text-[8px] tracking-[0.15em] uppercase text-[#475569] font-medium">
                    GROUND TELEMETRY ONLINE
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile quick actions */}
            <div className="lg:hidden flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenReportModal}
                className="gap-1.5"
              >
                <Plus size={14} />
                <span className="font-mono text-xs tracking-wider">REPORT</span>
              </Button>
            </div>
          </div>

          {/* Controls & User Profile */}
          <div className="flex items-center gap-3 flex-wrap justify-between lg:justify-end">
            {/* Sector/State Quick Filter */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#475569] shrink-0">
                SECTOR:
              </span>
              <select
                value={selectedState}
                onChange={(e) => onStateChange(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#172554] focus:outline-none focus:border-[#2563EB] transition-colors cursor-pointer"
                aria-label="Filter sector state"
              >
                <option value="ALL">ALL NER STATES</option>
                {NER_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Action Button (Desktop) */}
            <div className="hidden lg:block">
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenReportModal}
                className="gap-1.5 shadow-md shadow-[#2563EB]/15"
              >
                <Plus size={14} />
                <span className="font-mono text-xs tracking-wider">NEW INCIDENT REPORT</span>
              </Button>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Identity Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] text-xs font-mono">
              <UserIcon size={12} className="text-[#2563EB]" />
              <span className="text-[#172554] font-medium truncate max-w-[140px]">{userName}</span>
              <span className="text-[#CBD5E1]">·</span>
              <span className="text-[10px] text-[#64748B] truncate max-w-[160px]">{userEmail}</span>
            </div>

            {/* Role Badge */}
            <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#2563EB] px-2.5 py-1 rounded border border-[#BFDBFE] bg-[#EFF6FF] font-semibold">
              FIELD OFFICER
            </div>

            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="gap-1.5 text-[#475569] hover:text-[#172554]"
            >
              {loggingOut ? (
                <LoadingSpinner className="w-3.5 h-3.5" />
              ) : (
                <LogOut size={13} />
              )}
              <span className="font-mono text-[10px] tracking-wider uppercase">
                {loggingOut ? 'EXITING...' : 'SIGN OUT'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
