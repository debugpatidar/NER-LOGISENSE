'use client'

import React from 'react'
import { Sun } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

/**
 * Theme toggle — light mode is always active.
 * The button is kept in the UI for layout consistency but is non-functional.
 */
export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  return (
    <div
      title="Light mode active"
      aria-label="Light mode active"
      className={`
        flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-xl border
        bg-white border-[#E2E8F0] text-[#2563EB] shadow-xs cursor-default
        ${className}
      `}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun size={16} className="text-[#F59E0B]" />
      </div>
      {showLabel && (
        <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-[#64748B]">
          LIGHT MODE
        </span>
      )}
    </div>
  )
}
