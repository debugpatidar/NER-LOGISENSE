import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RoutePlannerWorkspace } from '@/components/route-planner/RoutePlannerWorkspace'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export const metadata = {
  title: 'Route Planner — NER / LogiSense',
  description: 'Plan vehicle and cargo routes across Northeast India. Free public access.',
}

export default function RoutePlannerPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#172554]">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-100 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(23,37,84,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(23,37,84,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Blue ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#2563EB]/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-5 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xl sticky top-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#475569] hover:text-[#172554] transition-colors text-sm group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase font-semibold">BACK TO HOME</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-sm bg-white" />
            </div>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#172554] font-bold group-hover:text-[#2563EB] transition-colors">
              NER / LOGISENSE
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] hover:text-[#2563EB] transition-colors hidden sm:block font-bold"
          >
            OPERATIONS LOGIN →
          </Link>
        </div>
      </div>

      {/* Page header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#475569] font-medium">
            PUBLIC ACCESS · NO LOGIN REQUIRED
          </span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#172554] leading-tight">
          Route <span className="italic text-[#2563EB]">Planner</span>
        </h1>
        <p className="mt-2 text-[#475569] text-sm sm:text-base max-w-xl leading-relaxed font-light">
          Plan vehicle and cargo routes across India&apos;s North Eastern Region with real road vector geometry and live weather radar.
        </p>
      </div>

      {/* Main workspace */}
      <div className="relative z-10">
        <RoutePlannerWorkspace />
      </div>

      {/* Footer strip */}
      <div className="relative z-10 mt-12 border-t border-[#E2E8F0] bg-white py-6 px-4 sm:px-8 text-center">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#64748B]">
          NER / LOGISENSE · NORTHEAST INDIA LOGISTICS INTELLIGENCE · PHASE 01
        </span>
      </div>
    </main>
  )
}
