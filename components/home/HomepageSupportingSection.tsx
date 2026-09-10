'use client'

import Link from 'next/link'
import { Shield, Compass, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const STATES = [
  'ASSAM',
  'ARUNACHAL PRADESH',
  'MEGHALAYA',
  'MANIPUR',
  'MIZORAM',
  'NAGALAND',
  'TRIPURA',
  'SIKKIM',
]

const CORRIDORS = [
  {
    code: 'NH-27',
    name: 'East-West Expressway Lifeline',
    route: 'Guwahati ↔ Nagaon ↔ Jorhat',
    status: 'OPTIMAL · ALL-WEATHER',
    risk: 'LOW RISK',
    riskColor: 'text-[#059669]',
    desc: 'Primary 4-lane freight corridor with continuous GPS road condition monitoring.',
  },
  {
    code: 'NH-13',
    name: 'Trans-Arunachal Highway',
    route: 'Itanagar ↔ Pasighat ↔ Tawang',
    status: 'MONSOON WATCH SECTOR',
    risk: 'MODERATE RISK',
    riskColor: 'text-[#D97706]',
    desc: 'Strategic high-altitude mountain corridor with dynamic elevation advisories.',
  },
  {
    code: 'NH-08',
    name: 'Tripura Arterial Connector',
    route: 'Silchar ↔ Karimganj ↔ Agartala',
    status: 'ACTIVE FREIGHT CORRIDOR',
    risk: 'LOW RISK',
    riskColor: 'text-[#059669]',
    desc: 'Heavy commercial goods passage connecting southern Assam and Tripura.',
  },
  {
    code: 'NH-29',
    name: 'Naga Hills Mountain Pass',
    route: 'Dimapur ↔ Kohima ↔ Imphal',
    status: 'ELEVATION GRADIENT ADVISORY',
    risk: 'MODERATE RISK',
    riskColor: 'text-[#D97706]',
    desc: 'Steep hill section with active field officer GPS verification and rain alerts.',
  },
]

export function HomepageSupportingSection() {
  return (
    <section id="corridors" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#E2E8F0] relative bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-20">

        {/* ── 1. Strategic Corridors Grid ── */}
        <div>
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569]">
                  STRATEGIC ARTERIES
                </span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[#172554]">
                Key Northeast logistics corridors.
              </h2>
            </div>
            <Link
              href="/route-planner"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#2563EB] hover:text-[#0891B2] tracking-wider uppercase font-bold"
            >
              Explore all corridors on interactive map
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CORRIDORS.map((c) => (
              <div
                key={c.code}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#2563EB]/40 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-white bg-[#2563EB] px-2.5 py-0.5 rounded-md">
                      {c.code}
                    </span>
                    <span className={`font-mono text-[9px] uppercase font-bold ${c.riskColor}`}>
                      {c.risk}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#172554] mb-1">
                    {c.name}
                  </h3>
                  <div className="font-mono text-[11px] text-[#0891B2] font-semibold mb-3">
                    {c.route}
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {c.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E8F0] font-mono text-[9px] text-[#64748B] uppercase tracking-wider">
                  {c.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. Two Clear Operational Experiences ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Public Experience */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-md">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
                <Compass size={22} />
              </div>
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#475569] mb-1">
                FOR CITIZENS & CARGO DRIVERS
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl font-normal text-[#172554] mb-3">
                Public Route Intelligence
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-6">
                Instant access to route calculations, road geometry visualizer, terrain risk ratings, and travel estimates. No account or credentials required.
              </p>
              <ul className="space-y-2.5 text-xs font-mono text-[#172554] mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#059669]" />
                  <span>Free, immediate route calculation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#059669]" />
                  <span>Interactive road geometry vector map</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#059669]" />
                  <span>Live weather radar & monsoon advisories</span>
                </li>
              </ul>
            </div>

            <Link href="/route-planner">
              <Button variant="amber" size="md" className="w-full sm:w-auto font-sans">
                Open Public Route Planner
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          {/* Operations Experience */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-md">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#7C3AED] flex items-center justify-center mb-4 border border-[#E2E8F0]">
                <Shield size={22} />
              </div>
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#475569] mb-1">
                FOR AUTHORIZED PERSONNEL ONLY
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl font-normal text-[#172554] mb-3">
                Operations & Field Reporting
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-6">
                Secure portal for ground-level Field Officers to verify road incidents via GPS and Logistics Operators to monitor corridor traffic flow.
              </p>
              <ul className="space-y-2.5 text-xs font-mono text-[#172554] mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#2563EB]" />
                  <span>GPS hardware location verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#2563EB]" />
                  <span>Store → Carry → Sync offline reporting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#2563EB]" />
                  <span>Central logistics operator command</span>
                </li>
              </ul>
            </div>

            <Link href="/login">
              <Button variant="secondary" size="md" className="w-full sm:w-auto font-sans">
                Operations Portal Login
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </section>
  )
}
