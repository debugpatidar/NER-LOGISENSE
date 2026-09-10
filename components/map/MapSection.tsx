'use client'

import { NorthEastMap } from './NorthEastMap'
import Link from 'next/link'
import { Compass, ArrowRight, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const NER_STATES = [
  { name: 'ASSAM', capital: 'Guwahati / Dispur', hub: 'Primary Freight Hub' },
  { name: 'ARUNACHAL PRADESH', capital: 'Itanagar', hub: 'Trans-Himalayan Corridor' },
  { name: 'MEGHALAYA', capital: 'Shillong', hub: 'Khasi Hills Lifeline' },
  { name: 'MANIPUR', capital: 'Imphal', hub: 'Border Commerce Gate' },
  { name: 'MIZORAM', capital: 'Aizawl', hub: 'Southern Ridge Link' },
  { name: 'NAGALAND', capital: 'Kohima / Dimapur', hub: 'Mountain Railway Railhead' },
  { name: 'TRIPURA', capital: 'Agartala', hub: 'Southwestern Arterial' },
  { name: 'SIKKIM', capital: 'Gangtok', hub: 'High Altitude Pass' },
]

export function MapSection() {
  return (
    <section id="coverage" className="py-20 px-4 sm:px-6 lg:px-8 relative border-t border-[#E2E8F0] bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569]">
                GEOSPATIAL FOUNDATION · LIVE RADAR
              </span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-[#172033]">
              Northeast India Live Regional Map
            </h2>
            <p className="text-[#64748B] text-sm sm:text-base mt-2 font-light max-w-2xl">
              Real-time interactive road vector map spanning all 8 states, interstate highway corridors, and elevation passes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/route-planner">
              <Button variant="amber" size="md" className="gap-2 font-sans">
                <Compass size={16} />
                Open Full Route Planner
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Prominent Landing Page Map Container */}
        <div className="relative rounded-3xl overflow-hidden border border-[#E2E8F0] bg-white shadow-xl p-1.5 sm:p-2">
          
          {/* Embedded NorthEastMap with generous height */}
          <div className="rounded-2xl overflow-hidden h-[460px] sm:h-[540px] lg:h-[620px] w-full">
            <NorthEastMap className="h-full w-full" />
          </div>

          {/* Floating Telemetry Box - Top Left */}
          <div className="absolute top-6 left-6 z-10 pointer-events-none hidden sm:block">
            <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-4 shadow-lg pointer-events-auto">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={13} className="text-[#2563EB]" />
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#475569]">
                  REGIONAL SECTOR COVERAGE
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-[#172033] tracking-tight">08</div>
              <div className="font-mono text-[10px] tracking-wider uppercase text-[#2563EB] font-bold">
                STATES CONNECTED
              </div>
              <div className="mt-2 pt-2 border-t border-[#E2E8F0] font-mono text-[9px] text-[#64748B]">
                100% Public Access · Live Weather Radar
              </div>
            </div>
          </div>

          {/* Floating Status - Bottom Right */}
          <div className="absolute bottom-6 right-6 z-10 pointer-events-none hidden sm:block">
            <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl px-3.5 py-2 font-mono text-[10px] text-[#475569] shadow-md flex items-center gap-2 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              <span>LIVE GEOSPATIAL TILES · GOOGLE MAPS JS</span>
            </div>
          </div>
        </div>

        {/* 8 State Quick Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {NER_STATES.map((state) => (
            <div
              key={state.name}
              className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-white shadow-xs hover:border-[#2563EB]/40 hover:shadow-sm transition-all"
            >
              <div className="font-mono text-[11px] font-bold text-[#172033] tracking-wider">
                {state.name}
              </div>
              <div className="text-[11px] text-[#0891B2] font-mono mt-0.5">
                {state.capital}
              </div>
              <div className="text-[9px] text-[#64748B] font-mono mt-1">
                {state.hub}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
