'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Shield, Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

const NAV_LINKS = [
  { label: 'ROUTE PLANNER', href: '/route-planner', isPrimary: true },
  { label: 'REGIONAL MAP', href: '#coverage' },
  { label: 'CORRIDORS', href: '#corridors' },
  { label: 'ABOUT', href: '#about' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* 1. Left: Brand Logo + System status */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-md shadow-[#2563EB]/25">
                <Compass size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs tracking-[0.2em] uppercase text-[#172554] font-bold group-hover:text-[#2563EB] transition-colors">
                  NER / LOGISENSE
                </span>
                <span className="text-[9px] font-mono text-[#475569] tracking-wider uppercase -mt-0.5">
                  SMART LOGISTICS INTELLIGENCE
                </span>
              </div>
            </Link>

            {/* Operational status badge */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-mono text-[#475569]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
              <span className="text-[#172554] font-medium">System nominal</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>14:35 IST</span>
            </div>
          </div>

          {/* 2. Center: Nav Buttons evenly spaced in light pill container */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3 py-1.5 shadow-inner">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`font-mono text-[11px] tracking-[0.14em] uppercase px-3.5 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  link.isPrimary
                    ? 'text-white bg-[#2563EB] font-bold shadow-sm shadow-[#2563EB]/20'
                    : 'text-[#475569] hover:text-[#172554] hover:bg-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* 3. Right: Theme Toggle & Operations Login */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm" variant="secondary" className="font-mono text-xs tracking-wider px-4 py-2 border-[#E2E8F0] hover:border-[#2563EB]/60 hover:text-[#2563EB] bg-white text-[#172554]">
                <Shield size={13} className="text-[#2563EB] mr-1.5" />
                OPERATIONS LOGIN
              </Button>
            </Link>
          </div>

          {/* Mobile Actions (Theme Toggle + Menu Toggle) */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              className="text-[#475569] hover:text-[#172554] transition-colors p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white/98 backdrop-blur-xl px-4 py-5 shadow-2xl">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`font-mono text-xs tracking-[0.15em] uppercase px-4 py-2.5 rounded-xl transition-colors ${
                  link.isPrimary
                    ? 'text-white bg-[#2563EB] font-bold'
                    : 'text-[#475569] hover:text-[#172554] hover:bg-[#F8FAFC]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-[#E2E8F0] flex flex-col gap-3">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="font-mono text-xs uppercase text-[#475569]">COLOR THEME</span>
                <ThemeToggle showLabel />
              </div>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button size="sm" variant="secondary" className="w-full justify-center py-2.5">
                  <Shield size={13} className="text-[#2563EB] mr-1.5" />
                  OPERATIONS LOGIN
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
