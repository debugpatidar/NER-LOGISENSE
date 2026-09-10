'use client'

import Link from 'next/link'
import { Compass } from 'lucide-react'

const FOOTER_LINKS = [
  { label: 'ROUTE PLANNER', href: '/route-planner' },
  { label: 'REGIONAL MAP', href: '#coverage' },
  { label: 'CORRIDORS', href: '#corridors' },
  { label: 'OPERATIONS LOGIN', href: '/login' },
]

export function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-[#E2E8F0] bg-white py-14 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Brand */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
                <Compass size={15} className="text-white" />
              </div>
              <span className="font-mono text-xs tracking-[0.2em] uppercase text-[#172554] font-bold">
                NER / LOGISENSE
              </span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569]">
              SMART LOGISTICS INTELLIGENCE · NORTH EASTERN REGION
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] hover:text-[#2563EB] transition-colors duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-[10px] text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <span>NORTHEAST INDIA LOGISTICS PLATFORM · PHASE 01</span>
          </div>
          <div>
            ALL RIGHTS RESERVED · GOVERNMENT &amp; FREIGHT OPERATIONS
          </div>
        </div>
      </div>
    </footer>
  )
}
