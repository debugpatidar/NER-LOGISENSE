'use client'

import Link from 'next/link'
import { ArrowRight, Compass, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-36 sm:pt-40 md:pt-44 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Background soft blue radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#2563EB]/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle coordinate grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(23,37,84,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(23,37,84,0.4) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

          {/* ── LEFT: Editorial Typography & Actions (7 cols) ── */}
          <div className="lg:col-span-7 space-y-6">

            {/* Small subtle label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[10px] font-mono tracking-[0.2em] uppercase text-[#2563EB]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2]" />
              <span>NORTH EAST REGION · LOGISTICS INTELLIGENCE</span>
            </div>

            {/* Editorial Serif Heading */}
            <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-[#172554] leading-[1.08]">
              Predict disruption{' '}
              <br className="hidden sm:inline" />
              <span className="italic text-[#172554]/90">before the road</span>{' '}
              <span className="text-[#2563EB]">closes.</span>
            </h1>

            {/* Supporting paragraph */}
            <p className="text-base sm:text-lg text-[#475569] max-w-xl leading-relaxed font-light">
              A live intelligence layer for the roads, vehicles, supplies, and route decisions that keep the North East moving.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link href="/route-planner">
                <Button size="lg" variant="amber" className="w-full sm:w-auto font-sans text-sm gap-2">
                  <Compass size={16} />
                  Plan a protected route
                  <ArrowRight size={15} />
                </Button>
              </Link>
              <a href="#coverage">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto font-sans text-sm gap-2">
                  <MapPin size={16} className="text-[#2563EB]" />
                  Explore Regional Map
                </Button>
              </a>
            </div>

            {/* Quick Metrics Strip */}
            <div className="pt-6 border-t border-[#E2E8F0] grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <div className="text-2xl font-bold font-mono text-[#172554]">08</div>
                <div className="text-[10px] font-mono tracking-wider uppercase text-[#475569] mt-0.5">
                  NER STATES
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-[#059669]">100%</div>
                <div className="text-[10px] font-mono tracking-wider uppercase text-[#475569] mt-0.5">
                  PUBLIC ACCESS
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-[#2563EB]">LIVE</div>
                <div className="text-[10px] font-mono tracking-wider uppercase text-[#475569] mt-0.5">
                  WEATHER & GPS
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Atmospheric Mountain / Corridor Visual Card (5 cols) ── */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xl">

              {/* Background scenic gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#EFF6FF] via-[#F8FAFC] to-white opacity-90" />
              
              {/* Subtle mountain ridge vector styling */}
              <div className="relative z-10 space-y-4">

                {/* Top Watch Window Badge */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#E2E8F0] text-[10px] font-mono text-[#475569] shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                    <span className="text-[#172033] font-semibold">NH-10 / WATCH WINDOW</span>
                    <span className="text-[#2563EB] font-bold">4–18 H</span>
                  </div>
                  <span className="font-mono text-[9px] text-[#475569] uppercase tracking-wider">
                    MONSOON CORRIDOR
                  </span>
                </div>

                {/* Mountain / Ridge Graphic Preview Area */}
                <div className="relative h-44 rounded-2xl overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center p-4">
                  {/* Atmospheric background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-[#EFF6FF]/40 pointer-events-none" />

                  {/* Visual mountain line graphic with risk-colored nodes */}
                  <svg className="w-full h-full text-[#2563EB]" viewBox="0 0 400 160" fill="none">
                    {/* Ridge silhouette background */}
                    <path
                      d="M0 130 Q 80 70 160 110 T 300 60 T 400 100 L 400 160 L 0 160 Z"
                      fill="rgba(37, 99, 235, 0.06)"
                    />
                    {/* Highway Path Vector */}
                    <path
                      d="M 20 120 L 110 85 L 220 105 L 310 55 L 380 75"
                      stroke="#2563EB"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Elevation Nodes */}
                    <circle cx="20" cy="120" r="4.5" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="110" cy="85" r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="220" cy="105" r="4.5" fill="#0891B2" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="310" cy="55" r="4.5" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="380" cy="75" r="4.5" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />
                  </svg>

                  {/* Overlaid corridor label */}
                  <div className="absolute bottom-2.5 left-3 font-mono text-[9px] text-[#475569] uppercase tracking-wider">
                    CORRIDOR ELEVATION PROFILE
                  </div>
                  <div className="absolute bottom-2.5 right-3 font-mono text-[9px] text-[#059669] uppercase tracking-wider font-bold">
                    LIVE RADAR SYNC
                  </div>
                </div>

                {/* Corridor Status Details */}
                <div className="space-y-2 pt-1 font-mono text-xs">
                  <div className="flex items-center justify-between text-[#475569] text-[11px]">
                    <span className="uppercase">SECTOR:</span>
                    <span className="text-[#172554] font-semibold">Guwahati ↔ Shillong Pass</span>
                  </div>
                  <div className="flex items-center justify-between text-[#475569] text-[11px]">
                    <span className="uppercase">ROAD HEALTH:</span>
                    <span className="text-[#059669] font-bold">92 / 100 · PASSABLE</span>
                  </div>
                  <div className="flex items-center justify-between text-[#475569] text-[11px]">
                    <span className="uppercase">WEATHER RADAR:</span>
                    <span className="text-[#172554]">LIVE SATELLITE CONNECTED</span>
                  </div>
                </div>

                {/* Card footer link */}
                <Link
                  href="/route-planner"
                  className="mt-2 block text-center py-2.5 rounded-xl border border-[#2563EB] bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all font-mono text-[11px] tracking-wider uppercase font-bold shadow-md shadow-[#2563EB]/20"
                >
                  OPEN LIVE ROUTE PLANNER →
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
