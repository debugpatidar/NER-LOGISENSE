'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { LogOut, ArrowLeft, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface DashboardPlaceholderProps {
  role: string
  title: string
  subtitle: string
  description: string
  userName?: string
  userEmail?: string
}

export function DashboardPlaceholder({
  role,
  title,
  subtitle,
  description,
  userName,
  userEmail,
}: DashboardPlaceholderProps) {
  const [loggingOut, setLoggingOut] = useState(false)

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
      // Use location.replace to eliminate the dashboard page from history stack
      window.location.replace('/login')
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#172554] flex flex-col">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-100 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(23,37,84,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(23,37,84,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-5 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-[#2563EB] flex items-center justify-center">
            <div className="w-2 h-2 rounded-sm bg-white" />
          </div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#172554] font-semibold">
            NER / LOGISENSE
          </span>
        </div>

        <div className="flex items-center gap-3">
          {userEmail && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] text-xs font-mono">
              <UserIcon size={12} className="text-[#2563EB]" />
              <span>{userEmail}</span>
            </div>
          )}
          <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#2563EB] px-2.5 py-1 rounded border border-[#BFDBFE] bg-[#EFF6FF] font-semibold">
            {role}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2"
          >
            {loggingOut ? (
              <LoadingSpinner className="w-3.5 h-3.5" />
            ) : (
              <LogOut size={14} />
            )}
            <span className="font-mono text-[10px] tracking-wider uppercase">
              {loggingOut ? 'SIGNING OUT...' : 'SIGN OUT'}
            </span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-lg text-center">
          <div className="w-16 h-16 rounded-2xl border border-[#E2E8F0] flex items-center justify-center mx-auto mb-8 bg-white shadow-md">
            <div className="w-6 h-6 border-2 border-[#2563EB] rounded-sm" />
          </div>

          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] mb-3 font-semibold">
            DASHBOARD / {role}
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#172554] mb-3">
            {title}
          </h1>
          <p className="text-lg text-[#2563EB] font-mono tracking-wide mb-4 font-bold">{subtitle}</p>

          {userName && (
            <div className="inline-block mb-6 px-3 py-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-mono text-[#475569]">
              AUTHENTICATED USER: <span className="text-[#172554] font-semibold">{userName}</span>
            </div>
          )}

          <p className="text-[#475569] text-sm leading-relaxed max-w-sm mx-auto">{description}</p>

          <div className="mt-10 inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] font-medium">
              OPERATIONS SECURE WORKSPACE
            </span>
          </div>

          <div className="mt-6">
            <Link href="/">
              <button className="inline-flex items-center gap-2 text-[#475569] hover:text-[#2563EB] transition-colors text-xs font-mono tracking-wider uppercase font-semibold">
                <ArrowLeft size={12} />
                RETURN TO PLATFORM
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
